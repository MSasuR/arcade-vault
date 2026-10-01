# Pulido del layout web móvil

**State:** Draft  
**Depends on:** SPEC 02 (portada), SPEC 04 (`Auth`), SPEC 03 (formulario de contacto), SPEC 10 (selector de skin), SPEC 11 (controles táctiles y arreglos de desborde a 375 px)  
**Date:** 2026-10-01  
**Objective:** Eliminar el scroll horizontal restante y llevar objetivos táctiles, inputs y alturas de pantalla al mínimo de la checklist móvil sin cambiar el escritorio.

---

## Scope

**Está incluido:**

- Desborde de la sección de estadísticas de la portada entre ~650 y ~1000 px de ancho (`.stat-n` «GLOBAL» a 52 px no cabe en su columna).
- Desborde de 7 px de la hamburguesa a 360 px en todas las rutas.
- Objetivos táctiles < 44 px con `pointer: coarse`: botones de la nav (41 px de alto), opciones del selector de skin (30 px), chips de `/games` (40 px), pestañas del Salón (40 px), pestañas de `/auth` (38 px), enlace «VER SALÓN →» de la portada (33 px; 17 px a 667×375).
- Inputs con `font-size` < 16 px con `pointer: coarse`: buscador de `/games` (13 px), campos de `/auth` y de `/about` (14 px).
- `autoComplete` e `inputMode` en el formulario de contacto (hoy no tiene ninguno).
- `min-height: 100vh` de `.home` y `.home-hero` → `100dvh`.

**No está incluido:** PWA, manifest, iconos ni safe areas (spec 13); el mando táctil (spec 11).

## Data Model

Sin cambios de datos. Solo CSS en `app/globals.css` y atributos en `app/components/about/ContactForm.tsx`.

### Medidas de partida (Playwright, sin `isMobile`)

| Fallo                         | Viewport          | Medida                                                                  |
| ----------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `.stat-n` «GLOBAL»            | 844×390           | `scrollWidth` 337 en columna de 240 → `documentElement.scrollWidth` 909 |
| `.stat-n` «GLOBAL»            | 768×1024          | 337 en columna de 221 → 852 > 768                                       |
| `.av-nav .hamburger`          | 360×740           | `right` 367 → `scrollWidth` 367 > 360 (todas las rutas)                 |
| Botones de la nav             | todos los móviles | 57×41 (Menú), 204×41 (Iniciar sesión)                                   |
| `.skin-picker .skin-opt`      | todos los móviles | 98×30, 71×30, 80×30                                                     |
| `.chip` / `.hall-tabs` / tabs | todos los móviles | 80×40, 151×40, 190×38                                                   |
| «VER SALÓN →»                 | 375×667 / 667×375 | 84×33 / 98×17                                                           |
| `.av-search input`            | todos             | `font-size` 13 px, 20 px de alto                                        |
| `.field input`, contacto      | todos             | `font-size` 14 px                                                       |

## Implementation Plan

1. **Estadísticas de la portada**: `.stat-block { container-type: inline-size; }` y `.stat-n { font-size: min(clamp(32px, 8vw, 52px), 15cqi); }`. A 1280 px la columna mide 359 px (15cqi ≈ 54 → sigue en 52 px). Verificar `scrollWidth` en 768 y 844.
2. **Nav a ≤ 380 px**: `@media (max-width: 380px) { .av-nav { padding: 12px; gap: 8px; } }`. Verificar `scrollWidth === 360` en todas las rutas.
3. **Objetivos táctiles**: bloque `@media (pointer: coarse)` con `min-height: 44px` (y `min-width: 44px` donde aplique) para `.av-nav .btn`, `.skin-picker .skin-opt`, `.chip`, los botones de `.hall-tabs`, las pestañas de `/auth` y el enlace «VER SALÓN →» (`display: inline-flex; align-items: center`).
4. **Inputs**: en el mismo bloque, `font-size: 16px` para `.av-search input`, `.field input` y los campos del contacto; `min-height: 44px` en `.av-search input`.
5. **Formulario de contacto**: `autoComplete="name"` y `autoComplete="email"` + `inputMode="email"` en sus inputs (ya tiene `noValidate`).
6. **Alturas**: añadir `min-height: 100dvh` justo después de cada `min-height: 100vh` de `.home` y `.home-hero` (el `vh` queda como respaldo).

Cada paso compila y se puede commitear solo.

## Acceptance Criteria

- [ ] `documentElement.scrollWidth === innerWidth` en `/`, `/games`, `/games/[id]`, `/player/[id]`, `/salon`, `/auth`, `/about` a 360×740, 375×667, 390×844, 667×375, 844×390 y 768×1024 (medido sin `isMobile`).
- [ ] Con `hasTouch` + `isMobile`, ningún objetivo interactivo visible fuera del mando mide < 44 px en alto o ancho.
- [ ] Con `pointer: coarse`, todo `input`/`textarea` visible tiene `font-size` ≥ 16 px.
- [ ] El formulario de contacto expone `autocomplete="name"`, `autocomplete="email"` e `inputmode="email"`.
- [ ] `.home-hero` usa `100dvh` en los navegadores que lo soportan.
- [ ] A 1280×800 las capturas de `/`, `/games`, `/salon`, `/auth`, `/about` y `/player/tetris` son idénticas a las de antes del cambio.
- [ ] `npx tsc --noEmit`, `npx eslint app lib` y `npm run build` sin errores.

## Decisions Taken and Discarded

| Decisión                                                       | Razón                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Container query (`cqi`) para `.stat-n`**                     | Escala con la columna real, no con el viewport; el escritorio se queda en 52 px |
| **Descartado: `overflow-x: hidden` en `.home-stats` o global** | Oculta el texto cortado en vez de arreglar el origen                            |
| **Descartado: `word-break` en «GLOBAL»**                       | Partir una palabra en la fuente pixel queda mal                                 |
| **Objetivos ≥ 44 px solo bajo `pointer: coarse`**              | El escritorio no cambia                                                         |
| **Descartado: detectar móvil por ancho**                       | Coherente con la spec 11                                                        |
| **`dvh` con `vh` de respaldo**                                 | Safari cambia el alto con la barra; navegadores antiguos siguen con `vh`        |

## Identified Risks

- Los botones de la nav a 44 px alargan la nav sticky (66 → ~69 px) y el cálculo del `.crt` en horizontal de la spec 11 usa 122 px. Mitigación: verificar a 667×375 y 844×390 que el `.player-stage` sigue cabiendo bajo la nav y, si no, ajustar el `122px`.
- Las opciones de skin a 44 px pueden no caber en una fila del HUD a 360 px. Mitigación: comprobar `scrollWidth` y permitir `flex-wrap` en `.skin-opts`.
- `cqi` no existe en Safari < 16. Mitigación: el `clamp()` original queda como valor previo en la cascada.

## What is **not** in this spec

- Manifest, iconos, `theme-color`, safe areas y modo standalone (spec 13).
- Cambios en el mando táctil o en los módulos de los juegos.
- Modo claro o rediseño visual.
