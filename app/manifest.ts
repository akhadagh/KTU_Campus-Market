import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JUMART — Your Campus. Your Marketplace.",
    short_name: "JUMART",
    description:
      "JUMART connects students, vendors and service providers on one campus marketplace. Buy and sell laptops, fashion, food, study materials and airtime bundles.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F5FC",
    theme_color: "#3B087D",
    orientation: "portrait",
    categories: ["shopping", "education", "business"],
    icons: [
      { src: "/brand/jumart-favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/brand/jumart-favicon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/brand/jumart-app-icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
