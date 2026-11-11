import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Draft privacy policy for JUMART.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy policy"
      description="How JUMART intends to collect, use, and protect personal information."
      updated="2 November 2026"
      draftNotice="This is a working draft. It must be reviewed against Ghana's Data Protection Act 2012 (Act 843) and applicable payment requirements before launch. This page is not a claim of legal compliance."
      sections={[
        {
          heading: "1. Information we collect",
          bullets: [
            "Account information such as name, email address, phone number, university, and campus.",
            "Verification information, including institutional email or student documents where required.",
            "Marketplace activity such as listings, orders, messages, reviews, reports, and disputes.",
            "Technical information needed for security, such as session metadata and device information.",
            "Payment references and transaction status from the payment provider. Raw card details are not stored.",
          ],
        },
        {
          heading: "2. How information is used",
          bullets: [
            "To create and secure accounts and verify eligibility.",
            "To operate the marketplace, process orders, and provide support.",
            "To prevent fraud, abuse, and policy violations.",
            "To send transactional notifications and, where permitted, marketplace updates.",
            "To improve search, recommendations, and platform reliability.",
          ],
        },
        {
          heading: "3. What is public",
          paragraphs: [
            "Public storefronts and listings show display-safe information such as store name, product details, campus, and ratings. Email addresses, phone numbers, verification documents, and private order or dispute details are not public.",
          ],
        },
        {
          heading: "4. Sharing",
          bullets: [
            "With payment, storage, email, SMS, and infrastructure providers strictly as needed to operate the service.",
            "With vendors and buyers as necessary to fulfil an order or resolve a dispute.",
            "With authorities where required by law or to protect safety and legal rights.",
            "JUMART does not sell personal information.",
          ],
        },
        {
          heading: "5. Retention",
          paragraphs: [
            "Account data is retained while the account is active. Financial, order, and audit records may be retained after account closure where required for legal, tax, fraud-prevention, or dispute-resolution purposes. Verification documents are retained only as long as necessary for the verification process and applicable obligations.",
          ],
        },
        {
          heading: "6. Security",
          paragraphs: [
            "Passwords are hashed, sessions are protected, authorization is enforced server-side, uploads are validated, and verification documents are stored privately. No system is perfectly secure, and the platform will maintain an incident response process.",
          ],
        },
        {
          heading: "7. Your choices",
          bullets: [
            "You can update profile information and notification preferences.",
            "You can disable personalization where it is available.",
            "You can request account deletion, subject to legal and financial retention requirements.",
            "You can report content or contact support about privacy concerns.",
          ],
        },
        {
          heading: "8. Children",
          paragraphs: [
            "The marketplace is intended for university and tertiary institution communities. It is not directed at children below the applicable age of digital consent.",
          ],
        },
        {
          heading: "9. Changes and contact",
          paragraphs: [
            "This policy may change as the product and legal requirements evolve. A formal privacy contact will be published before launch.",
          ],
        },
      ]}
    />
  );
}
