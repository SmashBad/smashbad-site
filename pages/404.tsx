import Image from 'next/image'
import Link from 'next/link'

export default function Custom404() {
  return (
    <main className="hero-split">
      <div className="container">
        {/* Texte */}
        <div className="hero-split__text">
          <p className="kicker">Erreur 404</p>
          <h1>
            Page <span className="accent">introuvable</span>
          </h1>
          <p className="lead">
            Oups… la page que tu cherches n’existe pas ou a peut-être été déplacée.
          </p>
          <div className="hero-actions">
            <Link href="/" className="btn btn-primary">
              Revenir à l’accueil
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Nous contacter
            </Link>
          </div>
        </div>

        {/* Illustration */}
        <div className="hero-split__art">
          <Image
            src="/Hero_404.png"
            alt="Illustration erreur 404"
            width={600}
            height={600}
            priority
          />
        </div>
      </div>
    </main>
  )
}
