## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Usa Spec Driven Design

Basado en /spec y /spec-impl

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```
## Supabase

La autenticación usa Supabase Auth (email + contraseña) y la tabla `public.profiles` para el nombre de usuario. El esquema está versionado en `supabase/migrations/`.

Variables de entorno requeridas en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Ajuste manual en el dashboard de Supabase (no se puede versionar):

- **Authentication → Providers → Email → "Confirm email": desactivado** en desarrollo, para que el registro inicie sesión de inmediato.
- **Actívalo antes de producción.** Con la confirmación desactivada se pueden registrar cuentas con correos ajenos, y al activarla habrá que añadir la ruta `/auth/confirm`.
