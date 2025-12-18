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
}