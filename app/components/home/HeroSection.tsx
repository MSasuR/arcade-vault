"use client";

import { useRouter } from "next/navigation";
import FloatingSilhouettes from "./FloatingSilhouettes";

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="home-hero">
      <FloatingSilhouettes />
      <div className="home-hero-inner">
        <div className="hero-eyebrow pixel neon-yellow">
          ▸ INSERTA UNA MONEDA<span className="blink">_</span>
        </div>
        <h1 className="home-title">
          <span className="line-1">EL ARCADE</span>
          <span className="line-2">CLÁSICO ESTÁ</span>
          <span className="line-3">DE VUELTA</span>
        </h1>
        <p className="home-sub">
          Juega los mejores clásicos directamente en tu navegador.
          <br />
          Sin descargas. Sin costo. Solo diversión.
        </p>
        <div className="home-ctas">
          <button
            className="btn xl pulse"
            onClick={() => router.push("/games")}
          >
            ▶ EXPLORAR JUEGOS
          </button>
          <button
            className="btn xl magenta"
            onClick={() => router.push("/auth")}
          >
            ✦ CREAR CUENTA
          </button>
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <span>DESLIZA</span>
          <span className="arrow">▼</span>
        </div>
      </div>
    </section>
  );
}
