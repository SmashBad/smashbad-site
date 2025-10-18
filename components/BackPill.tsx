// components/BackPill.tsx
import Link from "next/link";

type Props = {
  href: string;
  ariaLabel?: string;
};

export default function BackPill({ href, ariaLabel = "Retour" }: Props) {
  return (
    <Link href={href} className="back-pill back-icon" aria-label={ariaLabel}>
      <img src="/Back.svg" alt="" className="back-ic" aria-hidden />
    </Link>
  );
}
