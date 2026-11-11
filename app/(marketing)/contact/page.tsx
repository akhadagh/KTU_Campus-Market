import type { Metadata } from "next";
import Link from "next/link";
import { Clock, LifeBuoy, Mail, MapPin, MessageCircle, Smartphone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Contact JUMART",
  description:
    "Get in touch with the JUMART team about orders, vendors, partnerships or anything else.",
};

const channels = [
  {
    icon: MessageCircle,
    title: "Support messages",
    description:
      "The fastest way to reach us. Open JUMART, go to Messages and send it to the JUMART team.",
    action: { href: "/messages", label: "Open messages" },
  },
  {
    icon: Mail,
    title: "Email",
    description: "For partnerships, bulk listings and anything that needs attachments.",
    action: { href: "mailto:support@jumart.market", label: "support@jumart.market" },
  },
  {
    icon: Smartphone,
    title: "Phone and WhatsApp",
    description: "For urgent order issues, message the JUMART desk directly.",
    action: { href: "tel:+233000000000", label: "+233 00 000 0000" },
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Contact JUMART"
        description="Questions about an order, a listing, or bringing your business onto campus? Talk to us."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const external =
            channel.action.href.startsWith("mailto") || channel.action.href.startsWith("tel");
          return (
            <Card
              key={channel.title}
              className="border-neutral-200/80 p-5 shadow-[var(--shadow-card)]"
            >
              <div className="bg-brand-50 text-brand-700 grid h-10 w-10 place-items-center rounded-xl">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-semibold text-neutral-900">{channel.title}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">{channel.description}</p>
              {external ? (
                <a
                  href={channel.action.href}
                  className="text-brand-700 mt-3 inline-block text-sm font-semibold hover:underline"
                >
                  {channel.action.label}
                </a>
              ) : (
                <Link
                  href={channel.action.href}
                  className="text-brand-700 mt-3 inline-block text-sm font-semibold hover:underline"
                >
                  {channel.action.label}
                </Link>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-sm font-semibold text-neutral-900">Where we are</h2>
        <p className="mt-2 flex items-start gap-2 text-sm text-neutral-600">
          <MapPin className="text-brand-600 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Adum, Koforidua Technical University, Eastern Region, Ghana.
        </p>
        <p className="mt-2 flex items-start gap-2 text-sm text-neutral-600">
          <Clock className="text-brand-600 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Support replies Monday to Saturday, 8am to 6pm GMT.
        </p>
      </Card>

      <Card className="border-brand-100 bg-brand-50/60 mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-3">
          <LifeBuoy className="text-brand-700 mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">Order problem?</p>
            <p className="text-sm text-neutral-600">
              Include your order number and we will pull up the full payment and delivery history.
            </p>
          </div>
        </div>
        <Link href="/messages" className={buttonVariants()}>
          Contact JUMART
        </Link>
      </Card>
    </div>
  );
}
