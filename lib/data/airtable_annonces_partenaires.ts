const API_URL = "https://api.airtable.com/v0";
const BASE_ID = process.env.AIRTABLE_BASE_ID || ""; // tu dois l’avoir défini dans Vercel
const ADS = "Annonces"; // le nom de ta table dans Airtable
const VIEW_PUBLIC = "Vue publique"; // le nom de ta vue (ou à adapter)

/**
 * Helper générique pour GET sur Airtable
 */
async function airGet(path: string, params?: Record<string, string>) {
  const url = new URL(`${API_URL}/${BASE_ID}/${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error(`Airtable error: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function listAdsPublic(query: {
  id?: string;
  depts?: string[];           // ex ["92","75","2A"]
  classements?: string[];     // ex ["D9","D8"]
  tableaux?: string[];        // ex ["Double Homme","Double Mixte"]
  search?: string;
  maxRecords?: number;
}) {
  if (query.id) {
    const json = await airGet(`${encodeURIComponent(ADS)}/${query.id}`);
    const rec = json as AdRecord;
    return [mapAd(rec)];
  }

  const params: Record<string, string> = {
    view: VIEW_PUBLIC,
    pageSize: String(query.maxRecords || 50),
  };

  const esc = (s: string) => String(s).replace(/'/g, "\\'");
  const ors = (field: string, values: string[]) =>
    values.length ? `OR(${values.map(v => `{${field}} = '${esc(v)}'`).join(",")})` : "";

  const formula: string[] = [];
  if (query.depts?.length)       formula.push(ors("Département", query.depts));
  if (query.tableaux?.length)    formula.push(ors("Tableau", query.tableaux));
  if (query.classements?.length) formula.push(`OR(${query.classements.map(c => `SEARCH('${esc(c)}', {Classement})`).join(",")})`);
  if (query.search)              formula.push(
    `OR(SEARCH(LOWER('${esc(query.search)}'), LOWER({Titre})),
        SEARCH(LOWER('${esc(query.search)}'), LOWER({Ville})),
        SEARCH(LOWER('${esc(query.search)}'), LOWER({Tournoi})))`
  );

  if (formula.length) params.filterByFormula = `AND(${formula.join(",")})`;

  const json = await airGet(encodeURIComponent(ADS), params);
  const records: AdRecord[] = json.records || [];
  return records.map(mapAd);
}
