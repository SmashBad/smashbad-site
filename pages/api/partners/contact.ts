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
    const subject = `Contact — ${parsed.first_name} pour « ${adRec.tournoi} »`;
    const html = `
      <div style="font-family:Outfit,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;color:#0b1623">
        <p><strong>${esc(parsed.first_name)} ${esc(parsed.last_name)}</strong> te contacte pour « ${esc(adRec.tournoi)} »${adRec.ville ? ` à ${esc(adRec.ville)}` : ""}${adRec.date ? ` (${new Date(adRec.date).toLocaleDateString("fr-FR")})` : ""}.</p>
        <p>${esc(parsed.ranking)}${parsed.sex ? ` • ${parsed.sex === "H" ? "homme" : "femme"}` : ""}${parsed.age ? ` • ${parsed.age} ans` : ""}</p>
        ${parsed.message ? `<p style="white-space:pre-line">${esc(parsed.message)}</p>` : ""}
        <p>Réponds à <a href="mailto:${parsed.email}">${parsed.email}</a>${parsed.phone ? ` ou au <a href="tel:${parsed.phone}">${parsed.phone}</a>` : ""}.</p>
      </div>
    `;
    const text = `${parsed.first_name} ${parsed.last_name} te contacte pour "${adRec.tournoi}". ` +
                `${parsed.ranking}` + (parsed.sex ? ` • ${parsed.sex === "H" ? "homme" : "femme"}` : "") +
                (parsed.age ? ` • ${parsed.age} ans` : "") + `. ` +
                (parsed.message ? `\n\n${parsed.message}\n\n` : ``) +
                `Email: ${parsed.email}` + (parsed.phone ? ` • Tel: ${parsed.phone}` : ``);


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
      return res.status(400).json({ error: "Bad Request", issues: err.issues });
    }
    const msg = err?.message || "Server error";
    console.error("partners.contact error:", msg);
    // En DEV, on expose le détail pour déboguer depuis l’onglet Network
    if (process.env.NODE_ENV !== "production") {
      return res.status(500).json({ error: "Server error", detail: msg });
    }
    return res.status(500).json({ error: "Server error" });
  }

}

// petite util pour éviter l’injection dans l’email HTML
function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}