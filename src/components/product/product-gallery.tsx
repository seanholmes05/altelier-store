"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ProductImage } from "@/components/product/product-image";
import { MediaFrame } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Img } from "@/lib/product";

const control =
  "absolute top-1/2 z-10 inline-flex size-control -translate-y-1/2 items-center justify-center " +
  "border border-ink bg-paper text-ink transition-colors duration-150 hover:bg-ink hover:text-inverse " +
  "disabled:pointer-events-none disabled:opacity-0";

/**
 * Product image slides. A native scroll-snap track, so swipe, trackpad and keyboard scrolling work
 * with no JS, and the previous/next buttons, counter and thumbnails are layered on top.
 *
 * Quality: every slide uses `quality={90}` and `sizes` that match the real layout, so
 * next/image serves the correct high-resolution variant per device. The first slide is
 * `priority`, and the second is eager so "next" is instant; the rest load as they approach.
 */
export function ProductGallery({
  images,
  name,
  soldOut,
}: {
  images: readonly Img[];
  name: string;
  soldOut?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;
  const multiple = count > 1;

  const goTo = useCallback(
    (next: number) => {
      const el = track.current;
      if (!el) return;
      const target = Math.min(Math.max(next, 0), count - 1);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: target * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    },
    [count],
  );

  // Follow the scroll position, whether it came from a swipe, a button or the keyboard.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setIndex(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    }
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={`${name} images`}
      onKeyDown={onKeyDown}
    >
      <div className="relative">
        <div
          ref={track}
          tabIndex={multiple ? 0 : undefined}
          aria-label={multiple ? "Product images. Use the left and right arrow keys to browse." : undefined}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, i) => (
            <div
              key={image.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              className="w-full shrink-0 snap-center"
            >
              <MediaFrame ratio="portrait" className="md:aspect-[4/5]">
                <ProductImage
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={i === 0}
                  loading={i <= 1 ? "eager" : "lazy"}
                  quality={90}
                  sizes="(min-width: 1024px) 60vw, (min-width: 768px) 50vw, 100vw"
                  className={cn("object-cover", soldOut && "opacity-60")}
                />
              </MediaFrame>
            </div>
          ))}
        </div>

        {multiple ? (
          <>
            <button
              type="button"
              className={cn(control, "left-3 md:left-4")}
              aria-label="Previous image"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              className={cn(control, "right-3 md:right-4")}
              aria-label="Next image"
              disabled={index === count - 1}
              onClick={() => goTo(index + 1)}
            >
              <Chevron direction="right" />
            </button>
            <p
              className="type-caption absolute bottom-3 left-3 z-10 bg-paper px-2 py-1 md:bottom-4 md:left-4"
              role="status"
              aria-live="polite"
            >
              {index + 1} / {count}
            </p>
          </>
        ) : null}
      </div>

      {multiple ? (
        <ul className="flex gap-2 px-gutter py-3 md:px-4" aria-label="Choose an image">
          {images.map((image, i) => (
            <li key={image.src} className="w-14 shrink-0 md:w-16">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show image ${i + 1} of ${count}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "block w-full border-b-2 pb-1 transition-opacity duration-150",
                  i === index ? "border-ink" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <MediaFrame ratio="portrait">
                  <ProductImage
                    src={image.src}
                    alt=""
                    fill
                    quality={75}
                    loading="eager"
                    sizes="64px"
                    className={cn("object-cover", soldOut && "opacity-50")}
                  />
                </MediaFrame>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d={direction === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} />
    </svg>
  );
}
