import { appUrl, sendEmail } from "@/lib/email";

export async function sendVerificationEmail(
  user: { email: string; fullName: string },
  token: string,
) {
  const link = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: user.email,
    subject: "Verify your JUMART email",
    text: `Hi ${user.fullName},\n\nConfirm your email address to finish setting up your JUMART account:\n${link}\n\nThis link expires in 24 hours. If you did not create an account, ignore this email.`,
    html: `<p>Hi ${escapeHtml(user.fullName)},</p><p>Confirm your email address to finish setting up your JUMART account:</p><p><a href="${link}">Verify my email</a></p><p>This link expires in 24 hours. If you did not create an account, ignore this email.</p>`,
  });
}

export async function sendPasswordResetEmail(
  user: { email: string; fullName: string },
  token: string,
) {
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: user.email,
    subject: "Reset your JUMART password",
    text: `Hi ${user.fullName},\n\nReset your password with this link:\n${link}\n\nThis link expires in 1 hour. If you did not request a reset, ignore this email.`,
    html: `<p>Hi ${escapeHtml(user.fullName)},</p><p>Reset your password with this link:</p><p><a href="${link}">Choose a new password</a></p><p>This link expires in 1 hour. If you did not request a reset, ignore this email.</p>`,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
