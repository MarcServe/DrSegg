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
  async headers() {
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: appOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              `connect-src 'self' ${supabaseHost ? `https://${supabaseHost} wss://${supabaseHost}` : ""} https://api.anthropic.com https://api.openai.com`,
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
