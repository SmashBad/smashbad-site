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
    age_ok: true, // "je préfère ne pas le dire" => false (donc par défaut true = affichable)
    recherche_sexe: "AUTRE",
    recherche_classement: [] as string[],
    name :"",
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
        age_public: !form.age_ok,              // coché = ne pas afficher → true
        name: form.name,
        contact_email: form.email,

        // recherche
        search_sex: searchSexOut(form.recherche_sexe as "H"|"F"|"AUTRE"),
        search_ranking: form.recherche_classement,

        // divers
        notes: form.message,

        // honeypot (on l’envoie VIDE pour passer les contrôles serveur)
        hp: form.hp || ""
      };

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
          sexe:"", classement:"", age:"", age_ok:true,
          recherche_sexe:"AUTRE", recherche_classement:[],
          name:"", email:"", message:"", hp:""
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

          {/* Ligne 1 : Tu es (radios H/F) + Prénom */}
          <div className="pdepot-grid2">
            <div className="pdepot-field">
              <span>Tu es…* <small>(donnée publique)</small></span>
              <div className="pdepot-radios">
                <label className={`pdepot-radio ${form.sexe==="H"?"is-on":""}`}>
                  <input type="radio" name="sexe" value="H" required
                        checked={form.sexe==="H"} onChange={()=>setField("sexe","H")} />
                  un joueur
                </label>
                <label className={`pdepot-radio ${form.sexe==="F"?"is-on":""}`}>
                  <input type="radio" name="sexe" value="F" required
                        checked={form.sexe==="F"} onChange={()=>setField("sexe","F")} />
                  une joueuse
                </label>
              </div>
            </div>

            <div className="pdepot-field">
              <span>Ton prénom* <small>(donnée privée)</small></span>
              <input placeholder="Adrien" value={form.name}
                    onChange={e=>setField("name", e.target.value)} required />
            </div>
          </div>
        
          {/* Ligne 2 : Âge (+ case dessous) + Email */}
          <div className="pdepot-grid2">
            <div className="pdepot-field">
              <span>Ton âge</span>
              <input type="number" min={8} max={90} placeholder="27"
                    value={form.age} onChange={e=>setField("age", e.target.value)}
                    disabled={!form.age_ok} />
              <label className="pdepot-check">
                <input type="checkbox"
                      checked={!form.age_ok}
                      onChange={e=>{
                        const hide = e.target.checked;     // coché = ne pas afficher
                        setField("age_ok", !hide);
                        if (hide) setField("age", "");
                      }} />
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
              <input type="date"
                value={form.date_text}
                onChange={e=>setField("date_text", e.target.value)} />
            </div>
          </div>

          {/* 9-10) Tableau + Classement (même ligne) */}
          <div className="pdepot-grid2">
            <div className="pdepot-field">
              <span>Tableau pour lequel tu cherches un(e) partenaire *</span>
              <select value={form.tableau} onChange={e=>setField("tableau", e.target.value)} required>
                <option value="">— Sélectionner —</option>
                {TABLEAUX.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="pdepot-field">
              <span>Ton classement dans ce tableau *</span>
              <select value={form.classement} onChange={e=>setField("classement", e.target.value)} required>
                <option value="">— Sélectionner —</option>
                {CLASSEMENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* ===== LookFor.svg Profil recherché ===== */}
        <section className="pdepot-section">
          <h2 className="pdepot-title">
            <img src="/LookFor.svg" alt="" aria-hidden />
            <span>Profil recherché</span>
          </h2>

          {/* 11) Tu cherches… */}
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
