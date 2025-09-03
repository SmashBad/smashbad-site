// app/contact/page.tsx
"use client";

import { useState } from "react";

export default function ContactPage() {
  const [state, setState] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setMsg("");

    const form = new FormData(e.currentTarget);
    const payload = {
      prenom: String(form.get("prenom") || "").trim(),
      email: String(form.get("email") || "").trim(),
      message: String(form.get("message") || "").trim(),
      // anti-bot
      website: String(form.get("website") || ""), 
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setState("success");
      setMsg("Message envoyé ✅ Merci ! Je reviens vers toi rapidement.");
      (e.currentTarget as HTMLFormElement).reset();
    } else {
      const data = await res.json().catch(() => ({}));
      setState("error");
      setMsg(data?.error || "Un problème est survenu. Réessaie plus tard.");
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-2">Contact</h1>
      <p className="text-sm text-gray-600 mb-6">
        Signaler un bug, proposer une idée, poser une question.
      </p>

      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-1">
          <label htmlFor="prenom" className="text-sm">Prénom</label>
          <input
            id="prenom" name="prenom" type="text" required
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="Votre prénom"
          />
        </div>

        <div className="grid gap-1">
          <label htmlFor="email" className="text-sm">Email</label>
          <input
            id="email" name="email" type="email" required
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="votre@email.com"
          />
        </div>

        <div className="grid gap-1">
          <label htmlFor="message" className="text-sm">Message</label>
          <textarea
            id="message" name="message" required rows={6}
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="Écrivez votre message…"
          />
        </div>

        {/* Champ anti-bot (ne pas remplir) */}
        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

        <button
          type="submit"
          disabled={state === "loading"}
          className="rounded-xl px-4 py-2 border shadow-sm hover:shadow disabled:opacity-60"
        >
          {state === "loading" ? "Envoi…" : "Envoyer"}
        </button>

        {msg && (
          <p className={state === "error" ? "text-red-600" : "text-green-700"}>{msg}</p>
        )}
      </form>
    </main>
  );
}
