import { createHash, randomBytes } from "node:crypto";

export type EmailResult = {
  delivered: boolean;
  reason?: "email_provider_not_configured" | "provider_error";
};

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function fromAddress(): string {
  return process.env["EMAIL_FROM"] ?? "JUMART <no-reply@jumart.market>";
}

export function appUrl(): string {
  return (
    process.env["NEXT_PUBLIC_APP_URL"] ??
    process.env["AUTH_URL"] ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function createToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

export function hashEmailToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[email:dev] provider not configured; message not sent\n  to: ${message.to}\n  subject: ${message.subject}\n  text: ${message.text}`,
      );
    } else {
      console.warn("[email] provider not configured; message not sent");
    }
    return { delivered: false, reason: "email_provider_not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!res.ok) {
      console.error(`[email] provider responded ${res.status}`);
      return { delivered: false, reason: "provider_error" };
    }
    return { delivered: true };
  } catch {
    console.error("[email] provider request failed");
    return { delivered: false, reason: "provider_error" };
  }
}
