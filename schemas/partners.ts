// schemas/partners.ts
import { z } from "zod";

/** Listes contrôlées */
export const CLASSEMENTS = ["N1","N2","N3","R4","R5","R6","D7","D8","D9","P10","P11","P12","NC"] as const;
export const TABLEAUX = ["Double Dame", "Double Homme", "Double Mixte", "Double Intergenre"] as const;

/** Départements FR: 01..19, 2A/2B, 21..95, 971..976 */
export const DEPARTEMENTS = [
  ...Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0")),
  "2A","2B",
  ...Array.from({ length: 95 - 21 + 1 }, (_, i) => String(21 + i)),
  ...Array.from({ length: 6 }, (_, i) => String(971 + i)),
] as const;

/** Normalisation/validation légère pour champs texte non vides */
const nonEmpty = z.string().trim().min(1, "Champ requis");

/** Sexe */
const Sexe = z.enum(["H","F","AUTRE"]).default("AUTRE");

/** Multi sélection classements recherchés (tolère string "R5,R6" ou array) */
const ClassementsMulti = z
  .union([
    z.array(z.enum(CLASSEMENTS)),
    z.string().trim().transform(s => s ? s.split(/[,\s;/]+/).filter(Boolean) : [])
  ])
  .optional();

/** Schéma principal de création d’annonce */
export const PartnerAdCreateSchema = z.object({
  tournoi: nonEmpty,                   // texte
  ville: nonEmpty,                     // texte
  dept: z.enum(DEPARTEMENTS),          // sélection
  date_text: z.string().trim().optional(), // pour l’instant du texte libre (simple)
  tableau: z.enum(TABLEAUX),           // sélection
  sexe: Sexe,                          // sélection
  classement: z.enum(CLASSEMENTS),     // sélection
  age: z
    .union([z.number().int().min(8).max(90), z.string().regex(/^\d+$/, "Age numérique").transform(Number)])
    .optional(),
  age_ok: z.boolean().default(true),   // “je préfère ne pas le dire” => false
  recherche_sexe: Sexe.optional(),
  recherche_classement: ClassementsMulti,
  email: z.string().email("E-mail invalide"),
  message: z.string().trim().max(800, "Message trop long").optional(),
  // anti-spam (honeypot)
  hp: z.string().optional()
})
.refine(data => data.age_ok || !data.age, {
  message: "Vous avez décoché l’affichage de l’âge : laissez le champ âge vide.",
  path: ["age"],
});
