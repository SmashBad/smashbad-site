// lib/data/airtable_annonces_partenaires.ts

/* ========= Config ========= */
const API_URL = "https://api.airtable.com/v0";
const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkxlroj23rDP2Ep";                 // ex: appXXXXXXXXXXXX
const API_TOKEN = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN || "";

const ADS = process.env.AIRTABLE_PARTNERS_ADS || "Partenaires_Annonces";           // table des annonces
const CONTACTS = process.env.AIRTABLE_PARTNERS_RESPONSES || "Partenaires_Reponses"; // table des prises de contact
const VIEW_PUBLIC = process.env.AIRTABLE_PARTNERS_VIEW || "public_list";    // vue filtrée des annonces publiques

/* ========= Types ========= */
export type AdPublic = {
  id: string;
  titre?: string;
  dept?: string;
  ville?: string;
  dates?: { start?: string; end?: string; text?: string };
  lienBadNet?: string;
  tournoi?: string;
  sexe?: "H" | "F" | string;
  classement?: string;
  tableau?: string; // "Double Dame" | "Double Homme" | "Double Mixte" | "Double Intergenre"
  rechercheSexe?: string;
  rechercheClassement?: string;
  created_at?: string;
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

/** GET générique Airtable */
async function airGet(path: string, params?: Record<string, string>) {
  if (!BASE_ID || !API_TOKEN) {
    throw new Error("Airtable: BASE_ID ou API_TOKEN manquant dans les variables d'environnement.");
  }
  const url = new URL(`${API_URL}/${BASE_ID}/${path}`);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Airtable GET ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

/** POST générique Airtable */
async function airPost(path: string, body: unknown) {
  if (!BASE_ID || !API_TOKEN) {
    throw new Error("Airtable: BASE_ID ou API_TOKEN manquant dans les variables d'environnement.");
  }
  const res = await fetch(`${API_URL}/${BASE_ID}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Airtable POST ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

/** Mapping brut Airtable -> objet public côté site */
function mapAd(rec: AdRecord): AdPublic {
  const f = rec.fields || {};
  // "Date" peut être un champ texte, un date-range ({start,end}) ou deux dates selon ta config.
  let dates: AdPublic["dates"] = undefined;
  const rawDate = f["Date"];
  if (rawDate && typeof rawDate === "object" && ("start" in rawDate || "end" in rawDate)) {
    dates = { start: rawDate.start, end: rawDate.end };
  } else if (typeof rawDate === "string") {
    dates = { text: rawDate };
  } else {
    dates = undefined;
  }

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
    created_at: f["Créé le"],
  };
}

/* ========= Lecture liste publique avec filtres multi ========= */
export async function listAdsPublic(query: {
  id?: string;
  depts?: string[];
  classements?: string[];
  tableaux?: string[];
  search?: string;
  maxRecords?: number;
}) {
  // Détail par ID
  if (query.id) {
    const json = (await airGet(`${encodeURIComponent(ADS)}/${query.id}`)) as AdRecord;
    return [mapAd(json)];
  }

  // 1) Construire params
  const paramsBase: Record<string, string> = {
    pageSize: String(query.maxRecords || 50),
  };
  // On ne met "view" que si elle est définie (ENV) et non vide
  const useView = !!(VIEW_PUBLIC && VIEW_PUBLIC.trim());
  if (useView) paramsBase.view = VIEW_PUBLIC.trim();

  const orsEq = (field: string, values: string[]) =>
    values.length ? `OR(${values.map(v => `{${field}} = '${esc(v)}'`).join(",")})` : "";

  const formula: string[] = [];
  if (query.depts?.length)       formula.push(orsEq("Département", query.depts));
  if (query.tableaux?.length)    formula.push(orsEq("Tableau", query.tableaux));
  if (query.classements?.length) formula.push(`OR(${query.classements.map(c => `SEARCH('${esc(c)}', {Classement})`).join(",")})`);
  if (query.search)              formula.push(
    `OR(SEARCH(LOWER('${esc(query.search)}'), LOWER({Titre})),
        SEARCH(LOWER('${esc(query.search)}'), LOWER({Ville})),
        SEARCH(LOWER('${esc(query.search)}'), LOWER({Tournoi})))`
  );
  if (formula.length) paramsBase.filterByFormula = `AND(${formula.join(",")})`;

  // 2) Premier essai (avec view si fournie)
  let json = (await airGet(encodeURIComponent(ADS), paramsBase)) as AirtableListResponse;
  let records: AdRecord[] = json.records || [];

  // 3) Auto-fallback : si 0 record ET qu’on avait mis une view → retenter sans view
  if (records.length === 0 && useView) {
    const { view, ...paramsNoView } = paramsBase;
    try {
      const json2 = (await airGet(encodeURIComponent(ADS), paramsNoView)) as AirtableListResponse;
      const records2: AdRecord[] = json2.records || [];
      if (records2.length > 0) {
        console.warn(
          `[partners] 0 record avec view="${VIEW_PUBLIC}", mais ${records2.length} sans view. Vérifie le nom de vue ou ses filtres.`
        );
        records = records2;
      }
    } catch (e) {
      // on ignore, c’était juste un fallback de diagnostic
    }
  }

  // 4) Logs utiles (sans secrets)
  console.log(
    `[partners] fetched=${records.length} table="${ADS}" base="${(BASE_ID||'').slice(0,6)}…" view="${useView?VIEW_PUBLIC:''}"`
  );

  return records.map(mapAd);
}
}

/* ========= Détail + e-mail privé auteur pour /contact ========= */
export async function getAdForContact(id: string) {
  const rec = (await airGet(`${encodeURIComponent(ADS)}/${id}`)) as AdRecord;
  const authorEmail = rec.fields?.["Contact (e-mail)"] as string | undefined;
  return { record: rec, authorEmail };
}

/* ========= Log d'une prise de contact =========
   NB: la table CONTACTS doit contenir un champ "Annonce" (Link to Annonces)
*/
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
          Annonce: [payload.adId],     // champ "Link to Annonces" dans ContactRequests
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
