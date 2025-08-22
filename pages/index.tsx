import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Head>
        <title>SMASH.bad — Votre partenaire</title><br><span class="accent">Badminton</span>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Polices (on pourra déplacer dans _document plus tard) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Audiowide&family=Outfit:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Header />

      <main className="hero">
        <section className="hero__grid">
          <div className="hero__text">
            <span className="kicker">Bienvenue sur SMASH</span>
            <h1 className="hero__title">
              Votre partenaire <span className="accent">badminton</span>
            </h1>
            <p className="lead hero__lead">
              Entraînement, matériel, partenaires&nbsp;: tout ce qu’il te faut
              pour vivre le badminton à fond — simplement et sans blabla.
            </p>

            {/* CTA unique et discret (la nav contient déjà les entrées) */}
            <div className="hero__cta">
              <a href="/shadow" className="cta-primary">
                <img src="/assets/Bolt.svg" alt="" className="nav-ic" />
                Commencer l’entraînement
              </a>
            </div>
          </div>

          {/* Logo (ou illustration) en grand côté droit */}
          <div className="hero__art">
            {/* Utilise ton logo (ou illustration) déposée dans /public */}
            <img
              src="/logo.png"
              alt="Logo SMASH"
              className="hero__mark"
              loading="eager"
              decoding="async"
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
