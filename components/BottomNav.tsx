// components/BottomNav.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;       // chemin vers l’icône (public/)
  iconOn?: string;    // version active (turquoise)
  soon?: boolean;     // état “bientôt”
  title?: string;     // attribut title optionnel
  aliases?: string[]; // routes qui doivent aussi activer cet item
};

export default function BottomNav() {
  const router = useRouter();

  const navItems: NavItem[] = [
    { href: "/entrainements", label: "Entraînement", icon: "/Bolt.svg",    iconOn: "/Bolt_On.svg",    title: "Voir les entraînements", aliases: ["/shadow"]},
    { href: "/materiel",      label: "Matériel",     icon: "/Racket.svg",  iconOn: "/Racket_On.svg",  title: "Matériel - Bientôt disponible",    soon: true },
    { href: "/partenaires",   label: "Partenaires",  icon: "/Partner.svg", iconOn: "/Partner_On.svg", title: "Partenaires - Bientôt disponible",    soon: true },
    { href: "/shop",          label: "Boutique",     icon: "/Shop.svg",    iconOn: "/Shop_On.svg",    title: "Boutique - Bientôt disponible",    soon: true },
  ];

  // Active si la route courante commence par href (utile si on a des sous-pages)
  const isActive = (href: string) => {
    const cur = (router.asPath || "/").replace(/\/+$/, "") || "/";
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
    <>
      <nav className="bottomnav" aria-label="Navigation principale mobile">
        {navItems.map((item) => {
          const active =
            isActive(item.href) ||
            (item.aliases?.some((a) => isActive(a)) ?? false);
          const classes = [
            "bottomnav__item",
            active ? "is-active" : "",
            item.soon ? "is-soon" : "",
          ].join(" ").trim();

          const Iconsrc = active && item.iconOn ? item.iconOn : item.icon;
          const icon = <img src={Iconsrc} alt="" className="bottomnav__ic" aria-hidden />;

          if (item.soon) {
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
