"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavBar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: "home" },
    { name: "Cases", href: "/cases", icon: "medical_services" },
    { name: "Records", href: "/records", icon: "description" },
    { name: "Profile", href: "/profile", icon: "person" },
  ];

  // We hide the bottom nav on some specific flow screens if needed, but for now we'll show it everywhere
  // except maybe guided-inspection if it's full screen. Let's keep it simple.

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#f9faf6]/80 dark:bg-stone-950/80 backdrop-blur-lg border-t border-[#707973]/15 shadow-[0px_-4px_20px_rgba(44,105,78,0.05)] rounded-t-[3rem]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center px-4 py-2 hover:opacity-80 transition-opacity cursor-pointer active:scale-95 ${
              isActive 
                ? "bg-[#2d6a4f] text-white rounded-full px-5 shadow-lg" 
                : "text-[#414941] dark:text-stone-400"
            }`}
          >
            <span className={`material-symbols-outlined ${isActive ? "filled-icon" : ""}`}>
              {item.icon}
            </span>
            <span className="font-inter text-[12px] font-bold uppercase tracking-wider mt-1">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
