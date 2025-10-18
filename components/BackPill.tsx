import Link from "next/link";

type Props = {
  href: string;
  label?: string;          // texte visible
  ariaLabel?: string;      // accessibilité (si tu veux différent)
};

export default function BackPill({ href, label = "Retour", ariaLabel }: Props) {
  return (
    <div className="shadow-topbar" style={{ marginBottom: 12 }}>
      <div className="shadow-left">
        <Link href={href} className="back-pill" aria-label={ariaLabel || label}>
          <img src="/Back.svg" alt="" className="back-ic" aria-hidden />
          <span>{label}</span>
        </Link>
      </div>
      <div /> {/* centre vide */}
      <div className="shadow-actions" />
    </div>
  );
}
