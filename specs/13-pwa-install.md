# Instalación como PWA

**State:** Draft  
**Depends on:** SPEC 11 (mando táctil y layout `pointer: coarse`), SPEC 12 (pulido del layout móvil; recomendable antes, no obligatorio)  
**Date:** 2026-10-01  
**Objective:** Hacer que Arcade Vault se pueda instalar en la pantalla de inicio (`display: standalone`) con manifest, iconos, `theme-color` y safe areas, sin modo offline.

---

## Scope

**Está incluido:**

- `app/manifest.ts` (`MetadataRoute.Manifest`), servido por Next en `/manifest.webmanifest`.
- Iconos en `public/icons/`: 192×192 y 512×512 `purpose: "any"`, 512×512 `maskable` (logo dentro del 80 % central) y `apple-touch-icon` 180×180, diseñados con `/frontend-design` a partir de `.logo-mark` de la nav.
- `export const viewport` en `app/layout.tsx` con `themeColor: "#0a0a0f"` y `viewportFit: "cover"`.
- `env(safe-area-inset-*)` en `.av-nav`, `.player-hud`, `.touch-pad` y `.av-mobile-panel`.

**Estado actual (auditoría 2026-10-01):** `/manifest.webmanifest` → 404; sin `<link rel="manifest">`, sin `<meta name="theme-color">`, sin `apple-touch-icon`, `viewport` = `width=device-width, initial-scale=1`, sin ningún `safe-area-inset` en `globals.css`.

## Data Model

```ts
// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arcade Vault · Portal Retro",
    short_name: "Arcade Vault",
    description: "Arcade Vault — bóveda retro de videojuegos clásicos.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f", // = --bg
    theme_color: "#0a0a0f", // = --bg
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
```

Sin `orientation` (la spec 11 descartó el bloqueo de orientación).

## Implementation Plan

1. **Iconos**: diseñarlos con `/frontend-design` (rombo magenta/cian de `.logo-mark` sobre `#0a0a0f`, con el brillo neón) y exportar los 4 PNG a `public/icons/`. Verificar tamaños y que el maskable deja el logo dentro del círculo del 80 %.
2. **Manifest**: crear `app/manifest.ts` con el objeto anterior. Verificar `fetch("/manifest.webmanifest")` → 200 y que cada icono responde 200.
3. **Viewport y Apple**: `export const viewport: Viewport = { themeColor: "#0a0a0f", viewportFit: "cover" }` y `metadata.icons.apple = "/icons/apple-touch-icon.png"` en `app/layout.tsx`. Sin `userScalable` ni `maximumScale`.
4. **Safe areas**: en `globals.css`, `padding-top: max(<actual>, env(safe-area-inset-top))` en `.av-nav`; `padding-left/right` con `env(safe-area-inset-left/right)` en `.av-nav`, `.player-hud` y `.touch-pad` (en horizontal el notch queda a un lado); `padding-bottom` con `env(safe-area-inset-bottom)` en `.player-stage.has-touch` y `.av-mobile-panel`. Sin notch, `env()` vale 0 y nada cambia.
5. **Standalone**: solo si al verificar hace falta, `@media (display-mode: standalone)` para ajustes de la nav.
6. **Documentación**: sección PWA en `CLAUDE.md`.

## Acceptance Criteria

- [ ] `GET /manifest.webmanifest` → 200 con `name`, `short_name`, `description`, `start_url: "/"`, `display: "standalone"`, `background_color` y `theme_color` = `#0a0a0f` y sin `orientation`.
- [ ] Los 4 iconos responden 200 y miden 192×192, 512×512, 512×512 (maskable) y 180×180.
- [ ] El DOM tiene `<link rel="manifest">`, `<meta name="theme-color" content="#0a0a0f">`, `<link rel="apple-touch-icon">` y `viewport-fit=cover` en el meta viewport, sin `user-scalable=no`.
- [ ] Chrome DevTools (Application → Manifest) no muestra errores de instalabilidad.
- [ ] Con `display-mode: standalone` emulado a 390×844 y 844×390, la nav, el HUD y el mando no quedan bajo un inset simulado de 47 px arriba / 34 px abajo / 47 px a los lados.
- [ ] A 1280×800 el escritorio se ve igual (capturas comparadas).
- [ ] `npx tsc --noEmit`, `npx eslint app lib` y `npm run build` sin errores.

## Decisions Taken and Discarded

| Decisión                                            | Razón                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Sin service worker ni modo offline**              | Catálogo, ranking y sesión son datos en línea (Supabase); cachearlos arriesga datos viejos o sesiones mezcladas. Chrome ya instala sin SW |
| **Descartado: SW que cachee solo assets estáticos** | Aporta poco (los juegos necesitan el catálogo del servidor para montar `/player/[id]`); se puede abrir otra spec                          |
| **Sin `orientation` en el manifest**                | La spec 11 descartó bloquear la orientación                                                                                               |
| **`theme_color` = `--bg` (`#0a0a0f`)**              | La app es solo oscura; la barra de estado se funde con la nav                                                                             |
| **`manifest.ts` en vez de JSON estático**           | Tipado con `MetadataRoute.Manifest`, convención de Next 16                                                                                |
| **Descartado: `user-scalable=no` en standalone**    | Accesibilidad; decisión cerrada en la spec 11                                                                                             |

## Identified Risks

- `viewportFit: "cover"` sin safe areas haría que el notch tapara la nav. Mitigación: los pasos 3 y 4 van juntos en el mismo commit si se separan.
- La nav sticky crece con `safe-area-inset-top` en standalone y rompe el cálculo de 122 px del `.crt` en horizontal (spec 11). Mitigación: sumar `env(safe-area-inset-top)` a ese `calc()` y verificar a 844×390.
- iOS ignora parte del manifest y usa `apple-touch-icon` y metadatos `apple-*`. Mitigación: incluir `apple-touch-icon` y probar en un iPhone real (prueba manual propuesta al usuario).

## What is **not** in this spec

- Service worker, modo offline, notificaciones push o pantalla de «sin conexión».
- Arreglos de layout web móvil (spec 12).
- Pantalla completa, bloqueo de orientación o cambios del mando.
