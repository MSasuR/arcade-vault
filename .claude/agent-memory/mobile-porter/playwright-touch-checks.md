---
name: playwright-touch-checks
description: Cómo verificar el mando táctil con Playwright y CDP — multi-touch, contador de teclas, detectar GAME OVER y build vs dev server
metadata:
  type: project
---

Trucos que funcionaron al verificar la spec 11 (2026-10-01), con scripts de Node en el scratchpad:

- **Puntero `coarse`**: Playwright MCP no lo emula. Hace falta `browser.newContext({ viewport, hasTouch: true, isMobile: true })` desde un script de Node que haga `require("D:/ai-projects/05-arcade-valut/node_modules/playwright")` (ya está instalado con sus navegadores).
- **Toques reales**: `ctx.newCDPSession(page)` y `Input.dispatchTouchEvent`.
  - Dedo nuevo: `touchStart` con **todos** los puntos activos.
  - **Soltar un solo dedo**: `touchEnd` con **solo ese punto**. Un `touchMove` sin ese punto no lo suelta, y `touchEnd` sin puntos los suelta todos.
- **Contador de teclas**: `ctx.addInitScript` que registra en `window.__keys` cada `keydown`/`keyup` (`code`, `repeat`). El registro sobrevive a la navegación de cliente, así que sirve para probar el `keyup` al desmontar (clic en `VOLVER A DETALLES` con un botón mantenido).
- **Pestaña oculta**: `Object.defineProperty(document, "hidden", { get: () => true })` y después `document.dispatchEvent(new Event("visibilitychange"))`.
- **GAME OVER de Tetris**: el canvas se queda quieto entre caídas por gravedad, así que «canvas quieto» no sirve como señal. Señal fiable: CAÍDA (hard drop) ya no cambia el canvas.
- **Snake** ignora `PAUSAR` en el estado `ready` («PULSA UNA FLECHA…»): es comportamiento del juego, no del mando. Prueba la pausa con Tetris o con Snake ya en marcha.
- **Asteroids** llega a GAME OVER en menos de 2 minutos manteniendo `EMPUJE` a ráfagas; `DISPARO` reinicia.
- **Frogger**: señal de «un salto por toque» = la puntuación sube 10 por fila nueva (mantener `↑` 600 ms suma solo 10). GAME OVER en ~5 s tocando `↑` cada 250 ms (el HUD muestra `Vidas 0`). Mando `dpad` sin `repeat` (el módulo ignora `e.repeat`).
- **`npm run build` con `npm run dev` corriendo rompe el dev server**: haz el build antes y levanta el dev después.
- Las tareas en segundo plano tienen un tiempo máximo; si el dev server se para, vuelve a levantarlo.

**Why:** ahorra iteraciones al auditar el mando de cada juego o añadir el de un juego nuevo.
**How to apply:** en la verificación de la matriz juego × mando. Ver [[mobile-layout-pitfalls]].
