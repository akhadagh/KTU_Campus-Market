import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  MessagesSquare,
  PackageCheck,
  Search,
  ShieldCheck,
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
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <Badge variant="success">Launching at Koforidua Technical University</Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Everything you need. Right around campus.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg">
              Discover amazing deals, shop from fellow students, and turn your ideas into a
              business. Your campus marketplace starts here.
            </p>

            <form
              action="/marketplace"
              method="get"
              role="search"
              className="mt-8 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
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
              </Link>
              <Link href="/sell" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Sell on campus
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">Why students can trust it</p>
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
                      <p className="text-sm font-medium text-neutral-900">{point.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-neutral-600">
                        {point.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 border-t border-neutral-200 pt-4 text-xs leading-5 text-neutral-500">
              Payments, verification, and AI features are enabled only when their providers are
              configured. The platform never fakes a successful payment.
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
              }}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Featured products"
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
