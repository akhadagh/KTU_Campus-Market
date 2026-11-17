"use client";

import { useState } from "react";
import { Image } from "next/image";

export function ProductGallery({ images, productName }: { images: { url: string; altText?: string }[]; productName: string }) {
  const [mainImage, setMainImage] = useState(images[0]?.url ?? "");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImage, setZoomedImage] = useState("");

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm">
        {mainImage ? (
          <img
            src={mainImage}
            alt={productName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onClick={() => setIsZoomed(true)}
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <span className="text-[h-24] w-full text-neutral-300">No photo</span>
          </div>
        )}
        {isZoomed && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div
              className="relative max-w-[70vw] max-h-[60vh] overflow-hidden rounded-xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="absolute top-4 right-4 bg-black/50 text-white rounded-full h-8 w-8 place-items-center"
              >
                <span className="text-[h-4] w-4">&times;</span>
              </button>
              <img
                src={zoomedImage || mainImage}
                alt={productName}
                className="h-full w-full object-contain max-w-[70vw] max-h-[60vh]"
              />
            </div>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid gap-3">
          {images.map((image, index) => (
            <button
              key={image.url}
              onClick={() => setMainImage(image.url)}
              className={cn(
                "aspect-square overflow-hidden rounded-lg border border-neutral-200 overflow-hidden",
                mainImage === image.url ? "border-brand-700" : "border-neutral-200"
              )}
            >
              <img
                src={image.url}
                alt={image.altText || productName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
