import React from "react";

export default function Header() {
  return (
    <header className="nav">
      <a href="/" className="brand">
        <img src="/logo.png" alt="SMASH.bad" className="brand__logo" />
        <span className="brand__wordmark">SMASH</span>
      </a>

      <nav className="nav__links">
        <a href="/shadow" className="nav-pill">
          <img src="/Bolt.svg" alt="" className="nav-ic" />
          Entraînement
        </a>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/Racket.svg" alt="" className="nav-ic" />
          Matériel
          <span className="tooltip">Bientôt disponible</span>
        </span>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/Partner.svg" alt="" className="nav-ic" />
          Partenaires
          <span className="tooltip">Bientôt disponible</span>
        </span>

        <span className="nav-pill is-soon" aria-disabled="true">
          <img src="/Shop.svg" alt="" className="nav-ic" />
          Boutique
          <span className="tooltip">Bientôt disponible</span>
        </span>
      </nav>

      <button className="nav-pill is-soon" aria-disabled="true">
        <img src="/Login.svg" alt="" className="nav-ic" />
        Se connecter
        <span className="tooltip">Bientôt disponible</span>
      </button>
    </header>
  );
}