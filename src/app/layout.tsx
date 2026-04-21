import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { CaseProvider } from "@/context/CaseContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Dr Segg",
  description: "AI Livestock Health Assistant",
  icons: {
    icon: "/dr-morgees-logo.png",
    apple: "/dr-morgees-logo.png",
  },
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
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} antialiased min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)]`}
      >
        <CaseProvider>
          {children}
        </CaseProvider>
      </body>
    </html>
  );
}
