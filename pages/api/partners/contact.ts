import type { NextApiRequest, NextApiResponse } from "next";
import { createContactRequest, getAdForContact } from "../../../lib/data/airtable_annonces_partenaires";
// import { sendMail } from "@/lib/mail/send"; // on branchera quand tu seras prêt

function isEmail(v: unknown){ return typeof v === "string" && /.+@.+\..+/.test(v); }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (process.env.PARTNERS_FEATURE_ENABLED !== "true") return res.status(404).end();
    if (req.method !== "POST") return res.status(405).end();

    const { adId, first_name, last_name, ranking, message, email, phone } = req.body || {};
    if (!adId || !first_name || !last_name || !isEmail(email)) {
      return res.status(400).json({ error: "invalid payload" });
    }

    await createContactRequest({ adId, first_name, last_name, ranking, message, email, phone });

    const { authorEmail, record } = await getAdForContact(adId);
    if (!authorEmail) return res.status(400).json({ error: "ad has no author email" });

    // Envoi mail réel à activer plus tard
    // await sendMail({ to: authorEmail, replyTo: email, subject: "SMASH.bad · Nouvelle prise de contact",
    //   text: `Bonjour,\n\n${first_name} ${last_name} (${ranking || "?"}) souhaite vous contacter.\n\nMessage:\n${message || "(aucun)"}\nTéléphone: ${phone || "(non communiqué)"}\n\nAnnonce: ${record.fields["Titre"]}\n`
    // });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed" });
  }
}
