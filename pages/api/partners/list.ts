import type { NextApiRequest, NextApiResponse } from "next";
import { listAdsPublic } from "@/lib/data/airtable";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (process.env.PARTNERS_FEATURE_ENABLED !== "true") return res.status(404).end();
    if (req.method !== "GET") return res.status(405).end();

    const { id, dept, classement, tableau, q } = req.query;
    const items = await listAdsPublic({
      id: typeof id === "string" ? id : undefined,
      dept: typeof dept === "string" ? dept : undefined,
      classement: typeof classement === "string" ? classement : undefined,
      tableau: typeof tableau === "string" ? tableau : undefined,
      search: typeof q === "string" ? q : undefined,
      maxRecords: 100,
    });
    res.status(200).json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed" });
  }
}
