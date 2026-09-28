"use client";

const STATS = [
  { number: "12+", unit: "JUEGOS", sub: "Y CONTANDO" },
  { number: "MILES", unit: "DE PARTIDAS", sub: "JUGADAS CADA DÍA" },
  { number: "GLOBAL", unit: "RANKING", sub: "COMPITE CON EL MUNDO" },
];

export default function StatsSection() {
  return (
    <section className="home-stats reveal">
      <div className="stats-inner">
        {STATS.map((st, i) => (
          <div
            key={i}
            className="stat-block"
            style={{ transitionDelay: `${i * 90}ms` }}
          >
            <div className="stat-n neon-yellow">{st.number}</div>
            <div className="stat-u pixel">{st.unit}</div>
            <div className="stat-s">{st.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
