// components/Header.tsx
import { useEffect, useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  // Prevent body scroll when burger is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="nav">
      {/* Brand */}
      <a href="/" className="brand" aria-label="Page d’accueil">
        <img src="/public/logo.png" alt="SMASH.bad" className="brand__logo" />
        <span className="brand__wordmark">SMASH</span>
      </a>

      {/* Main nav pills (hidden < 900px) */}
      <nav className="nav__links" aria-label="Navigation principale">
        <a href="/entrainements" className="nav-pill">
          <img src="/public/Bolt.svg" className="nav-ic" alt="" aria-hidden />
          Entraînement
        </a>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/public/Racket.svg" className="nav-ic" alt="" />
          Matériel
          <span className="tooltip">Bientôt disponible</span>
        </span>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/public/Partner.svg" className="nav-ic" alt="" />
          Partenaires
          <span className="tooltip">Bientôt disponible</span>
        </span>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/public/Shop.svg" className="nav-ic" alt="" aria-hidden />
          Boutique
          <span className="tooltip">Bientôt disponible</span>
        </span>
      </nav>

      {/* Right area: login button (text version ≥1200), icon‑only 900–1199 */}
      <div className="nav__actions">
        {/* Icon-only login (shown between 900–1199) */}
        <button
          className="btn btn--ghost btn--icon login--icon-only"
          aria-disabled="true"
          title="Se connecter (bientôt)"
        >
          <img src="/assets/Login.svg" alt="" className="nav-ic" aria-hidden />
        </button>

        {/* Full login button (shown ≥1200) */}
        <button
          className="btn btn--ghost btn--disabled login--full"
          aria-disabled="true"
        >
          <img src="/assets/Login.svg" alt="" className="nav-ic" aria-hidden />
          Se connecter
          <span className="tooltip">Bientôt disponible</span>
        </button>

        {/* Burger (shown < 900) */}
        <button
          className="burger"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          aria-controls="mobileMenu"
          onClick={() => setOpen(true)}
        >
          {/* Simple inline burger icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" stroke="#EAF2FF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile overlay menu */}
      <div
        id="mobileMenu"
        className={`mmenu ${open ? "is-open" : ""}`}
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
              onClick={() => setOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="#EAF2FF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <nav className="mmenu__list">
            <a href="/entrainements" className="mmenu__item" onClick={() => setOpen(false)}>
              <img src="/assets/Bolt.svg" className="nav-ic" alt="" aria-hidden />
              <span>Entraînement</span>
            </a>
            <span className="mmenu__item is-soon" aria-disabled="true">
              <img src="/assets/Racket.svg" className="nav-ic" alt="" />
              <span>Matériel</span>
              <small className="mmenu__soon">Bientôt</small>
            </span>
            <span className="mmenu__item is-soon" aria-disabled="true">
              <img src="/assets/Partner.svg" className="nav-ic" alt="" />
              <span>Partenaires</span>
              <small className="mmenu__soon">Bientôt</small>
            </span>
            <span className="mmenu__item is-soon" aria-disabled="true">
              <img src="/assets/Shop.svg" className="nav-ic" alt="" />
              <span>Boutique</span>
              <small className="mmenu__soon">Bientôt</small>
            </span>
          </nav>

          <div className="mmenu__footer">
            <button className="btn btn--ghost btn--disabled" aria-disabled="true">
              <img src="/assets/Login.svg" alt="" className="nav-ic" aria-hidden />
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
