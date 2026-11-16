"use client";

import { useEffect } from "react";

/** Records a product view for the recently-viewed shelf and discovery signals. */
export function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/products/${slug}/view`, {
      method: "POST",
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [slug]);

  return null;
}
