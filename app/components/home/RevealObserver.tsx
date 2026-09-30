"use client";

import { useReveal } from "./useReveal";

// Activa las animaciones .reveal de la home sin convertir la página en Client Component.
export default function RevealObserver() {
  useReveal();
  return null;
}
