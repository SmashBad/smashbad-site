// pages/api/partners/contact.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { createContactRequest, getAdForContact } from "../../../lib/data/airtable_annonces_partenaires";

const ContactSchema = z.object({
  ad_id: z.string().min(5),            // Airtable recordId de l’annonce contactée
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  sex: z.string().optional(),
  ranking: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  hp: z.string().optional(),           // honeypot
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  try {
    const data = ContactSchema.parse(req.body || {});
    if (data.hp) return res.status(200).json({ ok: true, spam: true });

    // récup auteur (optionnel si tu n’envoies pas encore d’e-mail)
    const { authorEmail, authorName } = await getAdForContact(data.ad_id);

    // log en base
    await createContactRequest({
      adRecordId: data.ad_id,
      first_name: data.first_name,
      last_name: data.last_name,
      sex: data.sex,
      ranking: data.ranking,
      email: data.email,
      phone: data.phone,
      message: data.message,
    });

    // (envoi mail plus tard)
    return res.status(200).json({ ok: true, sent: !!authorEmail, to: authorEmail, authorName });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "Bad Request", issues: err.issues });
    }
    console.error("partners.contact error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
