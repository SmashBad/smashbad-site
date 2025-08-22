import Head from "next/head";
import Header from "../components/header";

export default function Home() {
  return (
    <>
      <Head>
        <title>SMASH.bad — Votre partenaire de badminton</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Audiowide&family=Outfit:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Header />

      <main>
        {/* Mini placeholder pour valider le rendu. 
            On remplacera ensuite par ton vrai hero. */}
        <section className="hero-split">
          <div className="hero-split__text">
            <p className="kicker">Bienvenue sur SMASH</p>
            <h1>Votre partenaire <span className="accent">Badminton</span></h1>
            <p className="lead">
              Des outils clairs pour t’entraîner mieux, t’équiper intelligemment
              et (bientôt) trouver des partenaires de tournoi.
            </p>
          </div>
          <div className="hero-split__art">
            <img src="/public/hero.png" alt="" />
          </div>
        </section>
      </main>
    </>
  );
}
