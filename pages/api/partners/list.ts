// pages/api/partners/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { listAdsPublic } from "../../../lib/data/airtable_annonces_partenaires";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, dept, tableau, classement, q, sort } = req.query;

    const items = await listAdsPublic({
      id: typeof id === "string" ? id : undefined,
      depts: typeof dept === "string" && dept ? dept.split(",") : [],
      tableaux: typeof tableau === "string" && tableau ? tableau.split(",") : [],
      classements: typeof classement === "string" && classement ? classement.split(",") : [],
      search: typeof q === "string" ? q : undefined,
      sort: (typeof sort === "string" ? sort : undefined) as any,
      maxRecords: 100,
    });

    res.status(200).json({ items });
  } catch (e: any) {
    console.error("partners.list error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
