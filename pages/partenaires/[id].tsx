import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import BackPill from "../../components/BackPill";

type Ad = import("../../lib/data/airtable_annonces_partenaires").AdPublic;

// Helpers phrasing contact intro
const NBSP = "\u00A0";
const fmtDateFR = (s?: string | null) => {
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("fr-FR");
};
const isFemme = (sex?: string) => /fem/i.test(String(sex || ""));
const nounForSex = (sex?: string) => (isFemme(sex) ? "une joueuse" : "un joueur");
const classWordFor = (sex?: string, neutral = false) =>
  neutral ? "classé(e)" : (isFemme(sex) ? "classée" : "classé");
const wantedForSearch = (searchSex?: string) => {
  if (!searchSex || /peu importe|sans préférence/i.test(searchSex)) {
    return { noun: "un joueur ou une joueuse", classWord: "classé(e)" };
  }
  return /fem/i.test(searchSex)
    ? { noun: "une joueuse", classWord: "classée" }
    : { noun: "un joueur", classWord: "classé" };
};
const listWithOu = (v: unknown) => {
  const raw = Array.isArray(v) ? v : (typeof v === "string" ? v.split(/[,\s;/]+/) : []);
  const arr = raw.map(s => String(s).trim()).filter(Boolean);
  if (!arr.length) return "";
  if (arr.length === 1) return arr[0];
  return `${arr.slice(0, -1).join(", ")} ou ${arr[arr.length - 1]}`;
};


const CLASSEMENTS = ["N1","N2","N3","R4","R5","R6","D7","D8","D9","P10","P11","P12","NC"] as const;

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default function AdDetail(){
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // formulaire
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    sex: "",     // optionnel : "", "H", "F"
    age: "",
    ranking: "",
    email: "",
    phone: "",
    message: "",
    hp: "",      // honeypot
  });
  const setField = (k: keyof typeof form, v: any) => setForm(s => ({ ...s, [k]: v }));

  // charge l’annonce
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/partners/list?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        const one: Ad | null = (d.items || []).find((x: Ad) => x.id === id) || null;
        setAd(one);
        // Préselectionne le classement proposé par l’annonce si présent
        if (one?.classement) setForm(s => ({ ...s, ranking: String(one.classement) }));
      })
      .catch(() => setAd(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function onContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true); setErr(null);

    try {
      // traduit "H"/"F" vers "Homme"/"Femme" pour Airtable
      const sexValue =
      form.sex === "H" ? "Homme" :
      form.sex === "F" ? "Femme" :
      undefined;

      const payload = {
        ad: id,
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        sex:        sexValue,
        age:        form.age ? Number(form.age) : undefined,
        ranking:    form.ranking.trim(),
        email:      form.email.trim(),
        phone:      form.phone.trim() || undefined,
        message:    form.message.trim() || undefined,
        hp:         form.hp || undefined,
        annonce_liee: (ad as { Ad_Id?: string })?.Ad_Id ?? "", // visible pour le test
      };

        const r = await fetch("/api/partners/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok || !data?.ok) throw new Error(data?.error || "Échec de l’envoi");
      setOk(true);
    } catch (e: any) {
    setErr(e?.message || "Impossible d’envoyer la demande.");
  } finally {
    setSubmitting(false);
  }
}

  if (loading) return <main className="partners-page"><div className="partners-empty">Chargement…</div></main>;
  if (!ad)     return <main className="partners-page"><div className="partners-empty">Annonce introuvable. <Link href="/partenaires">Retour</Link></div></main>;

  // Intro pédagogique
  const introConcept = (
    <p className="contact-intro__lead">
      Quand tu envoies ce formulaire, <strong>Smash.bad</strong> transmet ton message par e-mail
      à l’auteur de l’annonce. Cette personne reste libre de te répondre ou non ; tes coordonnées
      ne sont pas publiées sur le site.
    </p>
  );

  // Résumé littéraire du profil + recherche
  const profileLabel = nounForSex(ad.sexe);
  const classWord    = classWordFor(ad.sexe);
  const agePart = ad.age_masque
    ? "qui ne souhaite pas préciser son âge"
    : (typeof ad.age === "number" ? `de ${ad.age} ans` : "");
  const wanted = wantedForSearch(ad.search_sex);
  const wantedRanks = listWithOu(ad.search_ranking);
  const dateLabel = ad.date ? fmtDateFR(ad.date) : "";

  const introSummary = (
    <p className="contact-intro__summary">
      Cette annonce a été publiée par <strong>{profileLabel}</strong> {classWord}{NBSP}
      {ad.classement ? <><strong>{ad.classement}</strong>{NBSP}</> : null}
      {agePart && <>{agePart}{", "}</>}
      {ad.tableau && <>qui souhaite jouer en <strong>{ad.tableau}</strong>.{" "}</>}
      { (ad.search_sex || ad.search_ranking) && (
        <>
          Pour ce tournoi{dateLabel ? <> du <strong>{dateLabel}</strong></> : null}
          {ad.ville ? <> à <strong>{ad.ville}</strong></> : null}, la personne recherche{" "}
          <strong>{wanted.noun}</strong>
          {wantedRanks && <> {wanted.classWord} <strong>{wantedRanks}</strong></>}.
        </>
      )}
    </p>
  );


  if (ok) {
    return (
      <main className="partners-page">
        <div className="sb-container">
          <div className="topbar">
            <div className="topbar__grid">
              <div>
                <BackPill href="/partenaires" ariaLabel="Retour aux annonces" />
              </div>
              <h1>Demande envoyée 🎉</h1>
              <div></div>
            </div>
          </div>
        </div>        
        <section className="pcontact-done">
          <p>Nous avons transmis ta demande à l’auteur de « <strong>{ad.tournoi}</strong> ».</p>
          <p>Il/elle te recontactera peut-être prochainement. Merci !</p>
          <p><Link href="/partenaires" className="cta-primary">Retour aux annonces</Link></p>
        </section>
      </main>
    );
  }

  return (
    <main className="sb-container sb-section">

      <header className="partners-hero" style={{ marginBottom: 18 }}>
        <div className="topbar">
          <div className="topbar__grid">
            <div>
              <BackPill href="/partenaires" ariaLabel="Retour aux annonces" />
            </div>
            <h1 className="sb-h1 topbar__title">Contacter</h1>
            <div></div>
          </div>
        </div>
      </header>
        

        
        <article className="ad-card">
          <h2>{ad.tournoi}</h2>
          
            <section className="contact-intro">
              {introSummary}
              <p></p>
              {introConcept}
            </section>
          
        </article>

        <section className="pdepot-section">
          <h3 className="pdepot-title"><span>Prendre contact</span></h3>

          <form className="pdepot-form" onSubmit={onContact} noValidate>
            <input type="text" className="hp" tabIndex={-1} value={form.hp} onChange={e=>setField("hp", e.target.value)} />

            <input
              type="hidden"
              name="annonce_liee"
              value={(ad as any)?.Ad_Id ?? ""}
              placeholder={(ad as any)?.Ad_Id ? `Ad_Id : ${(ad as any).Ad_Id}` : "Ad_Id non chargé"}
            />

            <div className="pdepot-grid2">
              <div className="pdepot-field">
                <span>Prénom *</span>
                <input name="first_name" placeholder="Adrien" required
                      value={form.first_name} onChange={e=>setField("first_name", e.target.value)} />
              </div>
              <div className="pdepot-field">
                <span>Nom *</span>
                <input name="last_name" placeholder="Martin" required
                      value={form.last_name} onChange={e=>setField("last_name", e.target.value)} />
              </div>
            </div>

            <div className="pdepot-grid3">
              <div className="pdepot-field">
                <span>Ton classement (même tableau) *</span>
                <div className="pdepot-chips">
                  {CLASSEMENTS.map(c => {
                    const on = form.ranking === c;
                    return (
                      <button key={c} type="button"
                        className={`pdepot-chip ${on ? "is-active" : ""}`}
                        onClick={() => setField("ranking", on ? "" : c)}
                        aria-pressed={on}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pdepot-field">
                <span>Âge (optionnel)</span>
                <input name="age" type="number" inputMode="numeric" min={8} max={95}
                      placeholder="27" value={form.age} onChange={e=>setField("age", e.target.value)} />
              </div>

              <div className="pdepot-field">
                <span>Sexe (optionnel)</span>
                <div className="pdepot-radios">
                  <button type="button" className={`pdepot-radio ${form.sex==="H"?"is-on":""}`}
                          aria-pressed={form.sex==="H"} onClick={()=>setField("sex", form.sex==="H" ? "" : "H")}>un joueur</button>
                  <button type="button" className={`pdepot-radio ${form.sex==="F"?"is-on":""}`}
                          aria-pressed={form.sex==="F"} onClick={()=>setField("sex", form.sex==="F" ? "" : "F")}>une joueuse</button>
                </div>
              </div>
            </div>

            <div className="pdepot-grid2">
              <div className="pdepot-field">
                <span>E-mail (obligatoire) *</span>
                <input name="email" type="email" placeholder="prenom@exemple.fr" required
                      value={form.email} onChange={e=>setField("email", e.target.value)} />
                <small>Nous l’enverrons à l’auteur de l’annonce pour qu’il/elle te réponde.</small>
              </div>
              <div className="pdepot-field">
                <span>Téléphone (optionnel)</span>
                <input name="phone" type="tel" placeholder="06 12 34 56 78"
                      value={form.phone} onChange={e=>setField("phone", e.target.value)} />
              </div>
            </div>

            <div className="pdepot-field">
              <span>Message (optionnel)</span>
              <textarea name="message" rows={4} placeholder="Présente-toi, propose des créneaux, etc."
                        value={form.message} onChange={e=>setField("message", e.target.value)} />
            </div>

            {err && <div className="pdepot-err">{err}</div>}

            <div className="pdepot-actions">
              <button className="cta-primary"
                disabled={submitting || !form.first_name || !form.last_name || !form.email || !form.ranking}>
                {submitting ? "Envoi…" : "Envoyer la demande"}
              </button>
              <Link href="/partenaires" className="btn btn--ghost">Annuler</Link>
            </div>
          </form>
        </section>
      </main>
  );
}