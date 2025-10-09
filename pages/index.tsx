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
          <div className="hero-split__text">
            <p className="kicker">Bienvenue sur SMASH</p>
            <h1>
              Ton partenaire
              <br />
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
        </section>

        <hr className="divider" />

        {/* FEATURE 1 — SHADOW */}
        <section className="feature-block feature-shadow">
          <div className="feature-block__media">
            <img
              src="/hero/Hero_Shadow.png"
              alt="Shadow — entraînement déplacements"
            />
          </div>

          <div className="feature-block__content">
            <h2>
              <span className="accent">Shadow</span>
            </h2>
            <p className="feature-lead">
              Pose ton téléphone, suis les indications et travaille
              tes déplacements à ton rythme.
            </p>
            <Link href="/shadow" className="btn btn-primary">
              Lancer l’entraînement
            </Link>
          </div>
        </section>

        <hr className="divider" />

        {/* FEATURE 2 — MATERIEL */}
        <section className="feature-block feature-racket feature-block--reverse">
          <div className="feature-block__media">
            <img
              src="/hero/Hero_Racket.png"
              alt="Choisir sa raquette"
            />
          </div>

          <div className="feature-block__content">
            <h2>
              Choisir son <span className="accent">matériel</span>
            </h2>
            <p className="feature-lead">
              Catalogue, comparateur, conseils : trouve la raquette
              qui correspond à ton style de jeu.
            </p>

            {/* Pas encore disponible : bouton neutre/disabled */}
            <button className="btn btn-disabled" aria-disabled>
              Bientôt disponible
            </button>
          </div>
        </section>

        <hr className="divider" />

        {/* FEATURE 3 — PARTENAIRES */}
        <section className="feature-block feature-partner">
          <div className="feature-block__media">
            <img
              src="/hero/Hero_Partner.png"
              alt="Trouver un partenaire de tournoi"
            />
          </div>

          <div className="feature-block__content">
            <h2>
              Trouver un <span className="accent">partenaire</span>
            </h2>
            <p className="feature-lead">
              Publie une annonce, réponds à celles des autres et ne
              joue plus jamais un tournoi seul.
            </p>
            <Link href="/partenaires" className="btn btn-primary">
              Consulter les annonces
            </Link>
          </div>
        </section>

        <hr className="divider" />

        {/* FEATURE 4 — BOUTIQUE */}
        <section className="feature-block feature-shop feature-block--reverse">
          <div className="feature-block__media">
            <img
              src="/hero/Hero_Shop.png"
              alt="Boutique SMASH"
            />
          </div>

          <div className="feature-block__content">
            <h2>
              <span className="accent">Boutique</span>
            </h2>
            <p className="feature-lead">
              Des produits simples et stylés pour porter les couleurs
              de SMASH au quotidien.
            </p>

            {/* Pas encore disponible */}
            <button className="btn btn-disabled" aria-disabled>
              Bientôt disponible
            </button>
          </div>
        </section>

        <hr className="divider" />

        {/* SUMMARY / PITCH FINAL */}
        <section className="cta-summary">
          <h3>Pourquoi SMASH.bad&nbsp;?</h3>
          <p>
            Pensé par des joueurs, pour les joueurs. Un assistant simple
            et efficace pour t’entraîner, choisir ton matériel et trouver
            ton binôme de tournoi.
          </p>
          <div className="cta-summary__actions">
            <Link href="/shadow" className="btn btn-primary">
              Essayer le Shadow
            </Link>
            <Link href="/rester-informe" className="btn btn-ghost">
              Être prévenu des nouveautés
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}

