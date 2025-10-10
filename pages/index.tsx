// pages/index.tsx
import React from "react";
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";
import DeviceTest from "../components/DeviceTest";
import Link from "next/link";
import useViewMode from "components/hooks/useViewMode";

export default function Home() {
  const mode = useViewMode();
  return (
    <>
      <Head>
        <title>SMASH.bad — Ton partenaire badminton</title>
        <meta name="description" content="Progresse, équipe-toi, joue." />
      </Head>

      <main className={`home-main view-${mode}`}>
        {/* HERO PRINCIPAL (traitement à part) */}
        <section className="hero-split">
          <div className="container hero-split__grid">
            <div className="hero-split__text">
              <p className="kicker">Bienvenue sur SMASH</p>
              <h1>
                Ton partenaire <br />
                <span className="accent">Badminton</span>
              </h1>
              <p className="lead">
                Progresser, s’équiper, jouer : ce qu’il te faut pour vivre le badminton à fond.
              </p>
              <div className="hero-actions">
                <Link href="/shadow" className="btn btn-primary">Commencer l’entraînement</Link>
                <Link href="/rester-informe" className="btn btn-ghost">Rester informé</Link>
              </div>
            </div>
            <div className="hero-split__art">
              <img src="/hero.png" alt="Illustration SMASH.bad" />
            </div>
          </div>
        </section>


        {/* 4 BLOCS FONCTIONNALITÉS — largeur 70% de la fenêtre */}


        {/* SHADOW – image à gauche, texte à droite */}
        <section className="section section-left">
          <div className="section__media image-left">
            <img src="/hero/Hero_Shadow.png" alt="Shadow" />
          </div>
          <div className="section__content text-right">
            <h2><span className="accent">Shadow</span></h2>
            <p className="section__lead">Pose ton téléphone et suis les indications pour travailler tes déplacements.</p>
            <Link href="/shadow" className="btn btn-primary">Lancer l’entraînement</Link>
          </div>
        </section>

        {/* MATÉRIEL – image à droite, texte à gauche */}
        <section className="section section-right">
          <div className="section__content text-left">
            <h2>Choisir son <span className="accent">matériel</span></h2>
            <p className="section__lead">Catalogue, comparateur et conseils pour trouver la raquette qui te correspond.</p>
            <button className="btn btn-disabled" aria-disabled>Bientôt disponible</button>
          </div>
          <div className="section__media image-right">
            <img src="/hero/Hero_Racket.png" alt="Choisir son matériel" />
          </div>
        </section>

        {/* PARTENAIRES – image à gauche, texte à droite */}
        <section className="section section-left">
          <div className="section__media image-left">
            <img src="/hero/Hero_Partner.png" alt="Trouver un partenaire" />
          </div>
          <div className="section__content text-right">
            <h2>Trouver un <span className="accent">partenaire</span></h2>
            <p className="section__lead">Publie une annonce ou réponds à celles des autres pour ne plus jouer seul.</p>
            <Link href="/partenaires" className="btn btn-primary">Consulter les annonces</Link>
          </div>
        </section>

        {/* BOUTIQUE – image à droite, texte à gauche */}
        <section className="section section-right">
          <div className="section__content text-left">
            <h2><span className="accent">Boutique</span></h2>
            <p className="section__lead">Des produits simples et stylés pour porter les couleurs de SMASH.</p>
            <button className="btn btn-disabled" aria-disabled>Bientôt disponible</button>
          </div>
          <div className="section__media image-right">
            <img src="/hero/Hero_Shop.png" alt="Boutique SMASH" />
          </div>
        </section>



        {/* SUMMARY FINAL */}
        <section className="cta-summary">
          <div className="container">
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