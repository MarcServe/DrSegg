import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { CaseProvider } from "@/context/CaseContext";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Dr Segira",
  description: "AI-powered livestock health decision support for farmers in Africa.",
  applicationName: "Dr Segira",
  appleWebApp: {
    capable: true,
    title: "Dr Segira",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f5238" },
    { media: "(prefers-color-scheme: dark)", color: "#145c3a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/sw.js'); }); }`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} antialiased min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)]`}
      >
        <CaseProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <PwaInstallButton />
        </CaseProvider>
      </body>
    </html>
  );
}
