// pages/contact.tsx
import Head from "next/head";

const AIRTABLE_FORM_URL =
  "https://airtable.com/embed/appErxcur9vTL9X8t/paggdZiHNRGqOeORz/form";

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact — SMASH.bad</title>
        <meta
          name="description"
          content="Laisse ton email pour être informé et, si tu veux, devenir testeur des outils SMASH."
        />
      </Head>

      <div className="sb-contact">
        <div className="sb-contact-container">
          <h1>Rester informé & devenir testeur</h1>
          <p>
            Laisse ton contact pour recevoir les nouveautés (zéro spam). Tu peux
            aussi cocher l’option « testeur » pour essayer les outils en avant-première.
          </p>

          <div className="sb-formFrame">
            <iframe
              src={AIRTABLE_FORM_URL}
              className="sb-iframe"
              loading="lazy"
              title="Formulaire de contact Airtable"
            />
          </div>
        </div>
      </div>
    </>
  );
}
