// pages/AskContact.tsx
import Head from "next/head";

const AIRTABLE_FORM_URL =
  "https://airtable.com/embed/appkxlroj23rDP2Ep/pagYIt0nbUloCXCSd/form";

export default function ContactPage() {
  return (
    <>
        <section className="sb-section">
            <div className="sb-container">

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
