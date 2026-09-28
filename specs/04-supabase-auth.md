# Supabase: Cliente y Autenticación Real

**State:** Approved  
**Depends on:** SPEC 01 (Arcade Vault MVP)  
**Date:** 2026-09-28  
**Objective:** Integrar Supabase en Next.js con clientes SSR y reemplazar la autenticación falsa de localStorage por Supabase Auth (email + contraseña) con una tabla `profiles` para el nombre de usuario.

---

## Scope

**Está incluido:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr`
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`
- Clientes Supabase: browser (`lib/supabase/client.ts`) y server (`lib/supabase/server.ts`)
- `proxy.ts` en la raíz que solo refresca la sesión de Supabase en cada request (no bloquea ninguna ruta)
- Migración SQL versionada en `supabase/migrations/` que crea `public.profiles`, su trigger de alta y sus políticas RLS
- Tipos TypeScript generados de la BD en `lib/supabase/database.types.ts`
- `Auth.tsx`: registro (usuario + email + contraseña) e inicio de sesión (email + contraseña) contra Supabase Auth, con estados de carga y error
- Hook `useUser()` compartido que expone `{ name }` a partir de la sesión + `profiles.username`, reemplazando las lecturas de `av_user` en `AppLayout`, `GamePlayer` y `HallOfFame`
- Cerrar sesión con `supabase.auth.signOut()`
- Modo invitado: se mantiene; "JUGAR COMO INVITADO" cierra cualquier sesión y navega a `/games`
- Limpieza de la clave legacy `av_user` de localStorage
- Confirmación de email desactivada en el proyecto Supabase (paso manual en el dashboard)

**NO está incluido:**

- Tabla `scores` ni migración de `av_scores`; las puntuaciones siguen en localStorage (otra spec)
- Persistir mensajes del formulario de contacto (siguen solo por Resend, SPEC 03)
- OAuth con Google/GitHub (los botones siguen siendo decorativos)
- Magic link y recuperación de contraseña
- Confirmación de email y ruta `/auth/confirm`
- Login con nombre de usuario (solo email)
- Protección de rutas (ninguna ruta redirige a `/auth`)
- Edición de perfil, avatar o cambio de username
- Cambios visuales en la UI más allá de mostrar errores y estado de carga en `Auth.tsx`

---

## Data Model

Nueva tabla `public.profiles` (proyecto Supabase `xudaktpzdqfphuaegjmo`):

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[A-Z0-9_]{3,10}$'),
  created_at timestamptz not null default now()
);
```

- `username` se guarda en mayúsculas, 3–10 caracteres `A-Z 0-9 _` (mantiene el límite de 10 caracteres del MVP).
- Trigger `on_auth_user_created` (`after insert on auth.users`) ejecuta `public.handle_new_user()` (`security definer`, `set search_path = ''`), que inserta la fila leyendo `raw_user_meta_data->>'username'`.
- RLS activado:
  - `select`: público (`anon` y `authenticated`), porque los rankings futuros mostrarán usernames.
  - `update`: solo el dueño (`auth.uid() = id`).
  - `insert` / `delete`: sin política; el alta ocurre únicamente vía trigger.

Estructura consumida por la UI (sin cambios respecto al MVP):

```typescript
interface User {
  name: string; // profiles.username
}
```

Metadata enviada al registrarse:

```typescript
supabase.auth.signUp({
  email,
  password,
  options: { data: { username } }, // username ya normalizado a mayúsculas
});
```

Variables de entorno (`.env.local`, ignorado por git):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

---

## Implementation Plan

1. **Instalar dependencias y variables de entorno**
   - `npm install @supabase/supabase-js @supabase/ssr`
   - Obtener URL y publishable key con las herramientas MCP `get_project_url` y `get_publishable_keys`
   - Agregarlas a `.env.local` con los nombres del Data Model
   - El sitio sigue funcionando igual (nada las consume aún)

2. **Migración de `profiles`**
   - Crear `supabase/migrations/<timestamp>_create_profiles.sql` con tabla, función `handle_new_user`, trigger y políticas RLS
   - Aplicarla con la herramienta MCP `apply_migration`
   - Ejecutar `get_advisors` (security) y resolver cualquier aviso de esta migración
   - Generar tipos con `generate_typescript_types` y guardarlos en `lib/supabase/database.types.ts`

3. **Clientes Supabase y Proxy**
   - Consultar la guía de Proxy en `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` antes de escribir `proxy.ts`
   - `lib/supabase/client.ts`: `createBrowserClient<Database>` con las variables públicas
   - `lib/supabase/server.ts`: `createServerClient<Database>` con el store de cookies de Next
   - `lib/supabase/proxy.ts` + `proxy.ts` raíz: refrescan la sesión con `supabase.auth.getUser()` y reenvían las cookies actualizadas; el `matcher` excluye estáticos (`_next/static`, `_next/image`, `favicon.ico`, imágenes)
   - Verificación manual: `npm run dev` carga `/`, `/games` y `/about` sin errores

4. **Hook `useUser()`**
   - Crear `app/components/useUser.ts`: obtiene la sesión con `getUser()`, consulta `profiles.username` por `id`, se suscribe a `onAuthStateChange`, y devuelve `{ user: User | null, loading: boolean, signOut }`
   - Aún no se usa; el sistema funciona igual

5. **Conectar la UI existente al hook**
   - `AppLayout.tsx`: reemplazar `av_user` por `useUser()`; `handleSignOut` llama `signOut()`; eliminar `av_user` de localStorage al montar
   - `GamePlayer.tsx` y `HallOfFame.tsx`: reemplazar la lectura de `av_user` por `useUser()`; `GamePlayer` sigue guardando en `av_scores` con `user.name`
   - Sin sesión, el comportamiento es el de invitado del MVP

6. **Auth real en `Auth.tsx`**
   - Formulario con `noValidate`; validar en cliente: username `^[A-Za-z0-9_]{3,10}$` (solo registro), email con `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, contraseña de mínimo 6 caracteres
   - Registro: normalizar username a mayúsculas, comprobar disponibilidad con `select` a `profiles`, llamar `signUp`, y navegar a `/games` si devuelve sesión
   - Login: `signInWithPassword({ email, password })` y navegar a `/games`
   - Estados: botón deshabilitado con texto "CONECTANDO..." durante la petición; mensaje de error visible bajo el formulario
   - Mapeo de errores: credenciales inválidas → "CORREO O CONTRASEÑA INCORRECTOS"; username tomado → "ESE USUARIO YA EXISTE"; email ya registrado → "ESE CORREO YA ESTÁ REGISTRADO"; otros → "ERROR DE CONEXIÓN. INTENTA DE NUEVO"
   - "JUGAR COMO INVITADO": `signOut()` y `router.push("/games")`

7. **Configuración manual del proyecto Supabase**
   - En el dashboard (Authentication → Providers → Email) desactivar "Confirm email"
   - Documentar en `README.md` las variables de entorno requeridas y este ajuste (activarlo antes de producción)

---

## Acceptance Criteria

- [ ] `npm run build` termina sin errores de TypeScript ni de ESLint (`npm run lint`)
- [ ] `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, y `git status` no muestra `.env.local`
- [ ] La tabla `public.profiles` existe con RLS activado (`list_tables` lo confirma)
- [ ] `get_advisors` (security) no reporta avisos nuevos originados por `profiles` ni por `handle_new_user`
- [ ] Existe `supabase/migrations/*_create_profiles.sql` versionado en el repo
- [ ] Existen `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts`, `proxy.ts` y `lib/supabase/database.types.ts`
- [ ] Registrar un usuario nuevo crea una fila en `auth.users` y otra en `public.profiles` con `username` en mayúsculas
- [ ] Tras registrarse, el usuario queda con sesión iniciada y llega a `/games` con su username visible en el Nav
- [ ] Recargar la página mantiene la sesión y el username en el Nav
- [ ] Cerrar sesión desde el Nav elimina la sesión y el Nav vuelve al estado de invitado
- [ ] Iniciar sesión con email y contraseña correctos navega a `/games` y muestra el username
- [ ] Iniciar sesión con contraseña incorrecta muestra "CORREO O CONTRASEÑA INCORRECTOS" y no navega
- [ ] Registrar un username ya existente (sin importar mayúsculas/minúsculas) muestra "ESE USUARIO YA EXISTE" y no crea usuario
- [ ] Registrar un email ya existente muestra "ESE CORREO YA ESTÁ REGISTRADO"
- [ ] Un username de menos de 3 o más de 10 caracteres, un email sin formato válido o una contraseña de menos de 6 caracteres bloquea el envío con mensaje visible
- [ ] El botón de envío queda deshabilitado con "CONECTANDO..." mientras la petición está en curso
- [ ] "JUGAR COMO INVITADO" cierra cualquier sesión activa y navega a `/games`
- [ ] Un usuario con sesión que termina una partida guarda su puntuación en `av_scores` con su username
- [ ] Un usuario anónimo puede consultar `profiles` (select) pero no insertar, actualizar ni borrar filas ajenas
- [ ] La clave `av_user` ya no existe en localStorage tras cargar la app
- [ ] `/`, `/games`, `/games/[id]`, `/salon`, `/about` cargan sin sesión y sin errores en consola
- [ ] El formulario de contacto de `/about` sigue enviando por Resend

---

## Decisions Taken and Discarded

| Decisión                                                      | Razón                                                                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Alcance: cliente + auth (sin scores)**                      | Una feature por spec; `scores` implica modelo, RLS de ranking y migración de `av_scores`, que merece su propia spec      |
| **Email + contraseña como único método**                      | Encaja con el formulario actual; OAuth requiere credenciales externas y magic link depende del SMTP limitado de Supabase |
| **Tabla `profiles` con `username` único**                     | Consultable y único, necesario para rankings; `user_metadata` no permite unicidad ni consultas                           |
| **Username en mayúsculas con check regex**                    | Preserva el comportamiento del MVP (`toUpperCase().slice(0, 10)`) y evita duplicados por capitalización                  |
| **Alta de perfil vía trigger `security definer`**             | Atómico con el registro y no requiere política de `insert` abierta al cliente                                            |
| **`select` público en `profiles`**                            | Los rankings futuros mostrarán usernames a anónimos; el username no es dato sensible                                     |
| **Login solo con email**                                      | Supabase lo soporta nativo; login por username exigiría RPC o Edge Function                                              |
| **Confirmación de email desactivada**                         | Evita depender del SMTP por defecto (límites bajos) durante desarrollo; se activa antes de producción                    |
| **`proxy.ts` solo refresca sesión**                           | El modo invitado sigue permitido, así que no hay rutas privadas que proteger todavía                                     |
| **Invitado y `av_scores` en localStorage se mantienen**       | Evita cambiar el flujo del MVP; los scores migran en la spec de puntuaciones                                             |
| **Hook `useUser()` compartido**                               | `AppLayout`, `GamePlayer` y `HallOfFame` duplican hoy la lectura de `av_user`; un único punto evita inconsistencias      |
| **Migraciones versionadas en `supabase/migrations/`**         | Reproducibilidad del esquema; se aplican vía MCP y el `.sql` queda en el repo                                            |
| **`@supabase/ssr` en lugar de `supabase-js` solo**            | Maneja sesión por cookies, necesaria para leer al usuario en servidor y en `proxy.ts`                                    |
| **Descartado: mantener auth falsa con Supabase solo como BD** | No aporta seguridad real ni permite RLS por usuario                                                                      |

---

## Identified Risks

- **Mapeo de errores frágil**: Supabase no siempre devuelve códigos estables para "email ya registrado" o fallo del trigger. Mitigación: pre-check de username con `select` y mapeo por mensaje/código con fallback genérico.
- **Trigger que falla rompe el registro**: si `username` llega inválido, `auth.signUp` devuelve "Database error saving new user". Mitigación: validar el mismo regex en cliente antes de llamar a `signUp`.
- **Carrera en username duplicado**: dos registros simultáneos pasan el pre-check. Mitigación: la restricción `unique` de la BD es la garantía final; el error se mapea a "ESE USUARIO YA EXISTE".
- **Flash de estado de invitado al cargar**: `useUser()` es asíncrono. Mitigación: `AppLayout` ya no renderiza hasta montar; usar `loading` del hook para no mostrar Nav de invitado un instante.
- **Confirmación de email desactivada en producción**: permitiría registros con correos ajenos. Mitigación: documentado en `README.md` como paso previo a producción.
- **Cambios en el API de Next 16 (Proxy)**: la convención difiere de versiones anteriores. Mitigación: leer la guía local de Proxy en `node_modules/next/dist/docs/` antes del paso 3.
- **Configuración manual olvidada**: el ajuste del dashboard no se puede versionar. Mitigación: es el paso 7 explícito del plan y un criterio verificable (registro inicia sesión sin confirmar correo).

---

## What is **not** in this spec

- Tabla `scores`, rankings globales o migración de `av_scores` (otra spec).
- Persistencia de mensajes de contacto.
- OAuth (Google/GitHub), magic link y recuperación de contraseña.
- Protección de rutas y eliminación del modo invitado.
- Edición de perfil y avatar.

Cada uno de estos, si se aborda, va en su propia spec.
