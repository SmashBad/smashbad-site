// pages/AskContact.tsx
import Head from "next/head";
import BackPill from "../components/BackPill";

const AIRTABLE_FORM_URL =
  "https://airtable.com/embed/appkxlroj23rDP2Ep/pagYIt0nbUloCXCSd/form";

export default function ContactPage() {
  return (
    <>
        <section className="sb-section">
            <div className="sb-container">
            <BackPill href="/" label="Retour à l’accueil" />

            <div className="sb-card-embed">
                <iframe
                    src={AIRTABLE_FORM_URL}
                    className="sb-iframe"
                    title="Formulaire de contact Airtable"
                    loading="lazy"
                    />
            </div>
            </div>

        </section>
    </>
  );
}
