// lib/data/airtable.ts
const API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const ADS = process.env.AIRTABLE_TABLE_ADS || "Annonces";
const CONTACTS = process.env.AIRTABLE_TABLE_CONTACTS || "ContactRequests";
const VIEW_PUBLIC = process.env.AIRTABLE_VIEW_PUBLIC || "public_list";

export type AdPublic = {
  id: string;
  titre?: string;
  dept?: string;
  ville?: string;
  // "Date" peut être une plage ou un simple texte : on garde les deux possibilités
  dates?: { start?: string; end?: string; text?: string };
  lienBadNet?: string;
  tournoi?: string;
  sexe?: "H" | "F";
  classement?: string;
  tableau?: "DD" | "DM" | "DX" | string;
  rechercheSexe?: string;
  rechercheClassement?: string;
  created_at?: string;
};

type AdRecord = { id: string; fields: Record<string, any> };

const AIR = `https://api.airtable.com/v0/${BASE_ID}`;

async function airGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${AIR}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Airtable GET ${path} failed: ${r.status}`);
  return r.json();
}

async function airPost(path: string, body: any) {
  const r = await fetch(`${AIR}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Airtable POST ${path} failed: ${r.status}`);
  return r.json();
}

// Évite les soucis de quotes dans filterByFormula
const esc = (s: string) => String(s).replace(/'/g, "\\'");

function mapAd(rec: AdRecord): AdPublic {
  const f = rec.fields || {};
  // "Date" : si tu utilises "date range" dans Airtable, f["Date"] peut contenir {start,end}
  const dates =
    f["Date"] && typeof f["Date"] === "object"
      ? { start: f["Date"].start, end: f["Date"].end }
      : { text: f["Date"] };

  return {
    id: rec.id,
    titre: f["Titre"],
    dept: f["Département"],
    ville: f["Ville"],
    dates,
    lienBadNet: f["Lien BadNet"],
    tournoi: f["Tournoi"],
    sexe: f["Sexe"],
    classement: f["Classement"],
    tableau: f["Tableau"],
    rechercheSexe: f["Recherche Sexe"],
    rechercheClassement: f["Recherche Classement"],
    created_at: f["Créé le"],
  };
}

export async function listAdsPublic(query: {
  id?: string;
  dept?: string;
  classement?: string;
  tableau?: string;
  search?: string;
  maxRecords?: number;
}) {
  // Si on demande un ID précis → on renvoie juste cet enregistrement (utile pour la page détail)
  if (query.id) {
    const json = await airGet(`${encodeURIComponent(ADS)}/${query.id}`);
    const rec = json as AdRecord;
    return [mapAd(rec)];
  }

  const params: Record<string, string> = {
    view: VIEW_PUBLIC,
    pageSize: String(query.maxRecords || 50),
  };

  // Filtres dynamiques via filterByFormula
  const formula: string[] = [];

  if (query.dept) formula.push(`{Département} = '${esc(query.dept)}'`);
  if (query.tableau) formula.push(`{Tableau} = '${esc(query.tableau)}'`);
  if (query.classement) formula.push(`SEARCH('${esc(query.classement)}', {Classement})`);
  if (query.search)
    formula.push(
      `OR(SEARCH(LOWER('${esc(query.search)}'), LOWER({Titre})), SEARCH(LOWER('${esc(
        query.search
      )}'), LOWER({Ville})), SEARCH(LOWER('${esc(query.search)}'), LOWER({Tournoi})))`
    );

  if (formula.length) params.filterByFormula = `AND(${formula.join(",")})`;

  const json = await airGet(encodeURIComponent(ADS), params);
  const records: AdRecord[] = json.records || [];
  return records.map(mapAd);
}

// Pour /api/partners/contact : on a besoin de l'email privé de l'auteur
export async function getAdForContact(id: string) {
  const json = await airGet(`${encodeURIComponent(ADS)}/${id}`);
  const rec = json as AdRecord;
  const emailAuteur = rec.fields?.["Contact (e-mail)"] as string | undefined;
  return { record: rec, authorEmail: emailAuteur };
}

// Log d’une demande de contact
export async function createContactRequest(payload: {
  adId: string;
  first_name: string;
  last_name: string;
  ranking?: string;
  message?: string;
  email: string;
  phone?: string;
}) {
  const body = {
    records: [
      {
        fields: {
          Annonce: [payload.adId], // champ "Link to Annonces"
          first_name: payload.first_name,
          last_name: payload.last_name,
          ranking: payload.ranking || "",
          message: payload.message || "",
          email: payload.email,
          phone: payload.phone || "",
          created_at: new Date().toISOString(),
        },
      },
    ],
  };
  return airPost(encodeURIComponent(CONTACTS), body);
}
