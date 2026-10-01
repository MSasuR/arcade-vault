---
name: spec-impl-game
description: Implementa una spec de juego aprobada con el mismo flujo que /spec-impl (validación de estado, rama spec-NN-slug, pasos con pausa) y, al terminar, lanza en secuencia los agentes skin-designer y mobile-porter sobre el juego implementado.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, Agent, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(git stash:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — Implementar una spec de juego y pulirla

## Contexto de sesión

Estado actual del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs disponibles:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

Configuración de creación de ramas:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, no config file)"`

---

## Qué hace este comando

`/spec-impl-game` = **`/spec-impl` completo** + **fase 5**: al terminar la implementación lanza dos subagentes **uno después del otro**:

1. `skin-designer`: los 3 skins del canvas (`classic`, `neon`, `retro`) del juego nuevo.
2. `mobile-porter`: el mando táctil del juego y la revisión móvil de sus rutas.

Responde al usuario en el idioma en que te escribe (en este repo, español).

---

## Fases 1 a 4: delegar en `/spec-impl`

1. Lee **`.claude/skills/spec-impl/SKILL.md`** entero, que es la fuente de verdad.
2. Sigue sus **fases 1 a 4 al pie de la letra**, con estos dos ajustes:
   - el argumento recibido es: `$ARGUMENTS`;
   - usa el **contexto de sesión de arriba** en lugar de los bloques `` !`…` `` de ese archivo, que al leerlo no se ejecutan.
3. Heredas todas sus reglas:
   - solo specs cuyo estado signifique `Approved`;
   - si el árbol no está limpio, te detienes y preguntas, sin stash ni commit por tu cuenta;
   - rama `spec-NN-slug` según `AutoCreateBranch`;
   - resumen de la spec y confirmación antes del paso 1;
   - pausa tras cada paso;
   - ante una ambigüedad, te detienes con opciones;
   - nada fuera de alcance;
   - **nunca haces commits**.
4. Si `/spec-impl` se detiene (spec no aprobada, no encontrada, árbol sucio sin decisión del usuario, el usuario no confirma), **este comando también se detiene. No lanzas ningún agente.**
5. Al terminar el último paso **no** cierres con el mensaje final de `/spec-impl`: pasa a la fase 5. Ese mensaje se muestra al final de la fase 5.

---

## Fase 5: agentes en secuencia

Solo si **todos** los pasos del Implementation Plan quedaron implementados.

### 5.1 Identificar el juego

- Busca el id o los ids que la implementación añadió a `PLAYABLE`: `git diff app/components/games/registry.ts` y las carpetas nuevas en `git status --short -- app/components/games/`.
- Si no detectas ninguno (p. ej. una spec solo de catálogo o de portada), pregunta al usuario con `AskUserQuestion` si se lanzan los agentes y sobre qué id de `PLAYABLE`. **Sin un id, no lances los agentes**: termina con el mensaje final de `/spec-impl`.

### 5.2 Verificación previa

- `npx tsc --noEmit` y `npx eslint app lib`.
- Si fallan, avisa al usuario y repara dentro del alcance de la spec antes de seguir. No lances agentes sobre un código que no compila.

### 5.3 Primer agente: `skin-designer`

Lánzalo con la herramienta `Agent` (`subagent_type: "skin-designer"`), **en primer plano** (espera su resultado; nada de segundo plano). El prompt debe incluir:

- la spec implementada (ruta y objetivo), la rama activa, el id del juego y la salida de `git status --short`;
- **modo**: «juego nuevo (caso 4)». Audita el juego y **implementa sus 3 skins** con el contrato ya aprobado (`<id>/skins.ts`, `options.skin`, `setSkin`, alta en `SKINNABLE`). Si el juego necesita cambiar el contrato común, escribe una spec en `Draft` y se detiene;
- **excepción a su arranque**: el árbol de trabajo sucio es la implementación en curso de esa spec en esta rama, y es lo esperado. Debe continuar **sin stash ni commit** y sin deshacer ni reescribir lo implementado, salvo lo que exijan los skins;
- no hace commits ni cambia el estado de ninguna spec.

Cuando termine, muestra al usuario un **resumen corto**: la matriz del juego, los archivos tocados, la spec creada (si la hay) y las capturas.

### 5.4 Segundo agente: `mobile-porter`

Lánzalo **solo cuando `skin-designer` haya terminado**, con `Agent` (`subagent_type: "mobile-porter"`), en primer plano. El prompt debe incluir:

- el mismo contexto que en 5.3, más el resumen de lo que hizo `skin-designer`;
- **modo**: «juego nuevo (caso 4)». Añade la entrada del juego en `TOUCH_LAYOUTS` con el contrato de la spec 11, verifica su mando y audita `/player/<id>` y `/games/<id>` en los viewports móviles;
- el resto de rutas y la PWA **solo se auditan**. Si un fallo pide código fuera del caso 4, escribe la spec en `Draft` y se detiene;
- la misma excepción del árbol sucio y la misma regla de no hacer commits.

Lanza `mobile-porter` aunque `skin-designer` haya terminado con una spec en `Draft`: son áreas independientes.

**Excepción:** si tras `skin-designer` fallan `npx tsc --noEmit` o `npx eslint app lib`, no lo lances. Informa al usuario y pregúntale cómo seguir.

### 5.5 Verificación final

Los agentes también editan código. Ejecuta `npx tsc --noEmit`, `npx eslint app lib` y `npm run build`, e informa del resultado tal cual, con la salida si algo falla.

### 5.6 Cierre

Muestra:

1. La implementación de la spec: pasos completados.
2. El resultado de `skin-designer` y el de `mobile-porter`: archivos tocados, specs creadas en `Draft` con su ruta, y capturas.
3. El resultado de la verificación final.
4. El mensaje final de `/spec-impl`:

```
✅ All steps of the plan are implemented.

Next step: verify the spec's acceptance criteria one by one.
If they all pass, update the spec's state to "Implemented" (or the equivalent
in your repo's language) and make the final commit before merging this branch.
```

---

## Reglas duras

- Los agentes van **uno después del otro**: primero `skin-designer` y después `mobile-porter`. Nunca en paralelo ni en segundo plano.
- **Nunca hagas commits** ni cambies el estado de ninguna spec (tampoco los agentes).
- No modifiques `.claude/skills/spec-impl/`: es una skill de terceros fijada en `skills-lock.json`. Este comando la lee en cada ejecución.
- Si el usuario pide algo fuera del alcance de la spec, recuérdalo y propón anotarlo para otra spec, igual que `/spec-impl`.
