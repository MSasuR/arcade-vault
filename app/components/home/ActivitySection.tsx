"use client";

import { useRouter } from "next/navigation";

const ACTIVITY_FEED = [
  { player: "NEONFOX", game: "Caída", score: 184220, time: "hace 2 min", color: "magenta" },
  { player: "PX_KAI", game: "Glotón", score: 96400, time: "hace 5 min", color: "yellow" },
  { player: "Z3R0COOL", game: "Invasores", score: 54190, time: "hace 8 min", color: "green" },
  { player: "VAULT_07", game: "Rocas", score: 41200, time: "hace 12 min", color: "cyan" },
  { player: "GLITCHA", game: "Bloque Buster", score: 28450, time: "hace 18 min", color: "cyan" },
  { player: "ARKADYA", game: "Serpentina", score: 7820, time: "hace 24 min", color: "green" },
  { player: "CYBER_LU", game: "Ranaria", score: 18900, time: "hace 31 min", color: "yellow" },
];

const TOP_PLAYERS = [
  { rank: 1, player: "NEONFOX", score: 312840 },
  { rank: 2, player: "PX_KAI", score: 248110 },
  { rank: 3, player: "M00NRYU", score: 196720 },
  { rank: 4, player: "VAULT_07", score: 154300 },
  { rank: 5, player: "GLITCHA", score: 138900 },
];

export default function ActivitySection() {
  const router = useRouter();

  return (
    <section className="home-section reveal">
      <div className="section-head">
        <div className="kicker pixel neon-yellow">// 03</div>
        <h2 className="section-title">ACTIVIDAD EN VIVO</h2>
        <div className="section-rule"></div>
      </div>
      <div className="activity-grid">
        <div className="activity-card">
          <div className="ac-head">
            <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
          </div>
          <div className="ticker">
            {ACTIVITY_FEED.map((r, i) => (
              <div key={i} className="tick-row" style={{ animationDelay: `${i * 60}ms` }}>
                <span className={`tk-p neon-${r.color}`}>{r.player}</span>
                <span className="tk-mid">▸ {r.game}</span>
                <span className="tk-s">+{r.score.toLocaleString("es-ES")}</span>
                <span className="tk-t">{r.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-card">
          <div className="ac-head">
            <div className="ac-title pixel neon-magenta">▸ TOP JUGADORES · HOY</div>
            <button className="lb-link" onClick={() => router.push("/salon")}>
              VER SALÓN →
            </button>
          </div>
          <div className="top-list">
            {TOP_PLAYERS.map((r, i) => (
              <div
                key={i}
                className={
                  "top-row" +
                  (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")
                }
              >
                <span className="tp-rk">#{String(r.rank).padStart(2, "0")}</span>
                <span className="tp-bar">
                  <span className="tp-fill" style={{ width: `${100 - i * 16}%` }}></span>
                </span>
                <span className="tp-p">{r.player}</span>
                <span className="tp-s">{r.score.toLocaleString("es-ES")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
