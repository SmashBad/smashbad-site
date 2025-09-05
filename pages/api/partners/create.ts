// pages/api/partners/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PartnerAdCreateSchema } from "../../../schemas/partners";
import { createPartnerAd } from "../../../lib/data/airtable_annonces_partenaires";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const parsed = PartnerAdCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation error", details: parsed.error.flatten() });
    }

    const data = parsed.data;

    // Anti-spam (champ caché)
    if (data.hp && data.hp.trim() !== "") {
      return res.status(200).json({ ok: true }); // on fait mine d’accepter sans rien faire
    }

    // Normalise recherche_classement en tableau (schema le fait déjà, mais on force la forme)
    const searchCls = Array.isArray(data.recherche_classement) ? data.recherche_classement : [];

    await createPartnerAd({
      tournoi: data.tournoi,
      ville: data.ville,
      dept: data.dept,
      date_text: data.date_text,
      tableau: data.tableau,
      sexe: data.sexe,
      classement: data.classement,
      age: data.age_ok ? data.age : undefined,       // si age_ok=false on n’envoie pas l’âge
      age_ok: data.age_ok,
      recherche_sexe: data.recherche_sexe,
      recherche_classement: searchCls,
      email: data.email,
      message: data.message,
    });

    return res.status(201).json({ ok: true });
  } catch (e: any) {
    console.error("partners/create error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
