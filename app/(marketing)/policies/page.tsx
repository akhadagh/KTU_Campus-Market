import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "Marketplace policies",
  description: "Draft marketplace rules for listings, transactions, and disputes.",
};

export default function PoliciesPage() {
  return (
    <ContentPage
      title="Marketplace policies"
      description="Rules for listings, transactions, reviews, and dispute resolution."
      updated="2 November 2026"
      draftNotice="These policies are drafts for product development. They require review and approval before launch and must be enforced consistently by moderators and administrators."
      sections={[
        {
          heading: "1. Listing standards",
          bullets: [
            "Listings must describe the actual product or service being offered.",
            "Images must be clear and must not misrepresent the product.",
            "Condition (New, Used, Refurbished) must be accurate.",
            "Prices must be stated in Ghana cedis and must not include hidden charges.",
            "Stock and availability must be kept up to date.",
            "Duplicate or misleading listings may be removed.",
          ],
        },
        {
          heading: "2. Prohibited items and conduct",
          bullets: [
            "Illegal products, stolen goods, weapons, and controlled substances.",
            "Counterfeit or infringing products.",
            "Products that violate university rules or applicable law.",
            "Fraud, scams, harassment, hate speech, and threats.",
            "Fake reviews, fake accounts, and manipulated ratings.",
            "Attempts to bypass platform payments or verification.",
          ],
        },
        {
          heading: "3. Vendor responsibilities",
          bullets: [
            "Maintain accurate stock and respond to order enquiries promptly.",
            "Package and hand over products as described.",
            "Honour pickup and delivery arrangements.",
            "Cooperate with disputes and provide evidence when requested.",
            "Comply with tax and business obligations that apply to them.",
          ],
        },
        {
          heading: "4. Buyer responsibilities",
          bullets: [
            "Provide accurate delivery or pickup information.",
            "Pay using supported methods and complete verification when required.",
            "Inspect items at pickup or delivery where practical.",
            "Raise issues promptly and honestly.",
            "Do not abuse reviews, reports, or disputes.",
          ],
        },
        {
          heading: "5. Reviews",
          bullets: [
            "Only buyers with a completed eligible purchase may review.",
            "One review per purchased item.",
            "Reviews must reflect the actual experience.",
            "Reviews may be moderated for abuse, spam, or policy violations.",
          ],
        },
        {
          heading: "6. Refunds and returns",
          paragraphs: [
            "Refund eligibility depends on the order status, the nature of the product, the vendor's stated policy, and provider capabilities. Refunds require authorization and provider confirmation. The platform will publish a clear refund process before launch.",
          ],
        },
        {
          heading: "7. Dispute resolution",
          paragraphs: [
            "Buyers and vendors should first attempt to resolve an issue through the order conversation. If unresolved, either party may open a dispute with evidence. Authorized staff review disputes and record decisions. Both parties must be treated fairly and only authorized parties may access dispute information.",
          ],
        },
        {
          heading: "8. Enforcement",
          bullets: [
            "Listings may be removed or restricted.",
            "Accounts may receive warnings, restrictions, or suspension.",
            "Repeated or serious violations may result in permanent removal.",
            "Privileged enforcement actions are audit-logged.",
          ],
        },
        {
          heading: "9. Appeals",
          paragraphs: [
            "A formal appeals process will be published before launch. Until then, this document is a development draft.",
          ],
        },
      ]}
    />
  );
}
