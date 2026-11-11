import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, MapPin, ShieldCheck, Store, Users } from "lucide-react";
import { JumartMark, JumartWordmark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "About JUMART",
  description:
    "JUMART is a campus-first marketplace connecting students, vendors and service providers, launching at Koforidua Technical University.",
};

const pillars = [
  {
    icon: Store,
    title: "Campus-first",
    description:
      "We start with one university and build for the next: every feature is designed around how students actually shop, sell and study.",
  },
  {
    icon: ShieldCheck,
    title: "Trust by design",
    description:
      "Vendors and external purchase links are approved by our team, and payments are verified on the server before an order is marked paid.",
  },
  {
    icon: GraduationCap,
    title: "Built for students",
    description:
      "Free past questions and lecture notes, campus delivery, and prices in Ghana cedis from day one.",
  },
  {
    icon: Users,
    title: "One community",
    description:
      "Students, vendors, printers, tailors, food sellers and service providers all trade in the same place.",
  },
];

const milestones = [
  {
    label: "Today",
    title: "Koforidua Technical University",
    description:
      "JUMART is live on the KTU main campus with verified stores selling electronics, fashion, hostel essentials, food and services.",
  },
  {
    label: "Next",
    title: "More Ghanaian campuses",
    description:
      "We are onboarding the first campuses across the Eastern and Greater Accra regions, with the same approval standards.",
  },
  {
    label: "Later",
    title: "Beyond Ghana",
    description:
      "The platform is being designed so that new universities, and eventually new countries, can join without changing how students buy and sell.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="About JUMART"
        description="Your Campus. Your Marketplace — a campus-first marketplace built for students, vendors and service providers."
      />

      <Card className="mesh-panel mt-8 border-transparent p-7 text-white shadow-[var(--shadow-glow)]">
        <div className="flex items-center gap-3">
          <JumartMark variant="light" className="h-12 w-12" />
          <JumartWordmark tone="light" className="text-3xl" />
        </div>
        <p className="text-brand-100 mt-5 max-w-2xl text-base leading-7">
          JUMART connects students, vendors and service providers on one campus marketplace. It
          launches with a university-focused approach, but it is designed to scale across Ghana and
          eventually internationally.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/marketplace" className={buttonVariants({ variant: "accent" })}>
            Explore the marketplace
          </Link>
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Open a store
          </Link>
        </div>
      </Card>

      <h2 className="mt-12 text-2xl font-semibold tracking-tight text-neutral-900">
        What we stand for
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Card
              key={pillar.title}
              className="border-neutral-200/80 p-5 shadow-[var(--shadow-card)]"
            >
              <div className="bg-brand-50 text-brand-700 grid h-10 w-10 place-items-center rounded-xl">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-semibold text-neutral-900">{pillar.title}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">{pillar.description}</p>
            </Card>
          );
        })}
      </div>

      <h2 className="mt-12 text-2xl font-semibold tracking-tight text-neutral-900">
        Where we are going
      </h2>
      <ol className="mt-5 space-y-4">
        {milestones.map((milestone) => (
          <li key={milestone.label} className="flex gap-4">
            <Badge variant="accent" className="mt-1 h-fit shrink-0">
              {milestone.label}
            </Badge>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{milestone.title}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">{milestone.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <Card className="mt-12 flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-3">
          <MapPin className="text-brand-600 mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">Find us on campus</p>
            <p className="text-sm text-neutral-600">
              Adum, Koforidua Technical University, Eastern Region, Ghana.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/contact" className={buttonVariants({ variant: "outline" })}>
            Contact us
          </Link>
          <Link href="/resources" className={buttonVariants()}>
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            Free study materials
          </Link>
        </div>
      </Card>
    </div>
  );
}
