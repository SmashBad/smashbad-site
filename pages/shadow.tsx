import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Shadow() {
  return (
    <>
      <Head>
        <title>SMASH — Shadow</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      <main className="container">
        <h1 style={{ fontFamily: "Audiowide, Outfit, sans-serif", marginBottom: 8 }}>
          Shadow
        </h1>
        <p className="lead">
          La version Next.js arrive très vite. En attendant, tu peux utiliser l’exercice existant si tu l’as encore en HTML.
        </p>
      </main>

      <Footer />
    </>
  );
}