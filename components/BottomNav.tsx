// components/BottomNav.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;     // chemin vers l’icône (public/)
  soon?: boolean;   // état “bientôt”
  title?: string;   // attribut title optionnel
};

export default function BottomNav() {
  const router = useRouter();

  const navItems: NavItem[] = [
    { href: "/",               label: "Accueil",      icon: "/Bolt.svg",    title: "Aller à l’accueil" },
    { href: "/entrainements",  label: "Entraînement", icon: "/Racket.svg",  title: "Voir les entraînements" },
    { href: "/partenaires",    label: "Partenaires",  icon: "/Partner.svg", title: "Bientôt disponible", soon: true },
    { href: "/shop",           label: "Boutique",     icon: "/Shop.svg",    title: "Bientôt disponible", soon: true },
    { href: "/login",          label: "Compte",       icon: "/Login.svg",   title: "Bientôt disponible", soon: true },
  ];

  // Active si la route courante commence par href (utile si on a des sous-pages)
  const isActive = (href: string) => {
    const cur = router.asPath.replace(/\/+$/, "") || "/";
    const target = href.replace(/\/+$/, "") || "/";
    if (target === "/") return cur === "/";
    return cur === target || cur.startsWith(target + "/");
  };

  return (
    <nav className="bottomnav" aria-label="Navigation principale mobile">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const classes = [
          "bottomnav__item",
          active ? "is-active" : "",
          item.soon ? "is-soon" : "",
        ].join(" ").trim();

        const icon = <img src={item.icon} alt="" className="bottomnav__ic" aria-hidden />;

        if (item.soon) {
          // Élément désactivé (annoncé “bientôt”)
          return (
            <span
              key={item.href}
              className={classes}
              aria-disabled="true"
              role="link"
              title={item.title || item.label}
              data-soon="true"
            >
              {icon}
              <span>{item.label}</span>
            </span>
          );
        }

        // Lien actif/inactif
        return (
          <Link
            key={item.href}
            href={item.href}
            className={classes}
            aria-current={active ? "page" : undefined}
            title={item.title || item.label}
          >
            {icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
