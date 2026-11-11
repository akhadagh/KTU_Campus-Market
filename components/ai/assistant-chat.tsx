"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPesewas } from "@/lib/money";

interface AssistantProduct {
  id: string;
  slug: string;
  name: string;
  pricePesewas: number;
  vendorName: string;
  vendorSlug: string;
  categoryName: string;
  condition: string;
}

interface Turn {
  question: string;
  reply: string;
  products: AssistantProduct[];
  source: "ai" | "search";
}

export function AssistantChat() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    setPending(true);
    setQuestion("");
    try {
      const res = await fetch("/api/v1/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const json = (await res.json()) as {
        data?: { reply: string; products: AssistantProduct[]; source: "ai" | "search" };
        error?: { message?: string };
      };
      if (!res.ok || !json.data) {
        toast.error(json.error?.message ?? "Could not reach the assistant");
        return;
      }
      setTurns((current) => [
        ...current,
        {
          question: trimmed,
          reply: json.data!.reply,
          products: json.data!.products,
          source: json.data!.source,
        },
      ]);
    } catch {
      toast.error("Could not reach the server", {
        description: "Check your connection and try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="flex min-h-[28rem] flex-col p-5">
        <div className="flex-1 space-y-4">
          {turns.length === 0 ? (
            <div className="text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">Ask the campus assistant</p>
              <p className="mt-1">
                Try “I need a laptop under GH₵500” or “where can I find hostel essentials?”. Answers
                are grounded in live, approved listings.
              </p>
            </div>
          ) : (
            turns.map((turn, index) => (
              <div key={index} className="space-y-3">
                <p className="bg-brand-700 ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2 text-sm text-white">
                  {turn.question}
                </p>
                <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-2 text-sm leading-6 text-neutral-800">
                  <p className="whitespace-pre-line">{turn.reply}</p>
                  {turn.source === "search" ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      Answered from the live listing index. The AI assistant is not configured on
                      this deployment.
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={ask} className="mt-4 flex gap-2">
          <div className="flex-1">
            <label htmlFor="assistant-question" className="sr-only">
              Your question
            </label>
            <Input
              id="assistant-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What are you looking for?"
            />
          </div>
          <Button type="submit" disabled={pending || !question.trim()}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only">Ask</span>
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <Sparkles className="text-brand-700 h-4 w-4" aria-hidden="true" />
          Matching listings
        </h2>
        {turns.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">
            Listings that match your question appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {turns[turns.length - 1].products.map((product) => (
              <li key={product.id} className="rounded-lg border border-neutral-200 p-3">
                <Link
                  href={`/products/${product.slug}`}
                  className="text-sm font-semibold text-neutral-900 hover:underline"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-xs text-neutral-600">
                  {formatPesewas(product.pricePesewas)} · {product.categoryName} ·{" "}
                  <Link href={`/stores/${product.vendorSlug}`} className="hover:underline">
                    {product.vendorName}
                  </Link>
                </p>
              </li>
            ))}
            {turns[turns.length - 1].products.length === 0 ? (
              <li className="text-sm text-neutral-600">No live listings matched that question.</li>
            ) : null}
          </ul>
        )}
      </Card>
    </div>
  );
}
