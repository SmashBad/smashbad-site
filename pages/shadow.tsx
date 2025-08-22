import Head from "next/head";
import Header from "../components/header";

export default function Shadow() {
  return (
    <>
      <Head>
        <title>SMASH — Shadow</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      <main style={{ padding: "40px 5%" }}>
        <h1 style={{ fontFamily: "Audiowide, Outfit, sans-serif", marginBottom: 8 }}>
          Shadow
        </h1>
        <p className="lead" style={{ marginBottom: 16 }}>
          La version Next.js arrive. En attendant, utilise la version existante :
        </p>
        <p><a className="nav-pill" href="/shadow.html">Ouvrir l’exercice Shadow</a></p>
      </main>
    </>
  );
}
