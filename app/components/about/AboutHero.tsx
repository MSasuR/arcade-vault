"use client";

import HighlightIcon from "./HighlightIcon";

const HIGHLIGHTS = [
  { icon: "HEART", title: "HECHO CON ❤️ PARA JUGADORES", color: "magenta" },
  { icon: "BROWSER", title: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", color: "cyan" },
  { icon: "PLANT", title: "PROYECTO EN CONSTANTE CRECIMIENTO", color: "green" },
];

export default function AboutHero() {
  return (
    <section className="about-hero">
      <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
      <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
      <p className="about-mission">
        ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra
        misión es preservar y celebrar los arcades que definieron una
        generación, haciéndolos accesibles para todos, en cualquier lugar y
        sin costo.
      </p>

      <div className="highlight-row">
        {HIGHLIGHTS.map((h, i) => (
          <div
            key={h.title}
            className={`highlight ${h.color}`}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <HighlightIcon kind={h.icon} />
            <div className="hl-text pixel">{h.title}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
