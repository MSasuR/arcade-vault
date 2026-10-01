"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SKIN, isSkinId, type SkinId } from "./games/skins";

// Skin del canvas persistido en localStorage (spec 10). Un único valor global.
const STORAGE_KEY = "av_skin";

const listeners = new Set<() => void>();
// Respaldo en memoria si localStorage no está disponible (modo privado, bloqueo)
let sessionSkin: SkinId | null = null;

function readSkin(): SkinId {
  if (sessionSkin) return sessionSkin;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isSkinId(v) ? v : DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY && e.key !== null) return;
    sessionSkin = null; // otra pestaña cambió el skin: manda localStorage
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerSnapshot = (): SkinId => DEFAULT_SKIN;

export function useSkin(): [SkinId, (skin: SkinId) => void] {
  const skin = useSyncExternalStore(subscribe, readSkin, getServerSnapshot);

  const setSkin = useCallback((next: SkinId) => {
    if (!isSkinId(next)) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      sessionSkin = null;
    } catch {
      // localStorage bloqueado: la elección no persiste, pero se aplica en esta sesión
      sessionSkin = next;
    }
    listeners.forEach((l) => l());
  }, []);

  return [skin, setSkin];
}
