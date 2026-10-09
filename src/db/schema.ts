// Table definitions go here. Generate Better Auth tables with:
//   npx @better-auth/cli generate
import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** Public identifier used in URLs. */
    slug: text().notNull().unique(),
    name: text().notNull(),
    description: text().notNull(),
    details: text().array().notNull().default(sql`'{}'::text[]`),
    /** Price in minor units (USD cents). */
    priceCents: integer("price_cents").notNull(),
    /** Units on hand. 0 means out of stock. */
    stock: integer().notNull().default(0),
    imageUrl: text("image_url").notNull(),
    imageAlt: text("image_alt").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_category_id_idx").on(t.categoryId),
    check("products_price_cents_non_negative", sql`${t.priceCents} >= 0`),
    check("products_stock_non_negative", sql`${t.stock} >= 0`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));
