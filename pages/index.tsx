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

      <main style={{ padding: "40px 5%" }}>
        <h1 style={{ fontFamily: "Audiowide, Outfit, sans-serif", marginBottom: 8 }}>
          Accueil
        </h1>
        <p className="lead">Page Next.js opérationnelle ✅</p>
      </main>
    </>
  );
}
