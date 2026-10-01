---
name: crt-scanlines-css
description: El marco .crt-screen ya pinta scanlines CSS sobre todos los canvas; medir contraste con ese oscurecimiento y no duplicarlas en retro
metadata:
  type: project
---

`.crt-screen::after` en `app/globals.css` aplica scanlines a todos los juegos y skins (`repeating-linear-gradient` rgba(0,0,0,0.18) cada 4 px, `mix-blend-mode: multiply`) y `::before` una viñeta.

**Why:** dibujar scanlines también en el canvas (skin retro) las duplica y baja el contraste; además el contraste real en filas alternas es menor que el medido en el canvas (multiplicar fondo y figura por 0.82). Ej.: magenta neon sobre --bg baja de 5.15:1 a 3.67:1.

**How to apply:** en el script de contraste mide también el caso "scanline" (×0.82 por canal); en retro no añadas scanlines en canvas salvo que la spec lo decida explícitamente. Ver spec 10 ([[asteroids-skins-spec]]).
