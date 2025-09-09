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
  id: string;                // Airtable recordId
  public_id?: number;        // autonumber éventuel
  tournoi?: string;
  ville?: string;
  dept_code?: string;
  date?: string | null;
  badnet_url?: string;
  name?: string;             // prénom (privé)
  sexe?: string;
  age?: number | null;
  age_public?: boolean;
  tableau?: string;
  classement?: string;
  contact_email?: string;    // privé
  search_sex?: string;
  search_ranking?: string[] | string;
  notes?: string;
  status?: string;           // Actif | Archivé
  created_at?: string;       // Created time
  is_validated?: boolean;
};

type AdRecord = {
  id: string;
  fields: Record<string, any>;
};

type AirtableListResponse = {
  records: AdRecord[];
};

/* ========= Utils ========= */
const esc = (s: string) => String(s).replace(/'/g, "\\'");

async function airGet(path: string, params?: Record<string, string>) {
  if (!BASE_ID || !API_TOKEN) throw new Error("Airtable env vars manquantes");
  const url = new URL(`${API_URL}/${BASE_ID}/${path}`);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${API_TOKEN}` } });
  if (!res.ok) throw new Error(`Airtable GET ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

async function airPost(path: string, body: unknown) {
  if (!BASE_ID || !API_TOKEN) throw new Error("Airtable env vars manquantes");
  const res = await fetch(`${API_URL}/${BASE_ID}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Airtable POST ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

/* ========= Mapping ========= */
function mapAd(rec: AdRecord): AdPublic {
  const f = rec.fields || {};
  return {
    id: rec.id,
    public_id: f["public_id"],
    tournoi: f["tournoi"],
    ville: f["ville"],
    dept_code: f["dept_code"],
    date: f["date"] ||null,
    badnet_url: f["badnet_url"],
    name: f["name"],
    sexe: f["sexe"],
    age: typeof f["age"] === "number" ? f["age"] : null,
    age_public: !!f["age_public"],
    tableau: f["tableau"],
    classement: f["classement"],
    contact_email: f["contact_email"],
    search_sex: f["search_sex"],
    search_ranking: f["search_ranking"],
    notes: f["notes"],
    status: f["status"],
    created_at: f["created_at"],
    is_validated: !!f["is_validated"],
  };
}

/* ========= Lecture (liste publique + filtres) ========= */
export async function listAdsPublic(query: {
  id?: string;
  depts?: string[];
  classements?: string[];
  tableaux?: string[];
  search?: string;
  maxRecords?: number;
  sort?: "date-asc" | "date-desc" | "recents";
}) {
  if (query.id) {
    const rec = (await airGet(`${encodeURIComponent(ADS)}/${query.id}`)) as AdRecord;
    return [mapAd(rec)];
  }

  const params: Record<string, string> = {
    pageSize: String(query.maxRecords || 50),
  };

  // Modération : n’afficher que Actif + Validé
  const filters: string[] = [
    `{status} = 'Actif'`,
    `OR({is_validated} = 1, {is_validated} = TRUE())`,
  ];

  const orsEq = (field: string, values: string[]) =>
    values.length ? `OR(${values.map(v => `{${field}}='${esc(v)}'`).join(",")})` : "";

  if (query.depts?.length)       filters.push(orsEq("dept_code", query.depts));
  if (query.tableaux?.length)    filters.push(orsEq("tableau", query.tableaux));
  if (query.classements?.length) {
    // classement contient exactement la valeur
    filters.push(orsEq("classement", query.classements));
  }
  if (query.search) {
    const s = esc(query.search);
    filters.push(`OR(SEARCH(LOWER('${s}'), LOWER({tournoi})), SEARCH(LOWER('${s}'), LOWER({ville})))`);
  }

  if (filters.length) params.filterByFormula = `AND(${filters.join(",")})`;

  // Tri côté Airtable (facultatif). On laisse le tri côté client si tu veux.
  // Exemple: par created_at (desc) si "recents".
  if (query.sort === "recents") params.sort = JSON.stringify([{ field: "created_at", direction: "desc" }]);

  const json = (await airGet(encodeURIComponent(ADS), params)) as AirtableListResponse;
  return (json.records || []).map(mapAd);
}

/* ========= Création d’annonce ========= */
export async function createAd(fields: Record<string, any>) {
  // champs déjà aux bons noms snake_case
  const body = { records: [{ fields }] };
  return airPost(encodeURIComponent(ADS), body);
}

/* ========= Détail pour contact + e-mail privé ========= */
export async function getAdForContact(id: string) {
  const rec = (await airGet(`${encodeURIComponent(ADS)}/${id}`)) as AdRecord;
  const email = rec.fields?.["contact_email"] as string | undefined;
  const name = rec.fields?.["name"] as string | undefined;
  return { record: rec, authorEmail: email, authorName: name };
}

/* ========= Enregistrer une réponse (contact) ========= */
export async function createContactRequest(payload: {
  adRecordId: string;       // on stocke le recordId dans `ad` (texte)
  first_name: string;
  last_name: string;
  sex?: string;
  ranking?: string;
  email: string;
  phone?: string;
  message?: string;
}) {
  const fields = {
    ad: payload.adRecordId,        // champ texte (pas Link), on met le recordId
    first_name: payload.first_name,
    last_name: payload.last_name,
    sex: payload.sex || "",
    ranking: payload.ranking || "",
    email: payload.email,
    phone: payload.phone || "",
    message: payload.message || "",
    status: "Nouveau",
  };
  const body = { records: [{ fields }] };
  return airPost(encodeURIComponent(RESPONSES), body);
}
