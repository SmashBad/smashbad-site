// components/Header.tsx
import React from "react";

type HeaderProps = {
  /** Titre affiché au centre en version mobile (header minimal) */
  pageTitle?: string;
};

export default function Header({ pageTitle }: HeaderProps) {
  return (
    <header className="nav">
      {/* Partie gauche : marque */}
      <a href="/" className="brand" aria-label="Page d’accueil">
        {/* Utilise les chemins racine pour les assets (public/) */}
        <img src="/logo.png" alt="SMASH.bad" className="brand__logo" />
        <span className="brand__wordmark">SMASH</span>
      </a>

      {/* Titre central (affiché en MOBILE uniquement via CSS) */}
      <div className="nav__title" aria-hidden={pageTitle ? "false" : "true"}>
        {pageTitle ?? ""}
      </div>

      {/* Liens principaux (affichés en PC standard/étroit via CSS) */}
      <nav className="nav__links" aria-label="Navigation principale">
        <a href="/entrainements" className="nav-pill"  data-href="/entrainements">
          <img src="/Bolt.svg" className="nav-ic" alt="" aria-hidden />
          <span className="label">Entraînement</span>
        </a>

        <span className="nav-pill is-soon" aria-disabled="true" data-href="/materiel">
          <img src="/Racket.svg" className="nav-ic" alt="" />
          <span className="label">Matériel</span>
          <span className="tooltip">Bientôt disponible</span>
        </span>

        <span className="nav-pill is-soon" aria-disabled="true" data-href="/partenaires">
          <img src="/Partner.svg" className="nav-ic" alt="" />
          <span className="label">Partenaires</span>
          <span className="tooltip">Bientôt disponible</span>
        </span>

        <span className="nav-pill is-soon" aria-disabled="true" data-href="/shop">
          <img src="/Shop.svg" className="nav-ic" alt="" aria-hidden />
          <span className="label">Boutique</span>
          <span className="tooltip">Bientôt disponible</span>
        </span>
      </nav>

      {/* Zone droite : variantes de login (texte pour PC large, picto seul pour PC étroit, rien en mobile) */}
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
          <span className="label">Se connecter</span>
          <span className="tooltip">Bientôt disponible</span>
        </button>
      </div>
    </header>
  );
}
