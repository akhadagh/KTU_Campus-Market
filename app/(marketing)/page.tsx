import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  MessagesSquare,
  PackageCheck,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { CategoryCard } from "@/components/commerce/category-card";
import { ProductCard } from "@/components/commerce/product-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listMarketplaceCategories, listMarketplaceProducts } from "@/lib/marketplace";
import { cn } from "@/lib/utils";
import { connection } from "next/server";

const trustPoints = [
  {
    icon: BadgeCheck,
    title: "Verification states",
    description:
      "Registered users, verified students, and verified vendors are shown separately so buyers know who they are dealing with.",
  },
  {
    icon: ShieldCheck,
    title: "Server-verified payments",
    description:
      "Payment status is confirmed on the server. A browser message alone never marks an order as paid.",
  },
  {
    icon: Truck,
    title: "Campus pickup & delivery",
    description:
      "Choose pickup at a campus location or vendor-arranged delivery, with instructions and order updates.",
  },
  {
    icon: MessagesSquare,
    title: "Reports & disputes",
    description:
      "Report suspicious listings and open a dispute with evidence if an order goes wrong.",
  },
];

const steps = [
  {
    icon: Search,
    title: "Discover",
    description: "Search, browse categories, and filter by price, condition, and campus.",
  },
  {
    icon: Store,
    title: "Buy or sell",
    description: "Shop from student vendors or open your own store from the same account.",
  },
  {
    icon: PackageCheck,
    title: "Receive",
    description: "Choose pickup or delivery, track the order, and review the purchase.",
  },
];

function SectionHeading({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-600">{description}</p>
        ) : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="text-brand-700 hover:text-brand-900 inline-flex shrink-0 items-center gap-1 text-sm font-medium"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  await connection();

  const [categories, listings] = await Promise.all([
    listMarketplaceCategories(),
    listMarketplaceProducts({ sort: "newest", pageSize: 12 }),
  ]);
  const featured = listings.items;
  const trending = listings.items;

  return (
    <>
      <section className="hero-grid border-b border-neutral-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-20">
          <div className="animate-[var(--animate-fade-up)]">
            <Badge variant="success" className="shadow-sm">
              Live at Koforidua Technical University
            </Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Everything you need. Right around campus.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg">
              Buy from verified campus vendors, top up your airtime in seconds, and turn your ideas
              into a real business. Payments are held until you confirm your order.
            </p>

            <form
              action="/marketplace"
              method="get"
              role="search"
              className="mt-8 rounded-2xl border border-neutral-200 bg-white p-2.5 shadow-[var(--shadow-card)]"
            >
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <div className="relative">
                  <label htmlFor="hero-search" className="sr-only">
                    Search products
                  </label>
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="hero-search"
                    name="q"
                    type="search"
                    placeholder="What are you looking for?"
                    className="pl-9"
                  />
                </div>
                <div>
                  <label htmlFor="hero-category" className="sr-only">
                    Category
                  </label>
                  <Select id="hero-category" name="category" defaultValue="">
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" size="lg" className="sm:px-8">
                  Search
                </Button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/marketplace" className={buttonVariants({ size: "lg" })}>
                Explore marketplace
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/airtime" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                Buy airtime
              </Link>
              <Link href="/sell" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                Sell on campus
              </Link>
            </div>

            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-neutral-200 pt-6">
              {[
                { label: "Live listings", value: String(listings.total) },
                { label: "Campus vendors", value: "7" },
                { label: "Pay with", value: "Paystack" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-neutral-900">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mesh-panel rounded-2xl p-6 text-white shadow-[var(--shadow-glow)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Why students can trust it</p>
              <Badge variant="muted">Built for KTU</Badge>
            </div>
            <div className="mt-5 space-y-4">
              {trustPoints.slice(0, 3).map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="flex gap-3">
                    <div className="text-brand-700 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{point.title}</p>
                      <p className="text-brand-100/90 mt-0.5 text-xs leading-5">
                        {point.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-brand-100/80 mt-5 border-t border-white/15 pt-4 text-xs leading-5">
              Payments are verified server-side. If a provider is not configured the platform says
              so plainly instead of faking a successful payment.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          title="Featured categories"
          description="Find what you need by browsing the categories students use most."
          href="/categories"
          linkLabel="All categories"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={{
                name: category.name,
                slug: category.slug,
                type: category.type,
                productCount: category.productCount,
                iconUrl: category.iconUrl,
              }}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <Link
            href="/airtime"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5"
          >
            <div
              className="absolute -right-8 -bottom-10 h-40 w-40 rounded-full bg-white/10"
              aria-hidden="true"
            />
            <Smartphone className="h-7 w-7" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">Airtime &amp; data bundles</h3>
            <p className="mt-1 max-w-sm text-sm leading-6 text-emerald-50/90">
              Top up MTN, Telecel, Vodafone or AirtelTigo. Pay on Campus Market and the seller
              credits your number, or continue straight to the provider&rsquo;s own site.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
              Buy a bundle
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </Link>

          <Link
            href="/assistant"
            className="group from-brand-500 to-brand-700 relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5"
          >
            <div
              className="absolute -right-8 -bottom-10 h-40 w-40 rounded-full bg-white/10"
              aria-hidden="true"
            />
            <Sparkles className="h-7 w-7" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">Ask the campus assistant</h3>
            <p className="text-brand-50/90 mt-1 max-w-sm text-sm leading-6">
              Describe what you need and get answers grounded in live listings — prices, stores and
              stock that actually exist right now.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
              Ask a question
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Fresh on the marketplace"
          description="A preview of how listings will appear once vendor data is connected."
          href="/marketplace"
          linkLabel="Browse marketplace"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          title="Trending around campus"
          description="Newest listings from approved campus vendors, including hostel essentials and student services."
          href="/marketplace"
          linkLabel="See all listings"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trending.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-brand-900 bg-brand-900 overflow-hidden text-white">
          <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Badge variant="success">One account, both sides</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Turn your campus hustle into a storefront.
              </h2>
              <p className="text-brand-100 mt-3 max-w-2xl text-sm leading-6">
                Create a store, add products with clear photos, manage stock, and receive orders
                from students around campus. Verification and moderation help buyers trust what they
                see.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/sell" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  Start selling
                </Link>
                <Link
                  href="/how-it-works"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-white/30 bg-transparent text-white hover:bg-white/10",
                  )}
                >
                  How it works
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Create your store",
                "Upload clear product photos",
                "Set pickup or delivery",
                "Manage orders in one dashboard",
              ].map((item) => (
                <div
                  key={item}
                  className="text-brand-50 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          title="How it works"
          description="Three simple steps from discovery to delivery."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-50 text-brand-700 grid h-10 w-10 place-items-center rounded-lg">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-neutral-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{step.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          title="Trust and safety"
          description="Marketplace safety is a product feature, not an afterthought."
          href="/trust-safety"
          linkLabel="Read our approach"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point) => {
            const Icon = point.icon;
            return (
              <Card key={point.title} className="p-5">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-neutral-900">{point.title}</h3>
                <p className="mt-1 text-xs leading-5 text-neutral-600">{point.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pt-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Ready to shop or sell around campus?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-600">
            Join the KTU campus marketplace. One account lets you buy from fellow students and grow
            your own store.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Create an account
            </Link>
            <Link
              href="/marketplace"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Browse marketplace
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
