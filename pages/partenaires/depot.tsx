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
    sexe: "AUTRE",
    classement: "",
    age: "",
    age_ok: true, // "je préfère ne pas le dire" => false (donc par défaut true = affichable)
    recherche_sexe: "AUTRE",
    recherche_classement: [] as string[],
    email: "",
    message: "",
    hp: "" // honeypot
  });

  const setField = (k: string, v: any) => setForm(s => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null); setErr(null);
    setSubmitting(true);
    try {
      // si “je préfère ne pas le dire” => age_ok=false
      const age_ok = form.age_ok;
      const body = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        age_ok,
      };

      const res = await fetch("/api/partners/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        console.warn(json);
        setErr("Une erreur est survenue. Merci de vérifier les champs et réessayer.");
      } else {
        setOk("Merci ! Ton annonce a été déposée. Elle sera vérifiée et publiée sous 24h.");
        setForm({
          tournoi: "", ville: "", dept: "", date_text: "", tableau: "",
          sexe: "AUTRE", classement: "", age: "", age_ok: true,
          recherche_sexe: "AUTRE", recherche_classement: [], email: "", message: "", hp: ""
        });
      }
    } catch {
      setErr("Erreur réseau. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
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
          <label>Ne pas remplir <input value={form.hp} onChange={e=>setField("hp", e.target.value)} /></label>
        </div>

        {/* ===== Section 1 : Profil ===== */}
        <section className="pdepot-section">
          <h2 className="pdepot-title">
            <img src="/Trophy.svg" alt="" aria-hidden />
            <span>Ton profil de badiste</span>
          </h2>

          <div className="pdepot-grid">
            {/* Sexe */}
            <div className="pdepot-field">
              <span>Tu es…* (donnée publique)</span>
              <div className="pdepot-radios">
                <label className={`pdepot-radio ${form.sexe==="H"?"is-on":""}`}>
                  <input type="radio" name="sexe" value="H"
                    checked={form.sexe==="H"} onChange={()=>setField("sexe","H")} />
                  un joueur
                </label>
                <label className={`pdepot-radio ${form.sexe==="F"?"is-on":""}`}>
                  <input type="radio" name="sexe" value="F"
                    checked={form.sexe==="F"} onChange={()=>setField("sexe","F")} />
                  une joueuse
                </label>
                <label className={`pdepot-radio ${form.sexe==="AUTRE"?"is-on":""}`}>
                  <input type="radio" name="sexe" value="AUTRE"
                    checked={form.sexe==="AUTRE"} onChange={()=>setField("sexe","AUTRE")} />
                  autre / ne pas dire
                </label>
              </div>
            </div>

            {/* Classement */}
            <div className="pdepot-field">
              <span>Ton classement dans ce tableau *</span>
              <select value={form.classement} onChange={e=>setField("classement", e.target.value)} required>
                <option value="">— Sélectionner —</option>
                {CLASSEMENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Âge + confidentialité */}
            <div className="pdepot-field">
              <span>Ton âge</span>
              <input
                type="number" min={8} max={90} placeholder="27"
                value={form.age} onChange={e=>setField("age", e.target.value)}
                disabled={!form.age_ok}
              />
              <label className="pdepot-check">
                <input
                  type="checkbox"
                  checked={!form.age_ok}
                  onChange={e=>{
                    const hide = e.target.checked;
                    setField("age_ok", !hide);
                    if (hide) setField("age", "");
                  }}
                />
                Ne pas afficher mon âge publiquement
              </label>
            </div>
          </div>
        </section>

        {/* ===== Section 2 : Tournoi ===== */}
        <section className="pdepot-section">
          <h2 className="pdepot-title">
            <img src="/Planning.svg" alt="" aria-hidden />
            <span>Le tournoi auquel tu participes</span>
          </h2>

          <div className="pdepot-grid">
            <div className="pdepot-field" style={{ gridColumn: "1 / -1" }}>
              <span>Nom du tournoi *</span>
              <input placeholder="Tournoi de rentrée des badistes de l’Ouest"
                    value={form.tournoi} onChange={e=>setField("tournoi", e.target.value)} required />
            </div>

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
              <input placeholder="Sélectionner date"
                    value={form.date_text} onChange={e=>setField("date_text", e.target.value)} />
            </div>

            <div className="pdepot-field">
              <span>Tableau pour lequel tu cherches un(e) partenaire *</span>
              <select value={form.tableau} onChange={e=>setField("tableau", e.target.value)} required>
                <option value="">— Sélectionner —</option>
                {TABLEAUX.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* ===== Section 3 : Profil recherché ===== */}
        <section className="pdepot-section">
          <h2 className="pdepot-title">
            <img src="/LookFor.svg" alt="" aria-hidden />
            <span>Profil recherché</span>
          </h2>

          <div className="pdepot-grid">
            {/* Sexe recherché */}
            <div className="pdepot-field">
              <span>Tu cherches…* </span>
              <div className="pdepot-radios">
                <label className={`pdepot-radio ${form.recherche_sexe==="H"?"is-on":""}`}>
                  <input type="radio" name="recherche_sexe" value="H"
                    checked={form.recherche_sexe==="H"} onChange={()=>setField("recherche_sexe","H")} />
                  un joueur
                </label>
                <label className={`pdepot-radio ${form.recherche_sexe==="F"?"is-on":""}`}>
                  <input type="radio" name="recherche_sexe" value="F"
                    checked={form.recherche_sexe==="F"} onChange={()=>setField("recherche_sexe","F")} />
                  une joueuse
                </label>
                <label className={`pdepot-radio ${form.recherche_sexe==="AUTRE"?"is-on":""}`}>
                  <input type="radio" name="recherche_sexe" value="AUTRE"
                    checked={form.recherche_sexe==="AUTRE"} onChange={()=>setField("recherche_sexe","AUTRE")} />
                  peu importe
                </label>
              </div>
            </div>

            {/* Classement recherché */}
            <div className="pdepot-field" style={{ gridColumn: "1 / -1" }}>
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

            {/* Email */}
            <div className="pdepot-field" style={{ gridColumn: "1 / -1" }}>
              <span>Ton email* <small>(donnée privée)</small></span>
              <input type="email" placeholder="smash@exemple.fr"
                    value={form.email} onChange={e=>setField("email", e.target.value)} required />
            </div>

            {/* Message */}
            <div className="pdepot-field" style={{ gridColumn: "1 / -1" }}>
              <span>Message libre (optionnel)</span>
              <textarea rows={4} value={form.message} onChange={e=>setField("message", e.target.value)} />
            </div>
          </div>
        </section>

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
