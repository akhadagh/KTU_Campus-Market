import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/content-page";

export const metadata: Metadata = {
  title: "Help & support",
  description: "Answers to common JUMART questions.",
};

export default function HelpPage() {
  return (
    <ContentPage
      title="Help & support"
      description="Common questions about accounts, buying, selling, payments, and safety."
      sections={[
        {
          heading: "Accounts and verification",
          paragraphs: [
            "One account supports both buying and selling. Creating an account makes you a buyer. Vendor status requires a separate application and approval.",
            "Student verification can use an institutional email or a reviewed student document. Verification documents are private and accessible only to authorized reviewers.",
          ],
        },
        {
          heading: "Buying",
          paragraphs: [
            "Browse the marketplace, open a listing, and check the vendor, condition, price, and pickup or delivery options before ordering.",
            "The server validates prices and stock at checkout. If a product becomes unavailable, checkout will explain the issue instead of charging an incorrect total.",
          ],
        },
        {
          heading: "Selling",
          paragraphs: [
            "Vendors create a store, publish listings with clear photos and accurate descriptions, and manage orders from a dashboard.",
            "Vendors may only manage their own store, listings, and orders.",
          ],
        },
        {
          heading: "Payments",
          paragraphs: [
            "Payments are verified on the server using a configured payment provider. The platform does not mark an order paid based on a browser message.",
            "If payments are not configured, checkout will say so clearly. No live payment is simulated.",
          ],
        },
        {
          heading: "Safety and disputes",
          paragraphs: [
            "Report suspicious listings or behavior from the relevant page. Reports enter a moderation queue.",
            "If an order goes wrong, contact the vendor first, then open a dispute with evidence if needed.",
          ],
        },
        {
          heading: "Current status",
          paragraphs: [
            "JUMART is under active development. Account, marketplace, cart, payment, and AI features are being delivered in the milestones documented in the project roadmap. Help content will expand as those features go live.",
          ],
        },
      ]}
    />
  );
}
