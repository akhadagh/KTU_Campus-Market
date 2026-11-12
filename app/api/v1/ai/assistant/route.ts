import { fail, ok } from "@/lib/api-response";
import { askAssistant } from "@/lib/ai";
import { getSession } from "@/lib/auth/session";
import { clientIp, rateLimitWith } from "@/lib/rate-limit";

const schema = {
  parse(value: unknown) {
    const message =
      typeof value === "object" && value !== null
        ? (value as { message?: unknown }).message
        : undefined;
    if (typeof message !== "string" || message.trim().length === 0) {
      return { success: false as const, message: "Ask a question about campus listings." };
    }
    if (message.length > 500) {
      return { success: false as const, message: "Keep your question under 500 characters." };
    }
    return { success: true as const, message: message.trim() };
  },
};

export async function POST(request: Request) {
  const session = await getSession();
  const rateKey = session
    ? `ai-assistant:${session.user.id}`
    : `ai-assistant:ip:${clientIp(request)}`;
  const aiLimit = await rateLimitWith(rateKey, 30, {
    windowMs: 60 * 60_000,
    failClosed: false,
  });
  if (!aiLimit.allowed) {
    return fail("RATE_LIMITED", "Too many questions. Try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.parse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.message, 422);
  }

  const result = await askAssistant(parsed.message);
  return ok(result);
}
