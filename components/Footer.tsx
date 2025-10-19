// components/Footer.tsx
import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
     <footer className="footer" role="contentinfo">
      <Link href="/contact" aria-label="Formulaire de contact">Contact</Link>

      {/* Réseaux sociaux */}
        <div className="footer__social" aria-label="Réseaux sociaux">
          <a
            href="https://www.instagram.com/smashbad_fr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SMASH.bad sur Instagram"
            className="social-link"
            title="@smashbad_fr"
          >
            <img
              src="/Instagram_Glyph_White.svg"
              alt=""
              width={22}
              height={22}
              className="social-ic"
            />
          </a>
        </div>
      </div>

      <small>© {new Date().getFullYear()} SMASH.bad — Tous droits réservés</small>
    </footer>
  );
}
