import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "Draft terms governing the use of Campus Market.",
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms & conditions"
      description="Draft terms governing the use of Campus Market."
      updated="2 November 2026"
      draftNotice="This is a working draft for product development. It must be reviewed and approved by a qualified legal professional before the marketplace opens to real users or processes real payments."
      sections={[
        {
          heading: "1. About Campus Market",
          paragraphs: [
            "Campus Market is a marketplace that connects students and campus businesses with buyers in a university community. The platform is launching at Koforidua Technical University and is designed to support additional campuses.",
            "Campus Market provides the marketplace infrastructure. Unless expressly stated, it is not the seller of products listed by vendors.",
          ],
        },
        {
          heading: "2. Accounts",
          bullets: [
            "You must provide accurate registration information and keep it up to date.",
            "You are responsible for protecting your password and account access.",
            "You must not impersonate another person or create accounts for fraudulent purposes.",
            "Elevated roles are granted only by authorized administrators.",
          ],
        },
        {
          heading: "3. Buying",
          bullets: [
            "Product information is provided by vendors, subject to moderation and platform rules.",
            "Prices, availability, and delivery options are confirmed by the server at checkout.",
            "You must pay using supported payment methods and must not attempt to bypass payment verification.",
            "Orders may be cancelled only in accordance with the order status rules and marketplace policies.",
          ],
        },
        {
          heading: "4. Selling",
          bullets: [
            "Vendors must be approved and must comply with verification requirements.",
            "Listings must be accurate, lawful, and use images that represent the actual product.",
            "Vendors are responsible for stock accuracy and fulfilment.",
            "Prohibited products and misleading listings may be removed, and accounts may be suspended.",
          ],
        },
        {
          heading: "5. Payments and refunds",
          paragraphs: [
            "Payments are processed by configured third-party providers. Campus Market does not store raw card details. A payment is considered successful only after server-side verification.",
            "Refunds and disputes are handled according to marketplace policy, provider capabilities, and applicable law. The platform must not advertise escrow protection unless a compliant arrangement is in place.",
          ],
        },
        {
          heading: "6. Reviews and content",
          bullets: [
            "Reviews are limited to eligible purchases and must be honest.",
            "Harassment, hate speech, fraud, and illegal content are prohibited.",
            "The platform may moderate, remove, or restrict content that violates policy.",
          ],
        },
        {
          heading: "7. Suspension and termination",
          paragraphs: [
            "Accounts may be suspended or restricted for fraud, abuse, policy violations, or security risks. Financial and audit records may be retained as required by law and legitimate business needs.",
          ],
        },
        {
          heading: "8. Limitation and changes",
          paragraphs: [
            "The marketplace is provided on an evolving basis during development. Terms may change as the product and legal requirements evolve. Material changes will be communicated through the platform.",
            "Nothing in this draft constitutes legal advice or a final legal agreement.",
          ],
        },
        {
          heading: "9. Contact",
          paragraphs: [
            "A formal support and legal contact will be published before launch. Until then, this document is a development draft.",
          ],
        },
      ]}
    />
  );
}
