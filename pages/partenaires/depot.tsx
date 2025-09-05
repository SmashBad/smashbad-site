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

      <form className="sb-form" onSubmit={onSubmit}>

        {/* Anti-spam – champ caché */}
        <div className="hp" aria-hidden>
          <label>Ne pas remplir <input value={form.hp} onChange={e=>setField("hp", e.target.value)} /></label>
        </div>

        <div className="sb-grid">
          <div className="sb-field">
            <span>Tournoi *</span>
            <input value={form.tournoi} onChange={e=>setField("tournoi", e.target.value)} required />
          </div>

          <div className="sb-field">
            <span>Ville *</span>
            <input value={form.ville} onChange={e=>setField("ville", e.target.value)} required />
          </div>

          <div className="sb-field">
            <span>Département *</span>
            <select value={form.dept} onChange={e=>setField("dept", e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {DEPARTEMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="sb-field">
            <span>Dates (texte simple)</span>
            <input placeholder="ex : 12–13 octobre 2025" value={form.date_text} onChange={e=>setField("date_text", e.target.value)} />
          </div>

          <div className="sb-field">
            <span>Tableau *</span>
            <select value={form.tableau} onChange={e=>setField("tableau", e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {TABLEAUX.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="sb-field">
            <span>Sexe *</span>
            <select value={form.sexe} onChange={e=>setField("sexe", e.target.value)}>
              <option value="H">Homme</option>
              <option value="F">Femme</option>
              <option value="AUTRE">Autre / Ne pas dire</option>
            </select>
          </div>

          <div className="sb-field">
            <span>Classement *</span>
            <select value={form.classement} onChange={e=>setField("classement", e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {CLASSEMENTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="sb-field">
            <span>Âge</span>
            <input
              type="number" min={8} max={90} placeholder="ex : 26"
              value={form.age}
              onChange={e=>setField("age", e.target.value)}
              disabled={!form.age_ok}
            />
            <label style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
              <input
                type="checkbox"
                checked={form.age_ok}
                onChange={e=>{
                  const v = e.target.checked;
                  setField("age_ok", v);
                  if (!v) setField("age", ""); // si non, on vide le champ âge
                }}
              />
              Afficher mon âge (décocher pour ne pas le préciser)
            </label>
          </div>

          <div className="sb-field">
            <span>Je cherche (sexe)</span>
            <select value={form.recherche_sexe} onChange={e=>setField("recherche_sexe", e.target.value)}>
              <option value="H">Un joueur</option>
              <option value="F">Une joueuse</option>
              <option value="AUTRE">Sans préférence</option>
            </select>
          </div>

          <div className="sb-field">
            <span>Classement recherché (multi)</span>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {CLASSEMENTS.map(c => {
                const active = form.recherche_classement.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className={`partners-chip ${active ? "chip--active" : ""}`}
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

          <div className="sb-field">
            <span>E-mail (contact) *</span>
            <input type="email" value={form.email} onChange={e=>setField("email", e.target.value)} required />
          </div>

          <div className="sb-field" style={{ gridColumn: "1 / -1" }}>
            <span>Message libre (optionnel)</span>
            <textarea rows={4} value={form.message} onChange={e=>setField("message", e.target.value)} />
          </div>
        </div>

        <div className="sb-actions">
          <button className="cta-primary" disabled={submitting} type="submit">
            {submitting ? "Envoi…" : "Déposer mon annonce"}
          </button>
          {ok && <div className="sb-ok">{ok}</div>}
          {err && <div className="sb-err">{err}</div>}
        </div>

        <p className="sb-legal">
          En déposant une annonce, vous acceptez que votre e-mail soit utilisé uniquement pour permettre aux autres
          membres de vous contacter via le bouton “Contacter”. Il n’est jamais affiché publiquement.
        </p>
      </form>
    </main>
  );
}
