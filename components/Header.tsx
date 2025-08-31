// components/Header.tsx
import React from "react";
import { useRouter } from "next/router";

type HeaderProps = {
  /** Titre affiché au centre en version mobile (header minimal) */
  title?: string;
};

export default function Header({ title }: HeaderProps)
{
  const router = useRouter();
  const p = router.pathname;

  const isActive = (href: string) => {
    const cur = p.replace(/\/+$/, "") || "/";
    const target = href.replace(/\/+$/, "") || "/";
    if (target === "/") return cur === "/";
    return cur === target || cur.startsWith(target + "/");
  };

  return (
    <header className="nav">
      {/* Brand */}
      <a href="/" className="brand" aria-label="Page d’accueil">
        <img src="/logo.png" alt="SMASH.bad" className="brand__logo" />
        <span className="brand__wordmark">SMASH</span>
      </a>
      {/* Titre mobile : même style que le wordmark, visible hors-home */}
      {title && <div className="nav__title">{title.toUpperCase()}</div>}
      

      {/* Pills */}
      <nav className="nav__links" aria-label="Navigation principale">
        {/* Entraînement */}
        {(() => {
          const active = isActive("/entrainements");
          const icon = active ? "/Bolt_On.svg" : "/Bolt.svg";
          return (
            <a
              href="/entrainements"
              className={`nav-pill ${active ? "is-active" : ""}`}
            >
              <img src={icon} className="nav-ic" alt="" aria-hidden />
              <span className="label">Entraînement</span>
            </a>
          );
        })()}

        {/* Matériel (soon) */}
        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/Racket.svg" className="nav-ic" alt="" />
          <span className="label">Matériel</span>
          <span className="tooltip">Matériel - Bientôt disponible</span>
        </span>

        {/* Partenaires (soon) */}
        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/Partner.svg" className="nav-ic" alt="" />
          <span className="label">Partenaires</span>
          <span className="tooltip">Partenaires - Bientôt disponible</span>
        </span>

        {/* Boutique (soon) */}
        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/Shop.svg" alt="" className="nav-ic" aria-hidden />
          <span className="label">Boutique</span>
          <span className="tooltip">Boutique - Bientôt disponible</span>
        </span>
      </nav>



      {/* Actions à droite */} 
      <div className="nav__actions">
        {/* Version icône seule (PC étroit) */}
        <button
          className="btn btn--ghost btn--icon login--icon-only"
          aria-disabled="true"
          title="Se connecter (bientôt)"
          type="button"
        >
          <img src="/Login.svg" alt="" className="nav-ic" aria-hidden />
        </button>

        {/* Version texte (PC large) */}
        <button
          className="btn btn--ghost btn--disabled login--full"
          aria-disabled="true"
          type="button"
        >
          <img src="/Login.svg" alt="" className="nav-ic" aria-hidden />
          Se connecter
          <span className="tooltip">Bientôt disponible</span>
        </button>
      </div>
    </header>
  );
}
