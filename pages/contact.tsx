// pages/contact.tsx
import { useState } from "react";
import Head from "next/head";

type State = "idle" | "sending" | "sent" | "error";

export default function Contact() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
      // simple honeypot anti-bot
      website: (form.elements.namedItem("website") as HTMLInputElement).value || "",
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setState("sent");
      (form as HTMLFormElement).reset();
    } else {
      const j = await res.json().catch(() => ({} as any));
      setError(j?.error || "Une erreur est survenue.");
      setState("error");
    }
  }

  return (
    <>
      <Head><title>SMASH — Contact</title></Head>

      <section className="sb-section">
        <div className="sb-container" role="form" aria-labelledby="contact-title">
          <h1 id="contact-title" className="sb-h1">Contact</h1>
          <p className="sb-sub">
            Un bug à signaler, une idée d’amélioration, une question ? Écris-nous.
          </p>

          <form className="sb-form" onSubmit={onSubmit} noValidate>
            {/* Honeypot caché pour bots */}
            <input type="text" name="website" className="hp" tabIndex={-1} autoComplete="off" />

            <div className="sb-grid">
              <label className="sb-field">
                <span>Prénom</span>
                <input name="firstName" type="text" required placeholder="Ex. Simon" />
              </label>

              <label className="sb-field">
                <span>Email</span>
                <input name="email" type="email" required placeholder="Ex. simon@email.fr" />
              </label>
            </div>

            <label className="sb-field">
              <span>Message</span>
              <textarea name="message" rows={6} required placeholder="Dis-nous tout…" />
            </label>

            <div className="sb-actions">
              <button
                className="btn btn--ghost"
                type="submit"
                disabled={state === "sending"}
                aria-busy={state === "sending"}
              >
                {state === "sending" ? "Envoi…" : "Envoyer"}
              </button>
              {state === "sent" && <span className="sb-ok" role="status">Message envoyé ✅</span>}
              {state === "error" && <span className="sb-err" role="alert">{error}</span>}
            </div>

            <p className="sb-legal">
              En envoyant ce message, tu acceptes d’être recontacté par e-mail.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
