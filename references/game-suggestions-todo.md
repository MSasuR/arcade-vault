# To-do de sugerencias de juegos

Mantenido por el agente `game-planner`. Última actualización: 2026-09-30.

## Pendientes

- [ ] **frogger** — FROGGER VAULT (ACCIÓN) · sugerido 2026-09-30 · encaje 26/30 · **recomendado**
  - Por qué: fila ya existente con portada `cover-rana`; rejilla simple de carriles, puntuación clara (avance, casillas de llegada, bonus de tiempo), cabe holgado en una spec y suma un segundo ACCIÓN jugable.
  - Origen: fila existente en `games` (sin material en `references/started-games/`)
  - Siguiente paso: `/add-game Frogger (id frogger, fila existente): la rana cruza 5 carriles de tráfico y 5 de río con troncos y tortugas hasta 5 casillas de llegada, con puntos por avance, llegada y tiempo restante, vidas, niveles más rápidos, dibujado vectorial neón en canvas 800x600 con flechas/WASD, P pausa y Enter reinicia`
- [ ] **galaga** — GALAGA VAULT (ACCIÓN) · sugerido 2026-09-30 · encaje 25/30
  - Por qué: puntuación alta natural, estética neón perfecta y fila existente; riesgo de tamaño (formaciones + picados), dejar fuera el rayo tractor/nave doble.
  - Origen: fila existente en `games`
  - Siguiente paso: `/add-game Galaga (id galaga, fila existente): shooter vertical con oleadas de naves que entran en formación y hacen picados, disparo con Espacio, vidas y niveles, sin rayo tractor, dibujado vectorial neón en canvas 800x600`
- [ ] **duel** — DUEL VAULT (DEPORTES) · sugerido 2026-09-30 · encaje 23/30
  - Por qué: única vía para tener un DEPORTES jugable; el original es de reflejos (menor tiempo = mejor), así que necesita redefinirse como racha contra la CPU con puntos por rapidez.
  - Origen: fila existente en `games`
  - Siguiente paso: `/add-game Duel (id duel, fila existente): duelo de reflejos contra la CPU; al aparecer la señal se dispara con Espacio, cada victoria suma puntos según la rapidez, la CPU acelera por ronda, 3 vidas y disparar antes de tiempo cuesta una vida`

### Ronda de 19 sugerencias (2026-09-30)

Generadas por 4 agentes `game-planner` en paralelo, uno por segmento (ACCIÓN shooters, ACCIÓN sin naves, PUZZLE, DEPORTES/RETRO). Las puntuaciones son por segmento y no del todo comparables entre sí. Todas necesitan fila nueva en `games` (migración) y portada `.cover-<id>`; ninguna tiene material en `references/started-games/`.

- [ ] **invaders** — SPACE INVADERS (ACCIÓN) · sugerido 2026-09-30 · encaje 26/30 · mejor shooter del segmento
  - Por qué: rejilla fija 5×11 con búnkeres, un jugador y teclado; el shooter más pequeño y seguro. Riesgo: se solapa con galaga, elegir uno o diferenciarlos bien.
  - Siguiente paso: `/add-game Space Invaders (id invaders, fila nueva): cañón que se mueve con flechas/A-D y dispara con Espacio contra una formación de 5x11 invasores que baja y acelera, 4 búnkeres destructibles, platillo misterioso de bonus, vidas y oleadas más rápidas, dibujado vectorial neón en canvas 800x600, P pausa y Enter reinicia`
- [ ] **pong** — NEON PONG (DEPORTES) · sugerido 2026-09-30 · encaje 26/30 · primer DEPORTES recomendado
  - Por qué: patrón pala/bola como breakout, técnica trivial. Riesgo: parecer un breakout simplificado; necesita bonus por rally y aceleración para que la puntuación tenga recorrido.
  - Siguiente paso: `/add-game Neon Pong (id pong, DEPORTES, fila nueva): Pong contra la CPU sin fin; cada punto ganado suma 100 más un bonus por la duración del rally, cada punto perdido cuesta una vida (3), la CPU y la bola aceleran por nivel cada 5 puntos, pala con flechas/W-S, dibujado vectorial neón en canvas 800x600, P pausa y Enter reinicia`
- [ ] **kaboom** — KABOOM VAULT (ACCIÓN) · sugerido 2026-09-30 · encaje 25/30 · mejor ACCIÓN sin naves
  - Por qué: el de menor riesgo del segmento, cabe holgado en una spec. Riesgo: poca profundidad; subir dificultad por oleadas y dar vidas extra por hitos.
  - Siguiente paso: `/add-game Kaboom (id kaboom, fila nueva): un bombardero neón se mueve arriba soltando bombas cada vez más rápidas y el jugador mueve 3 cubos con flechas/A-D para atraparlas; puntos por bomba según la oleada, cada bomba que cae resta un cubo (vidas), canvas 800x600, P pausa, Enter reinicia`
- [ ] **lander** — LUNAR LANDER (RETRO) · sugerido 2026-09-30 · encaje 25/30 · primer RETRO recomendado
  - Por qué: vectorial y física de nave como asteroids; puntos por multiplicador de plataforma y combustible restante. Riesgo: ajustar gravedad/empuje para que no frustre; sin zoom.
  - Siguiente paso: `/add-game Lunar Lander (id lander, RETRO, fila nueva): módulo vectorial con gravedad que rota con izquierda/derecha y empuja con arriba gastando combustible; aterrizar suave en plataformas x2/x3/x5 da puntos por multiplicador y combustible restante; estrellarse cuesta una vida y combustible; terreno generado por nivel, canvas 800x600 neón, P pausa y Enter reinicia`
- [ ] **missile** — MISSILE COMMAND (ACCIÓN/RETRO) · sugerido 2026-09-30 · encaje 24/30 · propuesto por dos segmentos
  - Por qué: shooter de defensa distinto a todo el catálogo; puntos por misiles, ciudades y munición. Riesgo: apuntar con teclado; admitir ratón como en breakout.
  - Siguiente paso: `/add-game Missile Command (id missile, fila nueva): defender 6 ciudades de misiles que caen moviendo una mira con flechas/WASD y ratón y disparando con Espacio/clic desde 3 baterías con munición limitada, explosiones en expansión que destruyen misiles, bonus por ciudades y munición restante al final de cada oleada, fin sin ciudades, vectorial neón en canvas 800x600, P pausa y Enter reinicia`
- [ ] **2048** — 2048 VAULT (PUZZLE) · sugerido 2026-09-30 · encaje 24/30 · mejor PUZZLE del segmento
  - Por qué: encaje técnico y de tamaño muy seguro, puntuación granular. Riesgo: poco "arcade"; id numérico a validar en ruta y `.cover-2048` (alternativa `merge2048`).
  - Siguiente paso: `/add-game 2048 (id 2048, juego nuevo PUZZLE): tablero 4x4 donde las flechas/WASD deslizan y fusionan fichas de potencias de 2 con colores neón; cada fusión suma su valor a la puntuación, el nivel sube al alcanzar 256/512/1024/2048..., fin de partida cuando no quedan movimientos, P pausa y Enter reinicia, canvas 800x600`
- [ ] **hoops** — NEON HOOPS (DEPORTES) · sugerido 2026-09-30 · encaje 24/30
  - Por qué: más canastas en tiempo fijo = más puntos, ranking natural. Riesgo: el tiro con medidor puede sentirse aleatorio; calibrar y dar feedback claro.
  - Siguiente paso: `/add-game Neon Hoops (id hoops, DEPORTES, fila nueva): tiro a canasta contrarreloj de 60 s; Espacio fija un medidor de ángulo y otro de fuerza, canasta 2 puntos (3 desde la línea lejana), multiplicador por racha, la canasta se mueve en niveles superiores y hay +5 s por cada 5 canastas; canvas 800x600 neón, P pausa y Enter reinicia`
- [ ] **centipede** — CENTIPEDE (ACCIÓN) · sugerido 2026-09-30 · encaje 23/30
  - Por qué: shooter fijo con mucha puntuación y rejugable. Riesgo: el ciempiés que se parte y rebota en setas; dejar fuera pulga y escorpión.
  - Siguiente paso: `/add-game Centipede (id centipede, fila nueva): nave en la franja inferior que se mueve con flechas y dispara con Espacio a un ciempiés que baja zigzagueando entre setas y se divide al recibir disparos, araña que molesta en la zona del jugador, setas destructibles, vidas y oleadas, sin pulga ni escorpión, estilo neón en canvas 800x600, P pausa y Enter reinicia`
- [ ] **pang** — PANG VAULT (ACCIÓN) · sugerido 2026-09-30 · encaje 23/30
  - Por qué: acción sin naves y vistoso. Riesgo: física de rebote y diseño de niveles; limitar a ~10 niveles por patrón y un solo arma.
  - Siguiente paso: `/add-game Pang (id pang, fila nueva): el jugador camina por el suelo y lanza un arpón vertical con Espacio que parte burbujas rebotantes en dos más pequeñas hasta desaparecer; puntos por tamaño y bonus de tiempo al limpiar el nivel, vidas, niveles con más burbujas, vectorial neón 800x600, P pausa, Enter reinicia`
- [ ] **qix** — QIX VAULT (ACCIÓN) · sugerido 2026-09-30 · encaje 23/30
  - Por qué: la mejor estética neón del segmento. Riesgo: flood fill sobre rejilla lógica; roza PUZZLE.
  - Siguiente paso: `/add-game Qix (id qix, fila nueva): el jugador recorre el borde y traza líneas con flechas + Espacio para cerrar zonas del tablero mientras esquiva al Qix y a las chispas; puntos por área capturada y bonus al pasar del 75 %, vidas, niveles con enemigos más rápidos, rejilla lógica en canvas 800x600, neón, P pausa, Enter reinicia`
- [ ] **pipes** — PIPE VAULT (PUZZLE) · sugerido 2026-09-30 · encaje 23/30
  - Por qué: el PUZZLE más arcade y el que más variedad aporta. Riesgo: flujo y cola de piezas aprietan la spec; sin piezas especiales.
  - Siguiente paso: `/add-game Pipe Mania (id pipes, juego nuevo PUZZLE): rejilla 10x7 donde un cursor (flechas/WASD) coloca con Espacio la siguiente pieza de tubería de una cola de 5 antes de que el fluido neón avance; puntos por casilla recorrida y bonus por cruces, nivel sube con longitud mínima mayor y flujo más rápido, fin si el fluido se derrama, P pausa y Enter reinicia, canvas 800x600`
- [ ] **gems** — GEMS VAULT (PUZZLE) · sugerido 2026-09-30 · encaje 23/30
  - Por qué: match-3 con buena estética neón. Riesgo: cascadas y detección de "sin movimientos"; con teclado es menos fluido. SameGame es alternativa de la misma familia.
  - Siguiente paso: `/add-game Match-3 (id gems, juego nuevo PUZZLE): tablero 8x8 de gemas neón; con flechas/WASD se mueve el cursor, Espacio selecciona e intercambia con una adyacente si forma línea de 3+; puntos por gema y multiplicador por cascada, nivel sube por puntuación objetivo con límite de movimientos, fin al agotar movimientos, P pausa y Enter reinicia, canvas 800x600`
- [ ] **scramble** — SCRAMBLE (ACCIÓN) · sugerido 2026-09-30 · encaje 22/30
  - Por qué: único shoot'em up de scroll horizontal. Riesgo: terreno procedural + combustible + bombas rozan el límite; una sola fase de cuevas.
  - Siguiente paso: `/add-game Scramble (id scramble, fila nueva): shoot'em up de scroll horizontal con una nave que dispara con Espacio y lanza bombas con X sobre un terreno procedural de cuevas, depósitos de combustible que recargan, cohetes enemigos, puntos por distancia y objetivos, vidas, dibujado vectorial neón en canvas 800x600, P pausa y Enter reinicia`
- [ ] **tempest** — TEMPEST (ACCIÓN) · sugerido 2026-09-30 · encaje 22/30
  - Por qué: la estética más neón posible; aprovecha lo vectorial de asteroids. Riesgo: geometría de tubos en perspectiva; 2–3 formas y un enemigo base.
  - Siguiente paso: `/add-game Tempest (id tempest, fila nueva): shooter vectorial en un tubo en perspectiva, la nave se mueve por el borde con flechas y dispara con Espacio a enemigos que suben por los carriles, supercarga que limpia el tubo una vez por nivel, 3 formas de tubo que rotan por nivel, vidas, neón en canvas 800x600, P pausa y Enter reinicia`
- [ ] **bubbles** — BUBBLE VAULT (PUZZLE) · sugerido 2026-09-30 · encaje 22/30
  - Por qué: Puzzle Bobble, muy vistoso. Riesgo: rejilla hexagonal, rebotes y caída de grupos; el más cerca de necesitar dos specs.
  - Siguiente paso: `/add-game Puzzle Bobble (id bubbles, juego nuevo PUZZLE): lanzador inferior que apunta con flechas y dispara con Espacio burbujas neón que rebotan en paredes y se pegan en rejilla hexagonal; grupos de 3+ del mismo color explotan y los desconectados caen con bonus, el techo baja cada N disparos, fin si una burbuja cruza la línea, nivel sube al limpiar el tablero, P pausa y Enter reinicia, canvas 800x600`
- [ ] **joust** — JOUST VAULT (ACCIÓN) · sugerido 2026-09-30 · encaje 21/30
  - Por qué: acción de plataformas distinta. Riesgo: física de aleteo, colisiones por altura e IA; una pantalla, sin pterodáctilo.
  - Siguiente paso: `/add-game Joust (id joust, fila nueva): el jinete vuela aleteando con Espacio y se mueve con flechas entre plataformas; en cada choque gana quien está más alto, puntos por derribar enemigos y oleadas crecientes, vidas, una sola pantalla con wrap horizontal, vectorial neón 800x600, P pausa, Enter reinicia`
- [ ] **kong** — BARREL CLIMB VAULT (ACCIÓN) · sugerido 2026-09-30 · encaje 21/30
  - Por qué: plataformero clásico estilo Donkey Kong. Riesgo: tamaño (rampas, escaleras, saltos) e IP; nombre y arte propios, una pantalla.
  - Siguiente paso: `/add-game Barrel Climb (id kong, fila nueva): plataformero de una pantalla donde el jugador sube por rampas y escaleras esquivando o saltando (Espacio) barriles que rueda un gorila neón arriba; puntos por salto sobre barril, bonus de tiempo al llegar a la cima, vidas, cada vuelta más rápida, 800x600, P pausa, Enter reinicia`
- [ ] **simon** — SIMON VAULT (PUZZLE) · sugerido 2026-09-30 · encaje 21/30
  - Por qué: trivial de implementar y muy visual. Riesgo: poca variación de puntuación entre jugadores y depende del audio (`M` silencia, autoplay).
  - Siguiente paso: `/add-game Simon (id simon, juego nuevo PUZZLE): cuatro pads neón que se iluminan con tono en una secuencia creciente; el jugador la repite con flechas/WASD; cada acierto suma puntos por ronda y un bonus por rapidez, la velocidad sube cada 5 rondas (nivel), 3 vidas por fallo, M silencia, P pausa y Enter reinicia, canvas 800x600`
- [ ] **slalom** — SLALOM VAULT (DEPORTES) · sugerido 2026-09-30 · encaje 21/30 · reserva
  - Por qué: tercer DEPORTES posible. Riesgo: el original se mide por tiempo (redefinir como distancia + puertas) y la nieve encaja mal con el neón.
  - Siguiente paso: `/add-game Slalom Vault (id slalom, DEPORTES, fila nueva): descenso infinito esquivando árboles y rocas y pasando entre puertas; la puntuación suma distancia y bonus por puerta superada, saltarse una puerta o chocar cuesta una vida (3), la velocidad sube por nivel; pista oscura con trazos neón en canvas 800x600, flechas para girar, P pausa y Enter reinicia`

## En curso

## Hechos

- [x] **asteroids** — spec `05` implementada
- [x] **tetris** — spec `07` implementada
- [x] **breakout** — spec `08` implementada
- [x] **snake** — spec `09` implementada

## Descartados

- **minesweeper, sokoban, lightsout** — se miden por tiempo o movimientos (menos es mejor); no encajan con el ranking · 2026-09-30
- **columns, puyo** — bloques que caen, demasiado parecidos a tetris · 2026-09-30
