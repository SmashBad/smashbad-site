import { Resend } from "resend";
import type { NextApiRequest, NextApiResponse } from "next";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { firstName, email, message } = req.body;
  if (!firstName || !email || !message) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  try {
    await resend.emails.send({
      from: "SMASH.bad <onboarding@resend.dev>", // l'adresse d'envoi par défaut
      to: process.env.CONTACT_TO!,
      reply_to: email,
      subject: `Contact SMASH.bad — ${firstName}`,
      html: `<p><b>Prénom :</b> ${firstName}</p>
             <p><b>Email :</b> ${email}</p>
             <p><b>Message :</b><br/>${message.replace(/\n/g, "<br/>")}</p>`,
    });

    res.status(200).json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: "Erreur d’envoi" });
  }
}
