import { prisma } from "@/lib/db";
import { formatPesewas } from "@/lib/money";

export interface AssistantProduct {
  id: string;
  slug: string;
  name: string;
  pricePesewas: number;
  vendorName: string;
  vendorSlug: string;
  categoryName: string;
  condition: string;
}

export function aiConfigured(): boolean {
  return Boolean(
    process.env["AI_API_KEY"] && process.env["AI_BASE_URL"] && process.env["AI_MODEL"],
  );
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "any",
  "are",
  "can",
  "do",
  "does",
  "find",
  "for",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "looking",
  "me",
  "must",
  "my",
  "need",
  "of",
  "on",
  "or",
  "please",
  "show",
  "some",
  "that",
  "the",
  "there",
  "want",
  "with",
  "you",
]);

export function extractKeywords(message: string): string[] {
  return Array.from(
    new Set(
      message
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
    ),
  ).slice(0, 8);
}

export async function searchProductsForAssistant(keywords: string[]): Promise<AssistantProduct[]> {
  if (keywords.length === 0) return [];
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      vendor: { status: "ACTIVE" },
      OR: keywords.flatMap((keyword) => [
        { name: { contains: keyword, mode: "insensitive" as const } },
        { description: { contains: keyword, mode: "insensitive" as const } },
        { tags: { has: keyword } },
      ]),
    },
    orderBy: { ratingAvg: "desc" },
    take: 8,
    select: {
      id: true,
      slug: true,
      name: true,
      pricePesewas: true,
      condition: true,
      category: { select: { name: true } },
      vendor: { select: { storeName: true, slug: true } },
    },
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    pricePesewas: product.pricePesewas,
    vendorName: product.vendor.storeName,
    vendorSlug: product.vendor.slug,
    categoryName: product.category.name,
    condition: product.condition,
  }));
}

function buildContext(products: AssistantProduct[]): string {
  if (products.length === 0) return "No live listings match this request.";
  return products
    .map(
      (product, index) =>
        `${index + 1}. ${product.name} — ${formatPesewas(product.pricePesewas)} — ${product.condition} — sold by ${product.vendorName} (category: ${product.categoryName}, link: /products/${product.slug})`,
    )
    .join("\n");
}

export interface AssistantReply {
  reply: string;
  products: AssistantProduct[];
  source: "ai" | "search";
}

export async function askAssistant(message: string): Promise<AssistantReply> {
  const keywords = extractKeywords(message);
  const products = await searchProductsForAssistant(keywords);

  if (!aiConfigured()) {
    if (products.length === 0) {
      return {
        reply:
          "I could not find a live listing for that. Try a broader search term, or browse the marketplace directly.",
        products,
        source: "search",
      };
    }
    return {
      reply: `I found ${products.length} live listing${products.length === 1 ? "" : "s"} that match. The AI assistant is not configured on this deployment, so here are the matching listings instead.`,
      products,
      source: "search",
    };
  }

  const baseUrl = process.env["AI_BASE_URL"]!.replace(/\/$/, "");
  const model = process.env["AI_MODEL"]!;
  const apiKey = process.env["AI_API_KEY"]!;

  const prompt = [
    "You are the JUMART shopping assistant for a university marketplace in Ghana.",
    "Answer using ONLY the live listings below. If the listings do not cover the question, say so plainly and suggest a different search term. Do not invent products, prices, or sellers.",
    "Keep answers under 120 words, use Ghana cedis (GH₵) for prices, and be practical for students.",
    "",
    "Live listings:",
    buildContext(products),
    "",
    `Student question: ${message}`,
  ].join("\n");

  try {
    const res = await fetch(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[ai] provider responded ${res.status}: ${detail.slice(0, 600)}`);
      return {
        reply: `The assistant is unavailable right now, but I found ${products.length} matching listing${products.length === 1 ? "" : "s"}.`,
        products,
        source: "search",
      };
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return {
      reply: text ?? "I could not produce an answer. Try browsing the marketplace directly.",
      products,
      source: "ai",
    };
  } catch (error) {
    console.error(`[ai] provider request failed: ${String(error).slice(0, 200)}`);
    return {
      reply: `The assistant is unavailable right now, but I found ${products.length} matching listing${products.length === 1 ? "" : "s"}.`,
      products,
      source: "search",
    };
  }
}
