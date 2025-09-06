// lib/data/airtable_annonces_partenaires.ts
/* ========= Config ========= */
const API_URL = "https://api.airtable.com/v0";
const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkxlroj23rDP2Ep";
const API_TOKEN = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN || "";

const ADS = process.env.AIRTABLE_PARTNERS_ADS || "Partenaires_Annonces";
const CONTACTS = process.env.AIRTABLE_PARTNERS_RESPONSES || "Partenaires_Reponses";
const VIEW_PUBLIC = process.env.AIRTABLE_PARTNERS_VIEW || ""; // optionnel

/* ========= Types ========= */
export type AdPublic = {
  id: string;
  titre?: string;
  tournoi?: string;
  ville?: string;
  dept?: string;
  sexe?: string;
  classement?: string;
  tableau?: string;
  rechercheSexe?: string;
  rechercheClassement?: string[] | string;
  lienBadNet?: string;
  dates?: { start?: string; end?: string; text?: string };
  age?: number | null;
  age_hidden?: boolean; // true = ne pas afficher
  created_at?: string;
};

type AdRecord = { id: string; fields: Record<string, any> };
type AirtableListResponse = { records: AdRecord[] };

/* ========= Utils ========= */
const esc = (s: string) => String(s).replace(/'/g, "\\'");

async function airGet(path: string, params?: Record<string, string>) {
  if (!BASE_ID || !API_TOKEN) throw new Error("Airtable: BASE_ID ou API_TOKEN manquant.");
  const url = new URL(`${API_URL}/${BASE_ID}/${path}`);
  if (params) Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${API_TOKEN}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Airtable GET ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}
async function airPost(path: string, body: unknown) {
  if (!BASE_ID || !API_TOKEN) throw new Error("Airtable: BASE_ID ou API_TOKEN manquant.");
  const res = await fetch(`${API_URL}/${BASE_ID}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(()=> "");
    throw new Error(`Airtable POST ${path} → ${res.status} ${res.statusText} ${t}`);
  }
  return res.json();
}

/* ========= Mapping lecture ========= */
function mapAd(rec: AdRecord): AdPublic {
  const f = rec.fields || {};
  let dates: AdPublic["dates"] = undefined;
  const rawDate = f["Date"];
  if (rawDate && typeof rawDate === "object" && ("start" in rawDate || "end" in rawDate)) {
    dates = { start: rawDate.start, end: rawDate.end };
  } else if (typeof rawDate === "string") {
    dates = { text: rawDate };
  }

  const rawAge = f["Âge"];
  const age = typeof rawAge === "number" ? rawAge : (rawAge ? Number(rawAge) : null);
  const ageOk = !!f["Âge_Ok"]; // coché = affichable
  const age_hidden = !ageOk;

  return {
    id: rec.id,
    titre: f["Titre"],
    dept: f["Département"] != null ? String(f["Département"]) : undefined,
    ville: f["Ville"],
    dates,
    lienBadNet: f["Lien BadNet"],
    tournoi: f["Tournoi"],
    sexe: f["Sexe"],
    classement: f["Classement"],
    tableau: f["Tableau"],
    rechercheSexe: f["Recherche Sexe"],
    rechercheClassement: f["Recherche Classement"],
    created_at: f["Créé le"] || (rec as any).createdTime,
    age,
    age_hidden,
  };
}

/* ========= Lecture publique ========= */
export async function listAdsPublic(query: {
  id?: string;
  depts?: string[];
  classements?: string[];
  tableaux?: string[];
  search?: string;
  sort?: string;     // pris en charge côté API page
  maxRecords?: number;
}) {
  if (query.id) {
    const json = (await airGet(`${encodeURIComponent(ADS)}/${query.id}`)) as AdRecord;
    return [mapAd(json)];
  }

  const params: Record<string, string> = { pageSize: String(query.maxRecords || 50) };
  if (VIEW_PUBLIC.trim()) params.view = VIEW_PUBLIC.trim();

  const orsEq = (field: string, values: string[]) =>
    values.length ? `OR(${values.map(v => `{${field}} = '${esc(v)}'`).join(",")})` : "";

  // Modération : Validée = TRUE ET Statut = "Actif"
  const moderation = `AND({Validée} = TRUE(), {Statut} = 'Actif')`;

  const formula: string[] = [moderation];
  if (query.depts?.length)       formula.push(orsEq("Département", query.depts));
  if (query.tableaux?.length)    formula.push(orsEq("Tableau", query.tableaux));
  if (query.classements?.length) formula.push(`OR(${query.classements.map(c => `SEARCH('${esc(c)}', {Classement})`).join(",")})`);
  if (query.search)              formula.push(
    `OR(SEARCH(LOWER('${esc(query.search)}'), LOWER({Titre})),
        SEARCH(LOWER('${esc(query.search)}'), LOWER({Ville})),
        SEARCH(LOWER('${esc(query.search)}'), LOWER({Tournoi})))`
  );
  if (formula.length) params.filterByFormula = `AND(${formula.join(",")})`;

  const json = (await airGet(encodeURIComponent(ADS), params)) as AirtableListResponse;
  return (json.records || []).map(mapAd);
}

/* ========= Création d’annonce ========= */
export async function createAd(fields: Record<string, any>) {
  // `fields` DOIT utiliser les NOMS RÉELS DES COLONNES Airtable.
  const body = { records: [{ fields }] };
  const json = await airPost(encodeURIComponent(ADS), body);
  return json;
}
