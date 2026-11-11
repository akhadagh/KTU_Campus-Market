import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Headphones,
  MessageSquare,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";
import { CategoryCard } from "@/components/commerce/category-card";
import { ProductCard } from "@/components/commerce/product-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  listMarketplaceCategories,
  listMarketplaceProducts,
  listMarketplaceVendors,
} from "@/lib/marketplace";
import { formatPesewas } from "@/lib/money";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Buy and sell on your campus",
  description:
    "Shop laptops, sandals, Ghanaian food, past questions and airtime bundles from verified vendors on your campus. Buy and sell with JUMART.",
};

const valueProps = [
  {
    icon: ShoppingBag,
    title: "Buy from campus vendors",
    description: "Everything from laptops to jollof, listed by people around you.",
  },
  {
    icon: Store,
    title: "Sell with your store",
    description: "Open a JUMART store, list your products and manage orders in one place.",
  },
  {
    icon: MessageSquare,
    title: "Talk directly",
    description: "Message a seller or the JUMART team before you pay.",
  },
  {
    icon: Wallet,
    title: "Pay securely",
    description: "Server-verified Paystack payments. Nothing is marked paid until we confirm it.",
  },
];

const trustPoints = [
  {
    icon: BadgeCheck,
    title: "Admin-approved vendors",
    description: "Every store and every external purchase link is reviewed before students see it.",
  },
  {
    icon: ShieldCheck,
    title: "Verified payments",
    description:
      "Payments are confirmed server-side with Paystack, and sellers only see paid orders.",
  },
  {
    icon: PackageCheck,
    title: "Order tracking",
    description: "Follow each order from accepted to delivered, with a history of every update.",
  },
  {
    icon: BookOpen,
    title: "Free study materials",
    description: "Past questions, solutions and lecture notes uploaded by the JUMART team.",
  },
];

export default async function HomePage() {
  await connection();

  const [categories, listings, trending, vendors] = await Promise.all([
    listMarketplaceCategories(),
    listMarketplaceProducts({ sort: "newest", pageSize: 24 }),
    listMarketplaceProducts({ sort: "rating", pageSize: 8 }),
    listMarketplaceVendors({ pageSize: 4 }),
  ]);

  const featured = listings.items.slice(0, 8);
  const deals = listings.items
    .filter(
      (product) =>
        product.originalPricePesewas && product.originalPricePesewas > product.pricePesewas,
    )
    .slice(0, 4);

  return (
    <>
      <section className="hero-grid border-b border-neutral-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
          <div className="animate-[var(--animate-fade-up)]">
            <Badge variant="success" className="shadow-sm">
              Live at Koforidua Technical University
            </Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Everything you need.
              <br />
              <span className="text-brand-700">Right around campus.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg">
              Buy laptops, sneakers, Ghanaian food and study materials from verified vendors around
              you. Sell your own products, top up your airtime, and reach the JUMART team when you
              need help.
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
                    Search products and services
                  </label>
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="hero-search"
                    name="q"
                    type="search"
                    placeholder="What are you looking for?"
                    className="h-12 rounded-xl border-0 pl-10 shadow-none"
                  />
                </div>
                <div>
                  <label htmlFor="hero-category" className="sr-only">
                    Category
                  </label>
                  <Select
                    id="hero-category"
                    name="category"
                    defaultValue=""
                    className="h-12 rounded-xl"
                  >
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" size="lg" className="h-12 rounded-xl px-6">
                  Search
                </Button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/marketplace" className={buttonVariants({ size: "lg" })}>
                Shop now
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/sell" className={buttonVariants({ variant: "outline", size: "lg" })}>
                <Store className="h-4 w-4" aria-hidden="true" />
                Start selling
              </Link>
              <Link href="/airtime" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                Buy airtime
              </Link>
            </div>

            <dl className="mt-9 grid max-w-xl grid-cols-3 gap-4 border-t border-neutral-200 pt-6">
              {[
                { label: "Live listings", value: String(listings.total) },
                { label: "Campus stores", value: String(vendors.total) },
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

          <div className="mesh-panel rounded-3xl p-7 text-white shadow-[var(--shadow-glow)]">
            <Badge variant="accent" className="bg-accent-500 text-white">
              Campus deals
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Shop smarter on <span className="text-accent-400">JUMART</span>
            </h2>
            <p className="text-brand-100 mt-2 text-sm leading-6">
              Fresh listings from verified vendors around campus, updated every day.
            </p>

            <ul className="mt-6 space-y-4">
              {valueProps.map((prop) => {
                const Icon = prop.icon;
                return (
                  <li key={prop.title} className="flex gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
                      <Icon className="text-accent-400 h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{prop.title}</p>
                      <p className="text-brand-100/85 mt-0.5 text-xs leading-5">
                        {prop.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/categories"
                className="text-brand-700 hover:bg-brand-50 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold transition-colors"
              >
                Browse categories
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                Free past questions
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          title="Shop by category"
          description="Everything a student needs, grouped so you can find it fast."
          href="/categories"
          linkLabel="All categories"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((category) => (
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

      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            title="Fresh on the marketplace"
            description="The newest listings approved for students this week."
            href="/marketplace"
            linkLabel="See all"
          />
          {featured.length === 0 ? (
            <EmptyPanel
              title="No listings yet"
              description="Approved vendor listings appear here as soon as they are published."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {deals.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            title="Campus deals"
            description="Reduced prices from vendors clearing stock around campus."
            href="/marketplace?sort=price_asc"
            linkLabel="All deals"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {deals.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="group block">
                <Card className="group-hover:border-accent-300 h-full overflow-hidden border-neutral-200/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.imageAlt ?? product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : null}
                    <span className="bg-accent-500 absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white">
                      <Tag className="h-3 w-3" aria-hidden="true" />
                      Deal
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-1 text-sm font-semibold text-neutral-900">
                      {product.name}
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-base font-bold text-neutral-900">
                        {formatPesewas(product.pricePesewas)}
                      </span>
                      {product.originalPricePesewas ? (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatPesewas(product.originalPricePesewas)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-neutral-500">{product.vendorName}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-y border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            title="Trending near you"
            description="Listings students keep coming back to."
            href="/marketplace?sort=rating"
            linkLabel="See all"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {trending.items.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeader
          title="Stores to know"
          description="Verified campus vendors with fast responses and campus delivery."
          href="/marketplace"
          linkLabel="Explore stores"
        />
        {vendors.items.length === 0 ? (
          <EmptyPanel
            title="No stores yet"
            description="Approved vendor stores appear here once an administrator approves them."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vendors.items.map((vendor) => (
              <Link key={vendor.id} href={`/stores/${vendor.slug}`} className="group block">
                <Card className="group-hover:border-brand-200 h-full border-neutral-200/80 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-700 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white">
                      <Store className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {vendor.storeName}
                      </p>
                      <p className="text-xs text-neutral-500">{vendor.businessCategory}</p>
                    </div>
                  </div>
                  {vendor.description ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-600">
                      {vendor.description}
                    </p>
                  ) : null}
                  <p className="text-brand-700 mt-3 text-xs font-medium">
                    {vendor.productCount} listing{vendor.productCount === 1 ? "" : "s"}
                    {vendor.deliveryAvailable ? " · delivery" : ""}
                    {vendor.pickupAvailable ? " · pickup" : ""}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
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
              Top up MTN, Telecel, Vodafone and AirtelTigo through verified merchants. Every link is
              checked by our team before students can use it.
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
            href="/sell"
            className="group from-accent-500 to-accent-600 relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5"
          >
            <div
              className="absolute -right-8 -bottom-10 h-40 w-40 rounded-full bg-white/10"
              aria-hidden="true"
            />
            <Store className="h-7 w-7" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">Open a JUMART store</h3>
            <p className="text-accent-50/90 mt-1 max-w-sm text-sm leading-6">
              Turn your hustle into a real store. List products, take orders, manage fulfilment and
              grow your customer base around campus.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
              Start selling
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge variant="default">Trust &amp; safety</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                Built so students can shop with confidence
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                JUMART is designed around the things that make campus marketplaces risky: unverified
                sellers, fake payments and no support.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/trust-safety" className={buttonVariants({ variant: "outline" })}>
                  Read our safety guide
                </Link>
                <Link href="/help" className={buttonVariants({ variant: "ghost" })}>
                  Visit the help centre
                </Link>
              </div>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <li key={point.title} className="rounded-2xl border border-neutral-200 p-5">
                    <div className="bg-brand-50 text-brand-700 grid h-10 w-10 place-items-center rounded-xl">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-neutral-900">{point.title}</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">{point.description}</p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-neutral-100 pt-8 text-center">
            {[
              { icon: Truck, label: "Campus delivery" },
              { icon: Headphones, label: "Real support" },
              { icon: Sparkles, label: "Grounded AI help" },
              { icon: Wallet, label: "Paystack secured" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <p
                  key={item.label}
                  className="flex items-center gap-2 text-sm font-medium text-neutral-600"
                >
                  <Icon className="text-brand-600 h-4 w-4" aria-hidden="true" />
                  {item.label}
                </p>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeader({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">{description}</p>
      </div>
      <Link
        href={href}
        className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
      >
        {linkLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <p className="mt-1 text-sm text-neutral-600">{description}</p>
    </Card>
  );
}
