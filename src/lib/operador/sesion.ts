import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Sesión del operador de cancha — NO usa Supabase Auth. Los operadores
 * entran con un PIN (ver `operadores.pin_hash`) y quedan identificados por
 * una cookie firmada a mano (HMAC-SHA256), verificada en cada Server Action
 * de /operador. Las escrituras a `matches`/`match_events` se hacen con el
 * cliente de service role (ver `src/lib/supabase/admin.ts`) — los
 * operadores no pasan por RLS de Supabase Auth (ver `esquema-base-datos.md`).
 */

const COOKIE_NAME = "operador_sesion";
const DURACION_MS = 12 * 60 * 60 * 1000; // 12 horas — dura una jornada completa

function getSecret(): string {
  const secret = process.env.OPERATOR_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Falta configurar OPERATOR_SESSION_SECRET en las variables de entorno del servidor."
    );
  }
  return secret;
}

function firmar(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export type SesionOperador = { operadorId: string; nombre: string };

export function crearCookieSesion(
  operadorId: string,
  nombre: string
): { name: string; value: string; options: Record<string, unknown> } {
  const expira = Date.now() + DURACION_MS;
  const nombreCodificado = Buffer.from(nombre, "utf8").toString("base64url");
  const payload = `${operadorId}.${nombreCodificado}.${expira}`;
  const firma = firmar(payload);
  return {
    name: COOKIE_NAME,
    value: `${payload}.${firma}`,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
      maxAge: DURACION_MS / 1000,
    },
  };
}

export function verificarCookieSesion(valor: string | undefined): SesionOperador | null {
  if (!valor) return null;
  const partes = valor.split(".");
  if (partes.length !== 4) return null;
  const [operadorId, nombreCodificado, expiraStr, firma] = partes;

  const payload = `${operadorId}.${nombreCodificado}.${expiraStr}`;
  const firmaEsperada = firmar(payload);
  const a = Buffer.from(firma, "hex");
  const b = Buffer.from(firmaEsperada, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expira = Number(expiraStr);
  if (!Number.isFinite(expira) || Date.now() > expira) return null;

  try {
    const nombre = Buffer.from(nombreCodificado, "base64url").toString("utf8");
    return { operadorId, nombre };
  } catch {
    return null;
  }
}

/** Lee y valida la cookie de sesión del operador desde el request actual. */
export async function obtenerSesionOperador(): Promise<SesionOperador | null> {
  const store = await cookies();
  return verificarCookieSesion(store.get(COOKIE_NAME)?.value);
}

export async function establecerCookieSesion(operadorId: string, nombre: string) {
  const cookie = crearCookieSesion(operadorId, nombre);
  const store = await cookies();
  store.set(cookie.name, cookie.value, cookie.options);
}

export async function borrarCookieSesion() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// --- Hash de PIN (scrypt con sal aleatoria, sin dependencias externas) ---

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verificarPin(pin: string, hashAlmacenado: string): boolean {
  const [salt, hashGuardado] = hashAlmacenado.split(":");
  if (!salt || !hashGuardado) return false;
  const hashIntento = scryptSync(pin, salt, 32).toString("hex");
  const a = Buffer.from(hashGuardado, "hex");
  const b = Buffer.from(hashIntento, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
