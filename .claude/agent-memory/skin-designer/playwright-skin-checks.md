---
name: playwright-skin-checks
description: Cómo verificar skins en Playwright MCP — no regresión de classic, teclas mantenidas, capturas por juego y build vs dev server
metadata:
  type: project
---

Trucos de verificación que funcionaron con Asteroids (spec 10, 2026-09-30):

- **No regresión de `classic` con posiciones aleatorias**: comparar píxeles es inútil. Instrumentar los setters de `CanvasRenderingContext2D.prototype` (`fillStyle`, `strokeStyle`, `lineWidth`, `shadowBlur`, `globalAlpha`, `font`, `lineJoin`) durante unos segundos de juego, antes y después del cambio, y comparar el conjunto de valores.
- **`browser_press_key` es instantáneo** (keydown+keyup en el mismo frame): sirve para `Espacio`/`P` pero no mueve la nave. Para movimiento, desde `browser_evaluate` despachar `keydown` con `bubbles:true` sobre `document.activeElement`, esperar ~600 ms y soltar; así también se prueba que el foco no quedó en un botón.
- **Capturas**: usar captura de viewport con `scrollTo(0,0)`; la captura por elemento de `.av-player` hace scroll y la nav fija tapa el HUD.
- Esperar ~3.3 s tras (re)iniciar Asteroids antes de capturar: la nave parpadea mientras es invencible.
- `getImageData` repetido genera un aviso `willReadFrequently` en consola: es de la prueba, no de la app.
- **Viewport 1280×1120** para que el canvas entero quepa con el HUD; a 375 px, `scrollTo` hasta `.skin-picker` − 80 px para ver selector y canvas juntos.
- **Snake** muere en ~1 s si se le da una dirección sin control: capturar en el estado inicial ("PULSA UNA FLECHA…", recargando la página) y probar la pausa con flecha + `P` inmediato. **Breakout** pierde la bola sola en unos segundos: capturar justo tras `Enter`.
- **`npm run build` con `npm run dev` corriendo rompe el dev server** (500 + "Jest worker encountered 2 child process exceptions"): hacer el build antes de Playwright o reiniciar el dev después.
- Valor inválido en `av_skin` (p. ej. `bogus`) → el selector arranca en `classic`.

**Why:** ahorra iteraciones al verificar los skins de Tetris, Breakout y Snake.
**How to apply:** en el paso de verificación de cada spec de skins. Ver [[crt-scanlines-css]].
