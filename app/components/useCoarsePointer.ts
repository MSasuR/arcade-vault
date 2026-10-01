"use client";

import { useSyncExternalStore } from "react";

// true si el puntero principal es táctil (spec 11). En el servidor siempre false:
// el mando táctil aparece tras hidratar, sin desajuste de hidratación.
const QUERY = "(pointer: coarse)";

function subscribe(listener: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", listener);
  return () => mql.removeEventListener("change", listener);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
