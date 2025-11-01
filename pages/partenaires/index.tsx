import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ---------- Types ----------
type Ad = import("../../lib/data/airtable_annonces_partenaires").AdPublic;

// ---------- Constantes ----------
const NBSP = "\u2009";
const TABLEAUX = ["Double Dame", "Double Homme", "Double Mixte", "Double Intergenre"] as const;
const CLASSEMENTS = ["N1","N2","N3","R4","R5","R6","D7","D8","D9","P10","P11","P12","NC"] as const;

// Départements : 01..19, 2A/2B, 21..95, 971..976
const DEPTS = [
  ...Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0")),
  "2A", "2B",
  ...Array.from({ length: 95 - 21 + 1 }, (_, i) => String(21 + i)),
  ...Array.from({ length: 6 }, (_, i) => String(971 + i)),
];

// ---------- Helpers génériques ----------
const isHttpUrl = (s?: unknown) => /^https?:\/\//i.test(toStr(s));

const toStr = (v: unknown) => (v ?? "").toString().trim();

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// parse "YYYY-MM-DD", "DD/MM/YYYY", ISO ou Date → timestamp ou NaN
const parseDateSafe = (v?: unknown): number => {
  if (!v) return Number.NaN;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.getTime();
  const s = toStr(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s + "T12:00:00Z").getTime(); // ISO court
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);                                // FR
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00Z`).getTime();
  const t = Date.parse(s);
  return Number.isNaN(t) ? Number.NaN : t;
};

// priorité à la date de création de l’annonce (si dispo), sinon date de tournoi
const getEffectiveDate = (ad: any): number => {
  const created = ad?.created_at || ad?.createdAt || ad?._createdTime || ad?.created || ad?.createdTime;
  const t = parseDateSafe(created);
  return Number.isNaN(t) ? parseDateSafe(ad?.date) : t;
};

// sexe → "H" | "F" | "AUTRE"
type SexKind = "H" | "F" | "AUTRE";
const normalizeSex = (raw?: string): SexKind => {
  const s = toStr(raw).toLowerCase();
  if (["h", "homme", "m", "masculin", "male"].includes(s)) return "H";
  if (["f", "femme", "w", "féminin", "feminin", "female"].includes(s)) return "F";
  return "AUTRE";
};

// "un joueur" / "une joueuse" / "" (identité) / "un joueur ou une joueuse" (recherche)
const personLabel = (sexRaw?: string, context: "id" | "search" = "id") => {
  const s = normalizeSex(sexRaw);
  if (context === "id") {
    if (s === "H") return "un joueur";
    if (s === "F") return "une joueuse";
    return ""; // on tait si non défini
  } else {
    if (s === "H") return "un joueur";
    if (s === "F") return "une joueuse";
    return "un joueur ou une joueuse";
  }
};

// accord de "classé"
const classWordFor = (sexRaw?: string, forceNeutral = false) => {
  const s = normalizeSex(sexRaw);
  if (forceNeutral || s === "AUTRE") return "classé(e)";
  return s === "F" ? "classée" : "classé";
};

// DD/DH/DM/DI → libellé
const expandTableau = (t?: string) => {
  const x = toStr(t).toUpperCase();
  if (x === "DD" || x === "DOUBLE DAME")        return "Double Dame";
  if (x === "DH" || x === "DOUBLE HOMME")       return "Double Homme";
  if (x === "DM" || x === "DOUBLE MIXTE")       return "Double Mixte";
  if (x === "DI" || x === "DOUBLE INTERGENRE")  return "Double Intergenre";
  return toStr(t);
};

// "R5 ou R6" / "D9, D8, D7 ou R6"
const listWithOu = (arr: string[]) => {
  const a = arr.map(toStr).filter(Boolean);
  if (a.length === 0) return "";
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} ou ${a[1]}`;
  return `${a.slice(0, -1).join(", ")} ou ${a[a.length - 1]}`;
};

// ---------- UI util : fermeture au clic externe ----------
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

// ---------- UI : MultiFilter (dropdown avec recherche) ----------
type MultiFilterPillProps = {
  label: string;
  selected: string[];
  onChange: (v: string[]) => void;
  options: readonly string[];
  width?: number;
  placeholder?: string;
  normalize?: (s: string) => string | null; // pour valider saisie libre
};
function MultiFilterPill({ label, selected, onChange, options, width = 220, placeholder = "Rechercher…", normalize }: MultiFilterPillProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));
  const opts = useMemo(() => options.map(String), [options]);

  const filtered = useMemo(() => {
    if (!q.trim()) return opts;
    const qq = q.toLowerCase();
    return opts.filter(o => o.toLowerCase().includes(qq));
  }, [q, opts]);

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
                if (e.key === "Enter" || e.key === "Escape") setOpen(false);
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

// ---------- UI : Sort (liste simple) ----------
type SortKey = "recents" | "recent-asc" | "date-desc" | "date-asc" | "alpha";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "recents",    label: "Plus récentes" },
  { key: "recent-asc", label: "Moins récentes" },
  { key: "date-desc",  label: "Date du tournoi ↓" },
  { key: "date-asc",   label: "Date du tournoi ↑" },
  { key: "alpha",      label: "A → Z (tournoi)" },
];

function SortPill({ sort, setSort }: { sort: SortKey; setSort: (s: SortKey)=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(open, ()=>setOpen(false));
  return (
    <div className="partners-pill" ref={ref}>
      <button className="partners-pill__btn" onClick={()=>setOpen(v=>!v)}>
        {SORTS.find(s=>s.key===sort)?.label}<span className="partners-pill__caret">▾</span>
      </button>
      {open && (
        <div className="partners-pill__menu" style={{ width: 180 }}>
          {SORTS.map(s => (
            <button
              key={s.key}
              className={`partners-pill__opt ${s.key===sort?"is-selected":""}`}
              onClick={()=>{ setSort(s.key); setOpen(false); }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== Page =====================
export default function PartenairesIndexPage() {
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [depts, setDepts] = useState<string[]>([]);
  const [tableaux, setTableaux] = useState<string[]>([]);
  const [classements, setClassements] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("recents");

  // normaliser une saisie département (ex: "92", "2a", "971")
  const normDept = (s: string) => {
    const up = s.toUpperCase();
    if (/^(?:\d{1,2}|97[1-6]|2A|2B)$/.test(up)) return /^\d{1}$/.test(up) ? up.padStart(2,"0") : up;
    return null;
  };

  // ---- Fetch (tri côté client → on n’envoie pas "sort") ----
  useEffect(() => {
    const url = new URL("/api/partners/list", window.location.origin);
    if (depts.length)       url.searchParams.set("dept", depts.join(","));
    if (tableaux.length)    url.searchParams.set("tableau", tableaux.join(","));
    if (classements.length) url.searchParams.set("classement", classements.join(","));

    setLoading(true);
    fetch(url.toString())
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [depts, tableaux, classements]);

  // ---- Tri client robuste ----
  const sorted = useMemo(() => {
    const arr = [...items];

    if (sort === "recents") {
      arr.sort((a, b) => getEffectiveDate(b) - getEffectiveDate(a)); // plus récentes en haut
    } else if (sort === "recent-asc") {
      arr.sort((a, b) => getEffectiveDate(a) - getEffectiveDate(b));
    } else if (sort === "date-asc") {
      arr.sort((a, b) => parseDateSafe(a.date) - parseDateSafe(b.date));
    } else if (sort === "date-desc") {
      arr.sort((a, b) => parseDateSafe(b.date) - parseDateSafe(a.date));
    } else if (sort === "alpha") {
      arr.sort((a, b) => toStr(a.tournoi).localeCompare(toStr(b.tournoi), "fr", { sensitivity: "base" }));
    }

    return arr;
  }, [items, sort]);

  return (
    <main className="partners-page">
      {/* HERO */}
      <header className="partners-hero">
        <h1>Chercher un partenaire pour un tournoi</h1>
        <p>
          Dépose ton annonce et contacte des joueurs/joueuses pour jouer en tournoi près de chez toi.
          <br />
          Aucune coordonnée ne sera partagée publiquement.
        </p>

        <div className="partners-hero__actions">
          <Link className="cta-primary partners-cta" href="/partenaires/depot">
            Déposer une annonce
          </Link>
        </div>

        {/* FILTRES + TRI */}
        <div className="partners-filterbar" role="group" aria-label="Filtres d’annonces">
          <span className="partners-filterbar__label">Filtrer par :</span>

          {/* ⬇️ nouveau wrapper */}
          <div className="partners-filterstripWrap">
            <div className="partners-filterstrip">
              <MultiFilterPill
                label="Département"
                selected={depts} onChange={setDepts}
                options={DEPTS} width={300}
                placeholder="Département (ex: 92, 2A, 971)"
                normalize={normDept}
              />
              <MultiFilterPill
                label="Tableau"
                selected={tableaux} onChange={setTableaux}
                options={TABLEAUX} width={260}
              />
              <MultiFilterPill
                label="Classement"
                selected={classements} onChange={setClassements}
                options={CLASSEMENTS} width={360}
              />
            </div>
          </div>

          <span className="partners-filterbar__label">Tri :</span>
          <div className="partners-sort">
            <SortPill sort={sort} setSort={setSort} />
          </div>
        </div>

      </header>

      {/* LISTE */}
      {loading && <div className="partners-empty">Chargement…</div>}
      {!loading && sorted.length === 0 && (
        <div className="partners-empty">Aucune annonce pour ces filtres.</div>
      )}

      <section className="partners-cards">
        {sorted.map((ad) => {
          const tournoi = toStr(ad.tournoi);
          const ville   = toStr(ad.ville);
          const dept    = toStr(ad.dept_code);
          const createdTs =
            parseDateSafe((ad as any).created_at || (ad as any).createdAt || (ad as any)._createdTime || (ad as any).created || (ad as any).createdTime);
          const createdLabel = Number.isNaN(createdTs)
            ? null
            : new Date(createdTs).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

          return (
            <article key={ad.id} className="partners-card">
              {/* Titre + bouton externe (placeholder) */}
              <header className="partners-card__head">
                <h3 className="partners-card__title">{tournoi || "Annonce"}</h3>

                {isHttpUrl((ad as any).badnet_url) ? (
                  <a
                    href={toStr((ad as any).badnet_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost partners-card__ext"
                    aria-label="Ouvrir la fiche tournoi sur BadNet (nouvel onglet)"
                    title="Ouvrir sur BadNet"
                  >
                    <span className="nowrap">Infos Tournoi</span>
                    <span className="tooltip">Accéder au Tournoi sur BadNet</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    className="btn btn--ghost partners-card__ext"
                    aria-disabled="true"
                    title="Bientôt disponible"
                  >
                    <span className="nowrap">Infos Tournoi</span>
                    <span className="tooltip">Bientôt disponible</span>
                  </button>
                )}
              </header>

              {/* Métadonnées : date du tournoi + lieu */}
              <ul className="partners-card__meta">
                <li className="i-date">
                  {ad.date ? <span className="strong">{fmtDate(ad.date)}</span> : <>Date à préciser</>}
                </li>
                <li className="i-place">
                  <span className="strong">{ville}</span>
                  <span className="sep">,</span>
                  <span className="strong">{dept}</span>
                </li>
              </ul>

              {/* Identité */}
              <div className="desc-line i-id">
                {(() => {
                  const label = personLabel(ad.sexe, "id"); // "" si non défini
                  const cl    = toStr(ad.classement);
                  const age   = ad.age;
                  const classWord = classWordFor(ad.sexe, !label);

                  return (
                    <>
                      Je suis{NBSP}
                      {label ? <><span className="strong">{label}</span>{NBSP}</> : null}

                      {/* classement */}
                      {cl ? <>{classWord}{NBSP}<span className="strong">{cl}</span></> : <>classé(e)</>}

                      {/* âge */}
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

              {/* Tableau */}
              {ad.tableau && (
                <div className="desc-line i-draw">
                  Je souhaite jouer en {NBSP}<span className="strong">{expandTableau(ad.tableau)}</span>
                </div>
              )}

              {/* Recherche */}
              {(ad.search_sex || ad.search_ranking) && (
                <div className="desc-line i-search">
                  {(() => {
                    const person = personLabel(ad.search_sex, "search");
                    const raw = Array.isArray(ad.search_ranking)
                      ? ad.search_ranking
                      : (ad.search_ranking ? String(ad.search_ranking).split(/[,\s;/]+/) : []);
                    const list = listWithOu(raw);
                    const classWord = classWordFor(ad.search_sex);

                    return (
                      <>
                        Je souhaite jouer avec{" "}
                        {person.includes("ou") ? (
                          <span className="strong">{person}</span>
                        ) : (
                          <>
                            <span className="strong">{person.split(" ")[0]}</span>{" "}
                            <span className="strong">{person.split(" ")[1]}</span>
                          </>
                        )}
                        {list && <> {NBSP}{classWord}{NBSP}<span className="strong">{list}</span></>}
                        {(() => {
                          const rawNotes = (ad as any).notes ?? "";
                          const notes = String(rawNotes);
                          const hasNotes = notes.trim().length > 0;
                          const notesHtml = notes.replace(/\n/g, "<br />");

                          return (
                            <span className="notes-ic-wrap">
                              <button
                                type="button"
                                className={`notes-ic-btn ${hasNotes ? "" : "is-empty"}`}
                                aria-label={hasNotes ? "Lire le message de l’annonce" : "Aucun message saisi"}
                                title={hasNotes ? "Message" : "Aucun message"}
                                onClick={(e) => {
                                  // Mobile : tap pour ouvrir / refermer
                                  const el = e.currentTarget;
                                  el.getAttribute("data-open")
                                    ? el.removeAttribute("data-open")
                                    : el.setAttribute("data-open", "1");
                                }}
                              >
                                <img src="/Message.svg" alt="" className="notes-ic" width={20} height={20} />

                                {hasNotes ? (
                                  <span
                                    className="tooltip tooltip--notes"
                                    dangerouslySetInnerHTML={{ __html: notesHtml }}
                                  />
                                ) : (
                                  <span className="tooltip tooltip--notes">Aucun message</span>
                                )}
                              </button>
                            </span>
                          );
                        })()}

                      </>
                    );
                  })()}
                </div>
              )}

              {/* Actions */}
              <footer className="partners-card__foot">
                <em className="partners-card__created">
                  {createdLabel ? `date de l'annonce : ${createdLabel}` : ""}
                </em>
                <Link href={`/partenaires/${ad.id}`} className="btn">
                  Contacter
                </Link>
              </footer>
            </article>
          );
        })}
      </section>
    </main>
  );
}
