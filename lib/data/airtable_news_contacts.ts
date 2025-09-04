const API_URL = "https://api.airtable.com/v0";
const BASE_ID = process.env.AIRTABLE_BASE_ID || "appkxlroj23rDP2Ep";
const API_TOKEN = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN || "";
const NEWS = process.env.AIRTABLE_NEWS_CONTACTS || "Contact_News";

type NewsRecord = { id: string; fields: Record<string, any> };

async function airGet(path: string, params?: Record<string,string>) { /* idem */ }
async function airPost(path: string, body: unknown) { /* idem */ }

export async function addNewsContact(payload: { email: string; source?: string }) {
  return airPost(encodeURIComponent(NEWS), {
    records: [{ fields: { Email: payload.email, Source: payload.source || "site", Created_At: new Date().toISOString() } }],
  });
}
