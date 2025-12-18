"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import SiteHeader from "./SiteHeader";

export default function SiteShell({ children }: { children: ReactNode }) {
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    try {
      setShowHeader(window.self === window.top);
    } catch {
      setShowHeader(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-nf-bg">
      {showHeader ? <SiteHeader /> : null}
      <main className="flex-1">{children}</main>
      {showHeader ? (
        <footer className="border-t border-nf-border mt-12">
          <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-nf-text-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} nestframe</span>
            <span>Custom wall art, created in minutes.</span>
          </div>
        </footer>
      ) : null}
    </div>
  );
}