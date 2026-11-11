import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Eye, FileWarning, Lock, Scale, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Trust & safety",
  description: "How JUMART approaches verification, payments, reviews, reports, and disputes.",
};

const controls = [
  {
    icon: BadgeCheck,
    title: "Separate verification states",
    description:
      "Registered user, verified student, and verified vendor are distinct statuses. Registration alone is not identity verification.",
  },
  {
    icon: Eye,
    title: "Verified-purchase reviews",
    description:
      "Only buyers with a completed, eligible order can review. One review per purchased item is enforced.",
  },
  {
    icon: Lock,
    title: "Server-verified payments",
    description:
      "Payment success is confirmed with the provider and matched to the order. Browser messages are never trusted.",
  },
  {
    icon: FileWarning,
    title: "Reports and moderation",
    description:
      "Users can report listings, stores, reviews, and transactions. Reports enter a moderation queue with an audit trail.",
  },
  {
    icon: Scale,
    title: "Disputes with evidence",
    description:
      "Orders can be disputed with evidence. Only involved parties and authorized staff can access dispute details.",
  },
  {
    icon: ShieldCheck,
    title: "Administrative accountability",
    description:
      "Privileged actions are logged. Role changes, verification decisions, refunds, and moderation are auditable.",
  },
];

export default function TrustSafetyPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Trust & safety"
        description="A marketplace is only useful if students can trust what they see and how they pay."
      />

      <Alert variant="warning" title="Implementation status" className="mt-6">
        These controls are specified in the SRS and security notes. They are being implemented
        across Milestones 3–10. This page describes the design, not a claim that every control is
        live today.
      </Alert>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {controls.map((control) => {
          const Icon = control.icon;
          return (
            <Card key={control.title} className="p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-sm font-semibold text-neutral-900">{control.title}</h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">{control.description}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 rounded-2xl border border-neutral-200 bg-white p-8">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
          What to do if something goes wrong
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-neutral-700">
          <li>Contact the vendor through the order conversation.</li>
          <li>If unresolved, open a dispute from the order with the relevant evidence.</li>
          <li>Report suspicious listings or behavior to the moderation team.</li>
          <li>Keep communication and payment inside the platform where possible.</li>
        </ol>
        <Link href="/policies" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
          Read marketplace policies
        </Link>
      </div>
    </div>
  );
}
