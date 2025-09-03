import { useEffect, useState } from "react";
import Link from "next/link";

type Ad = import("../../lib/data/airtable").AdPublic;

export default function PartenairesPage(){
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres basiques (tu pourras les binder à tes pills)
  const [dept, setDept] = useState<string | undefined>(undefined);
  const [draw, setDraw] = useState<string | undefined>(undefined);
  const [ranking, setRanking] = useState<string | undefined>(undefined);

  useEffect(() => {
    const url = new URL("/api/partners/list", window.location.origin);
    if (dept) url.searchParams.set("dept", dept);
    if (draw) url.searchParams.set("draw", draw);
    if (ranking) url.searchParams.set("ranking", ranking);

    setLoading(true);
    fetch(url.toString())
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [dept, draw, ranking]);

  return (
    <main className="partners-page">
      <header className="hero">
        <h1>Chercher un partenaire pour un tournoi</h1>
        <p>Dépose ton annonce… Aucune coordonnée ne sera partagée publiquement.</p>
        <div className="actions">
          {/* CTA Déposer → pour le moment tu peux pointer vers un form Airtable privé */}
          <a className="cta-primary" href="#" aria-disabled>Déposer une annonce</a>
        </div>
        {/* Filtres (placeholder) */}
        <div className="filters">
          <button className="pill" onClick={() => setDept("92")}>Département : 92</button>
          <button className="pill" onClick={() => setDraw("DD")}>Tableau : DD</button>
          <button className="pill" onClick={() => setRanking("D9")}>Classement : D9</button>
          <button className="pill pill--ghost" onClick={() => {setDept(undefined); setDraw(undefined); setRanking(undefined);}}>Réinitialiser</button>
        </div>
      </header>

      <section className="cards">
        {loading && <div className="loading">Chargement…</div>}
        {!loading && items.length === 0 && <div className="empty">Aucune annonce pour ces filtres.</div>}

        {items.map(ad => (
          <article key={ad.id} className="ad-card">
            <div className="ad-card__head">
              <h3>{ad.title}</h3>
              {ad.event_link && (
                <a className="btn btn--ghost" href={ad.event_link} target="_blank" rel="noreferrer">Fiche BadNet</a>
              )}
            </div>

            <ul className="ad-card__meta">
              <li>📅 {ad.dates?.start} → {ad.dates?.end}</li>
              <li>📍 {ad.city}{ad.dept ? `, ${ad.dept}` : ""}</li>
              <li>🎯 {ad.draw || "?"} · {ad.ranking || "classement ?"} · {ad.sex === "F" ? "femme" : ad.sex === "H" ? "homme" : "?"}</li>
            </ul>

            {ad.looking_for && <p className="ad-card__desc">{ad.looking_for}</p>}

            <div className="ad-card__cta">
              <Link href={`/partenaires/${ad.id}`} className="btn cta-secondary">Contacter</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
