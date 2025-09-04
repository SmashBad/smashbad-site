import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// Type des annonces (vient de lib/data/airtable_annonces_partenaires.ts)
type Ad = import("../../lib/data/airtable_annonces_partenaires").AdPublic;

/* ---------- Constantes filtres ---------- */
const DEPTS = Array.from({ length: 95 }, (_, i) => String(i + 1).padStart(2, "0"));
const TABLEAUX = ["Double Dame", "Double Homme", "Double Mixte", "Double Intergenre"] as const;
const CLASSEMENTS = ["N1","N2","N3","R4","R5","R6","D7","D8","D9","P10","P11","P12","NC"] as const;

type SortKey = "date-asc" | "date-desc" | "recents";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "date-asc",  label: "date : du plus récent au plus lointain" },
  { key: "date-desc", label: "date : du plus lointain au plus récent" },
  { key: "recents",   label: "annonces récentes" },
];

/* ---------- Petits helpers ---------- */
const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("fr-FR");
};

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

/* ---------- Composant generic FilterPill ---------- */
type FilterPillProps = {
  label: string;
  value?: string;
  onChange: (v?: string) => void;
  options: string[];
  width?: number;
};
function FilterPill({ label, value, onChange, options, width = 240 }: FilterPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div className={`partners-pill ${value ? "is-active" : ""}`} ref={ref}>
      <button type="button" className="partners-pill__btn" onClick={() => setOpen((v) => !v)}>
        {label} {value ? `: ${value}` : ""}
        <span className="partners-pill__caret" aria-hidden>▾</span>
      </button>
      {open && (
        <div className="partners-pill__menu" style={{ width }}>
          <button className="partners-pill__opt is-clear" onClick={() => { onChange(undefined); setOpen(false); }}>
            Réinitialiser
          </button>
          <div className="partners-pill__list">
            {options.map((opt) => (
              <button
                key={opt}
                className={`partners-pill__opt ${opt === value ? "is-selected" : ""}`}
                onClick={() => { onChange(opt); setOpen(false); }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Page ===================== */
export default function PartenairesPage() {
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [dept, setDept] = useState<string | undefined>(undefined);
  const [tableau, setTableau] = useState<string | undefined>(undefined);
  const [classement, setClassement] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<SortKey>("date-asc");

  /* ----- Fetch des annonces (via /api) ----- */
  useEffect(() => {
    const url = new URL("/api/partners/list", window.location.origin);
    if (dept) url.searchParams.set("dept", dept);
    if (tableau) url.searchParams.set("tableau", tableau);
    if (classement) url.searchParams.set("classement", classement);

    setLoading(true);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [dept, tableau, classement]);

  /* ----- Tri client léger ----- */
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
          {/* Pour l’instant inactif : on branchera plus tard */}
          <a className="cta-primary partners-cta" href="#" aria-disabled>
            Déposer une annonce
          </a>
        </div>

        {/* FILTRES */}
        <div className="partners-filterbar" role="group" aria-label="Filtres d’annonces">
          <FilterPill label="Département"   value={dept}      onChange={setDept}      options={DEPTS} width={220} />
          <FilterPill label="Tableau"       value={tableau}   onChange={setTableau}   options={[...TABLEAUX]} width={260} />
          <FilterPill label="Classement"    value={classement}onChange={setClassement}options={[...CLASSEMENTS]} width={260} />
          <div className="partners-pill">
            <button className="partners-pill__btn">{SORTS.find(s=>s.key===sort)?.label}<span className="partners-pill__caret">▾</span></button>
            <div className="partners-pill__menu" style={{ width: 260 }}>
              {SORTS.map(s => (
                <button key={s.key} className={`partners-pill__opt ${s.key===sort?"is-selected":""}`} onClick={() => setSort(s.key)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* LISTE */}
      <section className="partners-cards">
        {loading && <div className="partners-loading">Chargement…</div>}
        {!loading && sorted.length === 0 && (
          <div className="partners-empty">Aucune annonce pour ces filtres.</div>
        )}

        {sorted.map((ad) => (
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
                {/* 📅 */}
                {ad.dates?.start || ad.dates?.end ? (
                  <>Du {fmtDate(ad.dates?.start)} au {fmtDate(ad.dates?.end)}</>
                ) : (
                  <>{ad.dates?.text || "Dates à préciser"}</>
                )}
              </li>
              <li className="i-place">
                {/* 📍 */}
                <strong>{ad.ville || "Ville ?"}</strong>
                {ad.dept ? `, ${ad.dept}` : ""}
              </li>
            </ul>

            <div className="partners-card__desc">
              {/* Ligne 1 : personne */}
              <div className="desc-line i-id">
                {/* 🪪 */}
                {ad.sexe ? (ad.sexe === "F" ? "Je suis une " : "Je suis un ") : "Je suis "}
                <strong>{ad.sexe === "F" ? "femme" : ad.sexe === "H" ? "homme" : "joueur/joueuse"}</strong>
                {ad.classement ? <> classé(e) <strong>{ad.classement}</strong></> : null}
              </div>

              {/* Ligne 2 : tableau */}
              {ad.tableau && (
                <div className="desc-line i-draw">
                  {/* 🏆 */}
                  Je souhaite jouer en <strong>{ad.tableau}</strong>
                </div>
              )}

              {/* Ligne 3 : recherche */}
              {(ad.rechercheSexe || ad.rechercheClassement) && (
                <div className="desc-line i-search">
                  {/* 🔎 */}
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
              {/* Pour l’instant : lien externe. On branchera le vrai formulaire de contact ensuite. */}
              <a className="cta-primary" href={ad.lienBadNet || "https://badnet.fr/"} target="_blank" rel="noreferrer">
                Contacter
              </a>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
