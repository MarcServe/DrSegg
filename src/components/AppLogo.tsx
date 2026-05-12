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
  /** Drop shadow keeps logos readable on pale / white backgrounds (blend modes hid light artwork). */
  const readability =
    emphasis
      ? "drop-shadow-[0_2px_6px_rgba(0,0,0,0.14)] dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
      : "drop-shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_2px_14px_rgba(0,0,0,0.35)]";

  const img = (
    <Image
      src="/dr-morgees-logo.png"
      alt="Dr Morgees"
      width={size}
      height={size}
      placeholder="empty"
      className={`object-contain border-0 !bg-transparent [background:none] ${readability} ${
        emphasis
          ? "ring-2 ring-[var(--color-primary)]/20 rounded-2xl ring-offset-4 ring-offset-[var(--color-background)]"
          : ""
      } ${className}`}
      style={{ color: "transparent" }}
      priority
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center shrink-0 border-0 bg-transparent p-0 shadow-none outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] rounded-sm"
        aria-label="Dr Morgees home"
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
