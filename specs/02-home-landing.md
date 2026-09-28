# Home Landing Page

**State:** Implementado  
**Depends on:** SPEC 01 (Arcade Vault MVP)  
**Date:** 2026-09-28  
**Objective:** Implementar la página home como landing page principal con hero, features, preview de juegos, actividad en vivo, pricing y CTA, reemplazando la Biblioteca actual como pantalla inicial.

---

## Scope

**Está incluido:**
- Home page como ruta raíz `/`
- Hero section: eyebrow, títulos multilineales, subtítulo, botones CTA (Explorar Juegos, Crear Cuenta), silhuetas flotantes decorativas (SVG pixels arcade)
- Sección "¿Por qué Arcade Vault?": 4 feature cards (Juegos Clásicos, 100% Gratis, Ladder Boards, Siempre Creciendo) con iconos pixel
- Sección "Juegos disponibles": rail de 6 mini cards con portada, título, categoría (primeros 6 juegos del array GAMES)
- Sección de estadísticas: 3 stat blocks (12+ Juegos, Miles de Partidas, Global Ranking)
- Sección "Actividad en vivo": ticker de últimas puntuaciones + tabla de top jugadores hoy (datos seedeados)
- Sección "Precios": 1 card de precio ($0 Forever) con features list + FAQ de 3 items
- CTA final: botón "¿Listo para Jugar?"
- Animaciones: reveal on scroll (IntersectionObserver), fade-in, staggered delays, pixel silhouettes
- Routing: cambio de hash-based a Next.js App Router; ruta `/` = home, `/games` = biblioteca, `/games/:id` = detalle
- Integración: la biblioteca actual se mueve a `/games`; todos los links de nav y CTAs apuntan a nuevas rutas

**NO está incluido:**
- Página About/Contact (scope futuro)
- Persistencia o storage de datos (datos seedeados)
- Backend o APIs (solo datos en memoria)
- Modificación de la lógica de juego, autenticación, o leaderboards del MVP
- Componentes de Detalle, Salón de la Fama, o Auth (mantienen su implementación del MVP)

---

## Data Model

No se introduce nuevo modelo de datos. Se reutiliza:
- Array `GAMES` del MVP para el preview de 6 juegos
- Array `CATS` del MVP para categorías
- Función `seededScores()` del MVP para generar puntuaciones reproducibles

Data específica de home (hardcodeada):
```typescript
// Feature cards
Features: [
  { icon: "GAMEPAD", title: "JUEGOS CLÁSICOS", desc: "...", color: "cyan" },
  { icon: "FREE",    title: "100% GRATIS",      desc: "...", color: "yellow" },
  { icon: "TROPHY",  title: "LADDER BOARDS",    desc: "...", color: "magenta" },
  { icon: "ROCKET",  title: "SIEMPRE CRECIENDO",desc: "...", color: "green" }
]

// Stats block
Stats: [
  { number: "12+", unit: "JUEGOS", sub: "Y CONTANDO" },
  { number: "MILES", unit: "DE PARTIDAS", sub: "JUGADAS CADA DÍA" },
  { number: "GLOBAL", unit: "RANKING", sub: "COMPITE CON EL MUNDO" }
]

// Activity ticker (últimas puntuaciones) — seedeadas
ActivityFeed: [
  { player: "NEONFOX", game: "Caída", score: 184220, time: "hace 2 min", color: "magenta" },
  ...
]

// Top players hoy — seedeadas
TopPlayers: [
  { rank: 1, player: "NEONFOX", score: 312840 },
  ...
]

// FAQ items
FAQItems: [
  { q: "¿REALMENTE ES GRATIS?", a: "..." },
  { q: "¿NECESITO CREAR CUENTA?", a: "..." },
  { q: "¿CÓMO SOBREVIVEN SIN COBRAR?", a: "..." }
]
```

---

## Implementation Plan

1. **Refactorizar estructura de rutas con Next.js App Router**
   - Cambiar de hash-based routing a Next.js rutas reales
   - Mantener `/` como home (nuevo landing)
   - Mover componente Library (Biblioteca) a `/games` (nueva ruta)
   - Mover componente GameDetail a `/games/[id]` (dinámica)
   - Otros componentes (Auth, HallOfFame, GamePlayer) mantienen rutas en App.tsx con lógica condicional si es necesario
   - Actualizar `app/layout.tsx` y crear estructura en `app/(marketing)/` para home si es necesario

2. **Crear componentes de home de alto nivel**
   - `app/components/home/HeroSection.tsx` — eyebrow, títulos, subtítulo, CTAs, FloatingSilhouettes (SVG decorativo)
   - `app/components/home/WhySection.tsx` — titulo, 4 feature cards con iconos pixel
   - `app/components/home/GamesPreviewSection.tsx` — titulo, rail de 6 mini cards, botón "Ver todos"
   - `app/components/home/StatsSection.tsx` — 3 stat blocks con números
   - `app/components/home/ActivitySection.tsx` — ticker de actividad + tabla de top jugadores
   - `app/components/home/PricingSection.tsx` — card de precio, features list, FAQ accordion
   - `app/components/home/FinalCTASection.tsx` — titulo + botón grande + tagline

3. **Crear componentes reutilizables de home**
   - `app/components/home/FeatureCard.tsx` — card con icono, título, descripción, color
   - `app/components/home/MiniCard.tsx` — portada + meta (título, categoría)
   - `app/components/home/FloatingSilhouettes.tsx` — SVG decorativo con 8 siluetas pixel
   - `app/components/home/FeatureIcon.tsx` — iconos pixel (GAMEPAD, FREE, TROPHY, ROCKET)
   - `app/components/home/HighlightIcon.tsx` — iconos para highlights

4. **Implementar animaciones y efectos**
   - Hook `useReveal()` — IntersectionObserver con threshold 0.12, agrega clase "in" al elemento visibles
   - Aplicar clase `.reveal` a secciones (fade-in on scroll)
   - Delays escalonados con `style={{ transitionDelay: (i * 80) + "ms" }}` en feature cards, stats, activity rows
   - Animación `.flicker` en "▸ INSERTA UNA MONEDA"
   - Animación `.blink` en el cursor "_"
   - Efecto `.fade-in` en home general
   - Mantener scroll indicator ("DESLIZA ▼") en hero

5. **Integrar datos y lógica de navegación**
   - Importar `GAMES`, `CATS`, `seededScores()` del MVP
   - Crear función `useFakeActivityFeed()` que genera feed de actividad seedeado con nombres aleatorios y juegos
   - Pasar función `navigate()` como prop desde App a Home (o usar Next.js `useRouter` si es más limpio)
   - Los botones CTA usan `navigate()` para ir a `/games`, `/auth`, `/games/:id`

6. **Adaptar estilos del template a globals.css existente**
   - No crear stylesheet nuevo; reutilizar variables CSS (`--neon-cyan`, `--neon-magenta`, etc.) del MVP
   - Agregar clases específicas de home en `globals.css` si es necesario (`.home-hero`, `.home-section`, `.reveal`, etc.)
   - Mantener responsive (desktop-first, 800px breakpoint) del MVP
   - Asegurar que silhuetas flotantes, animaciones de scroll y staggered delays funcionan

7. **Crear ruta home en `app/page.tsx`**
   - Renderizar componente Home que agrega todas las secciones
   - Integrar con App router para que home sea la landing inicial
   - Confirmar que links en Nav (Logo, "Explorar") apunten a `/games`

8. **Testing e integración**
   - Verificar que ruta `/` renderiza home completo con todas las secciones
   - Verificar que scroll trigger (`.reveal`) anima secciones correctamente
   - Verificar que CTAs navegan a `/games`, `/auth` correctamente
   - Verificar que preview de juegos muestra los primeros 6 de GAMES
   - Verificar responsive en mobile (800px breakpoint)
   - Verificar que no hay errores de console, estilos se aplican, animaciones fluidas
   - Probar que nav no tiene links rotos (ajustar después si es necesario)

---

## Acceptance Criteria

- [ ] Ruta `/` renderiza home page completo con todas las secciones (hero, why, games, stats, activity, pricing, final CTA)
- [ ] Hero section renderiza eyebrow, títulos multilineales, subtítulo, dos botones CTA (Explorar, Crear Cuenta), y silhuetas flotantes decorativas
- [ ] FeatureCards renderiza 4 cards con icono, título, descripción, staggered animation (80ms delays)
- [ ] GamesPreviewSection renderiza primeros 6 juegos de GAMES en rail de MiniCards, botón "Ver todos" navega a `/games`
- [ ] StatsSection renderiza 3 stat blocks con números grandes (yellow neon) y texto pixelado
- [ ] ActivitySection renderiza ticker de 7 últimas puntuaciones con staggered animation + tabla de top 5 jugadores (con highlighting para top 3)
- [ ] PricingSection renderiza 1 card con $0 Forever, features list (6 items), y 3 FAQ items con Q&A visible
- [ ] FinalCTA renderiza título pixelado, botón grande (pulse animation), tagline
- [ ] useReveal() hook anima secciones con clase "in" al scrollear (IntersectionObserver, threshold 0.12)
- [ ] Botones CTA navegan correctamente: "Explorar Juegos" → `/games`, "Crear Cuenta" → `/auth`, preview cards → `/games/:id`
- [ ] Estilos usan variables CSS existentes (colores neon, tipografía, espaciado); sin stylesheet nuevo
- [ ] Responsive en mobile: secciones apilan correctamente, grid se adapta a 1 columna en <800px
- [ ] No hay errores de console, animaciones fluidas, carga sin lag
- [ ] Routing App Router funciona: `/` = home, `/games` = biblioteca, `/games/:id` = detalle

---

## Decisions Taken and Discarded

| Decisión | Razón |
|----------|-------|
| **Home como ruta `/` con App Router en lugar de hash routing** | Mejora UX, SEO, y alineación con Next.js moderno; home es el entry point natural del landing |
| **Biblioteca se mueve a `/games`** | Home es el nuevo foco; biblioteca es sección funcional dentro del producto (no marketing) |
| **Componentes extraídos (HeroSection, FeatureCard, etc.) en lugar de monolito** | Mantenibilidad, reutilización, alineación con estructura del MVP; evita JSX gigante |
| **Datos seedeados para activity feed** | Actividad "fake" reproducible sin backend; suficiente para MVP, se puede reemplazar después |
| **Silhuetas decorativas como SVG inline (FloatingSilhouettes)** | Visual arcade puro, no requiere assets adicionales, ligero |
| **useReveal() hook reutilizado de template** | Patrón probado para reveal on scroll; adaptado a componentes React |
| **Staggered animations con inline transitionDelay** | Simple, sin librerías adicionales; efectos visuales sin overhead |

---

## Identified Risks

- **Performance de animaciones en mobile**: Muchas secciones con reveal + staggered delays podrían ralentizar en dispositivos lentos. Mitigación: usar `prefers-reduced-motion` media query si es necesario; desactivar animaciones en bajo-end devices.
- **SEO de home nueva**: Si hay indexación previa de rutas antiguas, links rotos podrán afectar. Mitigación: agregar redirects de hash antiguas a rutas nuevas si es necesario (scope futuro).
- **Activity feed hardcodeada no refleja estado real**: Los jugadores verán puntuaciones fake. Mitigación: suficiente para MVP; backend de actividad es scope futuro.
- **Responsive en pantallas muy pequeñas (<360px)**: Hero con textos grandes puede no caber bien. Mitigación: testear y ajustar font-sizes si es necesario.
