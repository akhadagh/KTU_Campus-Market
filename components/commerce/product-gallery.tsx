"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  url: string;
  altText?: string | null;
}

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100">
        <ImageOff className="h-10 w-10 text-neutral-300" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-[var(--shadow-card)]">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.altText ?? `${productName} photo ${active + 1}`}
            className="h-full w-full object-cover"
          />
        ) : null}
        {images.length > 1 ? (
          <span className="absolute right-3 bottom-3 rounded-full bg-neutral-900/70 px-2.5 py-1 text-xs font-semibold text-white">
            {active + 1} / {images.length}
          </span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1} of ${productName}`}
              aria-current={index === active}
              className={cn(
                "focus-visible:ring-brand-500/30 aspect-square overflow-hidden rounded-xl border-2 bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                index === active ? "border-brand-600" : "hover:border-brand-300 border-neutral-200",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.altText ?? `${productName} photo ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
