import { Button, Container, MediaFrame, ProductGrid, ProductTile, Section } from "@/components/ui";

// Placeholder page that exercises the design-system primitives.
export default function Home() {
  return (
    <main>
      <Section flush tone="ink">
        <MediaFrame ratio="hero" tone="ink">
          <div className="absolute inset-0 flex flex-col items-center justify-end gap-4 pb-12">
            <p className="type-heading">Altelier</p>
            <Button href="#" variant="inverse">
              Shop now
            </Button>
          </div>
        </MediaFrame>
      </Section>

      <Section flush>
        <ProductGrid>
          {["One", "Two", "Three", "Four"].map((n) => (
            <ProductTile key={n} name={`Product ${n}`} price="$000" />
          ))}
        </ProductGrid>
      </Section>

      <Section>
        <Container prose className="text-center">
          <p className="type-statement">Placeholder statement copy.</p>
        </Container>
      </Section>
    </main>
  );
}
