import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Campus Market",
    short_name: "Campus Market",
    description:
      "Everything you need, right around campus. Buy and sell with the KTU campus community.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#0b1f3a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
