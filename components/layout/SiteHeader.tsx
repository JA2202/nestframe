"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/create", label: "Create art" },
  { href: "/art", label: "Shop art" },
  { href: "/cart", label: "Cart" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-nf-border bg-nf-bg/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-baseline gap-1">
          <span className="text-xl font-heading text-nf-ink tracking-tight">
            nestframe
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm text-nf-text-muted">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1 rounded-full transition-colors ${
                  isActive
                    ? "bg-nf-primary-soft text-nf-ink"
                    : "hover:bg-nf-primary-soft/70"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}