// pages/index.tsx
import React from "react";
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";
import DeviceTest from "../components/DeviceTest";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>SMASH.bad — Ton partenaire badminton</title>
        <meta
          name="description"
          content="Progresse, équipe-toi, joue : SMASH.bad t'accompagne sur et en dehors des terrains."
        />
      </Head>

      <main className="home-main">

        {/* HERO */}
        <section className="hero-split">
          <div className="container hero-split__inner">
            <div className="hero-split__text">
              <p className="kicker">Bienvenue sur SMASH</p>
              <h1>
                Ton partenaire <br />
                <span className="accent">Badminton</span>
              </h1>
              <p className="lead">
                Progresser, s’équiper, jouer : ce qu’il te faut pour vivre
                le badminton à fond.
              </p>

              <div className="hero-actions">
                <Link href="/shadow" className="btn btn-primary">
                  Commencer l’entraînement
                </Link>
                <Link href="/rester-informe" className="btn btn-ghost">
                  Rester informé
                </Link>
              </div>
            </div>

            <div className="hero-split__art">
              <img src="/hero.png" alt="Illustration SMASH.bad" />
            </div>
          </div>
        </section>

        {/* FEATURE 1 — SHADOW */}
        <section className="feature-row">
          <div className="container">
            <div className="feature-card">
              <div className="feature-grid">
                <div className="feature-media">
                  <img src="/hero/Hero_Shadow.png" alt="Shadow" />
                </div>
                <div className="feature-content">
                  <h2><span className="accent">Shadow</span></h2>
                  <p className="feature-lead">
                    Pose ton téléphone et suis les indications pour travailler
                    tes déplacements.
                  </p>
                  <Link href="/shadow" className="btn btn-primary">
                    Lancer l’entraînement
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE 2 — MATERIEL (image à droite) */}
        <section className="feature-row">
          <div className="container">
            <div className="feature-card">
              <div className="feature-grid feature-grid--reverse">
                <div className="feature-media">
                  <img src="/hero/Hero_Racket.png" alt="Choisir son matériel" />
                </div>
                <div className="feature-content">
                  <h2>Choisir son <span className="accent">matériel</span></h2>
                  <p className="feature-lead">
                    Catalogue, comparateur et conseils pour trouver la raquette qui te correspond.
                  </p>
                  <button className="btn btn-disabled" aria-disabled>Bientôt disponible</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE 3 — PARTENAIRES */}
        <section className="feature-row">
          <div className="container">
            <div className="feature-card">
              <div className="feature-grid">
                <div className="feature-media">
                  <img src="/hero/Hero_Partner.png" alt="Trouver un partenaire" />
                </div>
                <div className="feature-content">
                  <h2>Trouver un <span className="accent">partenaire</span></h2>
                  <p className="feature-lead">
                    Publie une annonce ou réponds à celles des autres pour ne plus jouer seul.
                  </p>
                  <Link href="/partenaires" className="btn btn-primary">
                    Consulter les annonces
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE 4 — BOUTIQUE (image à droite) */}
        <section className="feature-row">
          <div className="container">
            <div className="feature-card">
              <div className="feature-grid feature-grid--reverse">
                <div className="feature-media">
                  <img src="/hero/Hero_Shop.png" alt="Boutique SMASH" />
                </div>
                <div className="feature-content">
                  <h2><span className="accent">Boutique</span></h2>
                  <p className="feature-lead">
                    Des produits simples et stylés pour porter les couleurs de SMASH.
                  </p>
                  <button className="btn btn-disabled" aria-disabled>Bientôt disponible</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUMMARY */}
        <section className="cta-summary">
          <div className="container cta-summary__inner">
            <h3>Pourquoi SMASH.bad&nbsp;?</h3>
            <p>
              Pensé par des joueurs, pour les joueurs. Un assistant simple et efficace
              pour t’entraîner, choisir ton matériel et trouver ton binôme de tournoi.
            </p>
            <div className="cta-summary__actions">
              <Link href="/shadow" className="btn btn-primary">Essayer le Shadow</Link>
              <Link href="/rester-informe" className="btn btn-ghost">Être prévenu des nouveautés</Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}