// /lib/schemas/partners.ts
import { z } from "zod";

/** Listes */
export const DEPARTEMENTS = [
  ...Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0")),
  "2A", "2B",
  ...Array.from({ length: 95 - 21 + 1 }, (_, i) => String(21 + i)),
  ...Array.from({ length: 6 }, (_, i) => String(971 + i)),
] as const;

export const TABLEAUX = ["Double Dame", "Double Homme", "Double Mixte", "Double Intergenre"] as const;

export const CLASSEMENTS = ["N1","N2","N3","R4","R5","R6","D7","D8","D9","P10","P11","P12","NC"] as const;

/** Schéma Zod pour le formulaire de dépôt d’annonce */
export const AdCreateSchema = z.object({
  // Champs visibles dans ton formulaire (adaptés à ta table Airtable)
  // Tu pourras ajuster les "optional()" si besoin
  titre: z.string().trim().optional(),  // si tu continues d’afficher "tournoi" comme titre de carte
  tournoi: z.string().trim().min(2, "Nom du tournoi requis"),
  ville: z.string().trim().min(2, "Ville requise"),

  dept: z.enum(DEPARTEMENTS as unknown as [typeof DEPARTEMENTS[number], ...typeof DEPARTEMENTS[number][]], {
    // z.enum attend un tuple, le cast ci-dessus est OK pour TS
    required_error: "Département requis",
    invalid_type_error: "Département invalide",
  }),

  // Dates : pour l’instant texte libre ou ISO ; adapteras plus tard si tu passes à des vrais Date fields
  dateText: z.string().trim().optional(),

  sexe: z.enum(["H","F","AUTRE"]).optional(),
  classement: z.enum(CLASSEMENTS as unknown as [typeof CLASSEMENTS[number], ...typeof CLASSEMENTS[number][]]).optional(),

  tableau: z.enum(TABLEAUX as unknown as [typeof TABLEAUX[number], ...typeof TABLEAUX[number][]]).optional(),

  rechercheSexe: z.enum(["H","F","AUTRE"]).optional(),

  // autorise soit un tableau, soit une string "R5, R6" qu’on re-splitera côté code si besoin
  rechercheClassement: z.union([
    z.array(z.enum(CLASSEMENTS as unknown as [typeof CLASSEMENTS[number], ...typeof CLASSEMENTS[number][]])),
    z.string().trim().optional(),
  ]).optional(),

  email: z.string().email("Email invalide"),

  // Âge + case "je préfère ne pas le dire"
  age: z
    .union([z.number().int().min(5).max(99), z.string().regex(/^\d+$/, "Âge invalide").transform(v => Number(v))])
    .optional(),
  age_ok: z.boolean().default(false), // ← ta case "Âge_Ok" (côté Airtable on mappe -> "Âge_Ok")

  // Anti-spam (honeypot)
  hp: z.string().max(0).optional(),

  // Metadonnées : on ne les affiche pas dans le formulaire, mais on peut les pousser
  statut: z.enum(["Actif", "Archivé"]).default("Actif"),
  valider: z.boolean().default(false), // ← pour "Validée" côté Airtable (tu valideras plus tard manuellement)
});

export type AdCreate = z.infer<typeof AdCreateSchema>;
