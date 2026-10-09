import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { Button, Container, MediaFrame, ProductGrid, Section } from "@/components/ui";
import {
  categoryCollections,
  featuredCollections,
  images,
  services,
  type Collection,
} from "@/data/catalog";
import { getNewArrivals } from "@/db/queries/products";

/** Large editorial tile with the title over a soft scrim at the bottom. */
function CollectionTile({
  collection,
  sizes,
  priority,
}: {
  collection: Collection;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Link href={collection.href} className="group relative block">
      <MediaFrame ratio="portrait">
        <Image
          src={collection.image.src}
          alt={collection.image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/50 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 text-inverse md:p-6">
          <h3 className="type-heading">{collection.title}</h3>
          <span className="type-label underline underline-offset-4">Shop now</span>
        </div>
      </MediaFrame>
    </Link>
  );
}

export default async function Home() {
  const newArrivals = await getNewArrivals();

  return (
    <main id="main">
      {/* Hero */}
      <Section flush tone="ink">
        <MediaFrame ratio="hero" tone="ink">
          <Image
            src={images.hero.src}
            alt={images.hero.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_25%]"
          />
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 px-gutter pb-10 text-center md:pb-16">
            <p className="type-label">Autumn / Winter</p>
            <h1 className="type-statement max-w-2xl">The new season, in considered layers</h1>
            <Button href="#" variant="inverse">
              Shop now
            </Button>
          </div>
        </MediaFrame>
      </Section>

      {/* New arrivals */}
      <Section flush className="pt-section">
        <Container className="flex items-end justify-between pb-6">
          <h2 className="type-heading">New Arrivals</h2>
          <Link href="#" className="type-label link">
            View all
          </Link>
        </Container>
        <ProductGrid>
          {newArrivals.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </ProductGrid>
      </Section>

      {/* Featured collections */}
      <Section flush>
        <Container className="pb-6 pt-section">
          <h2 className="type-heading">Featured Collections</h2>
        </Container>
        <div className="grid md:grid-cols-2">
          {featuredCollections.map((c) => (
            <CollectionTile key={c.slug} collection={c} sizes="(min-width: 768px) 50vw, 100vw" />
          ))}
        </div>
      </Section>

      {/* Editorial split */}
      <Section flush tone="ink">
        <div className="grid md:grid-cols-2">
          <MediaFrame ratio="portrait" tone="ink" className="md:aspect-auto md:min-h-[44rem]">
            <Image
              src={images.editorial.src}
              alt={images.editorial.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </MediaFrame>
          <div className="flex flex-col justify-center gap-6 px-gutter py-16 md:px-16">
            <p className="type-label">The Edit</p>
            <h2 className="type-statement">
              Made slowly, from the finest wool, leather and cotton, and cut to move with you.
            </h2>
            <div>
              <Button href="#" variant="inverse">
                Discover more
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Shop by category */}
      <Section flush>
        <Container className="pb-6 pt-section">
          <h2 className="type-heading">Shop by Category</h2>
        </Container>
        <div className="grid grid-cols-2">
          {categoryCollections.map((c) => (
            <CollectionTile key={c.slug} collection={c} sizes="50vw" />
          ))}
        </div>
      </Section>

      {/* Services */}
      <Section divided>
        <Container>
          <h2 className="type-heading">Altelier Services</h2>
          <ul className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
            {services.map((s) => (
              <li key={s.title} className="border-t border-ink pt-4">
                <h3 className="type-title">{s.title}</h3>
                <p className="type-body mt-2 text-muted">{s.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </main>
  );
}
