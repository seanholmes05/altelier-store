"use client";

import Image from "next/image";
import type { ImageProps } from "next/image";

const UNSPLASH = "https://images.unsplash.com/";
/** Product frames are portrait (3:4 on mobile, 4:5 from md), so crop to the taller 3:4. */
const PORTRAIT = 4 / 3;
/** Plenty for the largest slide at 2x; keeps requests inside what the originals can supply. */
const MAX_WIDTH = 2400;

/**
 * Sources are large landscape photographs shown in portrait frames. Letting `object-cover` do the
 * crop client-side means the browser stretches a landscape file taller than it is, which looks
 * soft. Instead the CDN crops to portrait server-side at exactly the requested width, so every
 * rendered pixel is a real pixel: nothing is ever scaled past its natural size.
 *
 * It must live in a Client Component (a loader function can't cross the server boundary), so
 * server components render this rather than passing `loader` to next/image themselves.
 */
function loader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const q = quality ?? 90;
  if (src.startsWith(UNSPLASH)) {
    const w = Math.min(width, MAX_WIDTH);
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(w));
    url.searchParams.set("h", String(Math.round(w * PORTRAIT)));
    url.searchParams.set("q", String(q));
    return url.toString();
  }
  // Any other host (e.g. real photography later) goes through the built-in optimizer.
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}

export function ProductImage(props: Omit<ImageProps, "loader">) {
  // eslint-disable-next-line jsx-a11y/alt-text -- `alt` is part of ImageProps and passed through.
  return <Image {...props} loader={loader} />;
}
