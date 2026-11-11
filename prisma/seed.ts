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
      "Airtime and data bundles for MTN, Telecel, Vodafone and AirtelTigo. Buy on Campus Market and we credit your number, or continue to the network's own page.",
    businessCategory: "Airtime & Data",
    phone: "+233245551207",
    whatsapp: "+233245551207",
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
  digital?: { network: string; dataAmount: string; validity: string };
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
      "Two gigabytes of Telecel data that renews every day. Bought on Campus Market and credited straight to your number.",
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
    externalUrl: "https://www.vodafone.com.gh/data-bundles",
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

    for (const product of products.filter((item) => item.vendorSlug === vendor.slug)) {
      const categoryId = categoryRows.get(product.categorySlug);
      if (!categoryId) continue;
      const deliveryOptions = product.delivery ?? [
        DeliveryOption.PICKUP,
        DeliveryOption.CAMPUS_DELIVERY,
      ];
      const imageUrl = `/products/${product.slug}.jpg`;

      const created = await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          description: product.description,
          pricePesewas: product.pricePesewas,
          originalPricePesewas: product.originalPricePesewas ?? null,
          condition: conditionMap[product.condition] ?? ProductCondition.NOT_SPECIFIED,
          quantity: product.quantity,
          status: "ACTIVE",
          deliveryOptions,
          pickupAvailable: vendor.pickupAvailable,
          purchaseMode: product.purchaseMode ?? PurchaseMode.INTERNAL,
          externalUrl: product.externalUrl ?? null,
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
          description: product.description,
          pricePesewas: product.pricePesewas,
          originalPricePesewas: product.originalPricePesewas ?? null,
          condition: conditionMap[product.condition] ?? ProductCondition.NOT_SPECIFIED,
          quantity: product.quantity,
          status: "ACTIVE",
          deliveryOptions,
          pickupAvailable: vendor.pickupAvailable,
          purchaseMode: product.purchaseMode ?? PurchaseMode.INTERNAL,
          externalUrl: product.externalUrl ?? null,
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
      await prisma.productImage.create({
        data: {
          productId: created.id,
          url: imageUrl,
          altText: `${product.name} on Campus Market`,
          sortOrder: 0,
        },
      });
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
