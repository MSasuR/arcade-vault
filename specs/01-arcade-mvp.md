# Arcade Vault MVP — Interfaz Visual Completa

**State:** Implementado  
**Date:** 2026-09-28  
**Objective:** Implementar las cinco pantallas principales (Biblioteca, Detalle, Salón de la Fama, Autenticación, Navegación) como componentes React funcionales con routing, búsqueda, filtros y persistencia de usuario, sin lógica de juego.

---

## Scope

**Está incluido:**
- Pantalla Biblioteca: hero, búsqueda, filtros por categoría, grid de tarjetas con efecto tilt
- Pantalla Detalle: portada, info del juego, estadísticas, leaderboard, botón JUGAR
- Pantalla Salón de la Fama: podio (top 3), tabla de leaderboard, tabs por juego, puntuación del usuario logueado
- Pantalla Autenticación: tabs login/signup, formularios, login social UI, jugar como invitado
- Navegación: header con logo, links, contador de créditos, estado del usuario, menú hamburguesa mobile
- Reproductor: solo layout y botones (sin mecánica de juego ni lógica interactiva de gameplay)
- Routing: navegación funcional entre pantallas via hash (#)
- Búsqueda y filtros: filtrando GAMES array en tiempo real
- Autenticación: guardar/restaurar usuario en localStorage (av_user)
- Estilos: sistema de variables CSS custom y clases de utilidad (fuentes, colores neon, animaciones)

**NO está incluido:**
- Lógica de juego o mecánica playable
- API backend o conexión a servidor (datos hardcodeados)
- Persistencia real de puntuaciones (solo UI de leaderboard con datos seedeados)
- Autenticación real (solo almacenamiento local)
- Órdenes sociales autentificadas (Google/GitHub son botones UI sin funcionalidad)

---

## Data Model

### Games Array
```typescript
interface Game {
  id: string;           // identificador único (ej: "galaga")
  title: string;        // "GALAGA VAULT"
  short: string;        // descripción corta (ej: "Disparos contra invasores")
  long: string;         // descripción larga (párrafo)
  cat: string;          // categoría (ej: "ACCIÓN", "PUZZLE", "DEPORTES")
  cover: string;        // clase CSS para fondo de portada
  best: number;         // puntuación global más alta
  plays: number;        // total de partidas jugadas
  color?: string;       // color del botón (ej: "magenta", "yellow")
}
```

### User Object (localStorage av_user)
```typescript
interface User {
  name: string;  // nombre (10 chars max, uppercase)
}
```

### Score Entry (localStorage av_scores)
```typescript
interface ScoreEntry {
  gameId: string;
  playerName: string;
  score: number;
  at: number;  // timestamp
}
```

### Categories
Array CATS: ["TODOS", "ACCIÓN", "PUZZLE", "DEPORTES", "RETRO"]

---

## Implementation Plan

1. **Crear sistema de estilos globales**
   - Definir variables CSS en `app/globals.css` (colores neon: cyan, magenta, yellow; tipografía: Geist Mono; espaciado arcade)
   - Clases utilitarias: `.neon-cyan`, `.neon-magenta`, `.pixel` (pixel font), `.flicker` (animación), `.blink`, efectos de glow/shadow
   - Estilos base para nav, hero, cards, formularios, botones
   - Media queries para mobile (800px breakpoint)

2. **Configurar estructura de componentes y datos**
   - Crear array GAMES en un archivo `data.ts` con ~8-12 juegos de ejemplo
   - Crear array CATS con las categorías
   - Crear función helper `seededScores()` para generar leaderboards reproducibles
   - Importar en la componente App

3. **Implementar componente App (router principal)**
   - Leer/escribir ruta en location.hash como JSON
   - Estados: route (current route), user (usuario logueado)
   - Renderizar Nav siempre + pantalla actual + footer
   - Pasar navigate(), handleLogin(), handleSignOut(), handleSaveScore() a componentes

4. **Implementar componente Nav**
   - Logo clickeable (navega a biblioteca)
   - Links: Biblioteca, Salón de la Fama
   - Contador de créditos (hardcodeado: "03")
   - Botón login (si no logueado) o perfil dropdown (si logueado)
   - Menú hamburguesa mobile con backdrop
   - Styles responsive (desktop + mobile)

5. **Implementar componente Auth**
   - Tabs: "INICIAR SESIÓN" / "CREAR CUENTA"
   - Campos input: usuario, contraseña, email (visible solo en signup)
   - Validación mínima (usuario no vacío)
   - Botón envío: guarda en localStorage, navega a biblioteca
   - Botón invitado: login sin usuario, navega a biblioteca
   - Botones sociales (solo UI)
   - Animación slide-in para campo email

6. **Implementar componente Library (Biblioteca)**
   - Hero section: título "ARCADE VAULT" + animación flicker + subtítulo con blink
   - SearchBox: busca en game.title (case-insensitive)
   - Chips: filtro por categoría (CATS)
   - Grid de GameCards (3 columnas desktop, 1 mobile)
   - GameCard:
     - Efecto tilt al mover mouse (rotateX/Y)
     - Portada con etiqueta categoría
     - Título, descripción corta
     - Badge de mejor puntuación
     - Botón JUGAR (con color del juego)
   - Mensaje "NO HAY RESULTADOS" si no hay coincidencias

7. **Implementar componente GameDetail**
   - Portada grande del juego
   - Tags: categoría, jugadores, controles, año
   - Título h2 neon-cyan
   - Descripción larga (párrafo)
   - Stat strip: Partidas | Mejor global (magenta glow) | Dificultad (estrellas, yellow glow)
   - Botones: JUGAR AHORA (pulse animation) | VOLVER AL VAULT
   - Sidebar (desktop) / bajo content (mobile): leaderboard de los mejores del juego
   - Leaderboard rows: rank, nombre, score, fecha (con estilos para top 3)

8. **Implementar componente HallOfFame**
   - Título + subtítulo pixelado
   - Tabs: chip por cada juego (cambia el leaderboard)
   - Podio (3 posiciones):
     - Plata (02): rk, nombre, score, fecha
     - Oro (01): "CAMPEÓN" label, rk más grande, nombre, score más grande, fecha
     - Bronce (03): rk, nombre, score, fecha
   - Tabla: headers (RANGO, JUGADOR, PUNTUACIÓN, FECHA) + rows con animación staggered
   - Si user logueado: agregar fila "▸ TU MEJOR MARCA EN [GAME]" con su puntuación (yellow)
   - Botón VOLVER A LA BIBLIOTECA

9. **Implementar componente GamePlayer**
   - Solo layout visual (pantalla de juego)
   - Encabezado: nombre del juego
   - Área central: placeholder "JUEGO AQUÍ" (no implementar mecánica)
   - Botones: PAUSA, TERMINAR PARTIDA
   - Scoreboard: puntuación actual (hardcodeado: "0")
   - Animación fade-in

10. **Integración y testing**
    - Verificar que todas las rutas funcionan: #{"name":"biblioteca"}, #{"name":"detalle","id":"galaga"}, etc.
    - Probar búsqueda y filtros en Biblioteca
    - Probar login/logout (verificar localStorage av_user)
    - Verificar que leaderboards se renderizan con datos seedeados
    - Responsive en desktop y mobile (verificar menú hamburguesa)
    - Verificar efectos visuales: tilt en cards, flicker en título, pulse en botón

---

## Acceptance Criteria

- [ ] Componente App renderiza la navegación y la pantalla correcta según la ruta (hash)
- [ ] Nav muestra logo, links, contador de créditos, y estado de usuario; hamburguesa funciona en mobile
- [ ] Auth renderiza tabs, formularios, acepta usuario sin verificación, guarda en localStorage, navega a biblioteca
- [ ] Library renderiza hero, búsqueda en tiempo real, filtros por categoría, grid de cards con tilt, "NO HAY RESULTADOS" si es necesario
- [ ] GameDetail renderiza portada, tags, info, stats, leaderboard, botones funcionales
- [ ] HallOfFame renderiza podio, tabs funcionales (cambian leaderboard), tabla de scores, fila de usuario logueado si aplica
- [ ] GamePlayer renderiza layout básico (sin juego playable)
- [ ] Variables CSS custom están definidas (colores, fuentes, espacios)
- [ ] Estilos son responsive (desktop-first, breakpoints mobile en 800px)
- [ ] Routing funciona: todas las pantallas navegan correctamente entre sí
- [ ] localStorage persiste usuario entre recargas de página
- [ ] No hay errores de console en dev

---

## Decisions Taken and Discarded

| Decisión | Razón |
|----------|-------|
| **Hash-based routing en lugar de Next.js App Router** | Los templates usan location.hash; mantener consistencia con el diseño provisto, simplifica estado de ruta portable |
| **Datos hardcodeados (GAMES array)** | MVP no requiere backend; facilita desarrollo sin dependencias externas |
| **localStorage para persistencia de usuario** | Simple, sin servidor, suficiente para MVP; sesión no sobrevive a borrar datos del navegador (aceptable) |
| **Leaderboards seedeados** | Datos reproducibles sin backend; función determinista basada en ID del juego |
| **Solo layout de GamePlayer** | Mecánica de juego es scope futuro; UI completa ahora prepara integración posterior |
| **Estilos en globals.css con CSS custom** | Variables reutilizables, tema fácil de cambiar, sin dependencia de librerías de utilidad adicionales |
| **Desktop-first responsive** | Desktop es la prioridad; mobile layout es adaptación con media queries |

---

## Identified Risks

- **Gestión de estado sin Context/Redux**: Si hay muchos re-renders, considerar pasar a Context API. Mitigación: Component props drilling es aceptable para 5 componentes.
- **Efectos visuales (tilt, animaciones) en mobile**: Touch events no triggean mousemove. Mitigación: Desactivar tilt en mobile (no es crítico).
- **Performance de grid con muchas cards**: Si GAMES > 50, grid puede ralentizar. Mitigación: Implementar virtualización después si es necesario.
- **localStorage lleno**: Si av_scores acumula demasiadas entradas. Mitigación: No es crítico para MVP (se puede limpiar).
