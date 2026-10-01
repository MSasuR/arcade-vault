---
name: mobile-layout-pitfalls
description: Causas reales de desborde a 375 px, cómo medirlo sin engañarse con isMobile, y alto útil bajo la nav sticky en horizontal
metadata:
  type: project
---

Aprendido en la spec 11 (2026-10-01):

- **Medición**: con `isMobile: true`, Chromium agranda `innerWidth` hasta el ancho del contenido (a 375 px daba 404 o 465), así que `scrollWidth === innerWidth` sale verdadero aunque haya desborde. Mide con un contexto sin `isMobile` a 375 px (`scrollWidth` frente a 375), o compara con 375 fijo.
- **Buscar al culpable**: recorre `body *`, ignora `position: fixed` y los elementos con un ancestro que recorta (`overflow-x` distinto de `visible`), y lista los que tienen `getBoundingClientRect().right > 375`.
- **Causas reales encontradas** (el aviso antiguo culpaba a `.av-mobile-panel`, pero no era ese):
  - `gap: 24px` de `.av-nav`: la hamburguesa desbordaba 28 px. Se arregló con `gap: 12px` a ≤ 480 px.
  - `.tick-row` de la portada, con 4 columnas fijas (90/1fr/120/100): pasa a dos filas por entrada a ≤ 480 px.
  - `1fr` sin `minmax(0, …)` en `.hall-table` y `.av-detail`: el contenido mínimo ensanchaba la columna.
  - `.stat-strip` de la ficha, con valores pixel de 16 px: `repeat(3, minmax(0, 1fr))` y 12 px a ≤ 480 px.
- **Pendientes en la auditoría del 2026-10-01 (spec 12 en Draft)**: `.stat-n` «GLOBAL» a 52 px (337 px) en columnas de 221–240 px desborda la portada a 768 y 844 px (`scrollWidth` 852/909); la hamburguesa desborda 7 px a 360 px en todas las rutas. El bisect fiable: ocultar hijos uno a uno (`display:none`) y bajar por el que deja `scrollWidth <= W`; el filtro por `getBoundingClientRect().right` no lo encontró.
- **Patrón general**: en grids, `1fr` equivale a `minmax(auto, 1fr)`; usa `minmax(0, 1fr)` cuando el contenido puede ser largo.
- **Nav sticky**: mide 66 px a ≤ 840 px de ancho y 89,5 px por encima. En horizontal, el `.crt` limita su ancho a `calc((100dvh - 122px) * 4 / 3 + 20px)` para que el canvas quepa bajo la nav (122 = 90 de nav + 20 de padding del `.crt` + 12 de margen).
- **Capturas**: el indicador «N» de Next en dev aparece abajo a la izquierda y tapa el botón ← en vertical. No es un fallo de la app.
- La fuente Press Start 2P no tiene `↓`/`↑`: el navegador usa otra fuente para esas flechas (se ven distintas de `←`/`→`). Es aceptable, pero tenlo en cuenta si se rediseña el mando.

**Why:** evita repetir el diagnóstico y medir mal el desborde.
**How to apply:** en la matriz ruta × viewport y en cualquier arreglo de layout. Ver [[playwright-touch-checks]].
