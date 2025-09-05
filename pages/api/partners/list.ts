import type { NextApiRequest, NextApiResponse } from "next";
import { listAdsPublic } from "../../../lib/data/airtable_annonces_partenaires";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const q = req.query;

    const toArr = (v: string | string[] | undefined) =>
      (Array.isArray(v) ? v.join(",") : (v || ""))
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    const depts       = toArr(q.dept as any);
    const tableaux    = toArr(q.tableau as any);
    const classements = toArr(q.classement as any);
    const search      = typeof q.search === "string" ? q.search : undefined;

    const items = await listAdsPublic({
      depts,
      tableaux,
      classements,
      search,
      maxRecords: 200,
    });

    res.status(200).json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
}
