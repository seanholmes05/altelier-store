// Sample storefront content. Replace with database-backed data later.

export type Img = { src: string; alt: string };

const unsplash = (id: string): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop`;

export const images = {
  hero: {
    src: unsplash("1483985988355-763728e1935b"),
    alt: "Woman in a burgundy coat and sunglasses carrying shopping bags",
  },
  editorial: {
    src: unsplash("1539109136881-3be0616acf4b"),
    alt: "Woman in a long blue coat standing in front of a cathedral",
  },
  boutique: {
    src: unsplash("1441986300917-64674bd600d8"),
    alt: "Boutique shelves lit by pendant lamps",
  },
} satisfies Record<string, Img>;

export type Collection = { slug: string; title: string; href: string; image: Img };

export const featuredCollections: Collection[] = [
  {
    slug: "women",
    title: "Women",
    href: "#",
    image: {
      src: unsplash("1566174053879-31528523f8ae"),
      alt: "Woman in a plum off-the-shoulder dress against a purple backdrop",
    },
  },
  {
    slug: "men",
    title: "Men",
    href: "#",
    image: {
      src: unsplash("1594938298603-c8148c4dae35"),
      alt: "Man adjusting the jacket of a blue check three-piece suit",
    },
  },
];

export const categoryCollections: Collection[] = [
  {
    slug: "accessories",
    title: "Accessories",
    href: "#",
    image: {
      src: unsplash("1584917865442-de89df76afd3"),
      alt: "Red leather top-handle handbag on a plinth",
    },
  },
  {
    slug: "outerwear",
    title: "Outerwear",
    href: "#",
    image: {
      src: unsplash("1551028719-00167b16eac5"),
      alt: "Black leather biker jacket on a hanger against white linen",
    },
  },
];

export type Product = {
  /** URL slug, also used as the identifier. */
  id: string;
  name: string;
  /** Display price. */
  price: string;
  category: string;
  /** Units on hand. 0 means out of stock. */
  stock: number;
  description: string;
  details: string[];
  image: Img;
};

export const productHref = (p: Pick<Product, "id">) => `/products/${p.id}`;

export type StockState = "in-stock" | "low-stock" | "out-of-stock";

const LOW_STOCK_THRESHOLD = 5;

export function getStock(p: Pick<Product, "stock">): { state: StockState; label: string } {
  if (p.stock <= 0) return { state: "out-of-stock", label: "Out of stock" };
  if (p.stock <= LOW_STOCK_THRESHOLD) {
    return { state: "low-stock", label: `Only ${p.stock} left` };
  }
  return { state: "in-stock", label: "In stock" };
}

export const newArrivals: Product[] = [
  {
    id: "fringed-knit-poncho",
    name: "Fringed Knit Poncho",
    price: "$420",
    category: "Knitwear",
    stock: 12,
    description:
      "An open-knit poncho with a hand-finished fringed hem, cut to drape over a shirt or a slip dress.",
    details: ["100% cotton", "Open-knit construction", "One size", "Hand wash cold, dry flat"],
    image: {
      src: unsplash("1434389677669-e08b4cac3105"),
      alt: "Cream open-knit poncho with fringed hem on a wooden hanger",
    },
  },
  {
    id: "satin-bomber-jacket",
    name: "Satin Bomber Jacket",
    price: "$690",
    category: "Outerwear",
    stock: 3,
    description:
      "A lightweight bomber in a soft terracotta satin with a ribbed collar and a relaxed, boxy shoulder.",
    details: ["Recycled polyester satin", "Ribbed collar, cuffs and hem", "Zip front, two pockets", "Dry clean only"],
    image: {
      src: unsplash("1591047139829-d91aecb6caea"),
      alt: "Terracotta bomber jacket held up on a hanger",
    },
  },
  {
    id: "suede-court-sneaker",
    name: "Suede Court Sneaker",
    price: "$380",
    category: "Footwear",
    stock: 0,
    description:
      "A low-profile court sneaker in tan suede on a cream rubber sole, finished with contrast stitching.",
    details: ["Suede upper", "Leather lining", "Rubber cupsole", "Made in Portugal"],
    image: {
      src: unsplash("1549298916-b41d501d3772"),
      alt: "Tan suede sneaker resting on mustard fabric",
    },
  },
  {
    id: "ribbed-wool-sweater",
    name: "Ribbed Wool Sweater",
    price: "$510",
    category: "Knitwear",
    stock: 8,
    description:
      "A dense ribbed sweater in grey merino with a high crew neck, made to be layered through winter.",
    details: ["100% merino wool", "Ribbed knit", "Regular fit", "Hand wash cold, dry flat"],
    image: {
      src: unsplash("1556905055-8f358a7a47b2"),
      alt: "Grey ribbed sweater, denim and a rust beanie laid flat",
    },
  },
  {
    id: "tailored-navy-suit",
    name: "Tailored Navy Suit",
    price: "$1,850",
    category: "Tailoring",
    stock: 5,
    description:
      "A two-piece suit in navy wool twill, half-canvassed and cut with a clean, structured shoulder.",
    details: ["100% virgin wool", "Half-canvassed jacket", "Fully lined", "Dry clean only"],
    image: {
      src: unsplash("1507679799987-c73779587ccf"),
      alt: "Man in a navy suit and striped tie fastening his jacket",
    },
  },
  {
    id: "washed-cotton-tee",
    name: "Washed Cotton Tee",
    price: "$140",
    category: "Essentials",
    stock: 40,
    description:
      "A heavyweight tee in garment-washed sage cotton, with a soft hand and a slightly boxy cut.",
    details: ["100% organic cotton", "Garment washed", "Regular fit", "Machine wash cold"],
    image: {
      src: unsplash("1523381210434-271e8be1f52b"),
      alt: "Sage green t-shirts hanging on wooden hangers",
    },
  },
  {
    id: "chunky-cable-cardigan",
    name: "Chunky Cable Cardigan",
    price: "$560",
    category: "Knitwear",
    stock: 14,
    description:
      "A generous cardigan in chunky cable knit, with a shawl collar and deep patch pockets.",
    details: ["Wool and alpaca blend", "Cable knit", "Relaxed fit", "Hand wash cold, dry flat"],
    image: {
      src: unsplash("1558769132-cb1aea458c5e"),
      alt: "Knitted cardigans and sweaters on a clothing rail",
    },
  },
  {
    id: "camel-wool-coat",
    name: "Camel Wool Coat",
    price: "$1,240",
    category: "Outerwear",
    stock: 2,
    description:
      "A long single-breasted coat in camel wool, with a notch lapel and a clean, unlined back.",
    details: ["Wool and cashmere blend", "Single-breasted", "Two welt pockets", "Dry clean only"],
    image: {
      src: unsplash("1445205170230-053b83016050"),
      alt: "Camel and cream coats on a boutique rail",
    },
  },
];

export const getProduct = (id: string) => newArrivals.find((p) => p.id === id);

export const navLinks = [
  { label: "New", href: "#" },
  { label: "Women", href: "#" },
  { label: "Men", href: "#" },
  { label: "Accessories", href: "#" },
  { label: "Outerwear", href: "#" },
] as const;

export const services = [
  { title: "Complimentary Shipping", body: "On every order, delivered in signature packaging." },
  { title: "Returns & Exchanges", body: "Thirty days to change your mind, no questions asked." },
  { title: "Book an Appointment", body: "Private styling with an advisor, in store or online." },
] as const;

export const footerColumns = [
  { title: "Client Care", links: ["Contact Us", "My Order", "Shipping", "Returns", "FAQs"] },
  { title: "The Company", links: ["About", "Careers", "Sustainability", "Press"] },
  { title: "Legal", links: ["Terms of Use", "Privacy Policy", "Cookie Settings"] },
] as const;
