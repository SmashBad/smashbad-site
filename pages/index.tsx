// pages/index.tsx
import React from "react";
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";

export default function Home() {
  return (
    <>
      <Head>
        <title>SMASH.bad — Votre partenaire de badminton</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Audiowide&family=Outfit:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <body className="home">
        {/* HEADER */}
        <Header />

        {/* HERO SPLIT */}
        <main>
          <section className="hero-split">
            <div className="hero-split__text">
              <p className="kicker">Bienvenue sur SMASH</p>
              <h1>
                Votre partenaire
                <br />
                <span className="accent">Badminton</span>
              </h1>
              <p className="lead">
                Progresser, s’équiper, jouer : tout ce qu’il te faut pour vivre
                le badminton à fond.
              </p>
            </div>

            <div className="hero-split__art">
              <img
                src="/hero.png"
                alt="SMASH"
              />
            </div>
          </section>
        </main>


export default function App({ Component, pageProps }) {
          return (
            <>
              <Component {...pageProps} />
              <BottomNav />
            </>
          )
        }

        {/* FOOTER */}
        <Footer />
      </body>
    </>
  );
}
