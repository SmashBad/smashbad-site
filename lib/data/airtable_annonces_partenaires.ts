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
