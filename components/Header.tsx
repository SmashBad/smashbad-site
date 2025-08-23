// components/Header.tsx
import { useEffect, useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  // Empêche le scroll quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="nav">
      {/* Brand */}
      <a href="/" className="brand" aria-label="Page d’accueil">
        <img src="logo.png" alt="SMASH.bad" className="brand__logo" />
        <span className="brand__wordmark">SMASH</span>
      </a>

      {/* Pills (cachées < 750px via CSS) */}
      <nav className="nav__links" aria-label="Navigation principale">
        <a href="/entrainements" className="nav-pill">
          <img src="Bolt.svg" className="nav-ic" alt="" aria-hidden />
          Entraînement
        </a>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="Racket.svg" className="nav-ic" alt="" />
          Matériel
          <span className="tooltip">Bientôt disponible</span>
        </span>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="Partner.svg" className="nav-ic" alt="" />
          Partenaires
          <span className="tooltip">Bientôt disponible</span>
        </span>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="Shop.svg" className="nav-ic" alt="" aria-hidden />
          Boutique
          <span className="tooltip">Bientôt disponible</span>
        </span>
      </nav>

      {/* Zone droite : login + burger */}
      <div className="nav__actions">
        {/* Icône login (visible 750–999px via CSS .login--icon-only) */}
        <button
          className="btn btn--ghost btn--icon login--icon-only"
          aria-disabled="true"
          title="Se connecter (bientôt)"
          type="button"
        >
          <img src="Login.svg" alt="" className="nav-ic" aria-hidden />
        </button>

        {/* Bouton login complet (visible ≥1000px via CSS .login--full) */}
        <button
          className="btn btn--ghost btn--disabled login--full"
          aria-disabled="true"
          type="button"
        >
          <img src="Login.svg" alt="" className="nav-ic" aria-hidden />
          Se connecter
          <span className="tooltip">Bientôt disponible</span>
        </button>

        {/* Burger (visible < 750px via CSS .burger) */}
        <button
          className="burger"
          aria-label="Ouvrir le menu"
          type="button"
          onClick={() => {
            const el = document.getElementById("mobileMenu");
            el?.classList.add("is-open");
            document.body.style.overflow = "hidden";
            }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" stroke="#EAF2FF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      <div
        id="mobileMenu"
        className="mmenu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="mmenu__panel">
          <div className="mmenu__header">
            <span>Menu</span>
              <button
                className="mmenu__close"
                aria-label="Fermer le menu"
                onClick={() => {
                  document.getElementById("mobileMenu")?.classList.remove("is-open");
                  document.body.style.overflow = "";
                }}
              >
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="#EAF2FF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <nav className="mmenu__list">
            <a href="/entrainements" className="mmenu__item">
              <img src="Bolt.svg" className="nav-ic" alt="" aria-hidden />
              <span>Entraînement</span>
            </a>
            <span className="mmenu__item is-soon" aria-disabled="true">
              <img src="Racket.svg" className="nav-ic" alt="" />
              <span>Matériel</span>
              <small className="mmenu__soon">Bientôt</small>
            </span>
            <span className="mmenu__item is-soon" aria-disabled="true">
              <img src="Partner.svg" className="nav-ic" alt="" />
              <span>Partenaires</span>
              <small className="mmenu__soon">Bientôt</small>
            </span>
            <span className="mmenu__item is-soon" aria-disabled="true">
              <img src="Shop.svg" className="nav-ic" alt="" />
              <span>Boutique</span>
              <small className="mmenu__soon">Bientôt</small>
            </span>
          </nav>

          <div className="mmenu__footer">
            <button className="btn btn--ghost btn--disabled" aria-disabled="true">
              <img src="Login.svg" alt="" className="nav-ic" aria-hidden />
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
