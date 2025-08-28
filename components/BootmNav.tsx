// components/BottomNav.tsx
import Link from "next/link"
import { useRouter } from "next/router"

export default function BottomNav() {
  const router = useRouter()

  const navItems = [
    { href: "/", label: "Accueil", icon: "/Bolt.svg" },
    { href: "/entrainements", label: "Entraînement", icon: "/Racket.svg" },
    { href: "/partenaires", label: "Partenaires", icon: "/Partner.svg", soon: true },
    { href: "/shop", label: "Boutique", icon: "/Shop.svg", soon: true },
    { href: "/login", label: "Compte", icon: "/Login.svg", soon: true },
  ]

  return (
    <nav className="bottomnav">
      {navItems.map((item) => {
        const active = router.pathname === item.href
        const classes = [
          "bottomnav__item",
          active ? "is-active" : "",
          item.soon ? "is-soon" : "",
        ].join(" ")

        return item.soon ? (
          <span key={item.href} className={classes} aria-disabled="true">
            <img src={item.icon} alt="" className="bottomnav__ic" aria-hidden />
            <span>{item.label}</span>
          </span>
        ) : (
          <Link key={item.href} href={item.href} className={classes}>
            <img src={item.icon} alt="" className="bottomnav__ic" aria-hidden />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
