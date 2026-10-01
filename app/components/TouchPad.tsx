"use client";

import React, { useEffect, useRef, useState } from "react";
import { TOUCH_REPEAT_DELAY, TOUCH_REPEAT_INTERVAL, type TouchButton } from "./games/touch";

// Grupo de botones del mando táctil (spec 11). Cada botón envía a window el
// KeyboardEvent de su tecla: keydown al tocar y keyup al soltar el último dedo.

interface Held {
  button: TouchButton;
  pointers: Set<number>;
  delay?: number;
  interval?: number;
}

function sendKey(type: "keydown" | "keyup", b: TouchButton, repeat = false) {
  window.dispatchEvent(
    new KeyboardEvent(type, { code: b.code, key: b.key, repeat, bubbles: true, cancelable: true }),
  );
}

function stop(h: Held) {
  window.clearTimeout(h.delay);
  window.clearInterval(h.interval);
}

export default function TouchPad({
  buttons,
  shape,
  side,
}: {
  buttons: TouchButton[];
  shape: "row" | "dpad" | "actions";
  side: "move" | "actions";
}) {
  const heldRef = useRef(new Map<string, Held>());
  const [pressed, setPressed] = useState<ReadonlySet<string>>(() => new Set());

  const syncPressed = () => setPressed(new Set(heldRef.current.keys()));

  const press = (b: TouchButton, pointerId: number) => {
    const held = heldRef.current;
    let h = held.get(b.code);
    if (!h) {
      const entry: Held = { button: b, pointers: new Set() };
      held.set(b.code, entry);
      sendKey("keydown", b);
      if (b.repeat) {
        entry.delay = window.setTimeout(() => {
          entry.interval = window.setInterval(
            () => sendKey("keydown", b, true),
            TOUCH_REPEAT_INTERVAL,
          );
        }, TOUCH_REPEAT_DELAY);
      }
      h = entry;
      syncPressed();
    }
    h.pointers.add(pointerId);
  };

  const release = (code: string, pointerId: number) => {
    const held = heldRef.current;
    const h = held.get(code);
    if (!h || !h.pointers.delete(pointerId) || h.pointers.size > 0) return;
    stop(h);
    held.delete(code);
    sendKey("keyup", h.button);
    syncPressed();
  };

  // Suelta todas las teclas al ocultar la pestaña y al desmontar: ninguna queda "pegada"
  useEffect(() => {
    const held = heldRef.current;
    const releaseAll = () => {
      held.forEach((h) => {
        stop(h);
        sendKey("keyup", h.button);
      });
      held.clear();
    };
    const onVisibility = () => {
      if (!document.hidden || held.size === 0) return;
      releaseAll();
      setPressed(new Set());
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      releaseAll();
    };
  }, []);

  return (
    <div className={`touch-pad ${shape}`} data-side={side}>
      {buttons.map((b) => (
        <button
          key={b.code}
          type="button"
          tabIndex={-1}
          className="touch-btn"
          data-code={b.code}
          data-pressed={pressed.has(b.code)}
          aria-label={b.aria}
          onPointerDown={(e) => {
            // Sin foco, selección ni gestos del navegador: el toque solo es la tecla
            e.preventDefault();
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Puntero ya liberado: el pointerup llegará igualmente al botón
            }
            press(b, e.pointerId);
          }}
          onPointerUp={(e) => release(b.code, e.pointerId)}
          onPointerCancel={(e) => release(b.code, e.pointerId)}
          onLostPointerCapture={(e) => release(b.code, e.pointerId)}
          onMouseDown={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
