import Image from "next/image";
import Link from "next/link";

type AppLogoProps = {
  /** If set, wraps the logo in a Next.js Link */
  href?: string;
  className?: string;
  /** Logo height/width in pixels (square asset) */
  size?: number;
  /** Optional soft shadow (e.g. header on busy backgrounds) */
  emphasis?: boolean;
};

export function AppLogo({
  href = "/",
  className = "",
  size = 104,
  emphasis = false,
}: AppLogoProps) {
  /** Knock out flat white in non–alpha PNGs so it doesn’t read as a solid “tile” on the header. */
  const knockout = "mix-blend-multiply dark:mix-blend-screen";

  const img = (
    <Image
      src="/dr-morgees-logo.png"
      alt="Dr Segg"
      width={size}
      height={size}
      placeholder="empty"
      className={`object-contain border-0 !bg-transparent [background:none] ${knockout} ${
        emphasis
          ? "drop-shadow-[0_2px_12px_rgba(15,82,56,0.12)] dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
          : ""
      } ${className}`}
      style={{ backgroundColor: "transparent" }}
      priority
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center shrink-0 border-0 bg-transparent p-0 shadow-none outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] rounded-sm"
        aria-label="Dr Segg home"
      >
        {img}
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center shrink-0 border-0 bg-transparent p-0 shadow-none">
      {img}
    </span>
  );
}
