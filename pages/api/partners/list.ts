import type { NextApiRequest, NextApiResponse } from "next";
import { listAdsPublic } from "../../../lib/data/airtable_annonces_partenaires";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // On lit UNIQUEMENT les paramètres utiles aux filtres
    const { dept, tableau, classement, q, max } = req.query;

    const depts =
      typeof dept === "string" && dept.trim() ? dept.split(",").map(s => s.trim()) : [];
    const tableaux =
      typeof tableau === "string" && tableau.trim() ? tableau.split(",").map(s => s.trim()) : [];
    const classements =
      typeof classement === "string" && classement.trim()
        ? classement.split(",").map(s => s.trim())
        : [];
    const maxRecords =
      typeof max === "string" && /^\d+$/.test(max) ? parseInt(max, 10) : undefined;

    // ⚠️ on n’envoie PAS “sort” à Airtable
    const items = await listAdsPublic({
      depts,
      tableaux,
      classements,
      search: typeof q === "string" ? q : undefined,
      maxRecords,
    });

    res.status(200).json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Internal error" });
  }
}
