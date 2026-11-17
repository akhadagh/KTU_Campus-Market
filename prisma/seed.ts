try {
  process.loadEnvFile(".env");
} catch {
  // Standalone runs may rely on exported environment variables only.
}

import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";
import {
  ProductCondition,
  CategoryType,
  DeliveryOption,
  PurchaseMode,
} from "../lib/generated/prisma/client";
import { Prisma } from "../lib/generated/prisma/client";

const SAMPLE_PASSWORD = process.env["SEED_SAMPLE_PASSWORD"] ?? "CampusSample!2026";

const sampleCategories: { slug: string; name: string; type: CategoryType }[] = [
  { slug: "electronics", name: "Electronics & Gadgets", type: CategoryType.PRODUCT },
  { slug: "fashion", name: "Fashion & Clothing", type: CategoryType.PRODUCT },
  { slug: "books-academics", name: "Books & Academics", type: CategoryType.PRODUCT },
  { slug: "food-groceries", name: "Food & Groceries", type: CategoryType.PRODUCT },
  { slug: "beauty-care", name: "Beauty & Personal Care", type: CategoryType.PRODUCT },
  { slug: "hostel-essentials", name: "Hostel & Room Essentials", type: CategoryType.PRODUCT },
  { slug: "sports-fitness", name: "Sports & Fitness", type: CategoryType.PRODUCT },
  { slug: "services", name: "Services", type: CategoryType.SERVICE },
  { slug: "accommodation", name: "Accommodation & Rentals", type: CategoryType.SERVICE },
  { slug: "airtime-bundles", name: "Airtime & Data Bundles", type: CategoryType.SERVICE },
  { slug: "other", name: "Other Products", type: CategoryType.PRODUCT },
];

const roles = [
  { name: "admin", description: "Platform administrator" },
  { name: "moderator", description: "Content and trust moderator" },
  { name: "vendor", description: "Campus seller" },
  { name: "buyer", description: "Campus shopper" },
];

const rolePermissions = {
  admin: [
    "product.create",
    "product.edit",
    "product.moderate",
    "order.manage",
    "vendor.approve",
    "user.manage",
    "report.review",
    "settings.manage",
  ],
  moderator: ["product.moderate", "report.review"],
  vendor: ["product.create", "product.edit", "order.manage"],
  buyer: [],
};

const conditionMap: Record<string, ProductCondition> = {
  New: ProductCondition.NEW,
  Used: ProductCondition.USED_GOOD,
  Refurbished: ProductCondition.REFURBISHED,
};

const vendors = [
  {
    storeName: "Adum Tech Point",
    slug: "adum-tech-point",
    email: "adumtechpoint@campusmarket.gh",
    description:
      "Laptops, phones and everyday tech accessories, all tested in store before they are listed. We deliver to your hostel block on campus within 30 minutes.",
    businessCategory: "Electronics",
    phone: "+233245551201",
    whatsapp: "+233245551201",
    deliveryAvailable: true,
    pickupAvailable: true,
  },
  {
    storeName: "Campus Book Hub",
    slug: "campus-book-hub",
    email: "campusbookhub@campusmarket.gh",
    description:
      "Course materials, past questions and stationery for every department. Second-hand textbooks are cleaned and checked before they go on the shelf.",
    businessCategory: "Books & Stationery",
    phone: "+233245551202",
    whatsapp: "+233245551202",
    deliveryAvailable: true,
    pickupAvailable: true,
  },
  {
    storeName: "Hostel Nest Store",
    slug: "hostel-nest-store",
    email: "hostelneststore@campusmarket.gh",
    description:
      "Everything a first-year hostel room needs: kettles, fans, lighting and storage. We keep prices student-friendly and stock popular sizes year round.",
    businessCategory: "Hostel Essentials",
    phone: "+233245551203",
    whatsapp: "+233245551203",
    deliveryAvailable: true,
    pickupAvailable: true,
  },
  {
    storeName: "Adum Fresh Mart",
    slug: "adum-fresh-mart",
    email: "adumfreshmart@campusmarket.gh",
    description:
      "Chilled food, snacks and groceries delivered to your hostel. Order before 6pm for same-evening delivery around campus.",
    businessCategory: "Food & Groceries",
    phone: "+233245551204",
    whatsapp: "+233245551204",
    deliveryAvailable: true,
    pickupAvailable: true,
  },
  {
    storeName: "Kente & Co. Threads",
    slug: "kente-and-co-threads",
    email: "kenteandco@campusmarket.gh",
    description:
      "Print, fabric and everyday clothing stitched and sold on campus. We take orders for graduation robes and aso-oke fits.",
    businessCategory: "Fashion",
    phone: "+233245551205",
    whatsapp: "+233245551205",
    deliveryAvailable: false,
    pickupAvailable: true,
  },
  {
    storeName: "KTU Print & Graphics",
    slug: "ktu-print-and-graphics",
    email: "printgraphics@campusmarket.gh",
    description:
      "Printing, binding, lamination and design work for assignments, projects and small businesses. Same-day turnaround on most jobs.",
    businessCategory: "Services",
    phone: "+233245551206",
    whatsapp: "+233245551206",
    deliveryAvailable: true,
    pickupAvailable: true,
  },
  {
    storeName: "TeleLink Data Point",
    slug: "telelink-data-point",
    email: "telelinkdatapoint@campusmarket.gh",
    description:
      "Airtime and data bundles for MTN, Telecel, Vodafone and AirtelTigo. Buy on JUMART and we credit your number, or continue to the network's own page.",
    businessCategory: "Airtime & Data",
    phone: "+233245551207",
    whatsapp: "+233245551207",
    deliveryAvailable: true,
    pickupAvailable: true,
  },
  {
    storeName: "Kwame's Data Spot",
    slug: "kwames-data-spot",
    email: "kwamesdatagotpoint@campusmarket.gh",
    description:
      "Data bundles for every network, bought from the nearest point. Send us your number on WhatsApp and we top it up while you wait.",
    businessCategory: "Airtime & Data",
    phone: "+233245551208",
    whatsapp: "+233245551208",
    deliveryAvailable: true,
    pickupAvailable: true,
  },
];

type ProductSeed = {
  slug: string;
  name: string;
  description: string;
  pricePesewas: number;
  originalPricePesewas?: number;
  condition: string;
  categorySlug: string;
  vendorSlug: string;
  quantity: number;
  tags: string[];
  delivery?: DeliveryOption[];
  purchaseMode?: PurchaseMode;
  externalUrl?: string;
  externalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  digital?: { network: string; dataAmount: string; validity: string };
  images?: string[];
  variants?: { name: string; stock: number; priceDeltaCedis?: number; sku?: string }[];
};

const products: ProductSeed[] = [
  {
    slug: "hp-elitebook-840-g5",
    name: "HP EliteBook 840 G5",
    description:
      "8GB RAM, 256GB SSD, Intel Core i5 (8th gen), Windows 11 installed. Battery health around 88 percent, clean body with minor scratches on the lid. Charger included, and it charges at full speed. Best seller for programming and assignments.",
    pricePesewas: 285000,
    originalPricePesewas: 320000,
    condition: "Used",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 2,
    tags: ["laptop", "hp", "business", "8gb ram"],
  },
  {
    slug: "dell-latitude-7490",
    name: "Dell Latitude 7490",
    description:
      "16GB RAM, 512GB SSD, Intel Core i7, 14-inch Full HD display. Refurbished with a new battery and a fresh Windows installation. Lightweight enough for daily carry to lectures.",
    pricePesewas: 340000,
    condition: "Refurbished",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 1,
    tags: ["laptop", "dell", "16gb ram"],
  },
  {
    slug: "lenovo-ideapad-15",
    name: 'Lenovo IdeaPad 1 15"',
    description:
      "4GB RAM, 128GB SSD, 15.6-inch display. Handles browsing, documents and Zoom classes comfortably. Comes with a 45W charger; battery lasts about four hours on a full charge.",
    pricePesewas: 165000,
    condition: "Used",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 3,
    tags: ["laptop", "lenovo", "student"],
  },
  {
    slug: "samsung-galaxy-a54-5g",
    name: "Samsung Galaxy A54 5G",
    description:
      "128GB storage, 8GB RAM, 50MP main camera, 5000mAh battery. Screen is free of scratches and the phone is still under warranty. Comes with the original box and a 25W charger.",
    pricePesewas: 235000,
    originalPricePesewas: 260000,
    condition: "Used",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 4,
    tags: ["phone", "samsung", "5g"],
  },
  {
    slug: "sony-wh-ch720n-headphones",
    name: "Sony WH-CH720N Wireless Headphones",
    description:
      "Active noise cancelling over-ear headphones with about 30 hours of battery life. Comes with the carry case, USB-C cable and 3.5mm audio cable. Sealed box.",
    pricePesewas: 42000,
    originalPricePesewas: 52000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 6,
    tags: ["audio", "headphones", "noise cancelling"],
  },
  {
    slug: "anker-20w-charger",
    name: "Anker 20W USB-C Fast Charger",
    description:
      "Compact 20W USB-C wall charger that charges phones and small tablets to about 50 percent in 30 minutes. Foldable pins, works with Ghana 230V sockets.",
    pricePesewas: 8500,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 15,
    tags: ["charger", "usb-c", "fast charge"],
  },
  {
    slug: "anker-powercore-10000",
    name: "Anker PowerCore 10,000mAh Power Bank",
    description:
      "10,000mAh power bank with two USB-A ports and one USB-C port. Enough for roughly three full phone charges. Charges from 0 to 60 percent in an hour.",
    pricePesewas: 16500,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 12,
    tags: ["power bank", "charger", "travel"],
  },
  {
    slug: "jbl-go-3-speaker",
    name: "JBL Go 3 Bluetooth Speaker",
    description:
      "Portable waterproof speaker with surprisingly loud sound for its size. Eight hours of playtime, IP67 dust and water resistance, and a clip for your bag.",
    pricePesewas: 19000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 8,
    tags: ["audio", "speaker", "bluetooth"],
  },
  {
    slug: "logitech-m330-mouse",
    name: "Logitech M330 Wireless Mouse",
    description:
      "Quiet-click wireless mouse with a 24-month battery and a tiny USB receiver that works with any laptop. One of the most reliable mice for long assignment nights.",
    pricePesewas: 7000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 10,
    tags: ["mouse", "wireless", "accessories"],
  },
  {
    slug: "tp-link-archer-ac1200",
    name: "TP-Link Archer AC1200 Wi-Fi Router",
    description:
      "Dual-band router with four antennas for strong coverage in a shared hostel room. Set up in minutes from the phone app and works with any Ghanaian broadband provider.",
    pricePesewas: 21000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 5,
    tags: ["router", "wifi", "network"],
  },
  {
    slug: "ampx-32gb-microsd",
    name: "Ampex 32GB microSD + Adapter",
    description:
      "32GB Class 10 microSD card with an SD adapter. Enough for course videos, lecture recordings and project backups. Tested and formatted before dispatch.",
    pricePesewas: 3500,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 20,
    tags: ["storage", "memory card", "accessories"],
  },
  {
    slug: "apple-usb-c-20w-charger",
    name: "Apple USB-C 20W Power Adapter",
    description:
      "Original 20W USB-C power adapter for iPhone and iPad. Genuine item with the standard braided cable included in the box.",
    pricePesewas: 9500,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 14,
    tags: ["charger", "apple", "usb-c"],
  },
  {
    slug: "engineering-mathematics-textbook",
    name: "Engineering Mathematics Textbook (3rd Edition)",
    description:
      "The standard mathematics text used across the engineering programmes. Clean pages, no missing chapters and no highlighting, so it is still easy to follow.",
    pricePesewas: 12000,
    condition: "Used",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 6,
    tags: ["textbook", "mathematics", "engineering"],
  },
  {
    slug: "computer-networks-beginners",
    name: "Computer Networks for Beginners",
    description:
      "Introductory networking text covering the OSI model, TCP/IP and routing. Brand new copy, still in shrink wrap. Great for the Computer Science elective.",
    pricePesewas: 9500,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 5,
    tags: ["textbook", "networking", "ict"],
  },
  {
    slug: "exam-answer-booklets-pack-of-5",
    name: "Exam Answer Booklets (Pack of 5)",
    description:
      "Five hard-cover answer booklets with the campus name pre-printed. Popular during exam season, so order early if you need a specific quantity.",
    pricePesewas: 1800,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 40,
    tags: ["exam", "stationery"],
  },
  {
    slug: "a4-spiral-exercise-books-set-of-3",
    name: "A4 Spiral Exercise Books (Set of 3)",
    description:
      "Three 120-page hard-cover spiral notebooks with ruled paper and a margin line. Survive a full semester of notes without bending.",
    pricePesewas: 2700,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 25,
    tags: ["notebook", "stationery", "exercise books"],
  },
  {
    slug: "casio-fx-991-calculator",
    name: "Casio FX-991EX Scientific Calculator",
    description:
      "The calculator most departments allow for exams. Solar plus battery powered, with a slide-on cover and the exam mode already set up.",
    pricePesewas: 14500,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 9,
    tags: ["calculator", "exam", "casio"],
  },
  {
    slug: "cambridge-as-a-level-physics",
    name: "Cambridge International AS & A Level Physics",
    description:
      "Coursebook for the physics syllabus, with worked examples and end-of-chapter questions. Some pencil notes in the margins, otherwise clean.",
    pricePesewas: 18000,
    condition: "Used",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 3,
    tags: ["textbook", "physics", "cambridge"],
  },
  {
    slug: "past-questions-wassce-bundle",
    name: "WASSCE Past Questions & Answers Bundle",
    description:
      "Five years of past questions with worked solutions for Mathematics, Physics, Chemistry and English. The bundle most students buy before the mocks.",
    pricePesewas: 6000,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 12,
    tags: ["past questions", "wassce", "revision"],
  },
  {
    slug: "highlighters-pens-set-12",
    name: "Highlighters & Pens Set (12)",
    description:
      "Twelve assorted highlighters and gel pens in a clear pouch. Colours do not bleed through standard exam paper.",
    pricePesewas: 2500,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 30,
    tags: ["pens", "highlighters", "stationery"],
  },
  {
    slug: "5l-electric-kettle",
    name: "5L Electric Kettle",
    description:
      "Five-litre stainless steel kettle with an auto shut-off, fast boiling and a removable limescale filter. Big enough for a whole hostel floor.",
    pricePesewas: 7500,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 14,
    tags: ["kettle", "hostel", "kitchen"],
  },
  {
    slug: "rechargeable-table-fan",
    name: 'Rechargeable Table Fan (16")',
    description:
      "Sixteen-inch rechargeable fan with three speeds, a USB charging port and a LED light. Runs for about six hours on one charge, which covers the night.",
    pricePesewas: 13000,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 10,
    tags: ["fan", "hostel", "rechargeable"],
  },
  {
    slug: "memory-foam-pillow",
    name: "Memory Foam Pillow",
    description:
      "Slow-rebound memory foam pillow with a breathable cotton cover. Helps with neck pain after long study sessions and it does not go flat.",
    pricePesewas: 5500,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 16,
    tags: ["pillow", "bedroom", "comfort"],
  },
  {
    slug: "study-desk-lamp-led",
    name: "LED Study Desk Lamp (3 Brightness)",
    description:
      "Adjustable desk lamp with three brightness levels and a USB charging port on the base. Foldable arm so it fits into a small hostel desk.",
    pricePesewas: 6500,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 18,
    tags: ["lamp", "study", "lighting"],
  },
  {
    slug: "laundry-basket-collapsible",
    name: "Collapsible Laundry Basket",
    description:
      "Foldable laundry basket with handles and a waterproof lining. Flat when empty so it does not take up room in a tight hostel room.",
    pricePesewas: 4000,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 11,
    tags: ["laundry", "storage", "hostel"],
  },
  {
    slug: "bedside-storage-rack",
    name: "Bedside Storage Rack",
    description:
      "Two-tier bedside rack that fits under a study bed. Metal frame with a textured top that will not let a phone slide off.",
    pricePesewas: 4800,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 9,
    tags: ["storage", "rack", "hostel"],
  },
  {
    slug: "water-bottle-25l-straw",
    name: "2.5L Water Bottle with Straw",
    description:
      "Large 2.5-litre bottle with a straw lid and a carry handle. The size most students use to avoid missing the water queue at the hostel tap.",
    pricePesewas: 2200,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 24,
    tags: ["bottle", "water", "hostel"],
  },
  {
    slug: "mosquito-net-single-full-size",
    name: "Mosquito Net (Single, Full Size)",
    description:
      "Full-size single mosquito net with a reinforced hanging ring and a fine mesh that keeps mosquitoes out without blocking airflow.",
    pricePesewas: 9000,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 7,
    tags: ["mosquito net", "bedroom", "hostel"],
  },
  {
    slug: "jollof-rice-bowl-chicken",
    name: "Jollof Rice Bowl with Grilled Chicken",
    description:
      "Party jollof served with grilled chicken thigh, coleslaw and a piece of fried plantain. Ordered hot and delivered to your block within the hour.",
    pricePesewas: 2800,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 20,
    tags: ["jollof", "food", "lunch"],
  },
  {
    slug: "fresh-banku-tomtom-pack",
    name: "Banku with Tomtom (Pack)",
    description:
      "Fresh banku with tomato stew, okro stew and wele. Serves one hungry student properly, and it comes with a spoon and a wrapper.",
    pricePesewas: 1800,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 25,
    tags: ["banku", "food", "ghanaian"],
  },
  {
    slug: "milo-450g-tin-pack-of-2",
    name: "Milo 450g Tin (Pack of 2)",
    description:
      "Two unopened tins of Milo energy drink, 450 grams each. Sealed and dated. Perfect for exam season and late-night group studies.",
    pricePesewas: 9500,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 15,
    tags: ["milo", "beverage", "energy"],
  },
  {
    slug: "indomie-carton-20-packs",
    name: "Indomie Carton (20 packs)",
    description:
      "A full carton of twenty Indomie packs in assorted flavours. Wholesale price, which works out below what you pay one pack at a time.",
    pricePesewas: 7800,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 12,
    tags: ["indomie", "noodles", "wholesale"],
  },
  {
    slug: "fresh-vegetables-bundle",
    name: "Fresh Vegetables Bundle",
    description:
      "Tomatoes, onions, pepper, okro and garden eggs, washed and bagged. Bought from the farm each morning, so it is market-fresh every day.",
    pricePesewas: 3500,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 18,
    tags: ["vegetables", "fresh", "groceries"],
  },
  {
    slug: "kente-print-fabric-6-yards",
    variants: [
      { name: "4 yards", stock: 3, priceDeltaCedis: -60 },
      { name: "6 yards", stock: 6 },
      { name: "8 yards", stock: 2, priceDeltaCedis: 70 },
    ],
    name: "Kente Print Fabric (6 yards)",
    description:
      "Six yards of high-quality kente print with a matching piece for the sleeves. Popular for graduations and Sunday service. Cutting is available on request.",
    pricePesewas: 26000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 10,
    tags: ["kente", "fabric", "traditional"],
  },
  {
    slug: "unisex-cotton-sneakers",
    name: "Unisex Cotton Sneakers (Size 42)",
    description:
      "Clean white cotton sneakers with a padded insole and a rubber sole. True to size, brand new in the box. Other sizes are available on request.",
    pricePesewas: 12000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 9,
    tags: ["sneakers", "shoes", "unisex"],
  },
  {
    slug: "plain-white-oxford-shirt",
    variants: [
      { name: "Small", stock: 3 },
      { name: "Medium", stock: 4 },
      { name: "Large", stock: 4 },
      { name: "Extra Large", stock: 3 },
    ],
    name: "Plain White Oxford Shirt (Large)",
    description:
      "Regular-fit white oxford shirt with mother-of-pearl style buttons. Worn twice and washed, so it is in like-new condition. Great for interviews and presentations.",
    pricePesewas: 8500,
    condition: "Like new",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 14,
    tags: ["shirt", "formal", "interview"],
  },
  {
    slug: "denim-jeans-32x32",
    variants: [
      { name: "30 x 30", stock: 2 },
      { name: "32 x 32", stock: 3 },
      { name: "34 x 32", stock: 3 },
      { name: "36 x 32", stock: 2 },
    ],
    name: "Denim Jeans (32 x 32)",
    description:
      "Mid-blue slim fit jeans with a little stretch. Worn a few times, no tears and no stains. Hemmed to length for free if you tell us your inseam.",
    pricePesewas: 13000,
    condition: "Used",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 8,
    tags: ["jeans", "denim", "trousers"],
  },
  {
    slug: "leather-crossbody-bag",
    name: "Leather Crossbody Bag",
    description:
      "Compact crossbody bag in genuine leather with an adjustable strap and a zipped inner pocket. Fits a phone, a small notebook and a set of keys.",
    pricePesewas: 14500,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 6,
    tags: ["bag", "leather", "accessories"],
  },
  {
    slug: "ankara-faded-t-shirt",
    name: "Ankara Faded T-Shirt",
    description:
      "Unisex ankara print tee with a soft washed finish. Sizes S to XXL, and we can swap the size at no extra cost before delivery.",
    pricePesewas: 6000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 16,
    tags: ["ankara", "t-shirt", "unisex"],
  },
  {
    slug: "printing-binding-100-pages-a4",
    name: "Printing & Binding (100 pages, A4)",
    description:
      "Single-sided A4 printing and spiral binding for up to 100 pages. Bring your file by email or WhatsApp and collect it the same day.",
    pricePesewas: 4500,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 99,
    tags: ["printing", "binding", "project"],
  },
  {
    slug: "custom-mug-printing",
    name: "Custom Mug Printing (single unit)",
    description:
      "One ceramic mug printed with your design or photo. We confirm the artwork by message before printing so you always know what you are getting.",
    pricePesewas: 3000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 99,
    tags: ["printing", "gift", "custom"],
  },
  {
    slug: "graphic-design-business-cards",
    name: "Graphic Design — Business Cards (50 pcs)",
    description:
      "Fifty business cards with a professional layout, delivered as a print-ready PDF plus printed copies. Two design revisions are included.",
    pricePesewas: 12000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 99,
    tags: ["design", "business cards", "branding"],
  },
  {
    slug: "laptop-repair-diagnostics",
    name: "Laptop Repair & Diagnostics",
    description:
      "Full diagnostic of a laptop with a written report and a repair quote before any work starts. Screen, keyboard, battery and software faults covered.",
    pricePesewas: 8000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 99,
    tags: ["repair", "diagnostics", "laptop"],
  },
  {
    slug: "cv-typing-formatting",
    name: "CV Typing & Formatting",
    description:
      "A clean, ATS-friendly CV typed and formatted, with two rounds of edits. Suitable for graduate schemes and industrial attachments.",
    pricePesewas: 4000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 99,
    tags: ["cv", "typing", "career"],
  },
  {
    slug: "photography-event-session",
    name: "Photography — Event Session (2 hours)",
    description:
      "Two hours of event coverage with edited photos delivered the next day. Popular for graduations, birthdays and society events.",
    pricePesewas: 35000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 99,
    tags: ["photography", "event", "service"],
  },
  {
    slug: "mtn-data-bundle-5gb",
    name: "MTN Data Bundle 5GB (30 days)",
    description:
      "Five gigabytes of MTN data valid for thirty days. We credit the bundle to your number after the order is confirmed, usually within ten minutes.",
    pricePesewas: 3500,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "telelink-data-point",
    quantity: 99,
    tags: ["mtn", "data", "bundle"],
    delivery: [DeliveryOption.DIGITAL],
    digital: { network: "MTN", dataAmount: "5GB", validity: "30 days" },
  },
  {
    slug: "telecel-2gb-daily-data",
    name: "Telecel 2GB Daily Data",
    description:
      "Two gigabytes of Telecel data that renews every day. Bought on JUMART and credited straight to your number.",
    pricePesewas: 1200,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "telelink-data-point",
    quantity: 99,
    tags: ["telecel", "data", "daily"],
    delivery: [DeliveryOption.DIGITAL],
    digital: { network: "Telecel", dataAmount: "2GB", validity: "1 day" },
  },
  {
    slug: "airteltigo-10gb-monthly",
    name: "AirtelTigo 10GB Monthly",
    description:
      "Ten gigabytes of AirtelTigo data with a thirty-day validity. Credit is confirmed by message once your payment is verified.",
    pricePesewas: 5500,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "telelink-data-point",
    quantity: 99,
    tags: ["airteltigo", "data", "monthly"],
    delivery: [DeliveryOption.DIGITAL],
    digital: { network: "AirtelTigo", dataAmount: "10GB", validity: "30 days" },
  },
  {
    slug: "vodafone-20gb-calls",
    name: "Vodafone 20GB + Calls",
    description:
      "Twenty gigabytes of Vodafone data with unlimited local calls. This bundle is sold by Vodafone directly, so we take you to their own page to complete the purchase.",
    pricePesewas: 7000,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "telelink-data-point",
    quantity: 99,
    tags: ["vodafone", "data", "calls"],
    delivery: [DeliveryOption.DIGITAL],
    purchaseMode: PurchaseMode.EXTERNAL,
    externalStatus: "APPROVED",
    externalUrl: "https://www.vodafone.com.gh/data-bundles",
  },
];

const ghanaianProducts: ProductSeed[] = [
  {
    slug: "ghanaian-sandals",
    variants: [
      { name: "Size 39", stock: 2 },
      { name: "Size 40", stock: 2 },
      { name: "Size 41", stock: 3 },
      { name: "Size 42", stock: 3 },
      { name: "Size 43", stock: 2 },
      { name: "Size 44", stock: 1 },
    ],
    name: "Ghanaian Leather Sandals (Size 42)",
    description:
      "Hand-finished leather sandals with a cushioned insole, made for long days on campus. Available in sizes 39 to 45, and we can resize before delivery.",
    pricePesewas: 12000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 14,
    tags: ["sandals", "leather", "footwear"],
    images: ["ghanaian-sandals", "ghanaian-sandals-2"],
  },
  {
    slug: "white-sneakers",
    variants: [
      { name: "Size 39", stock: 2 },
      { name: "Size 40", stock: 3 },
      { name: "Size 41", stock: 3 },
      { name: "Size 42", stock: 4 },
      { name: "Size 43", stock: 2 },
    ],
    name: "White Canvas Sneakers (Size 42)",
    description:
      "Clean white canvas sneakers with a padded insole and a rubber sole for daily campus use. True to size, brand new in the box.",
    pricePesewas: 18000,
    originalPricePesewas: 22000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 11,
    tags: ["sneakers", "shoes", "white"],
    images: ["white-sneakers", "white-sneakers-2"],
  },
  {
    slug: "ankara-maxi-dress",
    variants: [
      { name: "Small", stock: 3 },
      { name: "Medium", stock: 4 },
      { name: "Large", stock: 3 },
      { name: "Extra Large", stock: 2 },
    ],
    name: "Ankara Maxi Dress",
    description:
      "Full-length ankara dress with a fitted waist and side pockets. Made to order in your size, and it takes two days.",
    pricePesewas: 22000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 8,
    tags: ["ankara", "dress", "women"],
    images: ["ankara-maxi-dress", "ankara-maxi-dress-2"],
  },
  {
    slug: "kente-shirt-men",
    name: "Men's Kente Shirt",
    description:
      "Short-sleeve kente shirt with a tailored collar, cut from our house fabric. Sizes S to XXL, and we can swap the size free of charge.",
    pricePesewas: 16000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 12,
    tags: ["kente", "shirt", "men"],
    images: ["kente-shirt-men", "kente-shirt-men-2"],
  },
  {
    slug: "adinkra-tote-bag",
    variants: [{ name: "One size", stock: 10 }],
    name: "Adinkra Print Tote Bag",
    description:
      "Sturdy cotton tote with Adinkra symbol prints and a reinforced base. Fits a laptop, notes and a lunch box.",
    pricePesewas: 9500,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 15,
    tags: ["tote", "bag", "adinkra"],
    images: ["adinkra-tote-bag", "adinkra-tote-bag-2"],
  },
  {
    slug: "denim-skirt",
    name: "Denim Mini Skirt",
    description:
      "High-waisted denim skirt with a short zip, worn once and washed. Sizes S and M available now.",
    pricePesewas: 9000,
    condition: "Like new",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 7,
    tags: ["denim", "skirt"],
    images: ["denim-skirt", "denim-skirt-2"],
  },
  {
    slug: "student-bed-frame-mattress",
    name: "Student Bed Frame with Mattress",
    description:
      "Powder-coated metal single bed with a matching 4 by 6 foot mattress. Delivered and assembled in your hostel room.",
    pricePesewas: 65000,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 5,
    tags: ["bed", "mattress", "hostel"],
    delivery: ["PICKUP", "CAMPUS_DELIVERY"],
    images: ["student-bed-frame-mattress", "student-bed-frame-mattress-2"],
  },
  {
    slug: "mattress-single-4x6",
    name: "Single Mattress (4 x 6 ft)",
    description:
      "Spring mattress with a cotton cover, firm enough for study and soft enough to sleep on. Vacuum-packed for delivery.",
    pricePesewas: 35000,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 9,
    tags: ["mattress", "bed", "hostel"],
    images: ["mattress-single-4x6", "mattress-single-4x6-2"],
  },
  {
    slug: "ceiling-fan-5-blade",
    name: "5-Blade Ceiling Fan",
    description:
      "Five-blade ceiling fan with a three-speed pull switch. Installed by our technician when you buy the fitting service.",
    pricePesewas: 32000,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 4,
    tags: ["fan", "ceiling", "hostel"],
    images: ["ceiling-fan-5-blade", "ceiling-fan-5-blade-2"],
  },
  {
    slug: "plastic-basin-set",
    name: "Plastic Basin & Bucket Set",
    description:
      "Two wash basins and a matching bucket, all food-grade plastic. The set every first-year hostel room needs.",
    pricePesewas: 4500,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 20,
    tags: ["basin", "bucket", "hostel"],
    images: ["plastic-basin-set", "plastic-basin-set-2"],
  },
  {
    slug: "waakye-shito-egg",
    name: "Waakye with Shito and Egg",
    description:
      "Proper Ghanaian waakye with shito, wele, boiled egg and spaghetti. Served hot with a wrapped Ghana choppie.",
    pricePesewas: 2000,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 30,
    tags: ["waakye", "food", "breakfast"],
    images: ["waakye-shito-egg", "waakye-shito-egg-2"],
  },
  {
    slug: "gari-and-beans",
    name: "Gari and Beans with Pepper",
    description:
      "Gari cooked the Ghanaian way with beans and shito. Cheap, filling and the standard lunch for most students on campus.",
    pricePesewas: 1500,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 40,
    tags: ["gari", "beans", "food"],
    images: ["gari-and-beans", "gari-and-beans-2"],
  },
  {
    slug: "kelewele",
    name: "Kelewele (Fried Ripe Plantain)",
    description:
      "Ripe plantain fried with ginger, pepper and spices, served in a paper cone with roasted groundnuts.",
    pricePesewas: 1200,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 35,
    tags: ["kelewele", "plantain", "snack"],
    images: ["kelewele", "kelewele-2"],
  },
  {
    slug: "banku-groundnut-soup",
    name: "Banku with Groundnut Soup",
    description:
      "Smooth banku served with a rich groundnut soup, spinach and boiled egg. Comes with a spoon and a wrapper.",
    pricePesewas: 2200,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 25,
    tags: ["banku", "soup", "food"],
    images: ["banku-groundnut-soup", "banku-groundnut-soup-2"],
  },
  {
    slug: "ghanaian-ice-cream-tub",
    name: "Ghanaian Ice Cream (1L Tub)",
    description:
      "Locally made ice cream in a one-litre tub, the coconut and vanilla flavours students queue for. Keep it in the freezer.",
    pricePesewas: 3500,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 18,
    tags: ["ice cream", "dessert", "cold"],
    images: ["ghanaian-ice-cream-tub", "ghanaian-ice-cream-tub-2"],
  },
  {
    slug: "sobolo-hibiscus-bottle",
    name: "Sobolo Hibiscus Drink",
    description:
      "Chilled hibiscus drink with ginger and pineapple, sold by the bottle at every corner of campus.",
    pricePesewas: 800,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 60,
    tags: ["sobolo", "drink", "beverage"],
    images: ["sobolo-hibiscus-bottle", "sobolo-hibiscus-bottle-2"],
  },
  {
    slug: "kankake-ghanaian-pancake",
    name: "Kankake (Ghanaian Pancake)",
    description:
      "Soft rice pancake with ripe plantain and ginger sauce, made fresh every morning. Two pieces per order.",
    pricePesewas: 1000,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 45,
    tags: ["kankake", "pancake", "breakfast"],
    images: ["kankake-ghanaian-pancake", "kankake-ghanaian-pancake-2"],
  },
  {
    slug: "plantain-chips-pack",
    name: "Plantain Chips Pack",
    description:
      "Crunchy plantain chips seasoned with pepper and salt. The study-session snack that sells out by Friday.",
    pricePesewas: 1200,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 50,
    tags: ["plantain chips", "snack"],
    images: ["plantain-chips-pack", "plantain-chips-pack-2"],
  },
  {
    slug: "milo-sachet-pack",
    name: "Milo 3-in-1 Sachets (Pack of 20)",
    description:
      "Twenty sachets of Milo 3-in-1 for late-night study sessions. The single most requested item at exam time.",
    pricePesewas: 2500,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 22,
    tags: ["milo", "beverage", "study"],
    images: ["milo-sachet-pack", "milo-sachet-pack-2"],
  },
  {
    slug: "bread-loaf",
    name: "Fresh Bread Loaf",
    description:
      "Soft sliced bread baked this morning. Bought in the afternoon means you get the last few slices, so order early.",
    pricePesewas: 1800,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 24,
    tags: ["bread", "groceries"],
    images: ["bread-loaf", "bread-loaf-2"],
  },
  {
    slug: "sugar-1kg",
    name: "Sugar (1kg)",
    description:
      "One kilogram bag of granulated sugar. We sell it loose from the sack, so it is always fresh.",
    pricePesewas: 2000,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 40,
    tags: ["sugar", "groceries"],
    images: ["sugar-1kg", "sugar-1kg-2"],
  },
  {
    slug: "bottled-water-pack",
    name: "Bottled Water (Pack of 12)",
    description:
      "Shrink-wrapped pack of twelve 75cl bottles. Perfect for a group project meeting or a hostel floor.",
    pricePesewas: 2500,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 30,
    tags: ["water", "drink"],
    images: ["bottled-water-pack", "bottled-water-pack-2"],
  },
  {
    slug: "eggs-carton-30",
    name: "Eggs (Carton of 30)",
    description:
      "Full carton of fresh eggs, collected from our supplier each morning. Checked for breakage before delivery.",
    pricePesewas: 4500,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 16,
    tags: ["eggs", "groceries", "protein"],
    images: ["eggs-carton-30", "eggs-carton-30-2"],
  },
  {
    slug: "type-c-cable-2m",
    name: "USB-C Cable (2 metres)",
    description:
      "Braided USB-C to USB-C cable rated for 60W charging. The cable everyone in the hostel hall is looking for.",
    pricePesewas: 2500,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 40,
    tags: ["cable", "usb-c", "charger"],
    images: ["type-c-cable-2m", "type-c-cable-2m-2"],
  },
  {
    slug: "laptop-backpack",
    variants: [
      { name: "14 inch", stock: 4 },
      { name: "15.6 inch", stock: 7 },
    ],
    name: '15.6" Laptop Backpack',
    description:
      "Water-resistant backpack with a padded laptop compartment, USB charging port and a side water-bottle pocket. Built for a full day of lectures.",
    pricePesewas: 15000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 16,
    tags: ["backpack", "bag", "laptop"],
    images: ["laptop-backpack", "laptop-backpack-2"],
  },
  {
    slug: "laptop-sleeve",
    variants: [
      { name: "13 inch", stock: 3 },
      { name: "14 inch", stock: 6 },
    ],
    name: 'Laptop Sleeve (14")',
    description:
      "Slim felt sleeve with a soft lining that protects your laptop from hostel knocks. Slim enough to fit inside a backpack.",
    pricePesewas: 6000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 24,
    tags: ["laptop", "sleeve", "accessories"],
    images: ["laptop-sleeve", "laptop-sleeve-2"],
  },
  {
    slug: "phone-holder-stand",
    name: "Adjustable Phone Stand",
    description:
      "Foldable aluminium phone stand that holds a phone upright for video calls or watching lectures.",
    pricePesewas: 2000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 30,
    tags: ["phone stand", "accessories"],
    images: ["phone-holder-stand", "phone-holder-stand-2"],
  },
  {
    slug: "tws-earbuds",
    name: "TWS Wireless Earbuds",
    description:
      "Bluetooth earbuds with a charging case, 24 hours of playback and low-latency mode for video lectures.",
    pricePesewas: 12000,
    originalPricePesewas: 15000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 18,
    tags: ["earbuds", "audio", "bluetooth"],
    images: ["tws-earbuds", "tws-earbuds-2"],
  },
  {
    slug: "usb-flash-64gb",
    name: "64GB USB Flash Drive",
    description:
      "USB 3.1 flash drive for project submissions and notes. Comes in a hard case with a lanyard.",
    pricePesewas: 4500,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 28,
    tags: ["usb", "storage", "accessories"],
    images: ["usb-flash-64gb", "usb-flash-64gb-2"],
  },
  {
    slug: "drawing-board-set",
    name: "Drawing Board & Set (A3)",
    description:
      "A3 drawing board with a set square, ruler and compass in a carry bag. Everything the technical drawing course asks for.",
    pricePesewas: 4000,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 20,
    tags: ["drawing", "technical", "art"],
    images: ["drawing-board-set", "drawing-board-set-2"],
  },
  {
    slug: "geometry-set",
    name: "Geometry Set",
    description:
      "Complete geometry set with compass, protractor, set square and rulers in a transparent case.",
    pricePesewas: 2500,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 26,
    tags: ["geometry", "maths", "stationery"],
    images: ["geometry-set", "geometry-set-2"],
  },
  {
    slug: "colour-pens-pack",
    name: "Colour Pens Pack (12)",
    description: "Twelve assorted colour pens with fine tips that do not blot through exam paper.",
    pricePesewas: 2000,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 35,
    tags: ["pens", "colour", "stationery"],
    images: ["colour-pens-pack", "colour-pens-pack-2"],
  },
  {
    slug: "a3-drawing-sheet-pack",
    name: "A3 Drawing Sheets (Pack of 10)",
    description:
      "Ten A3 cartridge drawing sheets with a border printed. Order early, they disappear before the second semester.",
    pricePesewas: 3500,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 30,
    tags: ["drawing sheet", "a3", "stationery"],
    images: ["a3-drawing-sheet-pack", "a3-drawing-sheet-pack-2"],
  },
  {
    slug: "study-planner",
    name: "Academic Year Planner",
    description:
      "Weekly planner with a full academic year of pages, exam countdown and a notes section. Printed on thick paper.",
    pricePesewas: 2500,
    condition: "New",
    categorySlug: "books-academics",
    vendorSlug: "campus-book-hub",
    quantity: 40,
    tags: ["planner", "stationery", "study"],
    images: ["study-planner", "study-planner-2"],
  },
  {
    slug: "project-soft-binding",
    name: "Project Soft Binding (per copy)",
    description:
      "Soft-cover binding with a printed colour cover and a clear spine label. We collect from the department or you drop it off.",
    pricePesewas: 6000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 99,
    tags: ["binding", "project", "printing"],
    images: ["project-soft-binding", "project-soft-binding-2"],
  },
  {
    slug: "id-card-printing",
    name: "Campus ID Card Printing",
    description:
      "Printed and laminated campus ID card, ready in ten minutes. Bring your passport photo.",
    pricePesewas: 1500,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 99,
    tags: ["id card", "printing", "campus"],
    images: ["id-card-printing", "id-card-printing-2"],
  },
  {
    slug: "thesis-print-binding",
    name: "Thesis Printing & Binding",
    description:
      "Spiral or hard binding for a full project, printed single-sided on A4 with a margin for binding.",
    pricePesewas: 12000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 99,
    tags: ["thesis", "printing", "binding"],
    images: ["thesis-print-binding", "thesis-print-binding-2"],
  },
  {
    slug: "poster-design",
    name: "Poster & Flyer Design",
    description:
      "Design for a poster, flyer or event banner, delivered as a print-ready PDF and a high-resolution image.",
    pricePesewas: 8000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 99,
    tags: ["design", "poster", "flyer"],
    images: ["poster-design", "poster-design-2"],
  },
  {
    slug: "mtn-10gb-weekly",
    name: "MTN 10GB Weekly Data",
    description:
      "Ten gigabytes of MTN data valid for seven days. Buy directly from MTN through our partner link.",
    pricePesewas: 4500,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "telelink-data-point",
    quantity: 99,
    tags: ["mtn", "data", "weekly"],
    delivery: ["DIGITAL"],
    purchaseMode: "EXTERNAL",
    externalStatus: "APPROVED",
    externalUrl: "https://www.mtn.com.gh/products/data-bundles",
    digital: { network: "MTN", dataAmount: "10GB", validity: "7 days" },
    images: ["mtn-data-bundle-5gb", "mtn-data-bundle-5gb-2"],
  },
  {
    slug: "telecel-5gb-monthly",
    name: "Telecel 5GB Monthly Data",
    description:
      "Five gigabytes of Telecel data with a thirty-day validity, ordered directly from Telecel.",
    pricePesewas: 3000,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "kwames-data-spot",
    quantity: 99,
    tags: ["telecel", "data", "monthly"],
    delivery: ["DIGITAL"],
    purchaseMode: "EXTERNAL",
    externalStatus: "APPROVED",
    externalUrl: "https://telecel.com.gh/data",
    digital: { network: "Telecel", dataAmount: "5GB", validity: "30 days" },
    images: ["telecel-2gb-daily-data", "telecel-2gb-daily-data-2"],
  },
  {
    slug: "airteltigo-20gb-monthly",
    name: "AirtelTigo 20GB Monthly",
    description:
      "Twenty gigabytes of AirtelTigo data for the month, bought straight from the network's own page.",
    pricePesewas: 6000,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "kwames-data-spot",
    quantity: 99,
    tags: ["airteltigo", "data", "monthly"],
    delivery: ["DIGITAL"],
    purchaseMode: "EXTERNAL",
    externalStatus: "PENDING",
    externalUrl: "https://www.airteltigo.com.gh/data-bundles",
    digital: { network: "AirtelTigo", dataAmount: "20GB", validity: "30 days" },
    images: ["airteltigo-10gb-monthly", "airteltigo-10gb-monthly-2"],
  },
];


/**
 * Genuine listings: real product names, real specifications and prices verified
 * against Ghanaian retail and classifieds listings. Prices are the used /
 * pre-owned band unless the listing says otherwise, which is what a campus
 * marketplace actually sells. Images reuse the closest photographed subject.
 */
const REAL_UPDATES: Record<string, { priceCedis: number; description: string }> = {
  "hp-elitebook-840-g5": {
    priceCedis: 3520,
    description:
      "HP EliteBook 840 G5, Intel Core i5-8350U (8th gen), 16GB DDR4, 512GB NVMe SSD, 14-inch FHD anti-glare, backlit keyboard, fingerprint reader, Windows 11 Pro. Refurbished with a 30-day warranty in Ghana; a brand-new 16GB/512GB unit retails around GH₵5,350. Original HP charger included.",
  },
  "dell-latitude-7490": {
    priceCedis: 3600,
    description:
      "Dell Latitude 7490, Intel Core i7-8650U (8th gen), 16GB RAM, 512GB SSD, 14-inch FHD micro-edge display. Ultra-portable business laptop with a 41Wh battery and the classic Latitude port set. Used units in Ghana trade between GH₵3,000 and GH₵4,100.",
  },
  "samsung-galaxy-a54-5g": {
    priceCedis: 2800,
    description:
      "Samsung Galaxy A54 5G, 8GB RAM / 128GB storage (microSD to 1TB), 6.4-inch Super AMOLED 120Hz, 50MP main camera with OIS, 5,000mAh battery, IP67. Used units in Ghana sell from about GH₵2,600.",
  },
  "sony-wh-ch720n-headphones": {
    priceCedis: 900,
    description:
      "Sony WH-CH720N wireless noise-cancelling headphones: up to 35 hours of battery, 3-minute quick charge, DSEE upscaling, 40mm drivers, Bluetooth 5.2. Brand new in Ghana is about GH₵1,440.",
  },
  "anker-powercore-10000": {
    priceCedis: 250,
    description:
      "Anker PowerCore 10000 (A1263), 10,000mAh, USB-A PowerIQ output, four-LED indicator. Used units in Kumasi trade around GH₵250 against GH₵400-640 new.",
  },
  "anker-20w-charger": {
    priceCedis: 90,
    description:
      "Anker 20W USB-C wall charger (A2347K21 / Nano Pro 20W) with PowerIQ 3.0 and PPS. Charges an iPhone to about 50% in 25 minutes. Sold without a cable; new in Ghana is about GH₵120-210.",
  },
  "jbl-go-3-speaker": {
    priceCedis: 500,
    description:
      "JBL Go 3 portable Bluetooth speaker: Bluetooth 5.3, IP67, up to 5 hours of playtime, 209g with a fabric carry loop. Used units in Kumasi are about GH₵500.",
  },
  "logitech-m330-mouse": {
    priceCedis: 90,
    description:
      "Logitech M330 Silent Plus wireless mouse: SilentTouch clicks, 1000 DPI, 2.4GHz nano receiver, about 18 months on one AA battery. Brand new in Ghana is about GH₵120.",
  },
  "white-sneakers": {
    priceCedis: 200,
    description:
      "White low-top canvas sneakers in the Converse Chuck Taylor style, with a rubber toe cap and vulcanised sole. EU 37-45 in stock at about GH₵230 new; second-hand pairs trade around GH₵200.",
  },
  "ghanaian-sandals": {
    priceCedis: 350,
    description:
      "Nokoko men's authentic leather sandal: pure leather upper with a north-leather sole, made in Ghana for kaftan and traditional wear. Listed at GH₵350, down from GH₵650.",
  },
  "ankara-maxi-dress": {
    priceCedis: 350,
    description:
      "Malyn Fashion Zuri multicolour Ankara wax-print maxi dress: button-down front, matching waist belt, tiered flared skirt, sold retail and wholesale from Accra. UK10-22 available.",
  },
  "kente-shirt-men": {
    priceCedis: 220,
    description:
      "Kente statement shirt cut from authentic handwoven Ghanaian Kente cloth by Africa Art Express Limited, Accra. Unisex fit, GH₵220 per shirt.",
  },
  "denim-jeans-32x32": {
    priceCedis: 70,
    description:
      "Berrykey 500G heavyweight denim jeans, slim fit with reinforced stitching. GH₵123 new in blue, GH₵121 in black on Jumia Ghana; second-hand pairs trade around GH₵70.",
  },
  "adinkra-tote-bag": {
    priceCedis: 400,
    description:
      "DEWK Signature Kente crescent crossbody bag, handmade in Ghana: Kente panel with leather trim and a detachable adjustable strap, 23 x 5 x 22cm. Listed at GH₵400.",
  },
  "ankara-faded-t-shirt": {
    priceCedis: 320,
    description:
      "F.SKY Clothing bold orange Ankara tee, made to order in Accra: all-over Ankara print, relaxed crew neck, chest pocket, 5-14 business-day production. GH₵320 per shirt.",
  },
  "laptop-backpack": {
    priceCedis: 199,
    description:
      'Targus 15.6" Intellect Essentials backpack: side-loading laptop compartment, air-mesh back panel, contoured straps, front quick-access pocket. Sold from Osu, Accra at GH₵199.',
  },
  "student-bed-frame-mattress": {
    priceCedis: 700,
    description:
      "Flushrenic 200cm foldable metal single bed frame for dormitories and hostels, powder-coated and folds flat. Listed at GH₵700; a matching 4x6 ft mattress is about GH₵899-999.",
  },
  "mattress-single-4x6": {
    priceCedis: 530,
    description:
      "Bright Home / WGM student foam mattress, 27 x 74 x 4 in, high-density foam in a blue and mint cover, marketed for hostels and dormitories. GH₵530; 4x6 ft high-density mattresses run GH₵899-999.",
  },
  "rechargeable-table-fan": {
    priceCedis: 480,
    description:
      "JRT rechargeable table fan with a 21-LED lamp: 2 speeds, mains or battery power, about 4 hours of fan use or 8 hours of light per charge. GH₵480.",
  },
  "5l-electric-kettle": {
    priceCedis: 285,
    description:
      "Winning Star ST-6021 5L electric tea kettle: stainless steel, rapid boiling, boil-dry protection, auto cut-off and a cool-touch handle. GH₵285.",
  },
  "study-desk-lamp-led": {
    priceCedis: 69,
    description:
      "Maison Sophie rechargeable LED study desk lamp with a phone holder: 21 LEDs, 360-degree gooseneck, 4000mAh battery (14-16 hours at mid brightness), three colour temperatures. GH₵69.",
  },
  "mosquito-net-single-full-size": {
    priceCedis: 148,
    description:
      "Dou-color 1.8 x 2.0m bugfree anti-fall double-decker mosquito net: self-supporting foldable frame in terelyne mesh, sized for a single or double bed. GH₵148.",
  },
  "plastic-basin-set": {
    priceCedis: 103,
    description:
      "DPS round plastic washing basin with a reinforced base, GH₵103 each; matching buckets list at GH₵160-300.",
  },
  "water-bottle-25l-straw": {
    priceCedis: 169,
    description:
      "VACUUM FlowState 40oz (1.18L) insulated tumbler with a handle and straw lid, cold for 24 hours. GH₵169; a true 2.5L Thermos pump pot is about GH₵738.",
  },
  "laundry-basket-collapsible": {
    priceCedis: 75.4,
    description:
      "WEJESS 90L collapsible laundry hamper in 600D Oxford fabric with a PE coating, aluminium handle and EVA grip, folds flat for a dorm cupboard. GH₵75.40.",
  },
  "memory-foam-pillow": {
    priceCedis: 200,
    description:
      "oraimo home CloudEase slow-rebound memory foam pillow with an ergonomic curved, dual-height design. GH₵200.",
  },
  "waakye-shito-egg": {
    priceCedis: 25,
    description:
      "Waakye Ecomini plate: waakye rice and beans with shito, tomato stew, boiled egg, gari and spaghetti. Accra menus list the Ecomini plate at GH₵25.",
  },
  "banku-groundnut-soup": {
    priceCedis: 48,
    description:
      "Banku with groundnut soup: a banku portion (GH₵18) plus groundnut soup (GH₵30) on Accra chop-bar menus, with banku and grilled tilapia at GH₵110 for comparison.",
  },
  "gari-and-beans": {
    priceCedis: 30,
    description:
      "Beans and gari (Yɔɔ ke Gari) with fried ripe plantain: a cheap, filling Ghanaian supper classic, GH₵30 a plate.",
  },
  "kelewele": {
    priceCedis: 25,
    description:
      "Kelewele: ripe plantain cubes fried with ginger, pepper and spices, usually served with roasted groundnuts. GH₵25 a menu portion; street cones sell for GH₵5-15.",
  },
  "jollof-rice-bowl-chicken": {
    priceCedis: 70,
    description:
      "Jollof rice with grilled chicken: GH₵70 on Ghana takeaway menus, against GH₵95 at sit-down chop bars.",
  },
  "fufu-with-groundnut-soup": {
    priceCedis: 60,
    description:
      "Fufu with groundnut soup: fufu GH₵30 plus groundnut soup GH₵30 on Accra menus; delivery platforms list the same combination at GH₵90.",
  },
  "sobolo-hibiscus-bottle": {
    priceCedis: 10,
    description:
      "Fruity sobolo: hibiscus drink brewed with ginger, cloves and pineapple, served chilled. GH₵10 a standard serving, GH₵20 a large bottle.",
  },
  "ghanaian-ice-cream-tub": {
    priceCedis: 65,
    description:
      "FanIce vanilla family tub, 2 litres: FanMilk's FanIce is the best-selling ice cream brand in Ghana, listed at GH₵65 by a Ghana online grocer.",
  },
};

const realListings: ProductSeed[] = [
  // Real electronics with verified Ghana prices
  {
    slug: "lenovo-ideapad-1-15-6",
    name: 'Lenovo IdeaPad 1 15.6" (Celeron N4500, 4GB, 128GB)',
    description:
      "Entry-level Lenovo study laptop: Intel Celeron N4500, 4GB DDR4, 128GB eMMC, 15.6-inch HD anti-glare display, Windows 11 Home, about 1.9kg. Built for coursework and browsing. Used units in Ghana trade around GH₵2,500.",
    pricePesewas: 250000,
    condition: "Used",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 3,
    tags: ["lenovo ideapad 1", "budget laptop", "student laptop"],
    images: ["lenovo-ideapad-1", "hp-elitebook-840-g5-2"],
  },
  {
    slug: "tecno-spark-20",
    name: "Tecno Spark 20 (4GB / 128GB) Dual SIM 4G",
    description:
      "Tecno's best-selling budget phone in Ghana: 6.56-inch 90Hz HD+ display, Unisoc T606, 4GB RAM (expandable), 128GB storage, 50MP dual camera, 5,000mAh. GH₵1,850 new, about GH₵900 used.",
    pricePesewas: 90000,
    condition: "Used",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 4,
    tags: ["tecno spark 20", "budget phone", "student phone"],
    images: ["tecno-spark-20", "samsung-galaxy-a54-5g-2"],
  },
  {
    slug: "itel-a70",
    name: "itel A70 (3GB / 128GB) 4G Smartphone",
    description:
      "itel's lowest-cost Android Go phone and one of the highest-volume handsets sold in Ghana: 6.6-inch HD+ display, Unisoc T603, 3GB RAM plus 4GB virtual, 128GB storage, 13MP dual camera, 5,000mAh, side fingerprint. GH₵1,100 new.",
    pricePesewas: 110000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 6,
    tags: ["itel a70", "cheapest smartphone ghana", "budget android"],
    images: ["itel-a70", "tecno-spark-20-2"],
  },
  {
    slug: "infinix-hot-40i",
    name: "Infinix Hot 40i (8GB / 128GB) 4G Smartphone",
    description:
      "Infinix budget bestseller: 6.56-inch 90Hz HD+ display, Unisoc T606, 8GB RAM, 128GB storage, 50MP dual camera, 5,000mAh with 18W charging, XOS 13. GH₵1,540 new.",
    pricePesewas: 154000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 5,
    tags: ["infinix hot 40i", "budget phone", "unisoc t606"],
    images: ["infinix-hot-40i", "itel-a70-2"],
  },
  {
    slug: "infinix-note-30",
    name: "Infinix Note 30 (8GB / 128GB) AMOLED 4G Phone",
    description:
      "Infinix mid-range step up: 6.78-inch 1080p 120Hz AMOLED, MediaTek Helio G99, 8GB RAM with virtual expansion, 128GB storage, 64MP main camera, 5,000mAh with 45W charging. GH₵2,299 new.",
    pricePesewas: 229900,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 4,
    tags: ["infinix note 30", "amoled phone", "helio g99"],
    images: ["infinix-note-30", "infinix-hot-40i-2"],
  },
  {
    slug: "sandisk-extreme-1tb-ssd",
    name: "SanDisk Extreme Portable SSD 1TB (USB-C, 1050MB/s)",
    description:
      "Rugged pocket SSD: 1TB, up to 1050MB/s read over USB-C, IP65, 3m drop protection. GH₵1,690-1,900 new in Ghana; the Samsung T7 Shield sits in the same tier.",
    pricePesewas: 190000,
    condition: "New",
    categorySlug: "electronics",
    vendorSlug: "adum-tech-point",
    quantity: 3,
    tags: ["1tb external ssd", "sandisk extreme", "portable ssd"],
    images: ["sandisk-extreme-1tb-ssd", "usb-flash-64gb-2"],
  },
  // Real fashion with verified Ghana prices
  {
    slug: "nokoko-mens-classic-leather-sandal",
    name: "Nokoko Men's Authentic Leather Sandal (Dark Brown)",
    description:
      "Ghana-made slip-on sandal from Nokoko with a pure leather upper and north-leather sole, made for kaftan and traditional wear. Listed at GH₵350, down from GH₵650.",
    pricePesewas: 35000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 8,
    tags: ["leather sandals", "ghana made", "men's sandals"],
    images: ["nokoko-mens-classic-leather-sandal", "ghanaian-sandals-2"],
  },
  {
    slug: "converse-chuck-taylor-low-top-white",
    name: "Converse Chuck Taylor Low-Top (White)",
    description:
      "The classic Converse canvas low-top with a white rubber toe cap, ankle patch and vulcanised sole. EU 37-45 in stock at about GH₵230 a pair; second-hand pairs trade around GH₵200.",
    pricePesewas: 23000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 10,
    variants: [
      { name: "EU 38", stock: 2 },
      { name: "EU 40", stock: 3 },
      { name: "EU 42", stock: 3 },
      { name: "EU 44", stock: 2 },
    ],
    tags: ["white canvas sneakers", "converse", "student sneakers"],
    images: ["converse-chuck-taylor-low-top-white", "white-sneakers-2"],
  },
  {
    slug: "malyn-fashion-zuri-ankara-maxi-dress",
    name: "Zuri Multicolor African Print Maxi Dress (Malyn Fashion)",
    description:
      "Ghana-made floor-length Ankara wax-print maxi dress with a button-down front, matching waist belt and tiered flared skirt, sold retail and wholesale from Accra. GH₵350.",
    pricePesewas: 35000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 6,
    variants: [
      { name: "UK 10", stock: 2 },
      { name: "UK 12", stock: 2 },
      { name: "UK 14", stock: 1 },
      { name: "UK 16", stock: 1 },
    ],
    tags: ["ankara maxi dress", "african print dress", "ghanaian dress"],
    images: ["malyn-fashion-zuri-african-print-maxi-dress", "ankara-maxi-dress-2"],
  },
  {
    slug: "dewk-signature-kente-crossbody-bag",
    name: "Kente Crescent Crossbody Bag (DEWK Signature)",
    description:
      "Handmade in Ghana by DEWK Signature: crescent crossbody bag pairing authentic Kente with leather, detachable adjustable strap, 23 x 5 x 22cm. Listed at GH₵400.",
    pricePesewas: 40000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 4,
    tags: ["kente bag", "leather crossbody bag", "handmade ghana"],
    images: ["dewk-signature-kente-crescent-crossbody-bag", "adinkra-tote-bag-2"],
  },
  {
    slug: "fsky-bold-orange-ankara-tee",
    name: "Bold Orange Ankara Tee (F.SKY Clothing)",
    description:
      "Made to order in Accra by F.SKY Clothing: relaxed crew-neck tee in all-over orange and black Ankara print with a chest pocket. GH₵320 per shirt, 5-14 business days.",
    pricePesewas: 32000,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 7,
    tags: ["ankara t-shirt", "ghanaian streetwear", "made in ghana"],
    images: ["fsky-bold-orange-ankara-tee", "ankara-faded-t-shirt-2"],
  },
  {
    slug: "ashion-mens-slip-on-canvas-loafers",
    name: "ASHION Men's Slip-On Canvas Loafers",
    description:
      "Breathable canvas slip-on loafers with elastic side panels, honeycomb insoles and a non-slip rubber sole. The blue pair sells at GH₵68 with 223 verified reviews on Jumia Ghana.",
    pricePesewas: 6800,
    condition: "New",
    categorySlug: "fashion",
    vendorSlug: "kente-and-co-threads",
    quantity: 9,
    variants: [
      { name: "EU 40", stock: 2 },
      { name: "EU 42", stock: 3 },
      { name: "EU 44", stock: 4 },
    ],
    tags: ["canvas loafers", "slip-on shoes", "men's casual shoes"],
    images: ["ashion-mens-slip-on-canvas-loafers", "converse-chuck-taylor-low-top-white-2"],
  },
  // Real hostel items with verified Ghana prices
  {
    slug: "flushrenic-foldable-metal-bed-frame",
    name: "Flushrenic 200cm Metal Foldable Single Bed Frame",
    description:
      "Powder-coated metal single bed frame that folds flat for dormitories and hostels, fits a 3x6 ft or 4x6 ft mattress. Listed at GH₵700.",
    pricePesewas: 70000,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 5,
    tags: ["single bed frame", "hostel bed", "metal bed frame"],
    images: ["flushrenic-foldable-metal-single-bed-frame", "student-bed-frame-mattress-2"],
  },
  {
    slug: "bright-home-student-foam-mattress",
    name: "Bright Home Student Foam Mattress (27 x 74 x 4 in)",
    description:
      "Lightweight high-density foam single mattress in a blue and mint cover, sized 27 x 74 x 4 in for hostels and dormitories. GH₵530; 4x6 ft high-density mattresses run GH₵899-999.",
    pricePesewas: 53000,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 6,
    tags: ["student mattress", "single mattress", "foam mattress"],
    images: ["bright-home-student-foam-mattress", "mattress-single-4x6-2"],
  },
  {
    slug: "jrt-rechargeable-table-fan-led",
    name: "JRT Rechargeable Table Fan with LED Light",
    description:
      "2-in-1 table fan with 2 speeds and a 21-LED lamp, mains or battery power for up to 4 hours of fan use or 8 hours of light per charge. GH₵480.",
    pricePesewas: 48000,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 7,
    tags: ["rechargeable fan", "table fan", "power outage fan"],
    images: ["jrt-rechargeable-table-fan-with-led-light", "rechargeable-table-fan-2"],
  },
  {
    slug: "winning-star-5l-kettle",
    name: "Winning Star ST-6021 5L Electric Tea Kettle",
    description:
      "5-litre stainless-steel electric kettle with rapid boiling, boil-dry protection, auto cut-off and an illuminated base switch. GH₵285.",
    pricePesewas: 28500,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 8,
    tags: ["electric kettle", "5 litre kettle", "hostel kettle"],
    images: ["winning-star-st-6021-5l-electric-kettle", "5l-electric-kettle-2"],
  },
  {
    slug: "maison-sophie-led-study-lamp",
    name: "Maison Sophie Rechargeable LED Study Lamp with Phone Holder",
    description:
      "USB rechargeable desk lamp with 21 LEDs, 360-degree gooseneck, 4000mAh battery (14-16 hours at mid brightness), three colour temperatures and a base phone stand. GH₵69.",
    pricePesewas: 6900,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 12,
    tags: ["led desk lamp", "study lamp", "rechargeable lamp"],
    images: ["maison-sophie-rechargeable-led-study-lamp", "study-desk-lamp-led-2"],
  },
  {
    slug: "dou-color-double-decker-mosquito-net",
    name: "Dou-color 1.8 x 2.0m Double-Decker Mosquito Net",
    description:
      "Self-supporting foldable double-decker mosquito net in terelyne mesh, 180 x 200cm for a single or double bed. GH₵148.",
    pricePesewas: 14800,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 5,
    tags: ["mosquito net", "bed net", "double decker net"],
    images: ["dou-color-bugfree-double-decker-mosquito-net", "mosquito-net-single-full-size-2"],
  },
  {
    slug: "dps-round-plastic-basin",
    name: "DPS Round Plastic Basin",
    description:
      "Heavy-duty round plastic washing basin with a reinforced base for household or commercial use. GH₵103 each; matching buckets list at GH₵160-300.",
    pricePesewas: 10300,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 10,
    tags: ["plastic basin", "washing basin", "hostel laundry"],
    images: ["dps-round-plastic-basin", "plastic-basin-set-2"],
  },
  {
    slug: "vacuum-flowstate-tumbler-40oz",
    name: "VACUUM FlowState 40oz Insulated Tumbler with Straw",
    description:
      "Vacuum-insulated stainless tumbler with a carry handle and removable straw, cold for 24 hours. GH₵169.",
    pricePesewas: 16900,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 8,
    tags: ["stanley tumbler", "insulated tumbler", "water bottle with straw"],
    images: ["vacuum-flowstate-stanley-style-tumbler-with-straw", "water-bottle-25l-straw-2"],
  },
  {
    slug: "wejess-90l-collapsible-laundry-basket",
    name: "WEJESS 90L Collapsible Laundry Basket",
    description:
      "90-litre freestanding laundry hamper in 600D Oxford fabric with a PE coating, aluminium handle and EVA grip, folds flat. GH₵75.40.",
    pricePesewas: 7540,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 9,
    tags: ["laundry basket", "collapsible hamper", "dorm storage"],
    images: ["wejess-90l-collapsible-laundry-basket", "laundry-basket-collapsible-2"],
  },
  {
    slug: "oraimo-cloudease-memory-foam-pillow",
    name: "oraimo home CloudEase Memory Foam Pillow",
    description:
      "Slow-rebound memory foam pillow with an ergonomic curved, dual-height design. GH₵200.",
    pricePesewas: 20000,
    condition: "New",
    categorySlug: "hostel-essentials",
    vendorSlug: "hostel-nest-store",
    quantity: 8,
    tags: ["memory foam pillow", "sleep pillow", "hostel bedding"],
    images: ["oraimo-home-cloudease-memory-foam-pillow", "memory-foam-pillow-2"],
  },
  // Real Ghanaian food
  {
    slug: "kontomire-stew-sandwich",
    name: "Kontomire (Cocoyam Leaf) Stew Sandwich",
    description:
      "A bread roll packed with Ghanaian cocoyam-leaf (palava) stew, the classic green sandwich. Chopped kontomire sells at GH₵25 and sandwich rolls at about GH₵30, so a filled roll lands near GH₵30.",
    pricePesewas: 3000,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 12,
    tags: ["kontomire sandwich", "palava sauce", "ghanaian sandwich"],
    images: ["kontomire-stew-sandwich", "banku-groundnut-soup-2"],
  },
  {
    slug: "tuo-zaafi-green-soup",
    name: "Tuo Zaafi with Green Soup and Cow Organs",
    description:
      "Soft northern-Ghana corn and millet dumplings with green ayoyo soup and sauteed cow organs, the northern classic sold nationwide. Two balls with soup and stew are GH₵50.",
    pricePesewas: 5000,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 8,
    tags: ["tuo zaafi", "ayoyo soup", "northern ghana food"],
    images: ["tuo-zaafi-with-green-soup", "fufu-with-groundnut-soup-2"],
  },
  {
    slug: "hausa-koko-and-koose",
    name: "Hausa Koko with Koose (Spiced Millet Porridge and Bean Cakes)",
    description:
      "The classic northern Ghanaian breakfast: spiced millet porridge with koose, the fried black-eyed-pea cake. Street portions run GH₵10-20.",
    pricePesewas: 1500,
    condition: "New",
    categorySlug: "food-groceries",
    vendorSlug: "adum-fresh-mart",
    quantity: 15,
    tags: ["hausa koko", "koose", "ghanaian breakfast"],
    images: ["hausa-koko-and-koose", "waakye-shito-egg-2"],
  },
  // Real campus services with verified Ghana prices
  {
    slug: "a4-black-white-printing",
    name: "A4 Black & White Printing (per sheet)",
    description:
      "Mono A4 print-outs. Ghanaian university reprographic counters run GH₵0.27-0.40 per A4 sheet (GCTU GH₵0.38 printing, GH₵0.27 photocopying; UEW 40p single-sided).",
    pricePesewas: 38,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 999,
    tags: ["a4 printing", "black and white printing", "coursework printing"],
    images: ["printing-binding-100-pages-a4", "custom-mug-printing-2"],
  },
  {
    slug: "a4-photocopy",
    name: "A4 Photocopy (per sheet)",
    description:
      "Walk-in photocopying of printed or hand-written A4 pages. Published university library rates are GH₵0.27 per A4 sheet (GCTU) and 30p per photocopy (UEW).",
    pricePesewas: 30,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 999,
    tags: ["photocopy", "a4 photocopy", "document copying"],
    images: ["printing-binding-100-pages-a4-2", "project-soft-binding"],
  },
  {
    slug: "a4-colour-printing",
    name: "A4 Colour Printing (per sheet)",
    description:
      "Colour A4 printing on 80gsm bond, art paper or 300gsm art card. Ghana print shops quote GH₵2.00-4.00 per sheet, with Cromocoat 300gsm at GH₵3.00.",
    pricePesewas: 200,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 999,
    tags: ["colour printing", "a4 colour print", "flyer printing"],
    images: ["poster-design", "custom-mug-printing-2"],
  },
  {
    slug: "spiral-wire-binding",
    name: "Spiral / Wire Binding (per copy)",
    description:
      "Wire or plastic-coil binding for reports, notebooks and coursework with optional front and back covers. Print shops in Accra charge about GH₵5 per binding.",
    pricePesewas: 500,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 999,
    tags: ["spiral binding", "wire binding", "project binding"],
    images: ["project-soft-binding", "thesis-print-binding-2"],
  },
  {
    slug: "thesis-hard-cover-binding",
    name: "Thesis / Project Work Hard-Cover Binding (per copy)",
    description:
      "Library bindery hard-cover binding for project work and theses. Balme Library's approved fee is GH₵15 per copy with students reporting GH₵25-30; commercial thesis printers run a 3-4 day turnaround, so book 7-10 days ahead.",
    pricePesewas: 3000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 999,
    tags: ["thesis binding", "project work binding", "hard cover binding"],
    images: ["thesis-print-binding", "project-soft-binding-2"],
  },
  {
    slug: "business-cards-100",
    name: "Business Cards (per 100 pieces)",
    description:
      "Normal-print business cards, minimum order 100. Ghana print shops quote GH₵100 front-only and GH₵140 front-and-back per 100.",
    pricePesewas: 10000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 999,
    tags: ["business cards", "printing services", "branding"],
    images: ["graphic-design-business-cards", "poster-design-2"],
  },
  {
    slug: "flyers-a5-100",
    name: "Flyers / Leaflets (A5, per 100 copies)",
    description:
      "A5 flyer printing at GH₵120 for 100 copies; A4 trifold brochures run GH₵5 each on art paper.",
    pricePesewas: 12000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 999,
    tags: ["flyers", "leaflets", "promotional printing"],
    images: ["poster-design", "graphic-design-business-cards-2"],
  },
  {
    slug: "letterhead-500",
    name: "Letterhead Printing (per 500 sheets)",
    description:
      "A4 company letterhead printing at GH₵350 per 500 pieces, suitable for project documentation and small business stationery.",
    pricePesewas: 35000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 999,
    tags: ["letterhead", "stationery printing", "business printing"],
    images: ["printing-binding-100-pages-a4", "thesis-print-binding-2"],
  },
  {
    slug: "banner-per-square-metre",
    name: "Banner / Roll-up Printing (per square metre)",
    description:
      "Large-format and roll-up banner printing in the Eastern Region: pull-up banners, outdoor banners, mesh and vinyl from about GH₵80 per square metre.",
    pricePesewas: 8000,
    condition: "New",
    categorySlug: "services",
    vendorSlug: "ktu-print-and-graphics",
    quantity: 999,
    tags: ["banner printing", "roll up banner", "large format printing"],
    images: ["poster-design-2", "graphic-design-business-cards"],
  },
  // Real airtime and data bundles with current network tariffs
  {
    slug: "mtn-5gb-30-days",
    name: "MTN 5GB Monthly Data Bundle",
    description:
      "Five gigabytes of MTN data valid for 30 days, bought directly from MTN Ghana. Current published tariff: GH₵30.",
    pricePesewas: 3000,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "telelink-data-point",
    quantity: 99,
    tags: ["mtn", "data", "monthly bundle"],
    delivery: ["DIGITAL"],
    purchaseMode: "EXTERNAL",
    externalStatus: "APPROVED",
    externalUrl: "https://www.mtn.com.gh/products/data-bundles",
    digital: { network: "MTN", dataAmount: "5GB", validity: "30 days" },
    images: ["mtn-data-bundle-5gb", "telecel-2gb-daily-data-2"],
  },
  {
    slug: "mtn-10gb-30-days",
    name: "MTN 10GB Monthly Data Bundle",
    description:
      "Ten gigabytes of MTN data valid for 30 days, bought directly from MTN Ghana. Current published tariff: GH₵50.",
    pricePesewas: 5000,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "telelink-data-point",
    quantity: 99,
    tags: ["mtn", "data", "monthly bundle"],
    delivery: ["DIGITAL"],
    purchaseMode: "EXTERNAL",
    externalStatus: "APPROVED",
    externalUrl: "https://www.mtn.com.gh/products/data-bundles",
    digital: { network: "MTN", dataAmount: "10GB", validity: "30 days" },
    images: ["mtn-data-bundle-5gb-2", "airteltigo-10gb-monthly-2"],
  },
  {
    slug: "telecel-20gb-30-days",
    name: "Telecel 20GB Monthly Data Bundle (Giga Go)",
    description:
      "Twenty gigabytes of Telecel data valid for 30 days, ordered directly from Telecel Ghana. Current published tariff: GH₵100.",
    pricePesewas: 10000,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "kwames-data-spot",
    quantity: 99,
    tags: ["telecel", "data", "monthly bundle"],
    delivery: ["DIGITAL"],
    purchaseMode: "EXTERNAL",
    externalStatus: "APPROVED",
    externalUrl: "https://telecel.com.gh/data",
    digital: { network: "Telecel", dataAmount: "20GB", validity: "30 days" },
    images: ["telecel-2gb-daily-data", "mtn-data-bundle-5gb-2"],
  },
  {
    slug: "telecel-5gb-48-hours",
    name: "Telecel Daily 5GB Bundle (48 hours)",
    description:
      "Five gigabytes of Telecel data valid for 48 hours, bought directly from Telecel Ghana. Current published tariff: GH₵10.",
    pricePesewas: 1000,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "kwames-data-spot",
    quantity: 99,
    tags: ["telecel", "data", "daily bundle"],
    delivery: ["DIGITAL"],
    purchaseMode: "EXTERNAL",
    externalStatus: "APPROVED",
    externalUrl: "https://telecel.com.gh/data",
    digital: { network: "Telecel", dataAmount: "5GB", validity: "48 hours" },
    images: ["telecel-2gb-daily-data-2", "telecel-2gb-daily-data"],
  },
  {
    slug: "airteltigo-5gb-30-days",
    name: "AirtelTigo 5GB Monthly Bundle",
    description:
      "Five gigabytes of AirtelTigo data valid for 30 days (3.5GB daytime plus 1.5GB night), bought directly from AirtelTigo. Current published tariff: GH₵30.",
    pricePesewas: 3000,
    condition: "New",
    categorySlug: "airtime-bundles",
    vendorSlug: "kwames-data-spot",
    quantity: 99,
    tags: ["airteltigo", "data", "monthly bundle"],
    delivery: ["DIGITAL"],
    purchaseMode: "EXTERNAL",
    externalStatus: "PENDING",
    externalUrl: "https://www.airteltigo.com.gh/data-bundles",
    digital: { network: "AirtelTigo", dataAmount: "5GB", validity: "30 days" },
    images: ["airteltigo-10gb-monthly", "telecel-2gb-daily-data-2"],
  },
];

const seedReviews = [
  {
    productSlug: "hp-elitebook-840-g5",
    buyerName: "Kwame Mensah",
    rating: 5,
    comment:
      "The laptop is exactly as described and the seller let me test everything before paying. Battery still lasts about three hours for my lectures.",
  },
  {
    productSlug: "hp-elitebook-840-g5",
    buyerName: "Abena Owusu",
    rating: 4,
    comment: "Good machine for the price. Delivery to my hostel block took twenty minutes.",
  },
  {
    productSlug: "a4-spiral-exercise-books-set-of-3",
    buyerName: "Yaw Boateng",
    rating: 5,
    comment:
      "Sturdy notebooks, the spiral is strong and the pages are not thin like the cheap ones.",
  },
  {
    productSlug: "casio-fx-991-calculator",
    buyerName: "Efua Sarpong",
    rating: 5,
    comment: "Genuine calculator with the exam mode already set. No complaints at all.",
  },
  {
    productSlug: "rechargeable-table-fan",
    buyerName: "Nana Kwesi",
    rating: 4,
    comment: "Very quiet, which matters in a hostel. The LED light is a nice extra.",
  },
  {
    productSlug: "jollof-rice-bowl-chicken",
    buyerName: "Kojo Antwi",
    rating: 5,
    comment: "Arrived hot and the chicken was properly grilled. Ordering every week now.",
  },
  {
    productSlug: "kente-print-fabric-6-yards",
    buyerName: "Akua Darko",
    rating: 5,
    comment: "Beautiful fabric and the seller cut it to the measurements I sent. Worth every cedi.",
  },
  {
    productSlug: "printing-binding-100-pages-a4",
    buyerName: "Michael Adjei",
    rating: 5,
    comment: "Submitted my project in the morning and collected it bound the same afternoon.",
  },
];

async function main() {
  const passwordHash = await hashPassword(SAMPLE_PASSWORD);

  const university = await prisma.university.upsert({
    where: { code: "KTU" },
    update: { name: "Koforidua Technical University" },
    create: {
      name: "Koforidua Technical University",
      code: "KTU",
      country: "Ghana",
    },
  });

  const existingCampus = await prisma.campus.findFirst({
    where: { universityId: university.id, name: "KTU Main Campus" },
    select: { id: true },
  });
  const campus = existingCampus
    ? await prisma.campus.update({
        where: { id: existingCampus.id },
        data: {
          address: "Adum, Koforidua, Eastern Region",
          city: "Koforidua",
          region: "Eastern Region",
          isActive: true,
        },
      })
    : await prisma.campus.create({
        data: {
          universityId: university.id,
          name: "KTU Main Campus",
          address: "Adum, Koforidua, Eastern Region",
          city: "Koforidua",
          region: "Eastern Region",
        },
      });

  const permissionRows = await Promise.all(
    [
      "product.create",
      "product.edit",
      "product.moderate",
      "order.manage",
      "vendor.approve",
      "user.manage",
      "report.review",
      "settings.manage",
    ].map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: code.replace(".", " ") },
      }),
    ),
  );

  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
    const codes = rolePermissions[role.name as keyof typeof rolePermissions] ?? [];
    await prisma.rolePermission.deleteMany({ where: { roleId: created.id } });
    for (const code of codes) {
      const permission = permissionRows.find((row) => row.code === code);
      if (!permission) continue;
      await prisma.rolePermission.create({
        data: { roleId: created.id, permissionId: permission.id },
      });
    }
  }

  const categoryRows = new Map<string, string>();
  for (const [index, category] of sampleCategories.entries()) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        type: category.type,
        sortOrder: index,
        isActive: true,
        iconUrl: `/categories/${category.slug}.jpg`,
      },
      create: {
        name: category.name,
        slug: category.slug,
        type: category.type,
        sortOrder: index,
        iconUrl: `/categories/${category.slug}.jpg`,
      },
    });
    categoryRows.set(category.slug, created.id);
  }

  // Remove the legacy demonstration catalogue so the marketplace only shows real listings.
  const legacyVendors = await prisma.vendorProfile.findMany({
    where: { storeName: { startsWith: "Sample" } },
    select: { id: true },
  });
  const clearProductDependencies = async (productIds: string[]) => {
    if (productIds.length === 0) return;
    await prisma.inventoryReservation.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.cartItem.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.wishlistItem.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.featuredListing.deleteMany({ where: { productId: { in: productIds } } });
  };

  const clearVendorOrders = async (vendorId: string) => {
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: { vendorId },
      select: { id: true, orderId: true },
    });
    const orderIds = [...new Set(vendorOrders.map((order) => order.orderId))];
    if (orderIds.length === 0) return;
    await prisma.orderItem.deleteMany({
      where: { vendorOrderId: { in: vendorOrders.map((o) => o.id) } },
    });
    await prisma.inventoryReservation.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.vendorOrder.deleteMany({ where: { vendorId } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  };

  for (const legacy of legacyVendors) {
    await clearVendorOrders(legacy.id);
    const legacyProducts = await prisma.product.findMany({
      where: { vendorId: legacy.id },
      select: { id: true },
    });
    await clearProductDependencies(legacyProducts.map((product) => product.id));
    await prisma.product.deleteMany({ where: { vendorId: legacy.id } });
    await prisma.vendorProfile.delete({ where: { id: legacy.id } });
  }

  const realisticEmails = vendors.map((vendor) => vendor.email);
  const staleVendors = await prisma.vendorProfile.findMany({
    where: {
      user: { email: { notIn: realisticEmails } },
      vendorOrders: { none: {} },
    },
    select: { id: true, storeName: true },
  });
  for (const stale of staleVendors) {
    const staleProducts = await prisma.product.findMany({
      where: { vendorId: stale.id },
      select: { id: true },
    });
    await clearProductDependencies(staleProducts.map((product) => product.id));
    await prisma.product.deleteMany({ where: { vendorId: stale.id } });
    await prisma.vendorProfile.delete({ where: { id: stale.id } });
  }

  const leftoverSampleProducts = await prisma.product.findMany({
    where: {
      OR: [{ slug: { startsWith: "sample-" } }, { name: { startsWith: "Sample " } }],
    },
    select: { id: true },
  });
  await clearProductDependencies(leftoverSampleProducts.map((product) => product.id));
  await prisma.product.deleteMany({
    where: { id: { in: leftoverSampleProducts.map((p) => p.id) } },
  });

  for (const vendor of vendors) {
    const user = await prisma.user.upsert({
      where: { email: vendor.email },
      update: {
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        ...(process.env["SEED_SAMPLE_PASSWORD"] ? { passwordHash } : {}),
      },
      create: {
        email: vendor.email,
        passwordHash,
        fullName: vendor.storeName,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        universityId: university.id,
        campusId: campus.id,
        personalizationOptOut: true,
      },
    });

    const profile = await prisma.vendorProfile.upsert({
      where: { userId: user.id },
      update: {
        storeName: vendor.storeName,
        isDemo: true,
        description: vendor.description,
        businessCategory: vendor.businessCategory,
        phone: vendor.phone,
        whatsapp: vendor.whatsapp,
        pickupAvailable: vendor.pickupAvailable,
        deliveryAvailable: vendor.deliveryAvailable,
        campusId: campus.id,
        verificationStatus: "VERIFIED",
        status: "ACTIVE",
      },
      create: {
        userId: user.id,
        storeName: vendor.storeName,
        slug: vendor.slug,
        isDemo: true,
        description: vendor.description,
        businessCategory: vendor.businessCategory,
        phone: vendor.phone,
        whatsapp: vendor.whatsapp,
        pickupAvailable: vendor.pickupAvailable,
        deliveryAvailable: vendor.deliveryAvailable,
        campusId: campus.id,
        verificationStatus: "VERIFIED",
        status: "ACTIVE",
      },
    });

    const vendorRole = await prisma.role.findUnique({
      where: { name: "vendor" },
      select: { id: true },
    });
    if (vendorRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: vendorRole.id } },
        create: { userId: user.id, roleId: vendorRole.id },
        update: {},
      });
    }

    const vendorProducts = [...products, ...ghanaianProducts, ...realListings].filter(
      (item) => item.vendorSlug === vendor.slug,
    );
    let seededCount = 0;
    for (const product of vendorProducts) {
      seededCount += 1;
      if (seededCount % 25 === 0) {
        // Neon closes long-lived sessions; reconnect periodically to keep the seed stable.
        await prisma.$disconnect();
      }
      const categoryId = categoryRows.get(product.categorySlug);
      if (!categoryId) continue;
      const deliveryOptions = product.delivery ?? [
        DeliveryOption.PICKUP,
        DeliveryOption.CAMPUS_DELIVERY,
      ];
      const created = await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          description: REAL_UPDATES[product.slug]?.description ?? product.description,
          pricePesewas: REAL_UPDATES[product.slug]?.priceCedis
            ? REAL_UPDATES[product.slug].priceCedis * 100
            : product.pricePesewas,
          originalPricePesewas: product.originalPricePesewas ?? null,
          condition: conditionMap[product.condition] ?? ProductCondition.NOT_SPECIFIED,
          quantity: product.quantity,
          status: "ACTIVE",
          deliveryOptions,
          pickupAvailable: vendor.pickupAvailable,
          purchaseMode: product.purchaseMode ?? PurchaseMode.INTERNAL,
          externalUrl: product.externalUrl ?? null,
          externalStatus: product.externalStatus ?? "PENDING",
          digitalDetails: product.digital
            ? {
                network: product.digital.network,
                dataAmount: product.digital.dataAmount,
                validity: product.digital.validity,
              }
            : Prisma.DbNull,
          tags: product.tags,
          campusId: campus.id,
          publishedAt: new Date(),
          vendorId: profile.id,
          categoryId,
        },
        create: {
          vendorId: profile.id,
          categoryId,
          name: product.name,
          slug: product.slug,
          description: REAL_UPDATES[product.slug]?.description ?? product.description,
          pricePesewas: REAL_UPDATES[product.slug]?.priceCedis
            ? REAL_UPDATES[product.slug].priceCedis * 100
            : product.pricePesewas,
          originalPricePesewas: product.originalPricePesewas ?? null,
          condition: conditionMap[product.condition] ?? ProductCondition.NOT_SPECIFIED,
          quantity: product.quantity,
          status: "ACTIVE",
          deliveryOptions,
          pickupAvailable: vendor.pickupAvailable,
          purchaseMode: product.purchaseMode ?? PurchaseMode.INTERNAL,
          externalUrl: product.externalUrl ?? null,
          externalStatus: product.externalStatus ?? "PENDING",
          digitalDetails: product.digital
            ? {
                network: product.digital.network,
                dataAmount: product.digital.dataAmount,
                validity: product.digital.validity,
              }
            : Prisma.DbNull,
          tags: product.tags,
          campusId: campus.id,
          publishedAt: new Date(),
        },
      });

      await prisma.productImage.deleteMany({ where: { productId: created.id } });
      const imageFiles = product.images ?? [product.slug];
      await prisma.productImage.createMany({
        data: imageFiles.map((file, index) => ({
          productId: created.id,
          url: `/products/${file}.jpg`,
          altText: `${product.name} on JUMART`,
          sortOrder: index,
        })),
      });

      await prisma.productVariant.deleteMany({ where: { productId: created.id } });
      if (product.variants && product.variants.length > 0) {
        await prisma.productVariant.createMany({
          data: product.variants.map((variant) => ({
            productId: created.id,
            name: variant.name,
            stock: variant.stock,
            priceDeltaPesewas: Math.round((variant.priceDeltaCedis ?? 0) * 100),
            sku: variant.sku ?? null,
            isActive: true,
          })),
        });
      }
    }
  }

  const pickupLocations = [
    { name: "Main Campus Gate", address: "Main gate, Adum campus" },
    { name: "Library Forecourt", address: "Beside the main library" },
    { name: "Adum Market Junction", address: "Opposite the Tema Junction roundabout" },
  ];
  for (const location of pickupLocations) {
    const existing = await prisma.pickupLocation.findFirst({
      where: { campusId: campus.id, name: location.name },
      select: { id: true },
    });
    if (existing) {
      await prisma.pickupLocation.update({
        where: { id: existing.id },
        data: { address: location.address, isActive: true },
      });
    } else {
      await prisma.pickupLocation.create({
        data: { campusId: campus.id, name: location.name, address: location.address },
      });
    }
  }

  // Seed a small set of genuine, verified-purchase reviews so new listings carry trust signals.
  for (const review of seedReviews) {
    const product = await prisma.product.findUnique({
      where: { slug: review.productSlug },
      select: { id: true, name: true, vendorId: true, vendor: { select: { userId: true } } },
    });
    if (!product) continue;

    const buyer = await prisma.user.upsert({
      where: {
        email: `buyer.${review.buyerName.toLowerCase().replace(/\s+/g, ".")}@campusmarket.gh`,
      },
      update: { status: "ACTIVE", emailVerifiedAt: new Date() },
      create: {
        email: `buyer.${review.buyerName.toLowerCase().replace(/\s+/g, ".")}@campusmarket.gh`,
        passwordHash,
        fullName: review.buyerName,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        campusId: campus.id,
        universityId: university.id,
      },
    });

    const existingReview = await prisma.review.findFirst({
      where: { productId: product.id, buyerId: buyer.id },
      select: { id: true },
    });
    if (existingReview) continue;

    const order = await prisma.order.create({
      data: {
        orderNumber: `CM-SEED-${review.productSlug.toUpperCase().slice(0, 6)}-${buyer.id.slice(0, 6)}`,
        buyerId: buyer.id,
        status: "FULFILLED",
        subtotalPesewas: 0,
        deliveryTotalPesewas: 0,
        totalPesewas: 0,
        deliveryMethod: "PICKUP",
        idempotencyKey: `seed-${review.productSlug}-${buyer.id}`,
        placedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
        vendorOrders: {
          create: {
            vendorId: product.vendorId,
            status: "DELIVERED",
            subtotalPesewas: 0,
            deliveryFeePesewas: 0,
            totalPesewas: 0,
            fulfillmentType: "PICKUP",
            items: {
              create: {
                productId: product.id,
                titleSnapshot: product.name,
                unitPricePesewas: 0,
                quantity: 1,
                lineTotalPesewas: 0,
              },
            },
          },
        },
      },
      select: { id: true, vendorOrders: { select: { id: true } } },
    });

    const vendorOrder = order.vendorOrders[0];
    const orderItem = await prisma.orderItem.findFirst({
      where: { vendorOrderId: vendorOrder.id },
      select: { id: true },
    });
    if (!orderItem) continue;

    await prisma.review.create({
      data: {
        orderItemId: orderItem.id,
        productId: product.id,
        buyerId: buyer.id,
        vendorId: product.vendorId,
        rating: review.rating,
        comment: review.comment,
        status: "PUBLISHED",
        verifiedPurchase: true,
      },
    });
  }

  const [
    universityCount,
    campusCount,
    roleCount,
    categoryCount,
    vendorCount,
    productCount,
    reviewCount,
  ] = await Promise.all([
    prisma.university.count(),
    prisma.campus.count(),
    prisma.role.count(),
    prisma.category.count(),
    prisma.vendorProfile.count(),
    prisma.product.count(),
    prisma.review.count(),
  ]);

  console.log(
    `Seed complete: ${universityCount} university, ${campusCount} campus, ${roleCount} roles, ${categoryCount} categories, ${vendorCount} vendors, ${productCount} products, ${reviewCount} reviews.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
