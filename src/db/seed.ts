// Idempotent seed: `npm run db:seed`. Safe to re-run; it never resets `stock` on existing rows.
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });
config();

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop`;

const categorySeed = [
  { slug: "knitwear", name: "Knitwear" },
  { slug: "outerwear", name: "Outerwear" },
  { slug: "footwear", name: "Footwear" },
  { slug: "tailoring", name: "Tailoring" },
  { slug: "essentials", name: "Essentials" },
];

const productSeed = [
  {
    slug: "fringed-knit-poncho",
    name: "Fringed Knit Poncho",
    priceCents: 42000,
    category: "knitwear",
    stock: 12,
    description:
      "An open-knit poncho with a hand-finished fringed hem, cut to drape over a shirt or a slip dress.",
    details: ["100% cotton", "Open-knit construction", "One size", "Hand wash cold, dry flat"],
    imageUrl: unsplash("1434389677669-e08b4cac3105"),
    imageAlt: "Cream open-knit poncho with fringed hem on a wooden hanger",
  },
  {
    slug: "satin-bomber-jacket",
    name: "Satin Bomber Jacket",
    priceCents: 69000,
    category: "outerwear",
    stock: 3,
    description:
      "A lightweight bomber in a soft terracotta satin with a ribbed collar and a relaxed, boxy shoulder.",
    details: ["Recycled polyester satin", "Ribbed collar, cuffs and hem", "Zip front, two pockets", "Dry clean only"],
    imageUrl: unsplash("1591047139829-d91aecb6caea"),
    imageAlt: "Terracotta bomber jacket held up on a hanger",
  },
  {
    slug: "suede-court-sneaker",
    name: "Suede Court Sneaker",
    priceCents: 38000,
    category: "footwear",
    stock: 0,
    description:
      "A low-profile court sneaker in tan suede on a cream rubber sole, finished with contrast stitching.",
    details: ["Suede upper", "Leather lining", "Rubber cupsole", "Made in Portugal"],
    imageUrl: unsplash("1549298916-b41d501d3772"),
    imageAlt: "Tan suede sneaker resting on mustard fabric",
  },
  {
    slug: "ribbed-wool-sweater",
    name: "Ribbed Wool Sweater",
    priceCents: 51000,
    category: "knitwear",
    stock: 8,
    description:
      "A dense ribbed sweater in grey merino with a high crew neck, made to be layered through winter.",
    details: ["100% merino wool", "Ribbed knit", "Regular fit", "Hand wash cold, dry flat"],
    imageUrl: unsplash("1556905055-8f358a7a47b2"),
    imageAlt: "Grey ribbed sweater, denim and a rust beanie laid flat",
  },
  {
    slug: "tailored-navy-suit",
    name: "Tailored Navy Suit",
    priceCents: 185000,
    category: "tailoring",
    stock: 5,
    description:
      "A two-piece suit in navy wool twill, half-canvassed and cut with a clean, structured shoulder.",
    details: ["100% virgin wool", "Half-canvassed jacket", "Fully lined", "Dry clean only"],
    imageUrl: unsplash("1507679799987-c73779587ccf"),
    imageAlt: "Man in a navy suit and striped tie fastening his jacket",
  },
  {
    slug: "washed-cotton-tee",
    name: "Washed Cotton Tee",
    priceCents: 14000,
    category: "essentials",
    stock: 40,
    description:
      "A heavyweight tee in garment-washed sage cotton, with a soft hand and a slightly boxy cut.",
    details: ["100% organic cotton", "Garment washed", "Regular fit", "Machine wash cold"],
    imageUrl: unsplash("1523381210434-271e8be1f52b"),
    imageAlt: "Sage green t-shirts hanging on wooden hangers",
  },
  {
    slug: "chunky-cable-cardigan",
    name: "Chunky Cable Cardigan",
    priceCents: 56000,
    category: "knitwear",
    stock: 14,
    description:
      "A generous cardigan in chunky cable knit, with a shawl collar and deep patch pockets.",
    details: ["Wool and alpaca blend", "Cable knit", "Relaxed fit", "Hand wash cold, dry flat"],
    imageUrl: unsplash("1558769132-cb1aea458c5e"),
    imageAlt: "Knitted cardigans and sweaters on a clothing rail",
  },
  {
    slug: "camel-wool-coat",
    name: "Camel Wool Coat",
    priceCents: 124000,
    category: "outerwear",
    stock: 2,
    description:
      "A long single-breasted coat in camel wool, with a notch lapel and a clean, unlined back.",
    details: ["Wool and cashmere blend", "Single-breasted", "Two welt pockets", "Dry clean only"],
    imageUrl: unsplash("1445205170230-053b83016050"),
    imageAlt: "Camel and cream coats on a boutique rail",
  },
];

async function main() {
  // Imported lazily so dotenv has populated DATABASE_URL before `@/db` checks it.
  const { db } = await import("./index");
  const { categories, products } = await import("./schema");

  const insertedCategories = await db
    .insert(categories)
    .values(categorySeed)
    .onConflictDoUpdate({ target: categories.slug, set: { name: sql`excluded.name` } })
    .returning({ id: categories.id, slug: categories.slug });
  const categoryId = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  // The grid lists newest first, so the first entry gets the latest created_at.
  const base = Date.now();
  const rows = productSeed.map(({ category, ...p }, i) => ({
    ...p,
    categoryId: categoryId.get(category)!,
    createdAt: new Date(base - i * 60_000),
  }));

  await db
    .insert(products)
    .values(rows)
    .onConflictDoUpdate({
      target: products.slug,
      // Deliberately omits `stock` and `createdAt` so re-seeding never resets inventory or order.
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        details: sql`excluded.details`,
        priceCents: sql`excluded.price_cents`,
        imageUrl: sql`excluded.image_url`,
        imageAlt: sql`excluded.image_alt`,
        categoryId: sql`excluded.category_id`,
        updatedAt: sql`now()`,
      },
    });

  console.log(`Seeded ${insertedCategories.length} categories and ${rows.length} products.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
