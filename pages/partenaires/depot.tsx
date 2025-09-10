import { useState } from "react";
import { CLASSEMENTS, TABLEAUX, DEPARTEMENTS } from "../../schemas/partners";

export default function DepotAnnoncePage() {
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // champs contrôlés (simples). On laisse la validation “forte” à l’API + (plus tard) zod côté client si tu veux.
  const [form, setForm] = useState({
    tournoi: "",
    ville: "",
    dept: "",
    date_text: "",
    tableau: "",
    sexe: "",
    classement: "",
    age: "",
    age_masque: false,
    recherche_sexe: "AUTRE",
    recherche_classement: [] as string[],
    name :"",
    email: "",
    notes: "",
    hp: "" // honeypot
  });

  const setField = (k: string, v: any) => setForm(s => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null); setErr(null);
    setSubmitting(true);
    try {
      const body = {
        // tournoi
        tournoi: form.tournoi,
        ville: form.ville,
        dept_code: form.dept,
        date: form.date_text,                  // string "YYYY-MM-DD"
        tableau: form.tableau,
        classement: form.classement,

        // identité
        sexe: sexOut(form.sexe as "H"|"F"),    // "Homme" | "Femme"
        age: form.age ? Number(form.age) : undefined,
        age_public: !form.age_masque,              // coché = ne pas afficher → true
        name: form.name,
        contact_email: form.email,

        // recherche
        search_sex: searchSexOut(form.recherche_sexe as "H"|"F"|"AUTRE"),
        search_ranking: form.recherche_classement,

        // divers
        notes: form.notes,

        // honeypot (on l’envoie VIDE pour passer les contrôles serveur)
        hp: form.hp || ""
      };

      if (!form.sexe) {
        setErr("Merci de choisir « Tu es » : un joueur ou une joueuse.");
        setSubmitting(false);
        return;
      }


      const res = await fetch("/api/partners/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        console.warn(json);
        setErr("Impossible d’enregistrer l’annonce. Vérifie les champs puis réessaie.");
      } else {
        setOk("Merci ! Ton annonce a été déposée. Elle sera vérifiée et publiée rapidement.");
        setForm({
          tournoi:"", ville:"", dept:"", date_text:"", tableau:"",
          sexe:"", classement:"", age:"", age_masque:false,
          recherche_sexe:"AUTRE", recherche_classement:[],
          name:"", email:"", notes:"", hp:""
        });
      }
    } catch {
      setErr("Erreur réseau. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }

  };

  // mapping pour l’API / Airtable
  const sexOut = (v: "H" | "F") => (v === "H" ? "Homme" : "Femme");
  const searchSexOut = (v: "H" | "F" | "AUTRE") =>
    v === "H" ? "Homme" : v === "F" ? "Femme" : "Peu importe";

  const openDatePicker = (
    e: React.MouseEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>
  ) => {
    const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
    if (typeof el.showPicker === "function") requestAnimationFrame(() => el.showPicker!());
  };

  return (
    <main className="sb-container sb-section">
      <header className="partners-hero" style={{ marginBottom: 18 }}>
        <h1>Déposer une annonce</h1>
        <p>
          Ton e-mail est conservé pour permettre aux autres membres de te contacter via le bouton “Contacter”.
          Il n’est <strong>jamais</strong> publié en clair sur le site.
        </p>
      </header>

      <form className="pdepot-form" onSubmit={onSubmit}>
        {/* Anti-spam */}
        <div className="hp" aria-hidden>
          <label>Ne pas remplir
            <input value={form.hp} onChange={e=>setField("hp", e.target.value)} />
          </label>
        </div>

        {/* ===== Id.svg Ton profil de badiste ===== */}
        <section className="pdepot-section">
          <h2 className="pdepot-title">
            <img src="/Id.svg" alt="" aria-hidden />
            <span>Ton profil de badiste</span>
          </h2>

          <div className="pdepot-grid2">
            {/* Tu es… (H/F, toggle off si on re-clique) */}
            <div className="pdepot-field">
              <span>Tu es…* <small>(donnée publique)</small></span>
              <div className="pdepot-radios" role="radiogroup" aria-label="Tu es…">
                <button
                  type="button"
                  className={`pdepot-radio ${form.sexe==="H" ? "is-on" : ""}`}
                  role="radio"
                  aria-checked={form.sexe==="H"}
                  onClick={() => setField("sexe", form.sexe==="H" ? "" : "H")}
                >
                  un joueur
                </button>
                <button
                  type="button"
                  className={`pdepot-radio ${form.sexe==="F" ? "is-on" : ""}`}
                  role="radio"
                  aria-checked={form.sexe==="F"}
                  onClick={() => setField("sexe", form.sexe==="F" ? "" : "F")}
                >
                  une joueuse
                </button>
              </div>
            </div>
          
            <div className="pdepot-field">
              <span>Ton prénom* <small>(donnée privée)</small></span>
              <input
                type="text"
                placeholder="Adrien"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                autoComplete="given-name"
                required
              />
            </div>

          </div>

        
          {/* Ligne 2 : Âge (+ case dessous) + Email */}
          <div className="pdepot-grid2">
            <div className="pdepot-field">
              <span>Ton âge</span>
              <input
                type="number" min={8} max={90} placeholder="27"
                value={form.age}
                onChange={e=>setField("age", e.target.value)}
              />
              <label className="pdepot-check">
                <input
                  type="checkbox"
                  checked={form.age_masque}
                  onChange={e=>setField("age_masque", e.target.checked)}
                />
                Ne pas afficher mon âge publiquement
              </label>
            </div>

            <div className="pdepot-field">
              <span>Ton email* <small>(donnée privée)</small></span>
              <input type="email" placeholder="smash@exemple.fr"
                    value={form.email} onChange={e=>setField("email", e.target.value)} required />
            </div>
          </div>
        </section>

        {/* ===== Trophy.svg Le tournoi auquel tu participes ===== */}
        <section className="pdepot-section">
          <h2 className="pdepot-title">
            <img src="/Trophy.svg" alt="" aria-hidden />
            <span>Le tournoi auquel tu participes</span>
          </h2>

          {/* 5) Nom du tournoi (full width) */}
          <div className="pdepot-field" style={{ marginBottom: 10 }}>
            <span>Nom du tournoi *</span>
            <input placeholder="Tournoi de rentrée des badistes de l’Ouest"
                  value={form.tournoi} onChange={e=>setField("tournoi", e.target.value)} required />
          </div>

          {/* 6-7-8) Ville + Département + Date (même ligne) */}
          <div className="pdepot-grid3">
            <div className="pdepot-field">
              <span>Ville *</span>
              <input value={form.ville} onChange={e=>setField("ville", e.target.value)} required />
            </div>

            <div className="pdepot-field">
              <span>Département *</span>
              <select value={form.dept} onChange={e=>setField("dept", e.target.value)} required>
                <option value="">— Sélectionner —</option>
                {DEPARTEMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="pdepot-field">
              <span>Date du tournoi *</span>
              <input
                type="date"
                value={form.date_text}
                onChange={e=>setField("date_text", e.target.value)}
                onClick={openDatePicker}
                onFocus={openDatePicker}
              />

            </div>
          </div>

          {/* Tableau */}
          <div className="pdepot-field">
            <span>Tableau pour lequel tu cherches un(e) partenaire *</span>
            <div className="pdepot-chips">
              {TABLEAUX.map(t => {
                const on = form.tableau === t;
                return (
                  <button
                    key={t}
                    type="button"
                    className={`pdepot-chip ${on ? "is-active" : ""}`}
                    aria-pressed={on}
                    onClick={() => setField("tableau", on ? "" : t)}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Classement */}
            <div className="pdepot-field">
              <span>Ton classement dans ce tableau *</span>
              <div className="pdepot-chips">
                {CLASSEMENTS.map(c => {
                  const on = form.classement === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`pdepot-chip ${on ? "is-active" : ""}`}
                      aria-pressed={on}
                      onClick={() => setField("classement", on ? "" : c)}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

        </section>

        {/* ===== LookFor.svg Profil recherché ===== */}
        <section className="pdepot-section">
          <h2 className="pdepot-title">
            <img src="/LookFor.svg" alt="" aria-hidden />
            <span>Profil recherché</span>
          </h2>

          {/* Tu cherches… (H/F/AUTRE, toggle off) */}
          <div className="pdepot-field">
            <span>Tu cherches…* </span>
            <div className="pdepot-radios" role="radiogroup" aria-label="Tu cherches…">
              <button
                type="button"
                className={`pdepot-radio ${form.recherche_sexe==="H" ? "is-on" : ""}`}
                role="radio"
                aria-checked={form.recherche_sexe==="H"}
                onClick={() => setField("recherche_sexe", form.recherche_sexe==="H" ? "" : "H")}
              >
                un joueur
              </button>
              <button
                type="button"
                className={`pdepot-radio ${form.recherche_sexe==="F" ? "is-on" : ""}`}
                role="radio"
                aria-checked={form.recherche_sexe==="F"}
                onClick={() => setField("recherche_sexe", form.recherche_sexe==="F" ? "" : "F")}
              >
                une joueuse
              </button>
              <button
                type="button"
                className={`pdepot-radio ${form.recherche_sexe==="AUTRE" ? "is-on" : ""}`}
                role="radio"
                aria-checked={form.recherche_sexe==="AUTRE"}
                onClick={() => setField("recherche_sexe", form.recherche_sexe==="AUTRE" ? "" : "AUTRE")}
              >
                peu importe
              </button>
            </div>
          </div>


          {/* 12) Son classement (multi) */}
          <div className="pdepot-field">
            <span>Son classement* <small>(plusieurs choix possibles)</small></span>
            <div className="pdepot-chips">
              {CLASSEMENTS.map(c => {
                const active = form.recherche_classement.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className={`pdepot-chip ${active ? "is-active" : ""}`}
                    onClick={()=>{
                      setForm(s=>{
                        const set = new Set(s.recherche_classement);
                        active ? set.delete(c) : set.add(c);
                        return { ...s, recherche_classement: Array.from(set) };
                      });
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pdepot-section">
          <h2 className="pdepot-title">
            <img src="/Comment.svg" alt="" aria-hidden />
            <span>Notes</span>
          </h2>
          <div className="pdepot-field">
            <span>Ajoute des précisions (optionnel)</span>
            <textarea rows={4} value={form.notes} onChange={e=>setField("notes", e.target.value)} />
          </div>
        </section>

        {/* Bouton + messages */}
        <div className="pdepot-actions">
          <button className="cta-primary" disabled={submitting} type="submit">
            {submitting ? "Envoi…" : "Déposer mon annonce"}
          </button>
          {ok && <div className="pdepot-ok">{ok}</div>}
          {err && <div className="pdepot-err">{err}</div>}
        </div>

        <p className="pdepot-legal">
          En déposant une annonce, tes coordonnées ne seront jamais affichées publiquement.
          Elles servent uniquement à permettre à smash.bad de te mettre en relation.
        </p>
      </form>


    </main>
  );
}
