import React, { useMemo, useState } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

type Tag = "Seul" | "Avec volant" | "Renforcement" | "Routine";

type Exercise = {
  id: string;
  title: string;
  pitch: string;
  tags: Tag[];
  status: "active" | "soon";
  mode?: "play" | "read"; // play = interactif, read = consignes
  href?: string; // pour les actifs
};

const ALL_TAGS: Tag[] = ["Seul", "Avec volant", "Renforcement", "Routine"];

// Données de départ : Shadow actif, le reste en "bientôt"
const EXERCISES: Exercise[] = [
  {
    id: "shadow",
    title: "Shadow",
    pitch: "Déplace-toi vite et proprement : l’essentiel sans volant.",
    tags: ["Seul"],
    status: "active",
    // 👉 Choisis l'URL que tu veux : "/entrainements/shadow" ou "/shadow"
    href: "/shadow",
  },
  {
    id: "ex2",
    title: "Exercice à venir",
    pitch: "(à venir).",
    tags: [],
    status: "soon",
  },
  {
    id: "ex3",
    title: "Exercice à venir",
    pitch: "(à venir).",
    tags: [],
    status: "soon",
  },
  {
    id: "ex4",
    title: "Exercice à venir",
    pitch: "(à venir).",
    tags: [],
    status: "soon",
  },
];

export default function Entrainements() {
  // Multi-sélection des filtres
  const [activeTags, setActiveTags] = useState<Set<Tag>>(new Set()); // vide = tout afficher

  const toggleTag = (t: Tag) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const filtered = useMemo(() => {
    // Si aucun filtre : on montre tout (Shadow y compris)
    if (activeTags.size === 0) return EXERCISES;
    // Sinon, on garde les exos qui contiennent TOUS les tags actifs
    return EXERCISES.filter((ex) =>
      [...activeTags].every((t) => ex.tags.includes(t))
    );
  }, [activeTags]);

  return (
    <>
      <Head>
        <title>SMASH — Entraînements</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="trainings">
        <div className="trainings__wrap">
          <h1 className="trainings__title">Des exercices pour mieux performer</h1>

          {/* Filtres */}
          <div className="trainings__filters" aria-label="Filtres d’exercices">
            {ALL_TAGS.map((tag) => {
              const active = activeTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`chip ${active ? "chip--active" : ""}`}
                  aria-pressed={active}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Grille d’exercices */}
          {filtered.length === 0 ? (
            <div className="trainings__empty">
              <p>Aucun exercice ne correspond à ces filtres.</p>
              <button
                type="button"
                className="chip"
                onClick={() => setActiveTags(new Set())}
              >
                Tout afficher
              </button>
            </div>
          ) : (
            <section className="ex-grid" aria-live="polite">
              {filtered.map((ex) => (
                <article
                  key={ex.id}
                  className={`ex-card ${
                    ex.status === "soon" ? "ex-card--soon" : ""
                  }`}
                >
                  <div className="ex-card__body">
                    <h2 className="ex-card__title">{ex.title}</h2>
                    <p className="ex-card__pitch">{ex.pitch}</p>

                    <ul className="ex-card__tags" aria-label="Catégories">
                      {ex.tags.map((t) => (
                        <li key={t} className="ex-card__tag">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="ex-card__cta">
                    {ex.status === "active" && ex.href ? (
                        ex.mode === "read" ? (
                        <a href={ex.href} className="cta-secondary">
                            Voir
                        </a>
                        ) : (
                        <a href={ex.href} className="cta-primary">
                            Démarrer
                        </a>
                        )
                    ) : (
                        <span className="cta-disabled" aria-disabled="true">
                        Bientôt disponible
                        </span>
                    )}
                    </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
