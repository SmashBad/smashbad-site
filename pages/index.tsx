import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Head>
        <title>SMASH.bad — Votre partenaire de badminton</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Polices (tu pourras les déplacer plus tard dans _document si besoin) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Audiowide&family=Outfit:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Header />

      <main className="container">
        <p className="kicker">Bienvenue sur SMASH</p>
        <h1 style={{ fontFamily: "Audiowide, Outfit, sans-serif", margin: "0 0 8px" }}>
          Votre partenaire <span className="accent">badminton</span>
        </h1>
        <p className="lead">
          Des outils clairs pour t’entraîner mieux, t’équiper intelligemment et (bientôt) trouver des partenaires de tournoi.
        </p>
      </main>

      <Footer />
    </>
  );
}