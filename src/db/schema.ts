// Storefront tables live here. Better Auth tables are in `./auth-schema` and re-exported
// below, because drizzle-kit and the Drizzle client both read only this file.
import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

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

/** Ordered gallery. `position` 0 is the primary image shown on listing cards. */
export const productImages = pgTable(
  "product_images",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text().notNull(),
    alt: text().notNull(),
    position: integer().notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("product_images_product_id_position_unique").on(t.productId, t.position),
    check("product_images_position_non_negative", sql`${t.position} >= 0`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

// ---------------------------------------------------------------------------
// Orders. Created BEFORE payment, as `pending_payment`, together with a stock
// reservation (see `src/db/queries/orders.ts`). Webhooks only transition status;
// nothing about an order is ever taken from the client or created from Stripe data.
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "expired",
  "canceled",
  "payment_failed",
  "needs_review",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable(
  "orders",
  {
    /** App-generated so the order and its items can be inserted in one batch. Unguessable. */
    id: uuid().primaryKey(),
    /** Human-friendly order number. */
    number: integer().generatedAlwaysAsIdentity().notNull().unique(),
    /** Null for guest checkout. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    status: text().$type<OrderStatus>().notNull().default("pending_payment"),
    currency: text().notNull().default("usd"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    /** Hash of the cart this order was created from; lets a repeat click reuse the session. */
    cartHash: text("cart_hash").notNull(),
    /** Collected by Stripe; copied here when the payment is confirmed. */
    email: text(),
    shippingAddress: jsonb("shipping_address"),
    /** Stock is held until here; Stripe's session expiry is set to the same instant. */
    reservedUntil: timestamp("reserved_until", { withTimezone: true }).notNull(),
    /** Set exactly once, by the statement that returns the stock. */
    stockReleasedAt: timestamp("stock_released_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_user_id_idx").on(t.userId),
    index("orders_status_reserved_until_idx").on(t.status, t.reservedUntil),
    check(
      "orders_status_valid",
      sql`${t.status} in ('pending_payment','paid','expired','canceled','payment_failed','needs_review','refunded')`,
    ),
    check(
      "orders_totals_valid",
      sql`${t.subtotalCents} >= 0 and ${t.shippingCents} >= 0 and ${t.taxCents} >= 0 and ${t.totalCents} = ${t.subtotalCents} + ${t.shippingCents} + ${t.taxCents}`,
    ),
  ],
);

/** Immutable snapshot of what was bought, at the price charged. */
export const orderItems = pgTable(
  "order_items",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productSlug: text("product_slug").notNull(),
    name: text().notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer().notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (t) => [
    unique("order_items_order_id_product_id_unique").on(t.orderId, t.productId),
    index("order_items_order_id_idx").on(t.orderId),
    check("order_items_quantity_positive", sql`${t.quantity} > 0`),
    check(
      "order_items_amounts_valid",
      sql`${t.unitPriceCents} >= 0 and ${t.lineTotalCents} = ${t.unitPriceCents} * ${t.quantity}`,
    ),
  ],
);

/** Every Stripe event we have started processing, keyed by Stripe's event id. */
export const stripeEvents = pgTable(
  "stripe_events",
  {
    id: text().primaryKey(),
    type: text().notNull(),
    status: text().notNull().default("processing"),
    attempts: integer().notNull().default(1),
    error: text(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    check("stripe_events_status_valid", sql`${t.status} in ('processing','processed','failed')`),
  ],
);

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
