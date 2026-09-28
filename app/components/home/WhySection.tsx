"use client";

import FeatureCard from "./FeatureCard";

const FEATURES = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    desc: "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "green",
  },
];

export default function WhySection() {
  return (
    <section className="home-section reveal">
      <div className="section-head">
        <div className="kicker pixel neon-magenta">{"// 01"}</div>
        <h2 className="section-title">¿POR QUÉ ARCADE VAULT?</h2>
        <div className="section-rule"></div>
      </div>
      <div className="feature-grid">
        {FEATURES.map((f, i) => (
          <FeatureCard
            key={i}
            icon={f.icon}
            title={f.title}
            desc={f.desc}
            color={f.color}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
