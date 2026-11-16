import { sendEmail } from "@/lib/email";

export async function sendMfaCode(user: { email: string; fullName: string }, code: string) {
  const result = await sendEmail({
    to: user.email,
    subject: "Your JUMART staff sign-in code",
    text: `Hi ${user.fullName},\n\nYour sign-in code for JUMART staff access is ${code}. It expires in 10 minutes. If this was not you, change your password and contact support immediately.\n\n${code}`,
    html: `<p>Hi ${escapeHtml(user.fullName)},</p><p>Your sign-in code for JUMART staff access is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>It expires in 10 minutes. If this was not you, change your password and contact support immediately.</p>`,
  });

  if (!result.delivered) {
    // Without a mail provider the code is only reachable from the server log.
    // This keeps the second factor mandatory while making it operable.
    console.warn(
      `[mfa] email provider unavailable — staff sign-in code for ${user.email}: ${code}`,
    );
  }
  return result;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
