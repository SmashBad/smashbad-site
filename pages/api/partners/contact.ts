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

// Instance Resend (import statique, plus simple)
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
      annonce_liee: raw.annonce_liee ?? raw.annonceLiee ?? undefined,
    };

    if (payload.hp) return res.status(200).json({ ok: true, spam: true });

    const parsed = ContactSchema.parse(payload);

    // 1) Récupère l'annonce
    const adRec = await getAdById(parsed.ad);
    if (!adRec) return res.status(404).json({ error: "Annonce introuvable" });
    if (!adRec.contact_email) return res.status(400).json({ error: "Annonce sans email de contact" });

    // récupère la valeur lisible de l’annonce à copier côté Réponses
    const annonce_liee = adRec.Ad_Id ?? null;

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
      annonce_liee: payload.annonce_liee, // ← AJOUT
    });

    // --- utils (échappement HTML simple)
    const esc = (s?: string) =>
      String(s ?? "")
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&#039;");

    // Données formatées
    const ownerFirstName = adRec.name ? esc(adRec.name) : null;
    const greet  = ownerFirstName ? `Bonjour ${ownerFirstName},` : "Bonjour,";

    const tournoi = esc(adRec.tournoi ?? "");
    const ville   = adRec.ville ? ` à ${esc(adRec.ville)}` : "";
    const dateLbl = adRec.date ? ` le ${new Date(adRec.date).toLocaleDateString("fr-FR")}` : "";

    const fullName = `${esc(parsed.first_name)} ${esc(parsed.last_name)}`;
    const ageLbl   = (typeof parsed.age === "number" && !Number.isNaN(parsed.age)) ? `${parsed.age} ans` : "non précisé";
    const sexLbl   = parsed.sex ? (parsed.sex === "H" ? "homme" : "femme") : "non précisé";

    const rappel = [
      tournoi || "",
      adRec.tableau ? esc(adRec.tableau) : "",
      adRec.classement ? esc(adRec.classement) : ""
    ].filter(Boolean).join(" - ");

    // Sujet
    const subject = `Contact — ${parsed.first_name} souhaite jouer « ${adRec.tournoi} »`;

    // -------- HTML (fidèle à ton modèle, commentaire inclus si présent)
    const html = `
      <div style="font-family:Outfit,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;color:#0b1623;line-height:1.5">
        <p>${greet}</p>

        <p><strong>${fullName}</strong> souhaite participer avec toi au tournoi <strong>${tournoi}</strong>${ville}${dateLbl}.</p>

        <p>Son classement : <strong>${esc(parsed.ranking)}</strong><br/>
        Son âge : <strong>${esc(ageLbl)}</strong><br/>
        Sexe : <strong>${esc(sexLbl)}</strong></p>

        ${parsed.message ? `
          <p><strong>${esc(parsed.first_name)}</strong> a également laissé un commentaire :</p>
          <p style="white-space:pre-line">${esc(parsed.message)}</p>
        ` : ""}

        <p>Tu es libre de contacter ${esc(parsed.first_name)} si tu le souhaites :</p>
        <ul>
          <li>Par mail : <a href="mailto:${parsed.email}">${parsed.email}</a></li>
          ${parsed.phone ? `<li>Par téléphone : <a href="tel:${esc(parsed.phone)}">${esc(parsed.phone)}</a></li>` : ""}
        </ul>

        <hr style="border:none;border-top:1px solid #e3eef6;margin:18px 0"/>

        <p><em>Rappel de ton annonce :</em><br/>${esc(rappel)}</p>

        <p style="margin-top:16px">Pour rappel, tes coordonnées ne sont pas exposées sur Smash.bad. C'est toi qui décide si tu souhaites contacter ${esc(parsed.first_name)}.</p>
      </div>
    `;

    // -------- Version texte (sans backslashes piégeux)
    const text = [
      `${greet}`,
      "",
      `${parsed.first_name} ${parsed.last_name} souhaite participer avec toi au tournoi "${adRec.tournoi}"${adRec.ville ? ` à ${adRec.ville}` : ""}${adRec.date ? ` le ${new Date(adRec.date).toLocaleDateString("fr-FR")}` : ""}.`,
      "",
      `Son classement : ${parsed.ranking}`,
      `Son âge : ${ageLbl}`,
      `Sexe : ${sexLbl}`,
      "",
      parsed.message ? `${parsed.first_name} a également laissé un commentaire :\n${parsed.message}\n` : "",
      `Tu es libre de contacter ${parsed.first_name} si tu le souhaites :`,
      `- Par mail : ${parsed.email}`,
      parsed.phone ? `- Par Téléphone : ${parsed.phone}` : "",
      "",
      "---",
      `Rappel de ton annonce : ${rappel}`,
      `Pour rappel, tes coordonnées ne sont pas exposées sur Smash.bad. C'est toi qui décide si tu souhaites contacter ${parsed.first_name}.`
    ].filter(Boolean).join("\n");

    // -------- ENVOI (protégé)
    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: process.env.MAIL_FROM || "Smash.bad <contact@mail.smashbad.fr>",
          to: adRec.contact_email,
          reply_to: parsed.email,
          subject,
          html,
          text,
        });
      } else {
        console.warn("RESEND_API_KEY absente → email non envoyé (normal en dev).");
      }
    } catch (mailErr) {
      console.error("Resend error:", mailErr);
      // on n'échoue pas la requête si l'email tombe
    }

    // Succès API
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "Bad Request", issues: err.issues });
    }
    const msg = err?.message || "Server error";
    console.error("partners.contact error:", msg);
    if (process.env.NODE_ENV !== "production") {
      return res.status(500).json({ error: "Server error", detail: msg });
    }
    return res.status(500).json({ error: "Server error" });
  }
}
