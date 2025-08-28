// components/DeviceTest.tsx
"use client";
import { useEffect, useState } from "react";

export default function DeviceTest() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
      setIsMobile(mobile);
    }
  }, []);

  if (isMobile === null) return <p>Détection en cours...</p>;

  return (
    <p style={{ textAlign: "center", marginTop: "20px" }}>
      {isMobile ? "✅ Vous êtes sur un mobile" : "💻 Vous êtes sur un ordinateur"}
    </p>
  );
}
