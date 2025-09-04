import type { NextApiRequest, NextApiResponse } from "next";
import { listAdsPublic } from "../../../lib/data/airtable_annonces_partenaires";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { q, depts, tableaux, classements, max } = req.query;

    const data = await listAdsPublic({
      search: typeof q === "string" ? q : undefined,
      depts: typeof depts === "string" ? depts.split(",").map(s => s.trim()) : undefined,
      tableaux: typeof tableaux === "string" ? tableaux.split(",").map(s => s.trim()) : undefined,
      classements: typeof classements === "string" ? classements.split(",").map(s => s.trim()) : undefined,
      maxRecords: typeof max === "string" ? Number(max) : undefined,
    });

    res.status(200).json({ ok: true, count: data.length, items: data });
  } catch (e: any) {
    console.error("[partners] API error:", e?.message || e);
    res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
}
