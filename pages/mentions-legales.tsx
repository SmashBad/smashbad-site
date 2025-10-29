// pages/mentions-legales.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MentionsLegales() {
  const lastUpdate = "29 octobre 2025"; // Mets à jour si besoin

  return (
    <>
      <Head>
        <title>Mentions légales — SMASH.bad</title>
        <meta
          name="description"
          content="Mentions légales de SMASH.bad : éditeur, hébergeur, données personnelles (RGPD), droit applicable."
        />
        <link rel="canonical" href="https://smashbad.fr/mentions-legales" />
        <meta name="robots" content="index,follow" />
      </Head>

      <Header />

      <main className="sb-container sb-section" aria-labelledby="page-title">
        <header className="topbar" style={{ marginBottom: 18 }}>
          <div className="topbar__grid">
            <div />
            <h1 id="page-title" className="sb-h1 topbar__title">Mentions légales</h1>
            <div />
          </div>
          <p className="muted" style={{ textAlign: "center", marginTop: 6 }}>
            Dernière mise à jour : {lastUpdate}
          </p>
        </header>

        <article className="legal-wrapper">
          <section>
            <h2>Éditeur</h2>
            <p>
              <strong>SMASH</strong><br />
              Micro-entreprise — SIRET : <strong>99231294200012</strong><br />
              Courriel : <a href="mailto:smashbad.contact@gmail.com">smashbad.contact@gmail.com</a>
            </p>
          </section>

          <section>
            <h2>Responsable de la publication</h2>
            <p><strong>SMASH</strong></p>
          </section>

          <section>
            <h2>Hébergement</h2>
            <p>
              Site hébergé par <strong>Vercel Inc.</strong><br />
              440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{" "}
              <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>
            </p>
          </section>

          <section>
            <h2>Données personnelles</h2>
            <p>
              Les informations collectées (adresse e-mail) servent exclusivement à informer des
              actualités de <strong>SMASH.bad</strong>. Aucune revente ni partage à des tiers.
              Vous pouvez exercer vos droits (accès, rectification, suppression) à l’adresse :
              <a href="mailto:smashbad.contact@gmail.com"> smashbad.contact@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2>Droit applicable</h2>
            <p>Le présent site est soumis au <strong>droit français</strong>.</p>
          </section>
        </article>
      </main>

      <Footer />

      <style jsx>{`
        .legal-wrapper { max-width: 860px; margin: 0 auto; }
        .legal-wrapper h2 { margin-top: 22px; margin-bottom: 8px; }
        .legal-wrapper p { line-height: 1.65; margin: 0 0 12px 0; }
        .muted { opacity: 0.8; font-size: 0.95rem; }

        /* Fallback si les variables CSS ne sont pas chargées */
        :global(body) { background: var(--sb-bg, #010b2e); color: var(--sb-fg, #f5f7fb); }
        :global(a) { text-decoration: underline; }
      `}</style>
    </>
  );
}
