import type { NextApiRequest, NextApiResponse } from "next";
import { AdCreateSchema, AdCreate } from "../../../schemas/partners";
import { airPost } from "../../../lib/data/airtable_annonces_partenaires"; // ou ta fonction existante

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const parsed = AdCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  const data: AdCreate = parsed.data;

  // protection honeypot
  if (data.hp) return res.status(200).json({ ok: true }); // on fait comme si c’était OK

  // mapping vers Airtable (champ -> colonne)
  const fields: Record<string, any> = {
    "Titre": data.titre || data.tournoi,
    "Tournoi": data.tournoi,
    "Ville": data.ville,
    "Département": data.dept,
    "Date": data.dateText || "",

    "Sexe": data.sexe || "",
    "Classement": data.classement || "",
    "Tableau": data.tableau || "",

    "Recherche Sexe": data.rechercheSexe || "",
    "Recherche Classement": Array.isArray(data.rechercheClassement)
      ? data.rechercheClassement
      : (data.rechercheClassement ? data.rechercheClassement.split(/[,\s;/]+/) : []),

    "Contact (e-mail)": data.email,

    "Âge": data.age ?? null,
    "Âge_Ok": !!data.age_ok,

    "Statut": data.statut || "Actif",
    "Validée": !!data.valider,  // tu valideras manuellement plus tard, ici par défaut false
    "Créé le": new Date().toISOString(),
  };

  try {
    await airPost(encodeURIComponent(process.env.AIRTABLE_PARTNERS_ADS || "Partenaires_Annonces"), {
      records: [{ fields }],
    });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Airtable error" });
  }
}
