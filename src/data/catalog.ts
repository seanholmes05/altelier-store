// Static storefront content (imagery, collections, navigation, services, footer). Products live in the database.

import type { Img } from "@/lib/product";

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
    href: "/collections/outerwear",
    image: {
      src: unsplash("1551028719-00167b16eac5"),
      alt: "Black leather biker jacket on a hanger against white linen",
    },
  },
];

export const navLinks = [
  { label: "New", href: "/new-arrivals" },
  { label: "Women", href: "#" },
  { label: "Men", href: "#" },
  { label: "Accessories", href: "#" },
  { label: "Outerwear", href: "/collections/outerwear" },
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
