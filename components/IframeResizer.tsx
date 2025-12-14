"use client";

import { useEffect } from "react";

export default function IframeResizer() {
  useEffect(() => {
    // Only run when embedded
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }
    if (!inIframe) return;

    let raf = 0;

    const postHeight = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const height = Math.max(
          document.documentElement.scrollHeight,
          document.body?.scrollHeight ?? 0
        );

        window.parent.postMessage(
          { type: "NF_IFRAME_HEIGHT", height },
          "*"
        );
      });
    };

    postHeight();

    const ro = new ResizeObserver(() => postHeight());
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);

    window.addEventListener("load", postHeight);
    window.addEventListener("resize", postHeight);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("load", postHeight);
      window.removeEventListener("resize", postHeight);
    };
  }, []);

  return null;
}