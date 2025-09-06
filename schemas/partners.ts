// schemas/partners.ts
import { z } from "zod";

/* ===== Listes ===== */
export const CLASSEMENTS = [
  "N1","N2","N3","R4","R5","R6","D7","D8","D9","P10","P11","P12","NC",
] as const;

export const TABLEAUX = [
  "Double Dame", "Double Homme", "Double Mixte", "Double Intergenre",
] as const;

/** Départements FR : 01..19, 2A/2B, 21..95, 971..976 */
export const DEPARTEMENTS = [
  ...Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0")),
  "2A", "2B",
  ...Array.from({ length: 95 - 21 + 1 }, (_, i) => String(21 + i)),
  ...Array.from({ length: 6 }, (_, i) => String(971 + i)),
];

/* ===== Helpers ===== */
const sexValues = ["H","F","AUTRE"] as const;
export const normalizeSex = (raw?: string) => {
  const s = (raw || "").toLowerCase();
  if (["h","homme","m","masculin","male"].includes(s)) return "H";
  if (["f","femme","w","féminin","feminin","female"].includes(s)) return "F";
  return "AUTRE";
};

/* ===== Schéma d’entrée pour l’API create ===== */
export const CreateAdSchema = z.object({
  // anti-spam (honeypot)
  hp: z.string().optional(),

  // champs du formulaire
  tournoi: z.string().min(1),
  ville: z.string().min(1),
  dept: z.string().min(1),

  date_text: z.string().optional().default(""),

  tableau: z.enum(TABLEAUX),

  sexe: z.enum(sexValues).default("AUTRE"),
  classement: z.enum(CLASSEMENTS),

  age: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().min(8).max(90).optional()
  ),
  age_ok: z.boolean().default(true), // true = autorise l’affichage

  recherche_sexe: z.enum(sexValues).default("AUTRE"),
  recherche_classement: z.array(z.enum(CLASSEMENTS)).default([]),

  email: z.string().email(),
  message: z.string().optional().default(""),
});

/* Type TS pratique si besoin côté client */
export type CreateAdInput = z.infer<typeof CreateAdSchema>;
