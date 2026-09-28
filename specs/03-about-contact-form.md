# About Page y Formulario de Contacto

**State:** Implemented  
**Depends on:** SPEC 02 (Home Landing Page)  
**Date:** 2026-09-28  
**Objective:** Implementar la página `/about` con sección de misión y formulario de contacto que envía emails reales a través de Resend.

---

## Scope

**Está incluido:**
- Página About en ruta `/about`
- Sección About Hero: eyebrow, título, misión statement, 3 highlight cards (corazón, navegador, planta) con iconos pixel
- Divider animado con pixels parpadeantes
- Sección Contact: intro de contacto con tips LED, formulario con campos nombre/email/mensaje
- Envío de email real a `team@arcade-vault.gg` via API Resend
- Validación del formulario (campos no vacíos, email válido)
- Rate limiting: máx 1 mensaje por IP cada 5 minutos
- Estado de éxito: pantalla terminal con mensaje personalizado (nombre del usuario)
- Estado de error: mensaje de error visible en el formulario
- Link en navbar hacia `/about`
- Animaciones reveal on scroll (reutilizando `useReveal()` hook del MVP)

**NO está incluido:**
- Persistencia de mensajes en BD (solo envío por email)
- Confirmación de email al usuario (solo notificación al team)
- Sistema de tickets o gestión de soporte
- Campo "Asunto" en el formulario
- Modificación de otras páginas además de navbar

---

## Data Model

No se introduce nuevo modelo de datos persistente. 

Data específica de About (hardcodeada en componente):
```typescript
// Highlight items
Highlights: [
  { icon: "HEART", title: "HECHO CON ❤️ PARA JUGADORES", color: "magenta" },
  { icon: "BROWSER", title: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", color: "cyan" },
  { icon: "PLANT", title: "PROYECTO EN CONSTANTE CRECIMIENTO", color: "green" }
]

// Contact tips
ContactTips: [
  { led: "green", text: "RESPUESTA EN 24-48H" },
  { led: "yellow", text: "SUGERENCIAS BIENVENIDAS" },
  { led: "magenta", text: "SIN SPAM, JAMÁS" }
]
```

Estructura de email (data en tránsito, no persiste):
```typescript
interface ContactMessage {
  name: string
  email: string
  message: string
  timestamp: Date
  ipAddress?: string
}
```

---

## Implementation Plan

1. **Instalar y configurar Resend**
   - `npm install resend`
   - Crear variable de entorno `RESEND_API_KEY` en `.env.local` (el usuario lo proporciona)
   - Verificar que la key se carga correctamente

2. **Crear API route para envío de emails**
   - Crear `app/api/contact/route.ts` con método POST
   - Validar campos: nombre, email, mensaje (no vacíos)
   - Validar email con regex simple: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Implementar rate limiting basado en IP: almacenar timestamps en memoria simple (Map con cleanup cada 10 min)
   - Máx 1 mensaje por IP cada 5 minutos
   - Construir email HTML usando template simple (ver sección de template abajo)
   - Enviar email via `resend.emails.send()` con:
     - From: `onboarding@resend.dev` *(el usuario no tiene el dominio `arcade-vault.gg` verificado en Resend; `onboarding@resend.dev` es el remitente de pruebas de Resend que no requiere verificación de dominio)*
     - To: `lf.guerrero.vertiz@gmail.com` *(email de la cuenta de Resend del usuario, en lugar de `team@arcade-vault.gg` que no existe sin el dominio propio)*
     - Subject: `Nuevo mensaje de contacto de {name}`
     - HTML: template renderizado
   - Responder con `{ success: true, message: "Enviado" }` o error apropiado
   - Manejar errores: Resend API errors, validación fallida, rate limit

3. **Crear componentes de About page**
   - `app/components/about/AboutHero.tsx` — kicker, título, misión, highlight row
   - `app/components/about/AboutDivider.tsx` — líneas + pixels animados
   - `app/components/about/ContactForm.tsx` — formulario con estado (form data, loading, sent, error)
   - `app/components/about/HighlightIcon.tsx` — SVG icons (HEART, BROWSER, PLANT)

4. **Implementar lógica de formulario en ContactForm**
   - Estado: `{ name, email, msg, loading, sent, error, shake }`
   - `onSubmit`: validar, mostrar shake si hay error, hacer POST a `/api/contact`
   - Loading: deshabilitar botón, mostrar spinner o cambiar texto
   - Success: mostrar pantalla terminal con nombre del usuario (reutilizar style del template)
   - Error: mostrar mensaje de error rojo bajo el formulario, permitir reintentar
   - Rate limit: si 429, mostrar "Máx 1 mensaje cada 5 minutos"

5. **Crear ruta About en `app/about/page.tsx`**
   - Importar componentes AboutHero, AboutDivider, ContactForm
   - Aplicar clase `.reveal` a secciones para trigger IntersectionObserver
   - Renderizar estructura completa

6. **Actualizar navegación**
   - En `app/components/nav.tsx` (o donde esté nav), agregar link "ABOUT" → `/about`
   - Aplicar estado active cuando ruta es `/about`
   - Mantener responsive

7. **Adaptar estilos**
   - Verificar que `.about`, `.about-hero`, `.about-contact`, `.contact-form`, `.terminal-success` existan en `app/globals.css`
   - Si faltan, reutilizar del template `styles.css`
   - No crear stylesheet nuevo; mantener variables CSS existentes

8. **Testing e integración**
   - Verificar que ruta `/about` renderiza página completo
   - Verificar que link en navbar apunta a `/about` y se marca como active
   - Verificar validación: formulario no se envía si hay campos vacíos, shake animation
   - Verificar email válido: rechaza emails sin @ o dominio
   - Verificar rate limiting: 2º envío en <5min muestra error 429
   - Verificar éxito: email se envía, pantalla terminal muestra "GRACIAS, {NAME}"
   - Verificar error: si Resend falla (mock offline), muestra mensaje de error
   - Probar en mobile (responsive)
   - No hay errores de console

---

## Acceptance Criteria

- [ ] Ruta `/about` renderiza página completa con hero, divider, y contact section
- [ ] AboutHero renderiza eyebrow "ACERCA DE", título gradient cyan/white, misión statement en 2 líneas
- [ ] Highlight row renderiza 3 cards con iconos pixel (corazón magenta, navegador cyan, planta verde), staggered animation (80ms delays)
- [ ] AboutDivider renderiza líneas + 24 pixels parpadeantes con colores aleatorios (cyan/magenta/yellow)
- [ ] ContactForm renderiza campos: nombre, email, mensaje con labels
- [ ] Validación: formulario no envía si campos vacíos → shake animation
- [ ] Validación: rechaza emails sin formato válido (sin @, sin dominio)
- [ ] Botón ENVIAR deshabilitado durante loading, muestra estado (spinner o texto)
- [x] Email enviado a `lf.guerrero.vertiz@gmail.com` con remitente `onboarding@resend.dev` via Resend *(ver nota en Implementation Plan sobre dominio sin verificar)*
- [ ] Success state: pantalla terminal muestra "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {NAME.toUpperCase()}."
- [ ] Botón "ENVIAR OTRO MENSAJE" reinicia formulario a estado inicial
- [ ] Error state: mensaje de error visible bajo el formulario, permite reintentar
- [ ] Rate limiting: 2º envío en <5min desde misma IP devuelve 429, muestra "Máx 1 mensaje cada 5 minutos"
- [ ] useReveal() hook anima AboutDivider y ContactForm con clase "in" al scrollear
- [ ] Navbar tiene link "ABOUT" que navega a `/about` y se marca activo en esa ruta
- [ ] Responsive: en mobile <800px, contact-grid es 1 columna, highlight-row es 1-2 columnas
- [ ] No hay errores de console, estilos se aplican, animaciones fluidas

---

## Email Template HTML

Plantilla simple que Resend renderizará:

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: "Courier New", monospace; background: #0a0a0f; color: #e6e9ff; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; border: 1px solid #00f5ff; padding: 20px; background: #15151f; }
      .header { text-align: center; border-bottom: 1px solid #ff006e; padding-bottom: 16px; margin-bottom: 20px; }
      .header h1 { color: #00f5ff; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.1em; }
      .content { line-height: 1.6; margin-bottom: 20px; }
      .field { margin-bottom: 16px; }
      .label { color: #8a8fb5; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
      .value { color: #e6e9ff; margin-top: 4px; font-size: 14px; }
      .footer { text-align: center; color: #4a4f70; font-size: 12px; border-top: 1px dashed #00f5ff; padding-top: 16px; margin-top: 24px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>◆ Nuevo Mensaje de Contacto ◆</h1>
      </div>
      <div class="content">
        <div class="field">
          <div class="label">Nombre:</div>
          <div class="value">{{name}}</div>
        </div>
        <div class="field">
          <div class="label">Email:</div>
          <div class="value">{{email}}</div>
        </div>
        <div class="field">
          <div class="label">Mensaje:</div>
          <div class="value" style="white-space: pre-wrap;">{{message}}</div>
        </div>
      </div>
      <div class="footer">
        Enviado desde arcade-vault.gg/about
      </div>
    </div>
  </body>
</html>
```

---

## Decisions Taken and Discarded

| Decisión | Razón |
|----------|-------|
| **Resend para email** | Servicio confiable, fácil integración, buena documentación |
| **API route server-side en Next.js** | Seguro (API key nunca se expone al cliente), manejo de errores centralizado, rate limiting en server |
| **Rate limiting simple en memoria** | MVP: suficiente sin BD; Map con cleanup automático es simple y efectivo |
| **Sin confirmación al usuario** | MVP: simplifica flujo; notificación al team es suficiente |
| **Email HTML pixel-arcade style** | Mantiene cohesión visual con el sitio; elite arcade vibe |
| **Max 1 mensaje por 5 min por IP** | Balance: previene spam sin ser restrictivo para usuarios legítimos |
| **Ruta `/about` en lugar de `/about-us`** | Más corta, común, alineada con convención web |
| **Link en navbar agregado** | Mejora discoverabilidad; navegación de sitio más completa |

---

## Identified Risks

- **Resend API key expuesta**: Mitigación: guardar solo en `.env.local`, nunca commitear, añadir a `.gitignore`
- **Spam masivo**: Mitigación: rate limiting por IP; si escala, agregar CAPTCHA después (scope futuro)
- **Email bouncing**: Si `team@arcade-vault.gg` no existe o rechaza, Resend lo reportará; se maneja en error handler
- **DNS/SPF issues**: Si Resend no está verificado, emails pueden ir a spam. Requiere setup de dominio en Resend console (paso manual, no código)
- **Rate limit falso positivo**: IPs compartidas (proxy corporativo, VPN) pueden ser limitadas juntas. Mitigación: si es problema, agregar fingerprint del cliente (ua + ip combo)
