// pages/api/partners/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { CreateAdSchema } from "../../../schemas/partners";
import { createAd } from "../../../lib/data/airtable_annonces_partenaires";

// util simple pour forcer string
const s = (v: unknown) => (v ?? "").toString().trim();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const data = req.body;
    // 1) anti-spam (honeypot)
    if (data?.hp) return res.status(200).json({ ok: true, spam: true });

    // 2) validation
    const parsed = CreateAdSchema.parse(data);

    // 3) mapping -> noms des colonnes Airtable
    const fields: Record<string, any> = {
      // Affichage public côté listing
      "Tournoi":               s(parsed.tournoi),
      "Ville":                 s(parsed.ville),
      "Département":           s(parsed.dept),
      "Date":                  s(parsed.date_text),           // texte simple pour l’instant
      "Tableau":               s(parsed.tableau),

      "Sexe":                  s(parsed.sexe),
      "Classement":            s(parsed.classement),
      "Âge":                   parsed.age ?? undefined,
      "Âge_Ok":                !!parsed.age_ok,               // checkbox : true -> affichable

      "Recherche Sexe":        s(parsed.recherche_sexe),
      "Recherche Classement":  parsed.recherche_classement,   // multi-select (ou texte multiple)

      "Contact (e-mail)":      s(parsed.email),
      "Notes":                 s(parsed.message),

      // modération par défaut
      "Statut":                "Actif",
      "Validée":               false,                         // tu coches manuellement ensuite
    };

    // 4) écriture Airtable
    const created = await createAd(fields);

    // 5) réponse
    return res.status(200).json({ ok: true, created });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "Bad Request", issues: err.issues });
    }
    console.error("partners.create error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
