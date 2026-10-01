---
name: sprite-tint-and-retro-distinction
description: Cómo se tiñen los sprites (Breakout/Snake) y cómo se distinguen piezas/ladrillos en retro monocromo; trampa del degradado cian→magenta
metadata:
  type: project
---

Decisiones técnicas validadas al dar skins a Tetris, Breakout y Snake (2026-09-30, sin spec propia: caso 4 sobre spec 10).

- **Tintado de sprites** (`app/components/games/spriteTint.ts`): cada píxel opaco se reclasifica por su luminancia frente a la mediana de la región → rampa de 3 tonos (sombra/cuerpo/brillo). `quantize` (retro) usa solo esos 3 tonos y alfa binaria; sin él (neon) interpola y conserva el sombreado. La hoja teñida se cachea por skin en un `Map` dentro de `createSprites`; `classic` vuelve al `HTMLImageElement` original. En Breakout los frames de explosión de `gray` son los de `red`: no teñirlos dos veces.
- **Retro monocromo con mecánica de color**: 3 tonos de fósforo (`#b4ffb4`, `#4be06a`, `#2fa84f`; HI/MID 1.47:1, MID/LO 1.78:1) no bastan solos; se combinan con textura (lisa / marco / rayas / cruz en Tetris; lisa / rayas / puntos en Breakout) para que dos piezas o filas contiguas nunca compartan tono y textura. La sombra de caída de Tetris en retro es un contorno, no alfa.
- **Degradado neon de Snake**: mezclar `--cyan` → `--magenta` en RGB pasa por un gris lavanda (`#80799f`) apagado; se añadió `bodyMid` (`#b14dff`) para pasar por violeta (mínimo 4.57:1, 3.33:1 con scanline).
- **Pendiente heredado de classic** (no se toca: sin regresión): `GAME OVER` en `#ff006e` con velo 0.72 baja de 4.5:1 sobre piezas claras (2.53:1 sobre la O amarilla de Tetris).

**Why:** evita rediseñar el tintado y repetir la paleta retro indistinguible en juegos futuros con sprites o piezas de color.
**How to apply:** reutiliza `tintRegion` para cualquier juego nuevo con spritesheet; en retro, distingue por tono + textura. Ver [[crt-scanlines-css]] y [[playwright-skin-checks]].
