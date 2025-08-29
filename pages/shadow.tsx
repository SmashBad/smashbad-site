// pages/shadow.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ---------- Types & constantes ----------
type DirKey = "AG" | "AD" | "G" | "D" | "DG" | "DD";
type Phase = "param" | "precount" | "run" | "paused" | "finished";

const LS_KEY = "shadow.v1";

const DIRS: Record<DirKey, { key: DirKey; label: string; char: string }> = {
  AG: { key: "AG", label: "Amorti Gauche",  char:"↖"},
  AD: { key: "AD", label: "Amorti Droit", char:"↗"},
  G:  { key: "G",  label: "À Gauche", char:"←"},
  D:  { key: "D",  label: "À Droite", char:"→"},
  DG: { key: "DG", label: "Dégagement Gauche",  char:"↙"},
  DD: { key: "DD", label: "Dégagement Droit", char:"↘"},
};

const MIN_TOTAL = 30;   // secondes
const MAX_TOTAL = 180;  // 3 min
const STEP_TOTAL = 5;

const MIN_INT = 2;   // secondes
const MAX_INT = 8;
const STEP_INT = 0.5; // pas 0.5s

// Durée visible/cachée : 2/3 - 1/3 (exigence produit)
const VISIBLE_RATIO = 2 / 3;

// ---------- Petits utilitaires ----------
const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
};

const ceilTo = (value: number, step: number) =>
  Math.ceil(value / step) * step;

// Chargement/Enregistrement localStorage
const loadState = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p;
  } catch {
    return null;
  }
};

const saveState = (v: unknown) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(v));
  } catch {}
};

// Sons (facultatifs) — silencieux si fichiers absents
function useAudio(src: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!src) return;
    audioRef.current = new Audio(src);
  }, [src]);
  return {
    play: () => {
      const el = audioRef.current;
      if (!el) return;
      el.currentTime = 0;
      el.play().catch(() => {});
    },
    stop: () => {
      const el = audioRef.current;
      if (!el) return;
      el.pause();
      el.currentTime = 0;
    },
  };
}

// Wake lock (empêcher la mise en veille)
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
    try {
      if (wl.current && wl.current.release) {
        await wl.current.release();
      }
      wl.current = null;
    } catch {}
  };
  return { request, release };
}

// ---------- Flèche SVG géante ----------
function BigArrowChar({ char, size = 600, color = "#12D8DF" }: { char: string; size?: number; color?: string; }) {
  // Une simple flèche épaisse et lisible
  const s = size;
  return (
    <div
      className="big-arrow"
      role="img"
      aria-label="Direction"
      style={{
        fontSize: `${Math.floor(size * 0.8)}px`,
        color,
      }}
    >
      {char}
    </div>
  );
}

// ---------- Page principale ----------
export default function Shadow() {
  // ---- État persistant (réglages) ----
  const [totalSec, setTotalSec] = useState<number>(60);
  const [intervalSec, setIntervalSec] = useState<number>(5);
  const [selected, setSelected] = useState<DirKey[]>(["AG", "AD", "G", "D", "DG", "DD"]);
  const [hideProgress, setHideProgress] = useState<boolean>(false);

  // ---- État runtime ----
  const [phase, setPhase] = useState<Phase>("param");
  const [countdown, setCountdown] = useState<number>(3); // 3→2→1→GO(0)
  const [currentDir, setCurrentDir] = useState<DirKey | null>(null);
  const [showArrow, setShowArrow] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Chrono
  const [remaining, setRemaining] = useState<number>(60); // secondes

  // Raf & refs
  const rafRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);
  const lastIndexRef = useRef<number>(-1);
  const totalMsRef = useRef<number>(0);
  const visibleMsRef = useRef<number>(0);
  const intMsRef = useRef<number>(0);

  // Timers du precount
  const precountTimers = useRef<number[]>([]);

  // Sons
  const beep = useAudio("/sounds/countdown-beep.mp3"); // 3-2-1-GO
  const tick = useAudio("/sounds/tick.mp3");           // nouvelle flèche
  const finish = useAudio("/sounds/finish.mp3");       // fin

  // WakeLock
  const wl = useWakeLock();

  // Charger réglages sauvegardés
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      if (typeof saved.totalSec === "number") setTotalSec(saved.totalSec);
      if (typeof saved.intervalSec === "number") setIntervalSec(saved.intervalSec);
      if (Array.isArray(saved.dirs) && saved.dirs.length) setSelected(saved.dirs);
      if (typeof saved.hideProgress === "boolean") setHideProgress(saved.hideProgress);
    }
  }, []);

  // Sauvegarder à chaque modif des réglages
  useEffect(() => {
    saveState({
      totalSec,
      intervalSec,
      dirs: selected,
      hideProgress,
    });
  }, [totalSec, intervalSec, selected, hideProgress]);

  // -------- Helpers --------
  const roundedTotal = useMemo(
    () => ceilTo(totalSec, intervalSec), // arrondi au-dessus
    [totalSec, intervalSec]
  );

  const canGo = selected.length > 0;

  const toggleDir = (key: DirKey) => {
    setSelected(prev => {
      if (prev.includes(key)) {
        const next = prev.filter(k => k !== key);
        return next.length ? next : prev; // garde au moins 1
      } else return [...prev, key];
    });
  };

  const randomDir = () => {
    const arr = selected;
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
  };

  // -------- Pré-compte --------
  const clearPrecountTimers = () => {
    precountTimers.current.forEach(id => clearTimeout(id));
    precountTimers.current = [];
  };

  const startPrecount = async () => {
    setError("");
    if (!canGo) {
      setError("Choisis au moins une direction.");
      return;
    }
    // config timers
    intMsRef.current = Math.round(intervalSec * 1000);
    visibleMsRef.current = Math.round(intMsRef.current * VISIBLE_RATIO);
    totalMsRef.current = Math.round(roundedTotal * 1000);
    setRemaining(roundedTotal);

    // État & wake lock
    setPhase("precount");
    await wl.request();

    setCountdown(3);
    beep.play();

    clearPrecountTimers();
    precountTimers.current.push(
      window.setTimeout(() => { setCountdown(2); beep.play(); }, 1000),
      window.setTimeout(() => { setCountdown(1); beep.play(); }, 2000),
      window.setTimeout(() => { setCountdown(0); beep.play(); }, 3000),
      window.setTimeout(() => { startRun(); }, 4000) // GO compte 1s
    );
  };

  // -------- Run loop --------
  const stopRaf = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const startRun = () => {
    clearPrecountTimers();
    setPhase("run");
    startTsRef.current = performance.now();
    lastIndexRef.current = -1;
    setCurrentDir(randomDir());
    setShowArrow(true);
    tick.play();

    const loop = () => {
      const now = performance.now();
      const elapsed = now - startTsRef.current;

      const total = totalMsRef.current;
      const int = intMsRef.current;
      const visible = visibleMsRef.current;

      // Fin ?
      if (elapsed >= total) {
        setRemaining(0);
        finish.play();
        stopRaf();
        wl.release();
        setPhase("finished");
        return;
      }

      // Temps restant affiché (arrondi sec.)
      setRemaining((total - elapsed) / 1000);

      // Gestion phases intervalle
      const index = Math.floor(elapsed / int);
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        setCurrentDir(randomDir());
        tick.play();
      }
      const tIn = elapsed % int;
      setShowArrow(tIn < visible);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  const pause = () => {
    if (phase !== "run") return;
    stopRaf();
    setPhase("paused");
  };

  const resume = () => {
    if (phase !== "paused") return;
    // On redémarre en rebasant le start pour conserver le remaining
    const remainingMs = Math.max(0, remaining * 1000);
    startTsRef.current = performance.now() - (totalMsRef.current - remainingMs);
    setPhase("run");
    rafRef.current = requestAnimationFrame(function loop() {
      const now = performance.now();
      const elapsed = now - startTsRef.current;

      const total = totalMsRef.current;
      const int = intMsRef.current;
      const visible = visibleMsRef.current;

      if (elapsed >= total) {
        setRemaining(0);
        finish.play();
        stopRaf();
        wl.release();
        setPhase("finished");
        return;
      }

      setRemaining((total - elapsed) / 1000);

      const index = Math.floor(elapsed / int);
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        setCurrentDir(randomDir());
        tick.play();
      }
      const tIn = elapsed % int;
      setShowArrow(tIn < visible);

      rafRef.current = requestAnimationFrame(loop);
    });
  };

  const stopAll = () => {
    clearPrecountTimers();
    stopRaf();
    wl.release();
    setPhase("param"); // on revient aux réglages sans effacer l’état
  };

  const restartSame = () => {
    // Recommencer tel quel → repart sur le pré-compte
    startPrecount();
  };

  // Nettoyage global au démontage
  useEffect(() => {
    return () => {
      clearPrecountTimers();
      stopRaf();
      wl.release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Taille de flèche selon viewport
  const arrowSize = useMemo(() => {
    // Mobile : ~90% largeur ; Desktop : 600px max
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const mobileGuess = vw <= 768;
    return mobileGuess ? Math.floor(Math.min(vw, vh) * 0.9) : Math.min(600, Math.floor(Math.min(vw, vh) * 0.4));
  }, [phase]); // c’est suffisant

  return (
    <main className="shadow-page" aria-live="polite">
      {/* barre supérieure : Back + titre + actions */}
      <div className="shadow-topbar">
        <Link href="/entrainements" className="back-pill" title="Retour">
          <img src="/Back.svg" alt="" aria-hidden className="back-ic" />
          <span>Retour</span>
        </Link>

        <h1 className="shadow-title">SHADOW</h1>

        <div className="shadow-actions">
          {(phase === "precount" || phase === "run" || phase === "paused") && (
            <button className="btn btn--ghost" onClick={stopAll} aria-label="Arrêter">
              Arrêter
            </button>
          )}
          {phase === "run" && (
            <button className="btn btn--ghost" onClick={pause} aria-label="Mettre en pause">
              Pause
            </button>
          )}
          {phase === "paused" && (
            <button className="btn btn--ghost" onClick={resume} aria-label="Reprendre">
              Reprendre
            </button>
          )}
        </div>
      </div>

      {/* ----- ÉTAT : PARAMÈTRES ----- */}
      {phase === "param" && (
        <section className="shadow-card">
          <div className="shadow-group">
            <label className="shadow-label">
              Durée totale de l’exercice : <strong>{fmt(roundedTotal)}</strong>
            </label>
            <input
              type="range"
              min={MIN_TOTAL}
              max={MAX_TOTAL}
              step={STEP_TOTAL}
              value={totalSec}
              onChange={(e) => setTotalSec(Number(e.target.value))}
            />
            <div className="shadow-scale">
              <span>30s</span><span>1m45s</span><span>3m</span>
            </div>
          </div>

          <div className="shadow-group">
            <label className="shadow-label">
              Durée de chaque intervalle : <strong>{intervalSec.toFixed(1)}s</strong>
            </label>
            <input
              type="range"
              min={MIN_INT}
              max={MAX_INT}
              step={STEP_INT}
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number(e.target.value))}
            />
            <div className="shadow-scale">
              <span>2s</span><span>5s</span><span>8s</span>
            </div>
          </div>

          <div className="shadow-group">
            <p className="shadow-label">Positions à entraîner</p>
            <div className="dir-grid">
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
                    <div className="dir-char">{d.char}</div>
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
            Masquer la progression en cours
          </label>

          {error && <p className="shadow-error">{error}</p>}

          <div className="shadow-cta">
            <button className="cta-primary" onClick={startPrecount}>GO !</button>
          </div>
        </section>
      )}

      {/* ----- ÉTAT : PRECOUNT ----- */}
      {phase === "precount" && (
        <section className="shadow-stage">
          {!hideProgress && (
            <div className="shadow-remaining">
              Temps restant : <strong>{fmt(roundedTotal)}</strong>
            </div>
          )}
          <div className="precount">
            <div className="precount-num">
              {countdown > 0 ? countdown : "GO !"}
            </div>
          </div>
        </section>
      )}

      {/* ----- ÉTAT : RUN ----- */}
      {(phase === "run" || phase === "paused") && (
        <section className="shadow-stage">
          {!hideProgress && (
            <div className="shadow-remaining">
              Temps restant : <strong>{fmt(remaining)}</strong>
            </div>
          )}
          <div className="arrow-wrap">
            {currentDir && showArrow && (
              <BigArrowChar char={DIRS[currentDir].char} size={arrowSize} />
            )}
          </div>
          {phase === "paused" && <div className="paused-badge">En pause</div>}
        </section>
      )}

      {/* ----- ÉTAT : FINI ----- */}
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
