// pages/shadow.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ---------- Types & constantes ----------
type DirKey = "AG" | "AD" | "G" | "D" | "DG" | "DD";
type Phase = "param" | "precount" | "running" | "paused" | "finished";

const LS_KEY = "shadow.v1";

const DIRS: Record<DirKey, { key: DirKey; label: string; svg: string }> = {
  AG: { key: "AG", label: "Amorti gauche",     svg: "/shadow/arrow-AG.svg" },
  AD: { key: "AD", label: "Amorti droit",      svg: "/shadow/arrow-AD.svg" },
  G:  { key: "G",  label: "Défense à gauche",  svg: "/shadow/arrow-G.svg"  },
  D:  { key: "D",  label: "Défense à droite",  svg: "/shadow/arrow-D.svg"  },
  DG: { key: "DG", label: "Dégagement gauche", svg: "/shadow/arrow-DG.svg" },
  DD: { key: "DD", label: "Dégagement droit",  svg: "/shadow/arrow-DD.svg" },
};

const MIN_TOTAL = 30;   // secondes
const MAX_TOTAL = 180;  // 3 min
const STEP_TOTAL = 5;

const MIN_INT = 2;      // secondes
const MAX_INT = 8;
const STEP_INT = 0.5;   // 0.5s

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

// localStorage helpers
const loadState = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const saveState = (v: unknown) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(v));
  } catch {}
};

// Audio (silencieux si fichier absent)
function useAudio(src: string | null) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!src) return;
    ref.current = new Audio(src);
  }, [src]);
  return {
    play: () => {
      if (!ref.current) return;
      try {
        ref.current.currentTime = 0;
        void ref.current.play();
      } catch {}
    },
    stop: () => {
      if (!ref.current) return;
      ref.current.pause();
      ref.current.currentTime = 0;
    },
  };
}



export default function Shadow() {
  const [minimalUi, setMinimalUi] = useState<boolean>(false);

  // tout en haut de Shadow()
    useEffect(() => {
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      setVH();
      window.addEventListener('resize', setVH);
      window.addEventListener('orientationchange', setVH);
      return () => {
        window.removeEventListener('resize', setVH);
        window.removeEventListener('orientationchange', setVH);
      };
    }, []);

    useEffect(() => {
      const calcSize = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const navH = minimalUi ? 0 : 64; // navbar visible en standard
        const ctrlH = controlsRef.current?.offsetHeight ?? 0;

        // bottomnav si présente (mobile)
        const bn = document.querySelector<HTMLElement>(".bottomnav");
        const bottomH = (bn && getComputedStyle(bn).display !== "none") ? bn.offsetHeight : 0;

        // marge de confort
        const margins = 24;

        const availW = vw - margins * 2;
        const availH = vh - navH - ctrlH - bottomH - margins * 2;

        const base = Math.max(120, Math.min(availW, availH));     // côté utilisable
        const size = Math.floor(base * 0.80);                     // ~80%
        setArrowPx(size);
      };

      calcSize();
      const ro = new ResizeObserver(calcSize);
      controlsRef.current && ro.observe(controlsRef.current);
      window.addEventListener("resize", calcSize);
      window.addEventListener("orientationchange", calcSize);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", calcSize);
        window.removeEventListener("orientationchange", calcSize);
      };
    }, [minimalUi]);


  // Réglages (persistants)
  const [totalSec, setTotalSec] = useState<number>(60);
  const [intervalSec, setIntervalSec] = useState<number>(5);
  const [selected, setSelected] = useState<DirKey[]>(["AG", "AD", "G", "D", "DG", "DD"]);
  

  // État runtime
  const [phase, setPhase] = useState<Phase>("param");
  const [countdown, setCountdown] = useState<number>(3); // 3→2→1→GO
  const [currentDir, setCurrentDir] = useState<DirKey | null>(null);
  const [showArrow, setShowArrow] = useState<boolean>(true);
  const [remaining, setRemaining] = useState<number>(60); // s

  // Gestion du temps
  const startedAtRef = useRef<number | null>(null);
  const pausedAccumRef = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);

  // Timers
  const preTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const nextTimeoutRef = useRef<number | null>(null);
  const remainingIntervalRef = useRef<number | null>(null);

  // Sons
  const sPre = useAudio("/sounds/Precompte.mp3"); // 3,2,1
  const sGo  = useAudio("/sounds/Go.mp3");        // GO!
  const sTick= useAudio("/sounds/Bip.mp3");       // nouvelle flèche
  const sEnd = useAudio("/sounds/End.mp3");       // fin

  //Calcul la taille de flèche en fonction de l'espace disponible
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const [arrowPx, setArrowPx] = useState<number>(480);


  // Migration depuis anciens codes NW/NE/...
  const mapOld: Record<string, DirKey> = { NW: "AG", NE: "AD", W: "G", E: "D", SW: "DG", SE: "DD" };

  // Wake Lock (empêche la mise en veille)
  type WakeLockSentinel = any;
  const wakeRef = useRef<WakeLockSentinel | null>(null);

  async function acquireWakeLock() {
    try {
      if ("wakeLock" in navigator && (navigator as any).wakeLock?.request) {
        wakeRef.current = await (navigator as any).wakeLock.request("screen");
        wakeRef.current?.addEventListener?.("release", () => {});
      }
    } catch {}
  }
  function releaseWakeLock() {
    try { wakeRef.current?.release?.(); } catch {}
    wakeRef.current = null;
  }

  // Re-demande le wake lock si on revient visible pendant un run
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && phase === "running") {
        void acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase]);

  // Charger l'état sauvegardé
  useEffect(() => {
    const saved = loadState();
    if (!saved) return;
    if (typeof saved.totalSec === "number") setTotalSec(saved.totalSec);
    if (typeof saved.intervalSec === "number") setIntervalSec(saved.intervalSec);
    if (Array.isArray(saved.dirs) && saved.dirs.length) {
      setSelected(saved.dirs.map((k: string) => mapOld[k] ?? k) as DirKey[]);
    }
    if (typeof saved.minimalUi === "boolean") setMinimalUi(saved.minimalUi);
  }, []);

  // Sauvegarder l’état
  useEffect(() => {
    saveState({ totalSec, intervalSec, dirs: selected, minimalUi });
  }, [totalSec, intervalSec, selected, minimalUi]);

  // Masquer la chrome (Header/BottomNav) en mode épuré pendant l'exo
  useEffect(() => {
    const shouldHide =
      minimalUi && (phase === "precount" || phase === "running" || phase === "paused");
    const cls = "sb-chrome-hidden";
    const b = document.body;

    if (shouldHide) b.classList.add(cls); else b.classList.remove(cls);
    return () => b.classList.remove(cls); // sécurité au démontage
  }, [minimalUi, phase]);

  const canGo = selected.length > 0;

  const toggleDir = (k: DirKey) => {
    setSelected((prev) => {
      if (prev.includes(k)) {
        const next = prev.filter((x) => x !== k);
        return next.length ? next : prev; // toujours ≥1
      }
      return [...prev, k];
    });
  };

  // Durée totale effective (on allonge pour compléter le dernier intervalle)
  const effectiveTotalSec = useMemo(() => ceilTo(totalSec, intervalSec), [totalSec, intervalSec]);

  // Helpers timers
  function clearAllTimers() {
    if (preTimeoutRef.current) { clearTimeout(preTimeoutRef.current); preTimeoutRef.current = null; }
    if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
    if (nextTimeoutRef.current) { clearTimeout(nextTimeoutRef.current); nextTimeoutRef.current = null; }
    if (remainingIntervalRef.current) { clearInterval(remainingIntervalRef.current); remainingIntervalRef.current = null; }
  }

  // Mise à jour du temps restant (toutes les 50ms)
  function startRemainingTicker() {
    if (remainingIntervalRef.current) clearInterval(remainingIntervalRef.current);
    remainingIntervalRef.current = window.setInterval(() => {
      if (startedAtRef.current == null) return;
      const elapsed = Date.now() - startedAtRef.current - pausedAccumRef.current;
      const restMs = Math.max(0, Math.round(effectiveTotalSec * 1000) - elapsed);
      setRemaining(Math.min(totalSec, restMs / 1000));
      if (restMs <= 0) {
        finishExercise();
      }
    }, 50);
  }

  // Cycle des flèches (une seule “horloge”)
  function cycleArrow() {
    // choisit et montre
    const pool = selected.length ? selected : (Object.keys(DIRS) as DirKey[]);
    const dir = pool[Math.floor(Math.random() * pool.length)];
    setCurrentDir(dir);
    setShowArrow(true);
    sTick.play();

    const intervalMs = Math.round(intervalSec * 1000);
    const hideDelay = Math.max(150, Math.round(intervalMs * VISIBLE_RATIO));

    // masque avant la prochaine
    hideTimeoutRef.current = window.setTimeout(() => {
      setShowArrow(false);
    }, hideDelay);

    // planifie la suivante
    nextTimeoutRef.current = window.setTimeout(() => {
      // vérifie la fin ici aussi (en complément du ticker)
      if (startedAtRef.current != null) {
        const elapsed = Date.now() - startedAtRef.current - pausedAccumRef.current;
        if (elapsed >= effectiveTotalSec * 1000) {
          finishExercise();
          return;
        }
      }
      cycleArrow();
    }, intervalMs);
  }

  // Lancement : pré-compte 3-2-1-GO!, puis début run
  async function startExercise() {
    if (!canGo) return;
    // remonte en haut pour bien voir la flèche
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}

    clearAllTimers();
    pausedAccumRef.current = 0;
    pausedAtRef.current = null;

    await acquireWakeLock();

    setPhase("precount");
    setCountdown(3);
    sPre.play(); // "3"

    const tick = (n: number) => {
      preTimeoutRef.current = window.setTimeout(() => {
        if (n > 1) {
          setCountdown(n - 1);
          sPre.play();            // "2", puis "1"
          tick(n - 1);
        } else {
          // Affiche "GO !" pendant 1s
          setCountdown(0);
          sGo.play();
          preTimeoutRef.current = window.setTimeout(() => {
            beginRun();
          }, 1000);
        }
      }, 1000);
    };
    tick(3);
  }

  function beginRun() {
    clearAllTimers();
    setPhase("running");
    startedAtRef.current = Date.now();
    startRemainingTicker();
    cycleArrow();
  }

  function pause() {
    if (phase !== "running") return;
    clearAllTimers();
    pausedAtRef.current = Date.now();
    setPhase("paused");
  }

  function resume() {
    if (phase !== "paused") return;
    // accumule le temps en pause
    if (pausedAtRef.current != null) {
      pausedAccumRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    setPhase("running");
    startRemainingTicker();
    cycleArrow();
  }

  function finishExercise() {
    clearAllTimers();
    setShowArrow(false);
    setPhase("finished");
    releaseWakeLock();
    sEnd.play();
  }

  function stopAll() {
    clearAllTimers();
    setShowArrow(false);
    setPhase("param"); // retour aux réglages, on garde l’état
    releaseWakeLock();
  }

  function restartSame() {
    // relance directement un nouveau run avec les mêmes réglages
    startExercise();
  }

  // Arrow size responsive
  const arrowSize = useMemo(() => {
    if (typeof window === "undefined") return 600;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.min(vw, vh);
    // mobile : ~95% ; desktop : 70% (max 700)
    return vw <= 900 ? Math.floor(s * 0.95) : Math.min(700, Math.floor(s * 0.7));
  }, [phase]);

  return (
    <main className="shadow-page" aria-live="polite">
      {/* Bandeau de contrôle */}
      <div ref={controlsRef} className="shadow-controls" style={{ ["--nav-offset" as any]: minimalUi ? "0px" : "64px" }}>
        {(phase === "precount" || phase === "running" || phase === "paused") && (
          <div className="shadow-controls__actions" role="toolbar" aria-label="Contrôles de l'exercice">
            <button className="btn btn--danger btn--lg" onClick={stopAll} aria-label="Arrêter">Arrêter</button>

            {phase === "running" && (
              <button className="btn btn--warning btn--lg" onClick={pause} aria-label="Mettre en pause">Pause</button>
            )}
            {phase === "paused" && (
              <button className="btn btn--success btn--lg" onClick={resume} aria-label="Reprendre">Reprendre</button>
            )}
          </div>

          {/* Barre de progression — uniquement en mode standard */}
            {!minimalUi && (
              <div className="shadow-progress" aria-hidden>
                <div
                  className="shadow-progress__bar"
                  style={{
                    transform: `scaleX(${Math.max(0, Math.min(1,
                      1 - (remaining / (effectiveTotalSec || 1))
                    ))})`,
                  }}
                />
              </div>
            )}

        )}
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
              {/* champ numérique pour affiner */}
              <input
                className="numbox"
                type="number"
                min={MIN_TOTAL}
                max={MAX_TOTAL}
                step={STEP_TOTAL}
                value={totalSec}
                onChange={(e) =>
                  setTotalSec(Math.max(MIN_TOTAL, Math.min(MAX_TOTAL, Number(e.target.value))))
                }
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
                onChange={(e) =>
                  setIntervalSec(Math.max(MIN_INT, Math.min(MAX_INT, Number(e.target.value))))
                }
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
                    <img src={d.svg} alt="" className="dir-icon" aria-hidden />
                    <div className="dir-label">{d.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="shadow-check">
            <input
              type="checkbox"
              checked={minimalUi}
              onChange={(e) => setMinimalUi(e.target.checked)}
            />
            Épurer l'interface (idéal pour maximiser l'immersion ou pour les petits écrans)
          </label>

          <div className="shadow-cta">
            <button className="cta-primary" onClick={startExercise} disabled={!canGo}>
              GO !
            </button>
          </div>
        </section>
      )}

      {/* PRÉ-COMPTE */}
      {phase === "precount" && (
        <section className="shadow-stage">
                    {!minimalUi && (
          )}
          <div className="precount">
            <div className="precount-num">{countdown > 0 ? countdown : "GO !"}</div>
          </div>
        </section>
      )}

      {/* RUN / PAUSED */}
      {(phase === "running" || phase === "paused") && (
        <section className="shadow-stage">

          {!minimalUi && (
          )}
          <div className="arrow-wrap">
            {currentDir && showArrow && (
              <img
                src={DIRS[currentDir].svg}
                alt="Direction"
                style={{
                  width: `${arrowPx}px`,
                  height: `${arrowPx}px`,
                  filter: "drop-shadow(0 14px 36px rgba(0,0,0,.35))",
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
