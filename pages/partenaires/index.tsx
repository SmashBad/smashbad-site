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

/* ---------- Helpers ---------- */
const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function sexeLabel(s?: string) {
  if (s === "F") return { personne: "une femme", classe: "classée" };
  if (s === "H") return { personne: "un homme", classe: "classé" };
  return { personne: "un·e joueur·se", classe: "classé·e" };
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
    if (depts.length) url.searchParams.set("dept", depts.join(","));
    if (tableaux.length) url.searchParams.set("tableau", tableaux.join(","));
    if (classements.length) url.searchParams.set("classement", classements.join(","));

    setLoading(true);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [depts, tableaux, classements]);

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
          <MultiFilterPill label="Département" selected={depts} onChange={setDepts} options={DEPTS} width={260} placeholder="Département (ex: 92, 2A, 971)" normalize={normDept}/>
          <MultiFilterPill label="Tableau"     selected={tableaux} onChange={setTableaux} options={[...TABLEAUX]} width={260}/>
          <MultiFilterPill label="Classement"  selected={classements} onChange={setClassements} options={[...CLASSEMENTS]} width={260}/>
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
          const g = sexeLabel(ad.sexe);
          return (
            <article key={ad.id} className="partners-card">
              <div className="partners-card__head">
                <h3 className="partners-card__title">{ad.tournoi || "Annonce"}</h3>
                <a
                  className="btn btn--ghost partners-card__ext"
                  href={ad.lienBadNet || "https://badnet.fr/"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Fiche BadNet
                </a>
              </div>

              <ul className="partners-card__meta">
                <li className="i-date">
                  {ad.dates?.start || ad.dates?.end ? (
                    <>Du {fmtDate(ad.dates?.start)} au {fmtDate(ad.dates?.end)}</>
                  ) : (
                    <>{ad.dates?.text || "Dates à préciser"}</>
                  )}
                </li>
                <li className="i-place">
                  <strong>{ad.ville || "Ville ?"}</strong>
                  {ad.dept ? `, ${ad.dept}` : ""}
                </li>
              </ul>

              <div className="partners-card__desc">
                <div className="desc-line i-id">
                  Je suis {g.personne}
                  {ad.classement ? <> {g.classe} <strong>{ad.classement}</strong></> : null}
                </div>

                {ad.tableau && (
                  <div className="desc-line i-draw">
                    Je souhaite jouer en <strong>{ad.tableau}</strong>
                  </div>
                )}

                {(ad.rechercheSexe || ad.rechercheClassement) && (
                  <div className="desc-line i-search">
                    Je souhaite jouer avec&nbsp;
                    {ad.rechercheSexe && (
                      <>
                        {ad.rechercheSexe === "F" ? "une " : ad.rechercheSexe === "H" ? "un " : ""}
                        <strong>{ad.rechercheSexe === "F" ? "femme" : ad.rechercheSexe === "H" ? "homme" : ad.rechercheSexe}</strong>
                      </>
                    )}
                    {ad.rechercheSexe && ad.rechercheClassement ? " classé(e) " : ""}
                    {ad.rechercheClassement && <strong>{ad.rechercheClassement}</strong>}
                  </div>
                )}
              </div>

              <div className="partners-card__cta">
                <a className="cta-primary" href={ad.lienBadNet || "https://badnet.fr/"} target="_blank" rel="noreferrer">
                  Contacter
                </a>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
