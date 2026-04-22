import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Dr Morgees — Dr Segg",
    short_name: "Dr Morgees",
    description: "Farm and pet health decision support for poultry, goats, pigs, and dogs.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9faf6",
    theme_color: "#0f5238",
    orientation: "portrait-primary",
    categories: ["health", "medical", "lifestyle", "productivity"],
    icons: [
      {
        src: "/dr-morgees-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
