import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Dr Segira",
    short_name: "Dr Segira",
    description: "AI-powered livestock health decision support for poultry, goats, pigs, and dogs.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9faf6",
    theme_color: "#0f5238",
    orientation: "portrait-primary",
    categories: ["health", "medical", "lifestyle", "productivity"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
