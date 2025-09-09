// pages/api/partners/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { createAd } from "../../../lib/data/airtable_annonces_partenaires";

const CreateAdSchema = z.object({
  // champs du formulaire
  tournoi: z.string().min(2),
  ville: z.string().min(1),
  dept_code: z.string().min(1),
  date: z.string().min(2),                 // texte pour l’instant
  tableau: z.string().min(1),
  sexe: z.string().min(1),
  classement: z.string().min(1),
  age: z.coerce.number().int().positive().max(120).optional(),
  age_masque: z.boolean().optional().default(false), // true = masquer l’affichage
  search_sex: z.string().min(1),
  search_ranking: z.array(z.string()).optional().default([]),
  contact_email: z.string().email(),
  name: z.string().min(1).optional(),      // prénom (privé)
  notes: z.string().optional(),
  // honeypot
  hp: z.string().optional(),
});

const s = (v: unknown) => (v ?? "").toString().trim();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const data = req.body || {};
    if (data.hp) return res.status(200).json({ ok: true, spam: true }); // honeypot

    const parsed = CreateAdSchema.parse(data);

    const fields: Record<string, any> = {
      tournoi: s(parsed.tournoi),
      ville: s(parsed.ville),
      dept_code: s(parsed.dept_code),
      date: s(parsed.date),
      tableau: s(parsed.tableau),

      sexe: s(parsed.sexe),
      classement: s(parsed.classement),
      age: parsed.age ?? undefined,
      age_masque: Boolean(parsed.age_masque),

      search_sex: s(parsed.search_sex),
      search_ranking: parsed.search_ranking,

      contact_email: s(parsed.contact_email),
      name: s(parsed.name || ""),
      notes: s(parsed.notes || ""),

      status: "Actif",
      is_validated: false, // tu coches ensuite manuellement
    };

    const created = await createAd(fields);
    return res.status(200).json({ ok: true, created });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "Bad Request", issues: err.issues });
    }
    console.error("partners.create error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
