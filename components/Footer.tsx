// components/Footer.tsx
import React from "react";

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <small>
        © {new Date().getFullYear()} SMASH.bad — Tous droits réservés
      </small>
    </footer>
  );
}
