// pages/_app.tsx
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import "../styles/global.css";
import { Analytics } from "@vercel/analytics/next"

// Importe les composants du layout (chemins relatifs pour être sûrs)
import Header from "../components/Header";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";

/** Seuil (en pixels) pour considérer un "PC étroit" */
const NARROW_MAX = 1200; // ajuste cette valeur si besoin (ex: 700/900)

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Détection "mobile réel" via userAgent
  const [isMobile, setIsMobile] = useState(false);
  // Largeur de fenêtre (utile pour PC étroit)
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    // 1) Mobile réel
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(ua));
    }

    // 2) Largeur de fenêtre
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isDesktopNarrow = !isMobile && (width ?? 9999) <= NARROW_MAX;
  const isDesktopStandard = !isMobile && !isDesktopNarrow;
  
  const updateBodyClasses = () => {
    const b = document.body;
    b.classList.toggle("is-mobile", isMobile);
    b.classList.toggle("is-desktop-narrow", isDesktopNarrow);
    b.classList.toggle("is-desktop-standard", isDesktopStandard);
    // utilise asPath pour être 100% juste
    b.classList.toggle("is-home", router.asPath === "/");
  };

  // Pose des classes sur <body> pour piloter le CSS (3 cas)
  useEffect(() => {
    updateBodyClasses();
    // écoute les fins de navigation pour éviter l’état collant
    const onDone = () => updateBodyClasses();
    router.events.on("routeChangeComplete", onDone);
    router.events.on("hashChangeComplete", onDone);
    return () => {
      router.events.off("routeChangeComplete", onDone);
      router.events.off("hashChangeComplete", onDone);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isDesktopNarrow, isDesktopStandard, router.asPath]);

  // Titre d'écran (affiché AU CENTRE du header en mobile)
  const pageTitle = useMemo(() => {
    const p = router.pathname;
    if (p === "/") return "Accueil";
    if (p.startsWith("/entrainements")) return "Entraînements";
    if (p.startsWith("/shadow")) return "Shadow";
    if (p.startsWith("/partenaires")) return "Partenaires";
    if (p.startsWith("/shop")) return "Boutique";
    if (p.startsWith("/login")) return "Compte";
    // fallback : capitalise le segment
    const seg = p.split("/").filter(Boolean)[0];
    return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : "";
  }, [router.pathname]);

  return (
    <>
      <Head>
          {/* Fonts globales – charge pour toutes les pages */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Audiowide&family=Outfit:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap"
            rel="stylesheet"
          />
          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@700&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Symbols+2:wght@700&display=swap" rel="stylesheet" />
          <link rel="preload" as="image" href="/shadow/arrow-AG.svg" />
          <link rel="preload" as="image" href="/shadow/arrow-AD.svg" />
          <link rel="preload" as="image" href="/shadow/arrow-G.svg" />
          <link rel="preload" as="image" href="/shadow/arrow-D.svg" />
          <link rel="preload" as="image" href="/shadow/arrow-DG.svg" />
          <link rel="preload" as="image" href="/shadow/arrow-DD.svg" />


        {/* Favicons (assure-toi que les fichiers sont bien dans /public) */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#010B2E" />
        <title>SMASH.bad — {pageTitle || "Votre partenaire de badminton"}</title>
      </Head>

      {/* Header : en mobile, il n’affiche que logo + SMASH + pageTitle + login icône (via CSS) */}
      <Header title={pageTitle} />

      <main>
        <Component {...pageProps} />
        <Analytics />
      </main>

      <Footer />

      {/* Bottom navigation : visible UNIQUEMENT en mobile réel */}
      {isMobile && <BottomNav />}
    </>
  );
}
