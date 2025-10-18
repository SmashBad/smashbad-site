// pages/AskContact.tsx
import Head from "next/head";
import BackPill from "../components/BackPill";

const AIRTABLE_FORM_URL =
  "https://airtable.com/embed/appkxlroj23rDP2Ep/pagYIt0nbUloCXCSd/form";

export default function ContactPage() {
  return (
    <>
      <div className="topbar">
        <div className="topbar__grid">
          <div>
            <BackPill href="/" ariaLabel="Retour à l’accueil" />
          </div>
          <h1 className="sb-h1 topbar__title">Rester informé</h1>
          <div></div>
        </div>
      </div>

            <div className="sb-card-embed">
                <iframe
                    src={AIRTABLE_FORM_URL}
                    className="sb-iframe"
                    title="Formulaire de contact Airtable"
                    loading="lazy"
                    />
            </div>
    </>
  );
}
