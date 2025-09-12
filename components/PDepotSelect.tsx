import React, {useEffect, useId, useMemo, useRef, useState} from "react";

type Option = { value: string; label: string };

type PDepotSelectProps = {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function PDepotSelect({
  value,
  onChange,
  options,
  placeholder = "— Sélectionner —",
  disabled = false,
  ariaLabel,
  className = "",
}: PDepotSelectProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState<number>(-1);
  const id = useId();
  const listId = `${id}-listbox`;

  const selectedIndex = useMemo(
    () => options.findIndex(o => o.value === value),
    [options, value]
  );

  // Ouvrir/fermer + focus par défaut
  useEffect(() => {
    if (open) {
      setFocusIdx(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [open, selectedIndex]);

  // Fermer en cliquant hors du composant
  useEffect(() => {
    if (!open) return;
    const onDocDown = (ev: MouseEvent) => {
      if (!listRef.current && !btnRef.current) return;
      const t = ev.target as Node;
      if (
        btnRef.current?.contains(t) ||
        listRef.current?.contains(t)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  // Scroll option en vue quand focusIdx change
  useEffect(() => {
    if (!open || focusIdx < 0) return;
    optRefs.current[focusIdx]?.scrollIntoView({ block: "nearest" });
  }, [focusIdx, open]);

  // Petite recherche clavier (A…Z/0…9)
  const searchBuf = useRef<{q: string; t: number}>({ q: "", t: 0 });
  const typeahead = (key: string) => {
    const now = Date.now();
    if (now - searchBuf.current.t > 750) searchBuf.current.q = "";
    searchBuf.current.t = now;
    searchBuf.current.q += key.toLowerCase();

    const i = options.findIndex(o =>
      o.label.toLowerCase().startsWith(searchBuf.current.q)
    );
    if (i >= 0) setFocusIdx(i);
  };

  const commit = (i: number) => {
    const opt = options[i];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
  };

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (/^[a-z0-9]$/i.test(e.key)) {
      e.preventDefault();
      if (!open) setOpen(true);
      typeahead(e.key);
      return;
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); btnRef.current?.focus(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(options.length - 1, Math.max(0, i + 1))); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(0, (i < 0 ? 0 : i - 1))); return; }
    if (e.key === "Home")      { e.preventDefault(); setFocusIdx(0); return; }
    if (e.key === "End")       { e.preventDefault(); setFocusIdx(options.length - 1); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (focusIdx >= 0) commit(focusIdx); return; }
    if (/^[a-z0-9]$/i.test(e.key)) { e.preventDefault(); typeahead(e.key); return; }
  };

  const label = selectedIndex >= 0 ? options[selectedIndex].label : placeholder;
  const isPlaceholder = selectedIndex < 0;

  return (
    <div className={`pdepot-select ${className}`}>
      <button
        ref={btnRef}
        type="button"
        className={`pdepot-select__button ${open ? "is-open" : ""} ${isPlaceholder ? "is-placeholder" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={onButtonKeyDown}
        disabled={disabled}
      >
        <span className="pdepot-select__value">{label}</span>
      </button>

      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          className="pdepot-select__list"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
        >
          {options.map((opt, i) => {
            const selected = i === selectedIndex;
            const focused = i === focusIdx;
            return (
              <div
                key={opt.value}
                ref={el => (optRefs.current[i] = el)}
                role="option"
                aria-selected={selected}
                className={`pdepot-select__option ${selected ? "is-selected" : ""} ${focused ? "is-focused" : ""}`}
                onMouseEnter={() => setFocusIdx(i)}
                onMouseDown={(e) => e.preventDefault()}   // évite blur avant click
                onClick={() => commit(i)}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}