// components/hooks/useViewMode.ts
"use client";
import { useEffect, useState } from "react";

type ViewMode = "mobile" | "desktop-compact" | "desktop-full";

/** Règles :
 * - Mobile réel (UA mobile) => "mobile"
 * - Sinon (PC) : width < 1000 => "desktop-compact", width >= 1000 => "desktop-full"
 */
export default function useViewMode(): ViewMode {
  const [mode, setMode] = useState<ViewMode>("desktop-full");

  useEffect(() => {
    const compute = () => {
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(
        typeof navigator !== "undefined" ? navigator.userAgent : ""
      );
      if (isMobileUA) {
        setMode("mobile");
        return;
      }
      const w = typeof window !== "undefined" ? window.innerWidth : 1200;
      setMode(w < 1000 ? "desktop-compact" : "desktop-full");
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return mode;
}
