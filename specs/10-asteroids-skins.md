# Skins del canvas: infraestructura común y Asteroids

**State:** Implemented  
**Depends on:** SPEC 05 (módulo Asteroids y `GamePlayer`), SPEC 07 (contrato común `app/components/games/types.ts` y HUD dinámico de `GamePlayer`)  
**Date:** 2026-09-30  
**Objective:** Añadir la infraestructura común de skins del canvas (tipo `SkinId`, `options.skin`, `setSkin` y selector persistido en `GamePlayer`) y los 3 skins de Asteroids (`classic` por defecto, `neon` y `retro`), todos legibles en la app oscura.

---

## Scope

**Está incluido:**

- Módulo común `app/components/games/skins.ts` con `SkinId`, `SKINS`, `DEFAULT_SKIN` y el guard `isSkinId`
- Contrato ampliado en `app/components/games/types.ts`: `GameFactory` acepta un tercer parámetro opcional `options?: { skin?: SkinId }` y `GameInstance` gana un método **opcional** `setSkin?(skin)` (los juegos sin skins compilan sin cambios)
- Lista `SKINNABLE` en `app/components/games/registry.ts` con los ids que soportan skins (hoy solo `asteroids`)
- Hook `app/components/useSkin.ts` que lee y escribe el skin en `localStorage` (`av_skin`) con `useSyncExternalStore` (sin desajuste de hidratación) y `try/catch`; un valor inválido o ausente se trata como `DEFAULT_SKIN`
- Selector de 3 botones (`CLÁSICO`, `NEON`, `RETRO`) en el HUD de `GamePlayer`, **visible solo si el id está en `SKINNABLE`**; el skin se pasa como `options.skin` al crear el juego y con `setSkin` al cambiarlo, sin reiniciar la partida
- Estilos mínimos del selector en `app/globals.css` (clases nuevas `.skin-picker` y `.skin-opt`; no se modifica ninguna regla existente)
- Paletas de Asteroids en `app/components/games/asteroids/skins.ts` (`Record<SkinId, AsteroidsPalette>`) y eliminación de todos los colores fijos de `index.ts` y `entities.ts`
- `classic` reproduce exactamente el aspecto actual (sin regresión visual)
- `neon` con la paleta de marca de `globals.css` y glow moderado solo en elementos clave; `retro` en fósforo verde monocromo, sin glow ni degradados
- Velo semitransparente bajo los overlays `PAUSA` / `GAME OVER` en `neon` y `retro` (en `classic` no, para no cambiar su aspecto)
- Documentar el requisito de skins en `.claude/skills/add-game/reference.md` y el contrato ampliado en `CLAUDE.md`

**NO está incluido:**

- Skins de Tetris, Breakout y Snake (cada uno en su propia spec)
- Hacer `setSkin` obligatorio en `GameInstance` y retirar `SKINNABLE` (cuando todos los juegos tengan skins)
- Cambios en la UI global, en la paleta de `globals.css` o un modo claro
- Scanlines dibujadas en el canvas (el `.crt-screen::after` ya las aplica a todos los skins)
- Sonido, fuentes nuevas en el canvas o cambios de jugabilidad
- Skin por juego o sincronizado en la cuenta (Supabase)

---

## Data Model

No hay cambios de esquema. La preferencia vive solo en `localStorage`.

### Contrato común

```typescript
// app/components/games/skins.ts
export type SkinId = "classic" | "neon" | "retro";

export const SKINS: { id: SkinId; label: string }[] = [
  { id: "classic", label: "CLÁSICO" },
  { id: "neon", label: "NEON" },
  { id: "retro", label: "RETRO" },
];

export const DEFAULT_SKIN: SkinId = "classic";

export const isSkinId = (v: unknown): v is SkinId =>
  v === "classic" || v === "neon" || v === "retro";
```

```typescript
// app/components/games/types.ts (cambios)
export interface GameOptions {
  skin?: SkinId;
}

export interface GameInstance {
  pause: () => void;
  resume: () => void;
  getScore: () => number;
  destroy: () => void;
  // Opcional mientras haya juegos sin skins; cambia la paleta en caliente,
  // sin reiniciar la partida ni emitir callbacks
  setSkin?: (skin: SkinId) => void;
}

export type GameFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  options?: GameOptions,
) => GameInstance;
```

```typescript
// app/components/games/registry.ts (añadido)
export const SKINNABLE: ReadonlySet<string> = new Set(["asteroids"]);
```

| Clave `localStorage` | Valor                             | Lectura                                                                   |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `av_skin`            | `"classic"`, `"neon"` o `"retro"` | En `try/catch`; cualquier otro valor o error → `DEFAULT_SKIN` (`classic`) |

Un único skin global para todos los juegos que lo soporten. No se reutilizan `av_user` ni `av_scores`.

### Paleta de Asteroids

```typescript
// app/components/games/asteroids/skins.ts
export interface AsteroidsPalette {
  bg: string;
  ship: string;
  flame: string; // incluye alfa si aplica
  asteroid: string;
  bullet: string;
  particle: string; // se dibuja con globalAlpha = ttl / life
  powerUp: string; // rombo y texto "3x"
  timer: string; // contador "3x  N.Ns"
  overlayVeil: string | null; // velo a pantalla completa bajo PAUSA / GAME OVER
  overlayTitle: string;
  overlaySub: string;
  lineWidth: number; // trazo de nave y asteroides (px lógicos)
  bulletStyle: { shape: "round" | "square"; size: number }; // solo dibujo; no afecta colisiones
  glow: { ship: number; asteroid: number; bullet: number; powerUp: number; title: number }; // shadowBlur, 0 = sin glow
}

export const PALETTES: Record<SkinId, AsteroidsPalette>;
```

#### `classic` (por defecto, idéntico al actual)

| Elemento          | Valor                      | Origen actual            |
| ----------------- | -------------------------- | ------------------------ |
| Fondo             | `#000000`                  | `index.ts:274`           |
| Nave              | `#ffffff`                  | `entities.ts:236`        |
| Llama             | `rgba(255, 130, 0, 0.85)`  | `entities.ts:255`        |
| Asteroides        | `#ffffff`                  | `entities.ts:99`         |
| Balas             | `#ffffff`, redondas, r = 2 | `entities.ts:40`         |
| Partículas        | `#ffffff` con alfa ttl     | `entities.ts:292`        |
| Power-up y texto  | `#00ffff`                  | `entities.ts:143`, `148` |
| Contador 3x       | `#00ffff`                  | `index.ts:258`           |
| Velo de overlay   | ninguno                    | —                        |
| Título de overlay | `#ffffff`                  | `index.ts:265`           |
| Subtítulo         | `rgba(255,255,255,0.65)`   | `index.ts:269`           |
| Grosor de trazo   | 1.5                        | `entities.ts:100`, `237` |
| Glow              | 0 en todo                  | —                        |

#### `neon` (paleta de marca de `globals.css`)

| Elemento          | Valor                        | Variable      | Glow (`shadowBlur`) |
| ----------------- | ---------------------------- | ------------- | ------------------- |
| Fondo             | `#0a0a0f`                    | `--bg`        | —                   |
| Nave              | `#00f5ff`                    | `--cyan`      | 10                  |
| Llama             | `rgba(255, 207, 58, 0.85)`   | `--gold`      | 0                   |
| Asteroides        | `#ff006e`                    | `--magenta`   | 6                   |
| Balas             | `#f5ff00`, redondas, r = 2.5 | `--yellow`    | 8                   |
| Partículas        | `#ff006e` con alfa ttl       | `--magenta`   | 0                   |
| Power-up y texto  | `#00ff88`                    | `--green`     | 10                  |
| Contador 3x       | `#00ff88`                    | `--green`     | 0                   |
| Velo de overlay   | `rgba(10, 10, 15, 0.75)`     | `--bg` al 75% | —                   |
| Título de overlay | `#e6e9ff`                    | `--ink`       | 12 (`#00f5ff`)      |
| Subtítulo         | `#8a8fb5`                    | `--ink-dim`   | 0                   |
| Grosor de trazo   | 2                            | —             | —                   |

El color del glow es el mismo que el del trazo, salvo el título (glow `--cyan`). Tras cada elemento con glow se restablece `shadowBlur = 0`.

#### `retro` (fósforo verde monocromo, 4 tonos + fondo)

| Elemento          | Valor                        | Tono          |
| ----------------- | ---------------------------- | ------------- |
| Fondo             | `#040904`                    | negro fósforo |
| Nave              | `#b4ffb4`                    | brillante     |
| Llama             | `#2fa84f`                    | tenue         |
| Asteroides        | `#4be06a`                    | principal     |
| Balas             | `#b4ffb4`, cuadradas de 5 px | brillante     |
| Partículas        | `#2fa84f` con alfa ttl       | tenue         |
| Power-up y texto  | `#b4ffb4`                    | brillante     |
| Contador 3x       | `#4be06a`                    | principal     |
| Velo de overlay   | `rgba(4, 9, 4, 0.7)`         | fondo al 70%  |
| Título de overlay | `#b4ffb4`                    | brillante     |
| Subtítulo         | `#4be06a`                    | principal     |
| Grosor de trazo   | 2.5, `lineJoin = "miter"`    | —             |
| Glow              | 0 en todo                    | —             |

### Contraste medido (WCAG 2.x)

Medido con un script de Node (luminancia relativa sRGB). "Con scanline" = la fila oscurecida por `.crt-screen::after` (multiplica por 0.82 fondo y figura). Para el texto se mide sobre el fondo y sobre el peor caso real: el texto cruzando una línea de asteroide bajo el velo.

| Elemento                  | `classic`     | `neon`        | `retro`       | Mínimo |
| ------------------------- | ------------- | ------------- | ------------- | ------ |
| Luminancia del fondo      | 0.0000        | 0.0032        | 0.0023        | ≤ 0.05 |
| Nave                      | 21.00 (13.75) | 14.58 (9.78)  | 17.12 (11.40) | 3:1    |
| Asteroides                | 21.00 (13.75) | 5.15 (3.67)   | 11.63 (7.91)  | 3:1    |
| Balas                     | 21.00 (13.75) | 18.05 (12.00) | 17.12 (11.40) | 3:1    |
| Power-up                  | 16.75 (11.04) | 14.73 (9.86)  | 17.12 (11.40) | 3:1    |
| Llama (decorativa)        | 6.22 (4.39)   | 9.71 (6.67)   | 6.53 (4.63)   | 3:1    |
| Partículas (alfa inicial) | 21.00         | 5.15          | 6.53          | 3:1    |
| Contador 3x (texto)       | 16.75         | 14.73         | 11.63         | 4.5:1  |
| Título sobre fondo        | 21.00         | 16.43         | 17.12         | 4.5:1  |
| Título sobre asteroide    | 1.00 (\*)     | 13.11         | 8.75          | 4.5:1  |
| Subtítulo sobre fondo     | 8.63          | 6.28          | 11.63         | 4.5:1  |
| Subtítulo sobre asteroide | 1.00 (\*)     | 5.01          | 5.95          | 4.5:1  |

Entre paréntesis, con scanline. (\*) `classic` no tiene velo para no cambiar su aspecto: cuando una línea blanca de 1.5 px cruza el texto, ese píxel se funde; es el comportamiento actual y se acepta como excepción (el texto sigue legible porque las líneas son finas y móviles).

Distinción entre elementos (no es requisito de la mecánica, que no depende del color): en `neon`, nave/asteroides 2.83:1 con tono opuesto (cian frente a magenta) y balas/asteroides 3.50:1; power-up y nave tienen luminancia casi igual (1.01:1) pero se distinguen por tono (verde frente a cian), forma (rombo con "3x") y glow. En `retro` (monocromo) la distinción es por luminancia: brillante/principal 1.47:1 y principal/tenue 1.78:1, más la forma.

### Selector en `GamePlayer`

```
┌ player-hud ───────────────────────────────────────────────────────────────┐
│ Juego        Puntuación  Vidas  Nivel   Skin                    PAUSAR    │
│ ASTEROIDS…   1200        3      2       [■ CLÁSICO][■ NEON][■ RETRO]  TERMINAR │
└───────────────────────────────────────────────────────────────────────────┘
```

- Bloque con la misma estructura que `.hud-stat` (etiqueta `.l` "Skin" + fila de botones), colocado antes de `.hud-actions`; con `flex-wrap` del HUD pasa a otra línea a 375 px.
- Grupo con `role="group"` y `aria-label="Skin del canvas"`; cada botón es `.btn.ghost.skin-opt` con `aria-pressed`. El activo usa `border-color: var(--cyan)` y `color: var(--ink)`.
- Cada botón muestra una muestra de 6×6 px del color de la nave en ese skin (`#ffffff`, `#00f5ff`, `#b4ffb4`) mediante `::before` y `data-skin`; es la única pista visual del skin antes de elegirlo.
- Botones compactos (`font-size: 8px`, `padding: 8px 10px`) para no ensanchar el HUD.
- Tras el clic se hace `e.currentTarget.blur()` (como PAUSAR) para que `Espacio` y las flechas sigan yendo al juego.

## Implementation Plan

1. **Contrato común de skins**

   - Crear `app/components/games/skins.ts` (`SkinId`, `SKINS`, `DEFAULT_SKIN`, `isSkinId`)
   - Ampliar `types.ts` con `GameOptions`, `options?` en `GameFactory` y `setSkin?` en `GameInstance`
   - Añadir `SKINNABLE` (vacío todavía) en `registry.ts`
   - Los 4 juegos compilan sin cambios; `npx tsc --noEmit` y `npm run build` pasan

2. **Hook `useSkin` y selector en `GamePlayer`**

   - `app/components/useSkin.ts`: `useSyncExternalStore` con `getServerSnapshot = DEFAULT_SKIN`, lectura de `av_skin` en `try/catch` con `isSkinId`, escritura en `try/catch`, notificación a suscriptores y escucha del evento `storage`
   - `GamePlayer`: `skinRef` con el valor actual; el `useEffect` que crea el juego pasa `{ skin: skinRef.current }` (sin añadir `skin` a sus dependencias, para no recrear el juego); un segundo `useEffect` con `[skin]` llama a `gameRef.current?.setSkin?.(skin)`
   - Selector visible solo si `SKINNABLE.has(id)`; estilos `.skin-picker` / `.skin-opt` en `globals.css`
   - Con `SKINNABLE` vacío el selector no aparece en ningún juego; build y lint pasan

3. **Paletas de Asteroids y render parametrizado**

   - Crear `asteroids/skins.ts` con `AsteroidsPalette` y `PALETTES` (tablas del Data Model)
   - `draw(ctx, pal)` en `Ship`, `Asteroid`, `Bullet`, `PowerUp` y `Particle`; partículas con `globalAlpha` en vez de `rgba` construido
   - `index.ts`: `let pal = PALETTES[options?.skin ?? DEFAULT_SKIN]` (validado con `isSkinId`) en el closure; `draw`, `drawPowerUpTimer` y `drawOverlay` usan `pal`; velo si `pal.overlayVeil`; glow con `shadowBlur`/`shadowColor` y restablecido a 0 tras cada elemento
   - `setSkin(skin)` solo reasigna `pal` (ignora valores inválidos); no toca estado ni callbacks
   - Ningún color fijo en `index.ts` ni `entities.ts` (`grep` de `#`, `rgb` y `fillStyle = "` vacío)

4. **Activar Asteroids en el selector**

   - Añadir `asteroids` a `SKINNABLE`
   - El selector aparece en `/player/asteroids` y no en `/player/tetris`, `/player/breakout` ni `/player/snake`

5. **Verificación**

   - `npx tsc --noEmit`, `npx eslint app lib` y `npm run build`
   - Script de contraste (fuera del repo) sobre `asteroids/skins.ts` con los mínimos del checklist
   - Playwright con `npm run dev`: capturas `.playwright-screenshots/skins/asteroids-{classic,neon,retro}.png` y `-375.png`; captura de `classic` comparada con una tomada antes del cambio; cambio de skin en partida, en pausa y tras `GAME OVER`; persistencia tras recargar; valor inválido en `av_skin`

6. **Documentación**
   - `.claude/skills/add-game/reference.md`: requisito de 3 skins (`<id>/skins.ts`, `options.skin`, `setSkin`, alta en `SKINNABLE`, checklist de modo oscuro)
   - `CLAUDE.md`: contrato ampliado de `types.ts` y columna o nota de skins en la tabla de juegos

## Acceptance Criteria

- [ ] `npx tsc --noEmit`, `npx eslint app lib` y `npm run build` terminan sin errores
- [ ] Tetris, Breakout y Snake funcionan igual que antes y **no** muestran el selector de skin
- [ ] `/player/asteroids` muestra el selector con `CLÁSICO`, `NEON` y `RETRO`; sin `av_skin` en `localStorage` el activo es `CLÁSICO`
- [ ] Con `classic`, la captura de Asteroids es indistinguible de la anterior a esta spec (fondo `#000000`, trazos blancos de 1.5 px, power-up `#00ffff`, overlays sin velo)
- [ ] Con `neon`, la nave es `#00f5ff`, los asteroides `#ff006e`, las balas `#f5ff00` y el power-up `#00ff88` sobre `#0a0a0f`, con glow visible solo en nave, asteroides, balas, power-up y título
- [ ] Con `retro`, todo el canvas usa solo `#040904`, `#b4ffb4`, `#4be06a` y `#2fa84f`, sin glow ni degradados, con balas cuadradas
- [ ] Cambiar de skin durante la partida cambia la paleta en el siguiente frame sin reiniciar: puntuación, vidas, nivel y posiciones se conservan y no se emite ningún callback
- [ ] Cambiar de skin con el juego en pausa redibuja `PAUSA` con la nueva paleta y el juego sigue en pausa
- [ ] Cambiar de skin en `GAME OVER` no reinicia la partida ni vuelve a guardar la puntuación
- [ ] Tras hacer clic en un botón del selector, `Espacio` dispara y las flechas mueven la nave (el botón no conserva el foco)
- [ ] El skin elegido persiste tras recargar `/player/asteroids` (`av_skin`); con `av_skin = "foo"` o con `localStorage` bloqueado se usa `classic` sin errores en consola ni aviso de hidratación
- [ ] Ningún archivo de `app/components/games/asteroids/` salvo `skins.ts` contiene literales de color
- [ ] Contraste medido: fondo con luminancia ≤ 0.05; nave, asteroides, balas y power-up ≥ 3:1 contra el fondo; título y subtítulo de overlays ≥ 4.5:1 contra su fondo real con velo en `neon` y `retro` (tabla del Data Model)
- [ ] `shadowBlur` vale 0 al dibujar cualquier elemento sin glow (sin halos residuales en partículas o texto del contador)
- [ ] A 375 px de ancho el selector cabe en el HUD (pasa a otra línea si hace falta) y los 3 skins se ven en el canvas; capturas en `.playwright-screenshots/skins/asteroids-<skin>-375.png`
- [ ] Pausa con `P` y al ocultar la pestaña, `destroy()` idempotente (Strict Mode), `preventDefault` solo en las teclas del juego y guardado de puntuación sin cambios
- [ ] `reference.md` y `CLAUDE.md` documentan el contrato de skins

## Decisions Taken and Discarded

| Decisión                                                          | Razón                                                                                                                                                 |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`setSkin` opcional y lista `SKINNABLE` en el registro**         | Los otros 3 juegos compilan sin tocarlos; el selector sabe de forma estática (sin estado tras montar) si debe mostrarse                               |
| **Descartado: selector visible en todos los juegos**              | En juegos sin skins el botón no haría nada; confunde al usuario                                                                                       |
| **Descartado: detectar `setSkin` en la instancia tras crearla**   | Obliga a un `setState` dentro del `useEffect` (regla de lint de React 19) y hace parpadear el HUD                                                     |
| **Un skin global (`av_skin`) para todos los juegos**              | Es una preferencia estética del jugador, no del juego; una clave simple como pide el contrato                                                         |
| **Descartado: skin por juego o guardado en Supabase**             | Más complejidad (clave por id o migración) sin necesidad demostrada                                                                                   |
| **`useSyncExternalStore` para leer `localStorage`**               | El servidor renderiza `classic` y el cliente lee `av_skin` sin aviso de hidratación ni `setState` en efectos                                          |
| **El juego se crea con `skinRef.current`, no depende de `skin`**  | Cambiar de skin no debe recrear el juego (perdería la partida); el cambio en caliente va por `setSkin`                                                |
| **`classic` sin velo en los overlays**                            | Requisito de no regresión; el texto cruzado por una línea fina es el comportamiento actual                                                            |
| **Velo bajo overlays en `neon` (75%) y `retro` (70%)**            | Con velos de 55% y 60% el subtítulo sobre una línea de asteroide bajaba a 3.54:1 y 4.45:1; con 75% y 70% sube a 5.01:1 y 5.95:1                       |
| **Neon: nave cian, asteroides magenta, balas amarillas**          | Tonos opuestos para amigo/enemigo; el magenta (5.15:1) es el color de marca más oscuro pero supera 3:1 incluso con scanline (3.67:1)                  |
| **Neon: llama en `--gold` en vez de naranja**                     | `--gold` está en `globals.css` y no se confunde con las balas amarillas al ser más cálido y llevar alfa                                               |
| **Neon: glow solo en nave, asteroides, balas, power-up y título** | Partículas y contador sin glow para no saturar en explosiones y no penalizar el rendimiento                                                           |
| **Retro: fósforo verde monocromo**                                | Evoca los monitores vectoriales y de terminal; con un solo tono la jerarquía es por brillo (brillante = jugador y lo recogible; principal = amenazas) |
| **Descartado: retro en ámbar**                                    | Alternativa válida (decisión estética del usuario); el verde separa mejor el skin del `--yellow`/`--gold` de neon                                     |
| **Descartado: retro tipo CGA (cian/magenta/blanco)**              | Se parecería demasiado a neon                                                                                                                         |
| **Sin scanlines en el canvas en retro**                           | `.crt-screen::after` ya aplica scanlines (alfa 0.18, `multiply`) a todos los skins; dibujarlas otra vez bajaría el contraste                          |
| **Trazo más grueso en neon (2) y retro (2.5)**                    | A 375 px el canvas se escala ~0.35×; 1.5 px lógicos quedan en ~0.5 px. `classic` conserva 1.5 por no regresión                                        |
| **Balas cuadradas en retro**                                      | Bordes duros, sin antialias redondo; el tamaño de dibujo no afecta a las colisiones (usan el radio del asteroide)                                     |
| **Partículas con `globalAlpha`**                                  | Permite un color sólido en la paleta en vez de construir `rgba` con el blanco fijo; en `classic` el resultado es idéntico                             |
| **Muestra de color en cada botón del selector**                   | Anticipa el skin sin tener que probarlo; es la única decoración del selector                                                                          |

---

## Identified Risks

- **Regresión visual en `classic`**: al mover los colores a la paleta puede cambiar algún detalle (alfa de partículas, grosor). Mitigación: captura de `classic` antes y después del cambio y comparación; valores copiados literalmente de `index.ts` y `entities.ts`.
- **Rendimiento del glow**: con muchos asteroides pequeños en niveles altos, `shadowBlur` en cada uno puede bajar los FPS. Mitigación: glow moderado (6 px en asteroides), restablecido a 0 tras cada elemento; si en la prueba baja de ~55 FPS, se deja el glow de asteroides en 0 (decisión anotada en la implementación).
- **`shadowBlur` residual**: olvidar restablecerlo hace que todo el frame tenga halo. Mitigación: helper que dibuja con glow dentro de `save()`/`restore()`, y criterio de aceptación.
- **Foco en los botones del selector**: con el foco en un botón, `Espacio` lo activaría en vez de disparar. Mitigación: `blur()` tras el clic, como PAUSAR, y criterio de aceptación.
- **Recrear el juego al cambiar de skin**: si `skin` entra en las dependencias del efecto de creación, se pierde la partida. Mitigación: `skinRef` y efecto separado para `setSkin`, con criterio de aceptación.
- **`localStorage` no disponible** (modo privado, cuota, bloqueo): Mitigación: lectura y escritura en `try/catch` con `DEFAULT_SKIN` como respaldo.
- **Hidratación**: leer `localStorage` en el render del servidor rompe la hidratación. Mitigación: `useSyncExternalStore` con `getServerSnapshot` fijo.
- **Contraste en el cruce de texto y líneas en `classic`**: 1:1 en los píxeles cruzados. Mitigación: aceptado como comportamiento original; los skins nuevos usan velo.
- **Scanlines CSS**: el `.crt-screen::after` reduce el contraste en filas alternas. Mitigación: medido el peor caso (asteroides neon 3.67:1, por encima de 3:1).
- **Drift del contrato**: los juegos nuevos podrían no incluir skins. Mitigación: `reference.md` documenta el requisito para `/add-game` y `game-jam`.

---

## What is **not** in this spec

- Skins de Tetris, Breakout y Snake (specs posteriores; Breakout necesitará tintar su spritesheet en un canvas offscreen cacheado).
- Hacer `setSkin` obligatorio y retirar `SKINNABLE` cuando todos los juegos tengan skins.
- Modo claro, cambios en la paleta global o en la UI fuera del selector.
- Scanlines o efectos de post-proceso dibujados en el canvas.
- Skin por juego o sincronizado con la cuenta.
- Pruebas automatizadas (el repo no tiene framework de tests).

Cada uno de estos, si se aborda, va en su propia spec.
