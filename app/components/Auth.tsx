"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[A-Za-z0-9_]{3,10}$/;

export default function Auth() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [tab, setTab] = useState<"in" | "up">("in");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const changeTab = (next: "in" | "up") => {
    setTab(next);
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const username = user.trim().toUpperCase();
    if (tab === "up" && !USERNAME_RE.test(username)) {
      setError("USUARIO: 3 A 10 CARACTERES (LETRAS, NÚMEROS O _)");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("EL CORREO NO ES VÁLIDO");
      return;
    }
    if (pass.length < 6) {
      setError("LA CONTRASEÑA DEBE TENER AL MENOS 6 CARACTERES");
      return;
    }

    setLoading(true);
    try {
      if (tab === "in") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (err) {
          setError(
            err.code === "invalid_credentials"
              ? "CORREO O CONTRASEÑA INCORRECTOS"
              : "ERROR DE CONEXIÓN. INTENTA DE NUEVO",
          );
          return;
        }
        router.push("/games");
        return;
      }

      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (taken) {
        setError("ESE USUARIO YA EXISTE");
        return;
      }

      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: { data: { username } },
      });
      if (err) {
        if (err.code === "user_already_exists") {
          setError("ESE CORREO YA ESTÁ REGISTRADO");
        } else if (err.code === "email_address_invalid") {
          setError("EL CORREO NO ES VÁLIDO");
        } else if (err.code === "over_email_send_rate_limit") {
          setError("DEMASIADOS INTENTOS. ESPERA UN MOMENTO");
        } else if (/database error/i.test(err.message)) {
          // El trigger falló por la restricción unique de username (carrera).
          setError("ESE USUARIO YA EXISTE");
        } else {
          setError("ERROR DE CONEXIÓN. INTENTA DE NUEVO");
        }
        return;
      }
      if (data.session) {
        router.push("/games");
      } else {
        setError("REVISA TU CORREO PARA CONFIRMAR LA CUENTA");
      }
    } catch {
      setError("ERROR DE CONEXIÓN. INTENTA DE NUEVO");
    } finally {
      setLoading(false);
    }
  };

  const guest = async () => {
    await supabase.auth.signOut();
    router.push("/games");
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button className={tab === "in" ? "on" : ""} onClick={() => changeTab("in")}>
            INICIAR SESIÓN
          </button>
          <button className={tab === "up" ? "on" : ""} onClick={() => changeTab("up")}>
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          {tab === "up" && (
            <div className="field slide-in">
              <label>Usuario</label>
              <input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="px_kai"
                maxLength={10}
                autoComplete="username"
              />
            </div>
          )}
          <div className="field">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jugador@vault.gg"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="contact-error">{error}</div>}

          <button
            className="btn lg"
            type="submit"
            disabled={loading}
            style={{ width: "100%", marginTop: 8 }}
          >
            {loading ? "CONECTANDO..." : tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
          </button>
        </form>

        <button className="btn ghost" style={{ width: "100%", marginTop: 10 }} onClick={guest}>
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button">
            ◆ GOOGLE
          </button>
          <button className="btn ghost" type="button">
            ▣ GITHUB
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
