import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// Type depuis lib/data/airtable_annonces_partenaires
type Ad = import("../../lib/data/airtable_annonces_partenaires").AdPublic;

/* ---------- Listes ---------- */
// Départements : 01..19, 2A/2B, 21..95, 971..976
const DEPTS = [
  ...Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0")),
  "2A", "2B",
  ...Array.from({ length: 95 - 21 + 1 }, (_, i) => String(21 + i)),
  ...Array.from({ length: 6 }, (_, i) => String(971 + i)),
];

const TABLEAUX = ["Double Dame", "Double Homme", "Double Mixte", "Double Intergenre"] as const;
const CLASSEMENTS = ["N1","N2","N3","R4","R5","R6","D7","D8","D9","P10","P11","P12","NC"] as const;

type SortKey = "recent_desc" | "recent_asc" | "date_desc" | "date_asc" | "alpha";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent_desc", label: "Plus récentes" },
  { key: "recent_asc",  label: "Moins récentes" },
  { key: "date_desc",   label: "Date du tournoi ↓" },
  { key: "date_asc",    label: "Date du tournoi ↑" },
  { key: "alpha",       label: "A → Z (tournoi)" },
];

/* -- espace insécable (pour coller les mots) -- */
const NBSP = "\u00A0";

/* ---------- Helpers communs (unique) ---------- */
const clean = (v: unknown) => (v ?? "").toString().trim();

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// Normalise beaucoup de variantes saisies pour le sexe
type SexKind = "H" | "F" | "AUTRE";
const normalizeSex = (raw?: string): SexKind => {
  const s = clean(raw).toLowerCase();
  if (["h", "homme", "m", "masculin", "male"].includes(s)) return "H";
  if (["f", "femme", "w", "féminin", "feminin", "female"].includes(s)) return "F";
  return "AUTRE";
};

const articleForSex = (sex?: string) => {
  if (sex === "Femme") return "une";
  if (sex === "Homme") return "un";
  return "un·e"; // neutre / inconnu
};

// Libellé personne selon le contexte (identité vs recherche)
const personLabel = (sexRaw?: string, context: "id" | "search" = "id") => {
  const s = normalizeSex(sexRaw);
  if (context === "id") {
    if (s === "H") return "un joueur";
    if (s === "F") return "une joueuse";
    return ""; // sexe non défini -> on ne montre PAS "joueur/joueuse"
  } else {
    if (s === "H") return "un joueur";
    if (s === "F") return "une joueuse";
    return "un joueur ou une joueuse"; // recherche neutre
  }
};

// Accord de "classé" : H → classé, F → classée, AUTRE → classé(e)
const classWordFor = (sexRaw?: string, forceNeutral = false) => {
  const s = normalizeSex(sexRaw);
  if (forceNeutral || s === "AUTRE") return "classé(e)";
  return s === "F" ? "classée" : "classé";
};

// Tableau toujours en toutes lettres
const expandTableau = (t?: string) => {
  const x = clean(t).toUpperCase();
  if (x === "DD" || x === "DOUBLE DAME")        return "Double Dame";
  if (x === "DH" || x === "DOUBLE HOMME")       return "Double Homme";
  if (x === "DM" || x === "DOUBLE MIXTE")       return "Double Mixte";
  if (x === "DI" || x === "DOUBLE INTERGENRE")  return "Double Intergenre";
  return clean(t);
};

// Liste naturelle "R5 ou R6" / "D9, D8, D7 ou R6"
const listWithOu = (arr: string[]) => {
  const a = arr.map(s => clean(s)).filter(Boolean);
  if (a.length === 0) return "";
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} ou ${a[1]}`;
  return `${a.slice(0, -1).join(", ")} ou ${a[a.length - 1]}`;
};

/* ---------- Hook util : clic extérieur ---------- */
function useOutsideClose<T extends HTMLElement>(open: boolean, onClose: ()=>void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current) return;
      if (!ref.current.contains(t)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose]);
  return ref;
}

/* ---------- UI : MultiFilter pill ---------- */
type MultiFilterPillProps = {
  label: string;
  selected: string[];
  onChange: (v: string[]) => void;
  options: string[];
  width?: number;
  placeholder?: string;
  normalize?: (s: string) => string | null; // pour valider une saisie libre
};
function MultiFilterPill({ label, selected, onChange, options, width = 220, placeholder = "Rechercher…", normalize }: MultiFilterPillProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const qq = q.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(qq));
  }, [q, options]);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(x => x !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className="partners-pill" ref={ref}>
      <button className="partners-pill__btn" onClick={()=>setOpen(v=>!v)}>
        {label}<span className="partners-pill__caret">▾</span>
      </button>
      {open && (
        <div className="partners-pill__menu" style={{ width }}>
          <div className="partners-pill__search">
            <input
              placeholder={placeholder}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") setOpen(false);
                if (e.key === "Escape") setOpen(false);
              }}
            />
          </div>

          <div className="partners-pill__options">
            {filtered.map(opt => (
              <label key={opt} className={`partners-pill__opt ${selected.includes(opt) ? "is-selected" : ""}`}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          {normalize && (
            <div className="partners-pill__free">
              <input
                placeholder="Saisie libre…"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const v = normalize((e.target as HTMLInputElement).value || "");
                    if (v) toggle(v);
                    setQ("");
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- UI : Sort pill ---------- */
function SortPill({ sort, setSort }: { sort: SortKey; setSort: (s: SortKey)=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(open, ()=>setOpen(false));
  return (
    <div className="partners-pill" ref={ref}>
      <button className="partners-pill__btn" onClick={()=>setOpen(v=>!v)}>
        {SORTS.find(s=>s.key===sort)?.label}<span className="partners-pill__caret">▾</span>
      </button>
      {open && (
        <div className="partners-pill__menu" style={{ width: 260 }}>
          {SORTS.map(s => (
            <button key={s.key} className={`partners-pill__opt ${s.key===sort?"is-selected":""}`} onClick={()=>{ setSort(s.key); setOpen(false); }}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== Page ===================== */
export default function PartenairesPage() {
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres (multi)
  const [depts, setDepts] = useState<string[]>([]);
  const [tableaux, setTableaux] = useState<string[]>([]);
  const [classements, setClassements] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("recent_desc");

  // normaliser une saisie departement (ex: "92", "2a", "971")
  const normDept = (s: string) => {
    const up = s.toUpperCase();
    if (/^(\d{1,2}|97[1-6]|2A|2B)$/.test(up)) return up.padStart(2, "0");
    return null;
  };

  /* ----- Fetch des annonces (via /api) ----- */
  useEffect(() => {
    const url = new URL("/api/partners/list", window.location.origin);
    if (depts.length)       url.searchParams.set("dept", depts.join(","));
    if (tableaux.length)    url.searchParams.set("tableau", tableaux.join(","));
    if (classements.length) url.searchParams.set("classement", classements.join(","));
    // mapper vers l'API (qui comprend seulement certains flags)
    const apiSort =
      sort === "date_asc" ? "date-asc" :
      sort === "date_desc" ? "date-desc" :
      sort === "recent_desc" ? "recents" :
      null;
    if (apiSort) url.searchParams.set("sort", apiSort);

    setLoading(true);
    fetch(url.toString())
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [depts, tableaux, classements, sort]);

  /* ----- Tri + filtres client ----- */
  // Helpers robustes de dates/tri (alpha)
  const toStr = (v: unknown) => (v ?? "").toString().trim();

  const parseDateStr = (d?: unknown): number => {
    if (!d) return Number.NaN;
    if (d instanceof Date && !Number.isNaN(d.getTime())) return d.getTime();
    const str = toStr(d);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str + "T12:00:00Z").getTime();
    const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00Z`).getTime();
    const t = Date.parse(str);
    return Number.isNaN(t) ? Number.NaN : t;
  };

  // created_at si dispo, sinon date de tournoi
  const getWhen = (ad: Ad): number => {
    const created = (ad as any).created_at || (ad as any).createdAt || (ad as any)._createdTime;
    const t = parseDateStr(created);
    return Number.isNaN(t) ? parseDateStr(ad.date) : t;
  };

  const sorted = useMemo(() => {
    const clone = [...items];
    switch (sort) {
      case "recent_desc":
        clone.sort((a,b) => (getWhen(b) - getWhen(a))); break;
      case "recent_asc":
        clone.sort((a,b) => (getWhen(a) - getWhen(b))); break;
      case "date_desc":
        clone.sort((a,b) => (parseDateStr(b.date) - parseDateStr(a.date))); break;
      case "date_asc":
        clone.sort((a,b) => (parseDateStr(a.date) - parseDateStr(b.date))); break;
      case "alpha":
        clone.sort((a,b) => toStr(a.tournoi).localeCompare(toStr(b.tournoi), "fr", { sensitivity: "base" })); break;
      default:
        break;
    }
    return clone;
  }, [items, sort]);

  return (
    <main className="partners-page">
      {/* HERO */}
      <header className="partners-hero">
        <h1>Chercher un partenaire pour un tournoi</h1>
        <p>
          Dépose ton annonce, prend contact avec des joueurs qui cherchent des partenaires pour jouer en tournoi près de chez toi.
          <br />
          Aucune coordonnée ne sera partagée publiquement.
        </p>

        <div className="partners-hero__actions">
          <a className="cta-primary partners-cta" href="#" aria-disabled>
            Déposer une annonce
          </a>
        </div>

        {/* FILTRES */}
        <div className="partners-filterbar" role="group" aria-label="Filtres d’annonces">
          <span className="partners-filterbar__label">Filtrer par :</span>
          <MultiFilterPill label="Département" selected={depts} onChange={setDepts} options={[...DEPTS]} width={300} placeholder="Département (ex: 92, 2A, 971)" normalize={normDept}/>
          <MultiFilterPill label="Tableau"     selected={tableaux} onChange={setTableaux} options={[...TABLEAUX]} width={260}/>
          <MultiFilterPill label="Classement"  selected={classements} onChange={setClassements} options={[...CLASSEMENTS]} width={360}/>
          <span className="partners-filterbar__label">Trier :</span>
          <SortPill sort={sort} setSort={setSort}/>
        </div>
      </header>

      {/* LISTE */}
      {loading && <div className="partners-empty">Chargement…</div>}
      {!loading && sorted.length === 0 && (
        <div className="partners-empty">Aucune annonce pour ces filtres.</div>
      )}

      {sorted.map((ad) => {
        const tournoi   = clean(ad.tournoi || ad.tournoi);
        const ville     = clean(ad.ville);
        const dept      = clean(ad.dept_code);

        return (
          <article key={ad.id} className="partners-card">
            {/* Titre + bouton externe (désactivé, tooltip) */}
            <header className="partners-card__head">
              <h3 className="partners-card__title">{tournoi || "Annonce"}</h3>

              <button type="button" className="btn btn--ghost partners-card__ext" aria-disabled="true" title="Bientôt disponible">
                <span className="nowrap">Fiche BadNet</span>
                <span className="tooltip">Bientôt disponible</span>
              </button>
            </header>

            {/* Métadonnées : dates + lieu */}
            <ul className="partners-card__meta">
              <li className="i-date">
                {ad.date ? <span className="strong">{fmtDate(ad.date)}</span> : <>Date à préciser</>}
              </li>

              <li className="i-place">
                <span className="strong">{ville}</span>
                {dept ? <><span>,{NBSP}</span><span className="strong">{dept}</span></> : null}
              </li>
            </ul>

            {/* identité */}
            <div className="desc-line i-id">
              {(() => {
                const label = personLabel(ad.sexe, "id"); // "" si sexe non défini
                const cl    = clean(ad.classement);
                const age   = ad.age;

                // Choix de l'accord pour "classé"
                const classWord = classWordFor(ad.sexe, !label /* neutre si pas de joueur/joueuse */);

                return (
                  <>
                    Je suis{NBSP}
                    {label ? <><span className="strong">{label}</span>{NBSP}</> : null}

                    {/* classement (si présent) */}
                    {cl ? <>{classWord}{NBSP}<span className="strong">{cl}</span></> : <>classé(e)</>}

                    {/* âge : "de … ans" si on a un label (joueur/joueuse), sinon "et j'ai … ans" */}
                    {ad.age_masque ? (
                      label
                        ? <> {NBSP}qui ne souhaite pas préciser son âge</>
                        : <> {NBSP}et je ne souhaite pas préciser mon âge</>
                    ) : (typeof age === "number" && !Number.isNaN(age)) ? (
                      label
                        ? <> {NBSP}de{NBSP}<span className="strong">{age}</span>{NBSP}ans</>
                        : <> {NBSP}et j'ai{NBSP}<span className="strong">{age}</span>{NBSP}ans</>
                    ) : null}
                  </>
                );
              })()}
            </div>

            {/* tableau */}
            {ad.tableau && (
              <div className="desc-line i-draw">
                Je souhaite jouer en {NBSP}<span className="strong">{expandTableau(ad.tableau)}</span>
              </div>
            )}

            {/* recherche */}
            {(ad.search_sex || ad.search_ranking) && (
              <div className="desc-line i-search">
                {(() => {
                  const person = personLabel(ad.search_sex, "search"); // "un joueur", "une joueuse", ou "un joueur ou une joueuse"
                  const raw = Array.isArray(ad.search_ranking)
                    ? ad.search_ranking
                    : (ad.search_ranking ? String(ad.search_ranking).split(/[,\s;/]+/) : []);
                  const list = listWithOu(raw); // ex. "D9 ou R6"
                  const classWord = classWordFor(ad.search_sex); // AUTRE → "classé(e)"

                  return (
                    <>
                      Je souhaite jouer avec{" "}
                      {person.includes("ou") ? (
                        // cas neutre : "un joueur ou une joueuse"
                        <span className="strong">{person}</span>
                      ) : (
                        <>
                          {/* article + nom séparés */}
                          <span className="strong">{person.split(" ")[0]}</span>{" "}
                          <span className="strong">{person.split(" ")[1]}</span>
                        </>
                      )}
                      {list && <> {NBSP}{classWord}{NBSP}<span className="strong">{list}</span></>}
                    </>
                  );
                })()}
              </div>
            )}

            {/* actions */}
            <footer className="partners-card__foot">
              <Link href={`/partenaires/${ad.id}`} className="btn">
                Contacter
              </Link>
            </footer>
          </article>
        );
      })}
    </main>
  );
}
