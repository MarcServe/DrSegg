import type { NextConfig } from "next";

const supabaseHost = (() => {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!u) return null;
  try {
    return new URL(u).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost }] : [])],
  },
};

export default nextConfig;
