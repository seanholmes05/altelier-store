// Idempotent seed: `npm run db:seed`. Safe to re-run; it never resets `stock` or replaces existing images.
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
    images: [
      { url: unsplash("1434389677669-e08b4cac3105"), alt: "Cream open-knit poncho with fringed hem on a wooden hanger" },
      { url: unsplash("1556822003-bcdd4887bd12"), alt: "Grey fringed poncho worn over jeans among spring blossom" },
      { url: unsplash("1678801868975-32786ae5aeeb"), alt: "Beige chunky knit shawl worn over a rust blouse" },
    ],
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
    images: [
      { url: unsplash("1591047139829-d91aecb6caea"), alt: "Terracotta bomber jacket held up on a hanger" },
      { url: unsplash("1662624080599-dd453fbe6cd0"), alt: "Tan bomber jacket worn with a white tee and dark trousers" },
    ],
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
    images: [
      { url: unsplash("1549298916-b41d501d3772"), alt: "Tan suede sneaker resting on mustard fabric" },
      { url: unsplash("1603808033176-9d134e6f2c74"), alt: "Tan suede court sneaker balanced on smooth stones against an orange backdrop" },
      { url: unsplash("1788029011405-b7e732ed6b44"), alt: "Terracotta suede sneakers with gum soles on stone tiles" },
    ],
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
    images: [
      { url: unsplash("1556905055-8f358a7a47b2"), alt: "Grey ribbed sweater, denim and a rust beanie laid flat" },
      { url: unsplash("1604573824419-289a9a10672c"), alt: "Oatmeal ribbed sweater worn in a field" },
      { url: unsplash("1636146049394-0924c2b66104"), alt: "Close detail of a grey ribbed crew neckline" },
    ],
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
    images: [
      { url: unsplash("1507679799987-c73779587ccf"), alt: "Man in a navy suit and striped tie fastening his jacket" },
      { url: unsplash("1617137968427-85924c800a22"), alt: "Navy suit worn full length with a white shirt and brown shoes" },
      { url: unsplash("1540292212250-e817c4b2dd2e"), alt: "Close detail of three working buttons on a navy sleeve cuff" },
    ],
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
    images: [
      { url: unsplash("1523381210434-271e8be1f52b"), alt: "Sage green t-shirts hanging on wooden hangers" },
      { url: unsplash("1759572095329-1dcf9522762b"), alt: "Sage cotton tee folded flat beside cotton bolls" },
      { url: unsplash("1523381294911-8d3cead13475"), alt: "Sage green tees hanging on wooden hangers in close detail" },
    ],
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
    images: [
      { url: unsplash("1558769132-cb1aea458c5e"), alt: "Knitted cardigans and sweaters on a clothing rail" },
      { url: unsplash("1629821713624-12355bb28f40"), alt: "Cream chunky cardigan worn open against a bridge and cloudy sky" },
      { url: unsplash("1670080514836-2a007ec86f6a"), alt: "Cream cardigan with textured pom-pom cable-knit detail" },
    ],
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
    images: [
      { url: unsplash("1445205170230-053b83016050"), alt: "Camel and cream coats on a boutique rail" },
      { url: unsplash("1514813836041-518668f092b1"), alt: "Full-length camel wool coat worn against a grey sky" },
      { url: unsplash("1539533113208-f6df8cc8b543"), alt: "Belted camel wool coat in detail against a stone wall" },
    ],
  },
];

async function main() {
  // Imported lazily so dotenv has populated DATABASE_URL before `@/db` checks it.
  const { db } = await import("./index");
  const { categories, productImages, products } = await import("./schema");

  const insertedCategories = await db
    .insert(categories)
    .values(categorySeed)
    .onConflictDoUpdate({ target: categories.slug, set: { name: sql`excluded.name` } })
    .returning({ id: categories.id, slug: categories.slug });
  const categoryId = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  // The grid lists newest first, so the first entry gets the latest created_at.
  const base = Date.now();
  const rows = productSeed.map((p, i) => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    details: p.details,
    priceCents: p.priceCents,
    stock: p.stock,
    categoryId: categoryId.get(p.category)!,
    createdAt: new Date(base - i * 60_000),
  }));

  const insertedProducts = await db
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
        categoryId: sql`excluded.category_id`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: products.id, slug: products.slug });
  const productId = new Map(insertedProducts.map((p) => [p.slug, p.id]));

  // Sample photos only fill empty slots; they never replace images already set for a position.
  // Position 0 is the primary image; later positions are the gallery slides, in order.
  const imageRows = productSeed.flatMap((p) =>
    p.images.map((img, position) => ({
      productId: productId.get(p.slug)!,
      url: img.url,
      alt: img.alt,
      position,
    })),
  );
  await db.insert(productImages).values(imageRows).onConflictDoNothing();

  console.log(`Seeded ${insertedCategories.length} categories, ${rows.length} products and ${imageRows.length} images.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
