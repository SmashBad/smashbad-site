// components/BottomNav.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

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
    { href: "/entrainements",  label: "Entraînement", icon: "/Bolt.svg",  title: "Voir les entraînements" },
    { href: "/materiel",    label: "Matériel",  icon: "/Racket.svg", title: "Bientôt disponible", soon: true },
    { href: "/partenaires",    label: "Partenaires",  icon: "/Partner.svg", title: "Bientôt disponible", soon: true },
    { href: "/shop",           label: "Boutique",     icon: "/Shop.svg",    title: "Bientôt disponible", soon: true },
  ];

  // Active si la route courante commence par href (utile si on a des sous-pages)
  const isActive = (href: string) => {
    const cur = router.asPath.replace(/\/+$/, "") || "/";
    const target = href.replace(/\/+$/, "") || "/";
    if (target === "/") return cur === "/";
    return cur === target || cur.startsWith(target + "/");
  };

  // Petit toast non intrusif "Bientôt disponible"
  const [soonToast, setSoonToast] = useState<string | null>(null);
  useEffect(() => {
    if (!soonToast) return;
    const id = setTimeout(() => setSoonToast(null), 1400);
    return () => clearTimeout(id);
  }, [soonToast]);

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
            <button
              key={item.href}
              className={classes}
              type="button"
              title={item.title || item.label}
              onClick={() => setSoonToast(`${item.label} — bientôt disponible`)}
              aria-disabled="true"
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

    {/* Toast discret */}
    {soonToast && (
      <div className="toast" role="status" aria-live="polite">{soonToast}</div>
    )}
    </>
  );
}
