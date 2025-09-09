import { useRouter } from "next/router";
import { useEffect, useState } from "react";
type Ad = import("../../lib/data/airtable_annonces_partenaires").AdPublic;

export default function AdDetail(){
  const router = useRouter();
  const { id } = router.query;
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    fetch(`/api/partners/list?id=${id}`)
      .then(r => r.json())
      .then(d => setAd((d.items || [])[0] || null))
      .catch(() => setAd(null));
  }, [id]);

  async function onContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const r = await fetch("/api/partners/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, adId: id }),
    });
    if (r.ok) alert("Demande envoyée à l’auteur 👍");
    else alert("Échec de l’envoi");
  }

  if (!ad) return <main className="partners-page"><div>Chargement…</div></main>;

  return (
    <main className="partners-page">
      <article className="ad-card">
        <h2>{ad.tournoi}</h2>
        <p>{ad.ville}{ad.dept_code ? `, ${ad.dept_code}` : ""}</p>
        {/* … autres infos … */}
      </article>

      <section className="contact-form">
        <h3>Contacter l’auteur</h3>
        <form onSubmit={onContact}>
          <div className="grid">
            <input name="first_name" placeholder="Prénom" required />
            <input name="last_name" placeholder="Nom" required />
            <input name="email" type="email" placeholder="Email" required />
            <input name="ranking" placeholder="Classement (ex: D9)" />
            <input name="phone" placeholder="Téléphone (facultatif)" />
          </div>
          <textarea name="message" placeholder="Votre message (facultatif)" rows={5} />
          <button className="cta-primary" type="submit">Envoyer</button>
        </form>
      </section>
    </main>
  );
}
