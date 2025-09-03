// components/Footer.tsx
import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <small>
        © {new Date().getFullYear()} SMASH.bad — Tous droits réservés - 
      <Link
          href="/contact"
          className="underline underline-offset-4 hover:no-underline"
          aria-label="Formulaire de contact"
        >
          Contact
        </Link></small>
    </footer>
  );
}
