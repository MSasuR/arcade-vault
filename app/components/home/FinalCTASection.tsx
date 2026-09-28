"use client";

import { useRouter } from "next/navigation";

export default function FinalCTASection() {
  const router = useRouter();

  return (
    <section className="home-final reveal">
      <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
      <button
        className="btn xl pulse final-cta"
        onClick={() => router.push("/games")}
      >
        INSERTAR MONEDA →
      </button>
      <div className="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
    </section>
  );
}
