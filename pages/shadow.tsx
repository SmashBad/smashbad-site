// pages/shadow.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ---------- Types & constantes ----------
type DirKey = "AG" | "AD" | "G" | "D" | "DG" | "DD";
type Phase = "param" | "precount" | "run" | "paused" | "finished";

const LS_KEY = "shadow.v1";

// Nouveau libellé + flèches en caractères
const DIRS: Record<DirKey, { key: DirKey; label: string; char: string; svg:string }> = {
  AG: { key: "AG", label: "Amorti gauche",         char: "↖", svg: "/shadow/arrow-AG.svg" },
  AD: { key: "AD", label: "Amorti droit",          char: "↗", svg: "/shadow/arrow-AD.svg" },
  G:  { key: "G",  label: "Défense à gauche",      char: "←", svg: "/shadow/arrow-G.svg" },
  D:  { key: "D",  label: "Défense à droite",      char: "→", svg: "/shadow/arrow-D.svg" },
  DG: { key: "DG", label: "Dégagement gauche",     char: "↙", svg: "/shadow/arrow-DG.svg" },
  DD: { key: "DD", label: "Dégagement droit",      char: "↘", svg: "/shadow/arrow-DD.svg" },
};

const MIN_TOTAL = 30;   // secondes
const MAX_TOTAL = 180;  // 3 min
const STEP_TOTAL = 5;

const MIN_INT = 2;   // secondes
const MAX_INT = 8;
const STEP_INT = 0.5; // pas 0.5s

const VISIBLE_RATIO = 2 / 3;

// ---------- Utils ----------
const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
};
const ceilTo = (value: number, step: number) =>
  Math.ceil(value / step) * step;

// localStorage
const loadState = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};
const saveState = (v: unknown) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {}
};

// Audio (silencieux si fichier absent)
function useAudio(src: string | null) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!src) return;
    ref.current = new Audio(src);
  }, [src]);
  return {
    play: () => { ref.current && (ref.current.currentTime = 0, ref.current.play().catch(() => {})); },
    stop: () => { if (!ref.current) return; ref.current.pause(); ref.current.currentTime = 0; },
  };
}

// Wake Lock
function useWakeLock() {
  const wl = useRef<any>(null);
  const request = async () => {
    try {
      // @ts-ignore
      if (navigator?.wakeLock?.request) {
        // @ts-ignore
        wl.current = await navigator.wakeLock.request("screen");
      }
    } catch {}
  };
  const release = async () => {
    try { if (wl.current?.release) await wl.current.release(); wl.current = null; } catch {}
  };
  return { request, release };
}

export default function Shadow() {
  // Réglages (persistants)
  const [totalSec, setTotalSec] = useState<number>(60);
  const [intervalSec, setIntervalSec] = useState<number>(5);
  const [selected, setSelected] = useState<DirKey[]>(["AG","AD","G","D","DG","DD"]);
  const [hideProgress, setHideProgress] = useState<boolean>(false);

  // État runtime
  const [phase, setPhase] = useState<Phase>("param");
  const [countdown, setCountdown] = useState<number>(3); // 3→2→1→GO
  const [currentDir, setCurrentDir] = useState<DirKey | null>(null);
  const [showArrow, setShowArrow] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [remaining, setRemaining] = useState<number>(60); // s

  // Refs timers
  const rafRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);
  const lastIndexRef = useRef<number>(-1);
  const totalMsRef = useRef<number>(0);
  const effectiveTotalMsRef = useRef<number>(0);
  const visibleMsRef = useRef<number>(0);
  const intMsRef = useRef<number>(0);
  const precountTimers = useRef<number[]>([]);

  // Sons (noms demandés)
  const sPre = useAudio("/sounds/Precompte.mp3"); // 3,2,1
  const sGo  = useAudio("/sounds/Go.mp3");        // GO!
  const sTick= useAudio("/sounds/Bip.mp3");       // nouvelle flèche
  const sEnd = useAudio("/sounds/End.mp3");       // fin

  // WakeLock
  const wl = useWakeLock();

  // Migration depuis anciens codes NW/NE/...
  const mapOld: Record<string, DirKey> = { NW:"AG", NE:"AD", W:"G", E:"D", SW:"DG", SE:"DD" };

  useEffect(() => {
    const saved = loadState();
    if (!saved) return;
    if (typeof saved.totalSec === "number") setTotalSec(saved.totalSec);
    if (typeof saved.intervalSec === "number") setIntervalSec(saved.intervalSec);
    if (Array.isArray(saved.dirs) && saved.dirs.length) {
      setSelected(saved.dirs.map((k: string) => mapOld[k] ?? k) as DirKey[]);
    }
    if (typeof saved.hideProgress === "boolean") setHideProgress(saved.hideProgress);
  }, []);

  useEffect(() => {
    saveState({ totalSec, intervalSec, dirs: selected, hideProgress });
  }, [totalSec, intervalSec, selected, hideProgress]);

  const canGo = selected.length > 0;

  const toggleDir = (k: DirKey) => {
    setSelected(prev => {
      if (prev.includes(k)) {
        const next = prev.filter(x => x !== k);
        return next.length ? next : prev; // toujours ≥1
      }
      return [...prev, k];
    });
  };

  const randomDir = () => {
    const idx = Math.floor(Math.random() * selected.length);
    return selected[idx];
  };

  // Effective total : on **allonge** à la fin pour boucler l’intervalle en cours,
  // mais l’utilisateur a bien réglé "1:00" (affiché comme tel dans les réglages).
  const effectiveTotalSec = useMemo(() => {
    return ceilTo(totalSec, intervalSec);
  }, [totalSec, intervalSec]);

  // ---- Précompte ----
  const clearPrecount = () => {
    precountTimers.current.forEach(id => clearTimeout(id));
    precountTimers.current = [];
  };

  const startPrecount = async () => {
    setError("");

    // remonte en haut pour voir la flèche centrée
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}

    if (!canGo) { setError("Choisis au moins une direction."); return; }

    intMsRef.current = Math.round(intervalSec * 1000);
    visibleMsRef.current = Math.round(intMsRef.current * VISIBLE_RATIO);
    totalMsRef.current = Math.round(totalSec * 1000);
    effectiveTotalMsRef.current = Math.round(effectiveTotalSec * 1000);

    setRemaining(totalSec); // on affiche la cible (ex: 1:00) côté UI
    setPhase("precount");
    await wl.request();

    // 3,2,1 → GO
    setCountdown(3); sPre.play();
    clearPrecount();
    precountTimers.current.push(
      window.setTimeout(() => { setCountdown(2); sPre.play(); }, 1000),
      window.setTimeout(() => { setCountdown(1); sPre.play(); }, 2000),
      window.setTimeout(() => { setCountdown(0); sGo.play(); }, 3000),
      window.setTimeout(() => { startRun(); }, 4000)
    );
  };

  // ---- Run loop ----
  const stopRaf = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };

  const startRun = () => {
    clearPrecount();
    setPhase("run");
    startTsRef.current = performance.now();
    lastIndexRef.current = -1;
    setCurrentDir(randomDir());
    setShowArrow(true);
    sTick.play();

    const loop = () => {
      const now = performance.now();
      const elapsed = now - startTsRef.current;

      const totalEff = effectiveTotalMsRef.current;
      const int = intMsRef.current;
      const visible = visibleMsRef.current;

      // Fin (sur total **effectif**)
      if (elapsed >= totalEff) {
        setRemaining(0);
        sEnd.play();
        stopRaf(); wl.release();
        setPhase("finished");
        return;
      }

      // Affiche un restant "cible" jusqu’à atteindre 0
      const rest = Math.max(0, totalEff - elapsed);
      // on essaie de ne pas "dépasser" la cible dans l’affichage :
      const displayRest = Math.max(0, Math.min(rest / 1000, totalSec));
      setRemaining(displayRest);

      // Intervalle : apparition / gap
      const index = Math.floor(elapsed / int);
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        setCurrentDir(randomDir());
        sTick.play();
      }
      const tIn = elapsed % int;
      setShowArrow(tIn < visible);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  const pause = () => {
    if (phase !== "run") return;
    stopRaf(); setPhase("paused");
  };

  const resume = () => {
    if (phase !== "paused") return;
    const remainingMs = Math.max(0, remaining * 1000);
    startTsRef.current = performance.now() - (effectiveTotalMsRef.current - remainingMs);
    setPhase("run");
    rafRef.current = requestAnimationFrame(function loop() {
      const now = performance.now();
      const elapsed = now - startTsRef.current;

      const totalEff = effectiveTotalMsRef.current;
      const int = intMsRef.current;
      const visible = visibleMsRef.current;

      if (elapsed >= totalEff) {
        setRemaining(0);
        sEnd.play();
        stopRaf(); wl.release();
        setPhase("finished");
        return;
      }

      const rest = Math.max(0, totalEff - elapsed);
      const displayRest = Math.max(0, Math.min(rest / 1000, totalSec));
      setRemaining(displayRest);

      const index = Math.floor(elapsed / int);
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        setCurrentDir(randomDir());
        sTick.play();
      }
      const tIn = elapsed % int;
      setShowArrow(tIn < visible);

      rafRef.current = requestAnimationFrame(loop);
    });
  };

  const stopAll = () => {
    clearPrecount(); stopRaf(); wl.release();
    setPhase("param"); // retour aux réglages, on garde l’état
  };

  const restartSame = () => { startPrecount(); };

  useEffect(() => {
    return () => { clearPrecount(); stopRaf(); wl.release(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arrowSize = useMemo(() => {
    if (typeof window === "undefined") return 600;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.min(vw, vh);
    // mobile : occupe ~95% de la plus petite dimension ; desktop : 70% (max 700)
    return (vw <= 900) ? Math.floor(s * 0.95) : Math.min(700, Math.floor(s * 0.70));
  }, [phase]);

  return (
    <main className="shadow-page" aria-live="polite">
      {/* Topbar locale (sans titre – titre déjà dans la navbar globale).
         - Le bouton Retour n’apparaît QUE dans les paramètres
         - Pendant l’exercice : Stop (rouge), Pause (orange) / Reprendre (vert) */}
      <div className="shadow-topbar">
        <div className="shadow-left">
          {phase === "param" && (
            <Link href="/entrainements" className="back-pill back-icon" title="Retour">
              <img src="/Back.svg" alt="Retour" className="back-ic" />
            </Link>
          )}
        </div>
        <div className="shadow-center">{/* vide (respiration) */}</div>
        <div className="shadow-actions">
          {(phase === "precount" || phase === "run" || phase === "paused") && (
            <button className="btn btn--danger" onClick={stopAll} aria-label="Arrêter">Arrêter</button>
          )}
          {phase === "run" && (
            <button className="btn btn--warning" onClick={pause} aria-label="Mettre en pause">Pause</button>
          )}
          {phase === "paused" && (
            <button className="btn btn--success" onClick={resume} aria-label="Reprendre">Reprendre</button>
          )}
        </div>
      </div>

      {/* PARAMÈTRES */}
      {phase === "param" && (
        <section className="shadow-card">
          <div className="shadow-group">
            <label className="shadow-label">
              Durée totale de l’exercice : <strong>{fmt(totalSec)}</strong>
            </label>

            <div className="range-line">
              <input
                type="range"
                min={MIN_TOTAL}
                max={MAX_TOTAL}
                step={STEP_TOTAL}
                value={totalSec}
                onChange={(e) => setTotalSec(Number(e.target.value))}
              />
              {/* Affinage direct (rendu sliders moins “rigides”) */}
              <input
                className="numbox"
                type="number"
                min={MIN_TOTAL}
                max={MAX_TOTAL}
                step={STEP_TOTAL}
                value={totalSec}
                onChange={(e) => setTotalSec(Math.max(MIN_TOTAL, Math.min(MAX_TOTAL, Number(e.target.value))))}
              />
              <span className="numbox-suffix">s</span>
            </div>

            <div className="shadow-scale">
              <span>30s</span><span>1m45s</span><span>3m</span>
            </div>
          </div>

          <div className="shadow-group">
            <label className="shadow-label">
              Durée de chaque intervalle : <strong>{intervalSec.toFixed(1)}s</strong>
            </label>

            <div className="range-line">
              <input
                type="range"
                min={MIN_INT}
                max={MAX_INT}
                step={STEP_INT}
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
              />
              <input
                className="numbox"
                type="number"
                min={MIN_INT}
                max={MAX_INT}
                step={STEP_INT}
                value={intervalSec}
                onChange={(e) => setIntervalSec(Math.max(MIN_INT, Math.min(MAX_INT, Number(e.target.value))))}
              />
              <span className="numbox-suffix">s</span>
            </div>

            <div className="shadow-scale">
              <span>2s</span><span>5s</span><span>8s</span>
            </div>
          </div>

          <div className="shadow-group">
            <p className="shadow-label">Déplacements à entraîner</p>
            <div className="dir-grid dir-grid--two-cols">
              {(Object.keys(DIRS) as DirKey[]).map((k) => {
                const d = DIRS[k];
                const active = selected.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleDir(k)}
                    className={`dir-card ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                    aria-label={d.label}
                  >
                    {/* Remplacement du caractère par l'image */}
                    <img
                      src={d.svg}
                      alt=""
                      className="dir-icon"
                      aria-hidden
                    />
                    <div className="dir-label">{d.label}</div>
                  </button>
                );
              })}
            </div>
          </div>


          <label className="shadow-check">
            <input
              type="checkbox"
              checked={hideProgress}
              onChange={(e) => setHideProgress(e.target.checked)}
            />
            Épurer l’interface (masque le temps restant)
          </label>

          {error && <p className="shadow-error">{error}</p>}

          <div className="shadow-cta">
            <button className="cta-primary" onClick={startPrecount}>GO !</button>
          </div>
        </section>
      )}

      {/* PRÉCOMPTE */}
      {phase === "precount" && (
        <section className="shadow-stage">
          {!hideProgress && (
            <div className="shadow-remaining">
              Temps restant : <strong>{fmt(remaining)}</strong>
            </div>
          )}
          <div className="precount">
            <div className="precount-num">{countdown > 0 ? countdown : "GO !"}</div>
          </div>
        </section>
      )}

      {/* RUN / PAUSED */}
      {(phase === "run" || phase === "paused") && (
        <section className="shadow-stage">
          {!hideProgress && (
            <div className="shadow-remaining">
              Temps restant : <strong>{fmt(remaining)}</strong>
            </div>
          )}
          <div className="arrow-wrap">
            {currentDir && showArrow && (
              <img
                src={DIRS[currentDir].svg}
                alt="Direction"
                style={{
                  width: `${arrowSize}px`,
                  height: `${arrowSize}px`,
                  filter: 'drop-shadow(0 14px 36px rgba(0,0,0,.35))'
                }}
              />
            )}
          </div>
          {phase === "paused" && <div className="paused-badge">En pause</div>}
        </section>
      )}

      {/* FIN */}
      {phase === "finished" && (
        <section className="shadow-finish">
          <div className="thumb">👍</div>
          <h2>Bravo !</h2>
          <p>Exercice terminé.</p>
          <div className="finish-cta">
            <button className="cta-primary" onClick={restartSame}>Recommencer</button>
            <button className="btn btn--ghost" onClick={() => setPhase("param")}>
              Retour aux paramètres
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
