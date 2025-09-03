import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { firstName, email, message, website } = req.body || {};

  // Anti-bot (honeypot)
  if (website) return res.status(200).json({ ok: true });

  if (!firstName || !email || !message) {
    return res.status(400).json({ error: "Champs requis manquants." });
  }

  try {
    const payload = {
      from: "SMASH.bad <onboarding@resend.dev>", // ok tant que ton domaine n'est pas vérifié
      to: [process.env.CONTACT_TO!],             // ex. "smashbad.contact@gmail.com"
      reply_to: email,                           // pour répondre direct au visiteur
      subject: `Contact SMASH.bad — ${firstName}`,
      html: `
        <h2>Nouveau message</h2>
        <p><b>Prénom :</b> ${escapeHtml(firstName)}</p>
        <p><b>Email :</b> ${escapeHtml(email)}</p>
        <p><b>Message :</b><br/>${escapeHtml(message).replace(/\n/g,"<br/>")}</p>
      `,
    };

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return res.status(500).json({ error: `Erreur Resend ${r.status} ${txt}` });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "Impossible d’envoyer le message." });
  }
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
