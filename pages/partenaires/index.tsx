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

type SortKey = "date-asc" | "date-desc" | "recents";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "date-asc",  label: "date : chronologique" },
  { key: "date-desc", label: "date : anti-chronologique" },
  { key: "recents",   label: "annonces récentes" },
];
/* -- esapce insécable -- */
const NBSP = "\u00A0"; 

/* ---------- Helpers ---------- */
const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// normalise beaucoup de variantes "sexe"
const normalizeSex = (raw?: string) => {
  const s = (raw || "").toLowerCase();
  if (/^h|hom/i.test(s) || /masc/.test(s) || s === "m") return "H" as const;
  if (/^f|fem/i.test(s) || /fém/.test(s))               return "F" as const;
  return "AUTRE" as const;
};

const nounsForSex = (sexRaw?: string) => {
  const s = normalizeSex(sexRaw);
  if (s === "H") return { noun:"joueur",  classWord:"classé"   };
  if (s === "F") return { noun:"joueuse", classWord:"classée"  };
  return            { noun:"joueur·se", classWord:"classé·e" };
};

const expandTableau = (t?: string) => {
  const x = (t || "").toUpperCase().trim();
  if (x === "DD" || x === "DOUBLE DAME")        return "Double Dame";
  if (x === "DH" || x === "DOUBLE HOMME")       return "Double Homme";
  if (x === "DM" || x === "DOUBLE MIXTE")       return "Double Mixte";
  if (x === "DI" || x === "DOUBLE INTERGENRE")  return "Double Intergenre";
  return (t || "").trim();
};

const listWithOu = (arr: string[]) => {
  const clean = arr.map(s => s.trim()).filter(Boolean);
  if (clean.length <= 1) return clean.join("");
  if (clean.length === 2) return `${clean[0]}${NBSP}ou${NBSP}${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}${NBSP}ou${NBSP}${clean[clean.length - 1]}`;
};

function sexeLabel(s?: string) {
  if (s === "F") return { personne: "une femme", classe: "classée" };
  if (s === "H") return { personne: "un homme", classe: "classé" };
  return { personne: "un·e joueur·se", classe: "classé·e" };
}

// --- Helpers "propres" ---
const clean = (v: unknown) => (v ?? "").toString().trim();

type SexKind = "H" | "F" | "AUTRE";

const fullTableau = (t?: string) => {
  const x = clean(t).toUpperCase();
  if (x === "DH" || x === "DOUBLE HOMME") return "Double Homme";
  if (x === "DD" || x === "DOUBLE DAME")  return "Double Dame";
  if (x === "DM" || x === "DOUBLE MIXTE") return "Double Mixte";
  if (x === "DI" || x === "DOUBLE INTERGENRE") return "Double Intergenre";
  // déjà en toutes lettres, on renvoie tel quel
  return clean(t);
};

function nounsForSex(sexRaw?: string) {
  const s = clean(sexRaw).toLowerCase();
  const isH = ["h", "homme", "m", "male", "masculin"].includes(s);
  const isF = ["f", "femme", "w", "female", "féminin", "feminin"].includes(s);
  const sex: SexKind = isH ? "H" : isF ? "F" : "AUTRE";

  if (sex === "H") {
    return {
      // pour la personne qui poste
      art: "un",
      noun: "joueur",
      classWord: "classé",
      // pour la personne recherchée
      partnerArt: "un",
      partnerNoun: "joueur",
      partnerClass: "classé",
    };
  }
  if (sex === "F") {
    return {
      art: "une",
      noun: "joueuse",
      classWord: "classée",
      partnerArt: "une",
      partnerNoun: "joueuse",
      partnerClass: "classée",
    };
  }
  return {
    art: "un·e",
    noun: "joueur·se",
    classWord: "classé·e",
    partnerArt: "un·e",
    partnerNoun: "joueur·se",
    partnerClass: "classé·e",
  };
}

/** "Je suis une joueuse classée R5 de 25 ans" / "... qui ne souhaite pas préciser son âge" / "... âge non précisé" */
function formatPlayer(sex?: string, classement?: string, age?: number | string) {
  const { art, noun, classWord } = nounsForSex(sex);
  const cl = clean(classement);
  const ageStr = clean(age);
  let agePart = "";

  if (ageStr) {
    // valeur présente et non vide
    agePart = ` de ${ageStr} ans`;
  } else {
    // pas d’info / non précisé
    agePart = ` qui ne souhaite pas préciser son âge`;
  }

  return `Je suis ${art} ${noun} ${classWord} ${cl}${agePart}`.replace(/\s+/g, " ").trim();
}

/** "Double Homme" (jamais d’abréviation) */
function formatWishTableau(t?: string) {
  const ft = fullTableau(t);
  return `Je souhaite jouer en ${ft}`.trim();
}

/** Classements de recherche : 
 * 1 -> "R6" ; 2 -> "R5 ou R6" ; 3+ -> "D9, D8, D7 ou R6"
 */
function formatListWithOu(values: string[]) {
  const arr = values.map(v => clean(v)).filter(Boolean);
  if (arr.length <= 1) return arr.join(", ");
  if (arr.length === 2) return `${arr[0]} ou ${arr[1]}`;
  const last = arr[arr.length - 1];
  return `${arr.slice(0, -1).join(", ")} ou ${last}`;
}



function useOutsideClose<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onClose]);
  return ref;
}

/* ---------- Pills multi-sélection + saisie ---------- */
type MultiFilterPillProps = {
  label: string;
  selected: string[];
  onChange: (v: string[]) => void;
  options: string[];
  width?: number;
  placeholder?: string;
  normalize?: (s: string) => string | null; // pour valider une saisie libre
};
function MultiFilterPill({ label, selected, onChange, options, width = 280, placeholder = "Rechercher…", normalize }: MultiFilterPillProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const s = q.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(s));
  }, [q, options]);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(x => x !== opt));
    else onChange([...selected, opt]);
  };

  const addManual = () => {
    const norm = normalize ? normalize(q.trim()) : q.trim();
    if (!norm) return;
    if (!selected.includes(norm)) onChange([...selected, norm]);
    setQ("");
  };

  return (
    <div className={`partners-pill ${selected.length ? "is-active" : ""}`} ref={ref}>
      <button type="button" className="partners-pill__btn" onClick={() => setOpen(v => !v)}>
        {label}{selected.length ? ` : ${selected.join(", ")}` : ""}
        <span className="partners-pill__caret" aria-hidden>▾</span>
      </button>

      {open && (
        <div className="partners-pill__menu" style={{ width }}>
          <div className="partners-pill__chips">
            {selected.map(v => (
              <button key={v} className="partners-chip" onClick={() => toggle(v)} title="Retirer">{v} ✕</button>
            ))}
            <input
              className="partners-pill__search"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e)=>{ if (e.key === "Enter") { e.preventDefault(); addManual(); }}}
            />
            <button className="partners-chip partners-chip--add" onClick={addManual} title="Ajouter">+ Ajouter</button>
          </div>
          <div className="partners-pill__list">
            {filtered.map(opt => (
              <button
                key={opt}
                className={`partners-pill__opt ${selected.includes(opt) ? "is-selected": ""}`}
                onClick={() => toggle(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="partners-pill__footer">
            <button className="partners-pill__opt is-clear" onClick={()=>onChange([])}>Réinitialiser</button>
            <button className="partners-pill__opt" onClick={()=>setOpen(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Sort (avec ouverture/fermeture) ---------- */
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

const Em = ({ children }: { children: React.ReactNode }) => (
  <span className="partners-em">{children}</span>
);

/* ===================== Page ===================== */
export default function PartenairesPage() {
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres (multi)
  const [depts, setDepts] = useState<string[]>([]);
  const [tableaux, setTableaux] = useState<string[]>([]);
  const [classements, setClassements] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("date-asc");

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
    url.searchParams.set("sort", sort); // 👈

    setLoading(true);
    fetch(url.toString())
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [depts, tableaux, classements, sort]); // 👈 n’oublie pas "sort"


  /* ----- Tri client ----- */
  const sorted = useMemo(() => {
    const clone = [...items];
    const parseStart = (ad: Ad) => ad.dates?.start ? Date.parse(ad.dates.start) : Number.POSITIVE_INFINITY;
    if (sort === "date-asc") clone.sort((a,b)=>parseStart(a)-parseStart(b));
    if (sort === "date-desc") clone.sort((a,b)=>parseStart(b)-parseStart(a));
    if (sort === "recents")   clone.sort((a,b)=> (Date.parse(b.created_at||"")||0) - (Date.parse(a.created_at||"")||0));
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
          <MultiFilterPill label="Département" selected={depts} onChange={setDepts} options={DEPTS} width={260} placeholder="Département (ex: 92, 2A, 971)" normalize={normDept}/>
          <MultiFilterPill label="Tableau"     selected={tableaux} onChange={setTableaux} options={[...TABLEAUX]} width={260}/>
          <MultiFilterPill label="Classement"  selected={classements} onChange={setClassements} options={[...CLASSEMENTS]} width={260}/>
          
          <span className="partners-filterbar__label partners-filterbar__label--split">Trier par :</span>
          <SortPill sort={sort} setSort={setSort}/>
        </div>
      </header>

      {/* LISTE */}
      <section className="partners-cards">
        {loading && <div className="partners-loading">Chargement…</div>}
        {!loading && sorted.length === 0 && (
          <div className="partners-empty">Aucune annonce pour ces filtres.</div>
        )}

        {sorted.map((ad) => {
          // --- nettoyage & normalisation ---
          const tournoi   = clean(ad.tournoi || ad.titre);
          const ville     = clean(ad.ville);
          const dept      = clean(ad.dept);
          const sex       = clean(ad.sexe);
          const classement= clean(ad.classement);
          const age = ad.age_hidden ? "" : (ad.age ?? ""); 

          const wishTab   = fullTableau(ad.tableau);
          // recherche de classement : string "R5,R6" OU tableau
          const searchCls = Array.isArray(ad.rechercheClassement)
            ? ad.rechercheClassement.map(clean)
            : (clean(ad.rechercheClassement) ? clean(ad.rechercheClassement).split(/[,\s;/]+/) : []);

          return (
            <article key={ad.id} className="partners-card">
              {/* Titre + bouton externe (désactivé, tooltip) */}
              <header className="partners-card__head">
                <h3 className="partners-card__title">{tournoi || "Annonce"}</h3>

                <button type="button" className="btn btn--ghost is-soon partners-card__ext" aria-disabled="true" title="Bientôt disponible">
                  <span className="nowrap">Fiche BadNet</span>
                  <span className="tooltip">Bientôt disponible</span>
                </button>

              </header>

              {/* Métadonnées : dates + lieu */}
              <ul className="partners-card__meta">
                <li className="i-date">
                  {ad.dates?.start && ad.dates?.end ? (
                    <>Du {NBSP}<span className="strong">{fmtDate(ad.dates.start)}</span>{NBSP}au{NBSP}<span className="strong">{fmtDate(ad.dates.end)}</span></>
                  ) : ad.dates?.start ? (
                    <><span className="strong">{fmtDate(ad.dates.start)}</span></>
                  ) : ad.dates?.text ? (
                    <>{ad.dates.text}</>
                  ) : <>Dates à préciser</>}
                </li>

                <li className="i-place">
                  <span className="strong">{(ad.ville || "").trim()}</span>
                  {ad.dept ? <><span>,{NBSP}</span><span className="strong">{ad.dept}</span></> : null}
                </li>


              </ul>

              {/* identité */}
              <div className="desc-line i-id">
                {(() => {
                  const { noun, classWord } = nounsForSex(ad.sexe);
                  const cl  = (ad.classement || "").trim();
                  const age = ad.age;
                  return (
                    <>
                      Je suis {NBSP}<span className="strong">{noun}</span>
                      {cl && <> {NBSP}{classWord}{NBSP}<span className="strong">{cl}</span></>}
                      {ad.age_hidden
                        ? <> {NBSP}qui ne souhaite pas préciser son âge</>
                        : (typeof age === "number" && !Number.isNaN(age))
                            ? <> {NBSP}de{NBSP}<span className="strong">{age}</span>{NBSP}ans</>
                            : null}
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
              {(ad.rechercheSexe || ad.rechercheClassement) && (
                <div className="desc-line i-search">
                  {(() => {
                    const wanted = nounsForSex(ad.rechercheSexe);
                    const raw = Array.isArray(ad.rechercheClassement)
                      ? ad.rechercheClassement
                      : (ad.rechercheClassement ? String(ad.rechercheClassement).split(/[,\s;/]+/) : []);
                    const list = listWithOu(raw);
                    return (
                      <>
                        Je souhaite jouer avec {NBSP}<span className="strong">{wanted.noun}</span>
                        {list && <> {NBSP}{wanted.classWord}{NBSP}<span className="strong">{list}</span></>}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* CTA (temporaire : lien externe) */}
              <div className="partners-card__cta">
                <Link className="cta-primary" href={`/partenaires/contact/${ad.id}`}>Contacter</Link>
              </div>

            </article>
          );
        })}

      </section>
    </main>
  );
}
