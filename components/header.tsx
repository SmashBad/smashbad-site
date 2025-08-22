import React from "react";

export default function Header() {
  return (
    <header className="nav">
      <a href="/" className="brand">
        {/* Mets ton logo ici (placer le fichier plus tard dans /public/logo.png) */}
        <img src="/public/logo.png" alt="SMASH.bad" className="brand__logo" />
        <span className="brand__wordmark">SMASH</span>
      </a>

      <nav className="nav__links">
        {/* NOTE: si ta page Shadow est encore en HTML, garde /shadow.html.
                 Si tu la convertis en page Next, remplace par /shadow */}
        <a href="/shadow.html" className="nav-pill">
          <img src="/public/Bolt.svg" alt="" className="nav-ic" />
          Entraînement
        </a>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/public/Racket.svg" alt="" className="nav-ic" />
          Matériel
          <span className="tooltip">Bientôt disponible</span>
        </span>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/public/Partner.svg" alt="" className="nav-ic" />
          Partenaires
          <span className="tooltip">Bientôt disponible</span>
        </span>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/public/Shop.svg" alt="" className="nav-ic" />
          Boutique
          <span className="tooltip">Bientôt disponible</span>
        </span>
      </nav>

      <button className="btn btn--ghost btn--disabled" aria-disabled="true">
        <img src="/public/Login.svg" alt="" className="nav-ic" />
        Se connecter
        <span className="tooltip">Bientôt disponible</span>
      </button>
    </header>
  );
}
