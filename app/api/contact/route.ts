import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

const lastRequestByIp = new Map<string, number>();

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [ip, timestamp] of lastRequestByIp) {
    if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
      lastRequestByIp.delete(ip);
    }
  }
}

const globalForCleanup = globalThis as unknown as {
  contactCleanupTimer?: ReturnType<typeof setInterval>;
};
if (!globalForCleanup.contactCleanupTimer) {
  const timer = setInterval(cleanupRateLimitMap, CLEANUP_INTERVAL_MS);
  timer.unref();
  globalForCleanup.contactCleanupTimer = timer;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}): string {
  return `<!DOCTYPE html>
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
            <div class="value">${escapeHtml(name)}</div>
          </div>
          <div class="field">
            <div class="label">Email:</div>
            <div class="value">${escapeHtml(email)}</div>
          </div>
          <div class="field">
            <div class="label">Mensaje:</div>
            <div class="value" style="white-space: pre-wrap;">${escapeHtml(message)}</div>
          </div>
        </div>
        <div class="footer">
          Enviado desde arcade-vault.gg/about
        </div>
      </div>
    </body>
  </html>`;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const lastRequest = lastRequestByIp.get(ip);
  if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_WINDOW_MS) {
    return NextResponse.json(
      { success: false, error: "Máx 1 mensaje cada 5 minutos" },
      { status: 429 }
    );
  }

  let body: { name?: string; email?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Solicitud inválida" },
      { status: 400 }
    );
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!name || !email || !message) {
    return NextResponse.json(
      { success: false, error: "Todos los campos son obligatorios" },
      { status: 400 }
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { success: false, error: "El email no es válido" },
      { status: 400 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "lf.guerrero.vertiz@gmail.com",
      subject: `Nuevo mensaje de contacto de ${name}`,
      html: buildEmailHtml({ name, email, message }),
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: "No se pudo enviar el mensaje" },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "No se pudo enviar el mensaje" },
      { status: 502 }
    );
  }

  lastRequestByIp.set(ip, Date.now());

  return NextResponse.json({ success: true, message: "Enviado" });
}
