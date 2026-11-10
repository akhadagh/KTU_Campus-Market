import {
  BedDouble,
  BookOpen,
  Dumbbell,
  Home,
  Laptop,
  Music,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface SampleCategory {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface SampleProduct {
  slug: string;
  name: string;
  description: string;
  pricePesewas: number;
  originalPricePesewas?: number;
  condition: "New" | "Used" | "Refurbished";
  categorySlug: string;
  categoryName: string;
  vendorName: string;
  vendorSlug: string;
  campus: string;
  rating: number;
  reviewCount: number;
  isSample: true;
}

export const sampleCategories: SampleCategory[] = [
  {
    slug: "electronics",
    name: "Electronics & Gadgets",
    description: "Phones, laptops, chargers, and accessories.",
    icon: Laptop,
  },
  {
    slug: "fashion",
    name: "Fashion & Clothing",
    description: "Clothing, shoes, bags, watches, and jewelry.",
    icon: Shirt,
  },
  {
    slug: "books-academics",
    name: "Books & Academics",
    description: "Textbooks, notes, calculators, and materials.",
    icon: BookOpen,
  },
  {
    slug: "food-groceries",
    name: "Food & Groceries",
    description: "Snacks, drinks, meals, and groceries.",
    icon: UtensilsCrossed,
  },
  {
    slug: "beauty-care",
    name: "Beauty & Personal Care",
    description: "Skincare, hair products, and cosmetics.",
    icon: Sparkles,
  },
  {
    slug: "hostel-essentials",
    name: "Hostel & Room Essentials",
    description: "Mattresses, fans, kitchenware, and furniture.",
    icon: BedDouble,
  },
  {
    slug: "sports-fitness",
    name: "Sports & Fitness",
    description: "Sportswear, gym equipment, and accessories.",
    icon: Dumbbell,
  },
  {
    slug: "services",
    name: "Services",
    description: "Design, printing, tutoring, repairs, and more.",
    icon: Wrench,
  },
  {
    slug: "accommodation",
    name: "Accommodation & Rentals",
    description: "Hostel spaces, room items, and rentals.",
    icon: Home,
  },
  {
    slug: "other",
    name: "Other Products",
    description: "Musical instruments and general merchandise.",
    icon: Music,
  },
];

export const sampleProducts: SampleProduct[] = [
  {
    slug: "hp-elitebook-840-g5",
    name: "HP EliteBook 840 G5",
    description:
      "Sample listing: 8GB RAM, 256GB SSD, Intel Core i5, good battery. Suitable for programming and assignments. This is demonstration data, not a real vendor listing.",
    pricePesewas: 285000,
    originalPricePesewas: 320000,
    condition: "Used",
    categorySlug: "electronics",
    categoryName: "Electronics & Gadgets",
    vendorName: "Sample Tech Store",
    vendorSlug: "sample-tech-store",
    campus: "KTU Main Campus",
    rating: 4.6,
    reviewCount: 18,
    isSample: true,
  },
  {
    slug: "dell-latitude-7490",
    name: "Dell Latitude 7490",
    description:
      "Sample listing: 16GB RAM, 512GB SSD, lightweight business laptop. Demonstration data only.",
    pricePesewas: 340000,
    condition: "Refurbished",
    categorySlug: "electronics",
    categoryName: "Electronics & Gadgets",
    vendorName: "Sample Tech Store",
    vendorSlug: "sample-tech-store",
    campus: "KTU Main Campus",
    rating: 4.4,
    reviewCount: 11,
    isSample: true,
  },
  {
    slug: "samsung-galaxy-a54",
    name: "Samsung Galaxy A54",
    description:
      "Sample listing: 128GB storage, dual SIM, excellent camera. Demonstration data only.",
    pricePesewas: 145000,
    originalPricePesewas: 160000,
    condition: "Used",
    categorySlug: "electronics",
    categoryName: "Electronics & Gadgets",
    vendorName: "Campus Mobile Hub",
    vendorSlug: "campus-mobile-hub",
    campus: "KTU Main Campus",
    rating: 4.7,
    reviewCount: 24,
    isSample: true,
  },
  {
    slug: "engineering-mathematics-textbook",
    name: "Engineering Mathematics Textbook",
    description: "Sample listing: second-hand textbook in good condition. Demonstration data only.",
    pricePesewas: 6500,
    condition: "Used",
    categorySlug: "books-academics",
    categoryName: "Books & Academics",
    vendorName: "Sample Book Corner",
    vendorSlug: "sample-book-corner",
    campus: "KTU Main Campus",
    rating: 4.8,
    reviewCount: 9,
    isSample: true,
  },
  {
    slug: "wireless-headphones",
    name: "Wireless Over-Ear Headphones",
    description:
      "Sample listing: Bluetooth headphones with noise isolation and long battery life. Demonstration data only.",
    pricePesewas: 18000,
    originalPricePesewas: 22000,
    condition: "New",
    categorySlug: "electronics",
    categoryName: "Electronics & Gadgets",
    vendorName: "Sample Gadget Shop",
    vendorSlug: "sample-gadget-shop",
    campus: "KTU Main Campus",
    rating: 4.3,
    reviewCount: 15,
    isSample: true,
  },
  {
    slug: "hostel-desk-fan",
    name: "Rechargeable Desk Fan",
    description:
      "Sample listing: quiet rechargeable fan suitable for hostel rooms. Demonstration data only.",
    pricePesewas: 9500,
    condition: "New",
    categorySlug: "hostel-essentials",
    categoryName: "Hostel & Room Essentials",
    vendorName: "Sample Hostel Essentials",
    vendorSlug: "sample-hostel-essentials",
    campus: "KTU Main Campus",
    rating: 4.5,
    reviewCount: 7,
    isSample: true,
  },
  {
    slug: "graphic-design-service",
    name: "Graphic Design Service",
    description:
      "Sample service: flyers, posters, and social media designs. Demonstration data only.",
    pricePesewas: 12000,
    condition: "New",
    categorySlug: "services",
    categoryName: "Services",
    vendorName: "Sample Creative Studio",
    vendorSlug: "sample-creative-studio",
    campus: "KTU Main Campus",
    rating: 4.9,
    reviewCount: 32,
    isSample: true,
  },
  {
    slug: "campus-printing-service",
    name: "Campus Printing & Binding",
    description:
      "Sample service: printing, binding, and project cover design. Demonstration data only.",
    pricePesewas: 3000,
    condition: "New",
    categorySlug: "services",
    categoryName: "Services",
    vendorName: "Sample Print Hub",
    vendorSlug: "sample-print-hub",
    campus: "KTU Main Campus",
    rating: 4.6,
    reviewCount: 21,
    isSample: true,
  },
];

export function getSampleProduct(slug: string) {
  return sampleProducts.find((product) => product.slug === slug);
}

export function getSampleCategory(slug: string) {
  return sampleCategories.find((category) => category.slug === slug);
}
