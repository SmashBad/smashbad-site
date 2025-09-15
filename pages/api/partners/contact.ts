import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { Resend } from "resend";
import { getAdById, createResponse } from "../../../lib/data/airtable_annonces_partenaires";

// Schéma unique – on autorise sex optionnel, age optionnel
const ContactSchema = z.object({
  ad: z.string().min(3, "id d'annonce manquant"),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  sex: z.enum(["H", "F"]).optional(),
  age: z.number().int().positive().max(120).optional(),
  ranking: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  hp: z.string().optional(), // honeypot
});

const resend = new Resend(process.env.RESEND_API_KEY || "");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const raw = req.body || {};

    // 🔧 Compat : accepte adId / ad_id / camelCase
    const ad = raw.ad ?? raw.adId ?? raw.ad_id;

    // 🔧 Coercions douces
    const payload = {
      ad,
      first_name: raw.first_name ?? raw.firstName,
      last_name:  raw.last_name  ?? raw.lastName,
      sex:        raw.sex || undefined,
      age:        raw.age === "" || raw.age == null ? undefined : Number(raw.age),
      ranking:    raw.ranking ?? raw.rank,
      email:      raw.email,
      phone:      raw.phone || undefined,
      message:    raw.message || undefined,
      hp:         raw.hp || undefined,
    };

    if (payload.hp) return res.status(200).json({ ok: true, spam: true });

    const parsed = ContactSchema.parse(payload);

    // 1) Récupère l'annonce
    const adRec = await getAdById(parsed.ad);
    if (!adRec) return res.status(404).json({ error: "Annonce introuvable" });
    if (!adRec.contact_email) return res.status(400).json({ error: "Annonce sans email de contact" });

    // 2) Enregistre la réponse (ta table a bien sex + age)
    await createResponse({
      ad: parsed.ad,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      sex: parsed.sex,
      age: parsed.age,
      ranking: parsed.ranking,
      email: parsed.email,
      phone: parsed.phone,
      message: parsed.message,
      status: "Nouveau",
    });

    // 3) Email (texte naturel v1)
    const subject = `🎯 ${parsed.first_name} te contacte pour ${adRec.tournoi}`;
    const html = `
      <div style="font-family:Outfit,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;color:#0b1623">
        <p>Bonjour,</p>
        <p><strong>${escapeHtml(parsed.first_name)} ${escapeHtml(parsed.last_name)}</strong> souhaite te contacter pour ton annonce
        <strong>« ${escapeHtml(adRec.tournoi ?? "")} »</strong>${adRec.ville ? ` à ${escapeHtml(adRec.ville)}` : ""}${adRec.date ? ` (le ${new Date(adRec.date).toLocaleDateString("fr-FR")})` : ""}.</p>
        <p><strong>Classement :</strong> ${escapeHtml(parsed.ranking)}${
          parsed.sex ? ` &nbsp;•&nbsp; <strong>Sexe :</strong> ${parsed.sex === "H" ? "homme" : "femme"}` : ""
        }${parsed.age ? ` &nbsp;•&nbsp; <strong>Âge :</strong> ${parsed.age}` : ""}</p>
        ${parsed.message ? `<p style="white-space:pre-line">${escapeHtml(parsed.message)}</p>` : ""}
        <p>Réponds-lui sur <a href="mailto:${parsed.email}">${parsed.email}</a>${parsed.phone ? ` ou au <a href="tel:${parsed.phone}">${parsed.phone}</a>` : ""}.</p>
        <hr style="border:none;border-top:1px solid #e3eef6;margin:18px 0" />
        <p style="font-size:14px;opacity:.7">Annonce ${escapeHtml(adRec.id || "")}${adRec.tableau ? ` • ${escapeHtml(adRec.tableau)}` : ""}${adRec.classement ? ` • ${escapeHtml(adRec.classement)}` : ""}</p>
      </div>
    `;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.MAIL_FROM || "Smash.bad <onboarding@resend.dev>",
        to: adRec.contact_email,
        reply_to: parsed.email, // l’auteur clique "Répondre" → répond au contactant
        subject,
        html,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      // aide debug (visible dans logs Vercel)
      console.error("partners.contact Zod issues:", err.issues);
      return res.status(400).json({ error: "Bad Request", issues: err.issues });
    }
    console.error("partners.contact error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// petite util pour éviter l’injection dans l’email HTML
function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}