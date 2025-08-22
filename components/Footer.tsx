import React from "react";

export default function Footer() {
  return (
    <footer style={{ padding: "26px 5%", borderTop: "1px solid rgba(255,255,255,.06)", color: "var(--muted)", textAlign: "center" }}>
      © {new Date().getFullYear()} SMASH.bad — Tous droits réservés
    </footer>
  );
}