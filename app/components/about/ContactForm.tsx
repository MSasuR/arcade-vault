"use client";

import { useState, type FormEvent } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONTACT_TIPS = [
  { led: "", text: "RESPUESTA EN 24-48H" },
  { led: "y", text: "SUGERENCIAS BIENVENIDAS" },
  { led: "m", text: "SIN SPAM, JAMÁS" },
];

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const resetForm = () => {
    setSent(null);
    setName("");
    setEmail("");
    setMsg("");
    setError("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMsg = msg.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMsg) {
      triggerShake();
      setError("Completa todos los campos");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      triggerShake();
      setError("El email no es válido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMsg,
        }),
      });

      if (res.status === 429) {
        setError("Máx 1 mensaje cada 5 minutos");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "No se pudo enviar el mensaje");
        return;
      }

      setSent(trimmedName);
    } catch {
      setError("No se pudo enviar el mensaje");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="about-contact reveal">
      <div className="contact-grid">
        <div className="contact-intro">
          <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
          <h2 className="contact-title">CONTÁCTANOS</h2>
          <p className="contact-sub">
            ¿Tienes alguna sugerencia, quieres proponer un juego, o
            simplemente quieres saludar? Escríbenos.
          </p>
          <div className="contact-tips">
            {CONTACT_TIPS.map((tip) => (
              <div className="tip" key={tip.text}>
                <span className={`tip-led${tip.led ? ` ${tip.led}` : ""}`}></span>
                {tip.text}
              </div>
            ))}
          </div>
        </div>

        <form
          className={`contact-form${shake ? " shake" : ""}`}
          onSubmit={onSubmit}
          noValidate
        >
          {!sent ? (
            <>
              <div className="field">
                <label>NOMBRE</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="px_kai"
                />
              </div>
              <div className="field">
                <label>CORREO ELECTRÓNICO</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jugador@vault.gg"
                />
              </div>
              <div className="field">
                <label>MENSAJE</label>
                <textarea
                  rows={5}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Cuéntanos qué tienes en mente…"
                ></textarea>
              </div>
              <button
                className="btn xl press"
                type="submit"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
              </button>
              {error && <div className="contact-error">{error}</div>}
            </>
          ) : (
            <div className="terminal-success">
              <div className="term-bar">
                <span className="dot r"></span>
                <span className="dot y"></span>
                <span className="dot g"></span>
                <span className="term-title">VAULT-OS // TERMINAL</span>
              </div>
              <div className="term-body">
                <div className="line">
                  <span className="prompt">vault@arcade:~$</span>{" "}
                  ./send_message --to=team
                </div>
                <div className="line dim">[OK] Conectando con servidor…</div>
                <div className="line dim">[OK] Validando contenido…</div>
                <div className="line dim">[OK] Transmitiendo paquete…</div>
                <div className="line success">
                  &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS,{" "}
                  {sent.toUpperCase()}.<span className="caret">_</span>
                </div>
                <div style={{ marginTop: 18 }}>
                  <button className="btn ghost" type="button" onClick={resetForm}>
                    ENVIAR OTRO MENSAJE
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
