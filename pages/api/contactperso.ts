// pages/api/contactperso.ts
import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

const {
  CONTACT_TO,           // ex: "contact@smash.bad"
  CONTACT_FROM,         // ex: "no-reply@smash.bad"
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: Number(SMTP_PORT) === 465,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { firstName, email, message, website } = req.body || {};

    // bot trap
    if (website) return res.status(200).json({ ok: true });

    if (!firstName || !email || !message) {
      return res.status(400).json({ error: "Champs requis manquants." });
    }

    const html = `
      <h2>Nouveau message de contact</h2>
      <p><b>Prénom :</b> ${escapeHtml(firstName)}</p>
      <p><b>Email :</b> ${escapeHtml(email)}</p>
      <p><b>Message :</b><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
    `;

    await transporter.sendMail({
      to: CONTACT_TO,
      from: CONTACT_FROM || CONTACT_TO,
      replyTo: email,
      subject: `Contact SMASH.bad — ${firstName}`,
      html,
    });

    res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: "Impossible d’envoyer le message." });
  }
}

// --- petite util ---
function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
