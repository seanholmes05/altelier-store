CREATE TABLE "product_images" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_images_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_images_product_id_position_unique" UNIQUE("product_id","position"),
	CONSTRAINT "product_images_position_non_negative" CHECK ("product_images"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Preserve each product's existing image as its primary (position 0) gallery image.
INSERT INTO "product_images" ("product_id", "url", "alt", "position")
SELECT "id", "image_url", "image_alt", 0 FROM "products";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "image_alt";