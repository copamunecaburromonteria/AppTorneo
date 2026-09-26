import { createHmac } from "crypto";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Límite de intentos fallidos para `/operador/login` (PIN de 4-6 dígitos,
 * sin correo ni Supabase Auth — ver `src/lib/operador/sesion.ts`). Se agregó
 * el 2026-09-26 al ponerle a este login un acceso público visible en el
 * home/header (antes solo se llegaba escribiendo la URL a mano, sin ningún
 * límite): sin esto, cualquiera que encuentre el botón puede sentarse a
 * probar PINs de 4 dígitos (10.000 combinaciones) sin ningún freno.
 *
 * Se identifica por IP (hasheada con HMAC, mismo patrón que `ip_hash` en
 * `src/lib/votacion/antifraude.ts`) en vez de por dispositivo/cookie: acá lo
 * que importa es frenar a un desconocido probando PINs al azar, no distinguir
 * operadores legítimos entre sí. Reutiliza `OPERATOR_SESSION_SECRET` (ya
 * obligatoria para este login) en vez de pedir una variable de entorno más.
 *
 * Umbral y duración del bloqueo son constantes de código a propósito (no una
 * fila de `torneo_config`): son parámetros de seguridad, no de negocio, y no
 * hace falta que Fernando los pueda tocar desde un panel.
 */
const UMBRAL_INTENTOS = 5;
export const DURACION_BLOQUEO_MINUTOS = 15;

function getSecret(): string {
  const secret = process.env.OPERATOR_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Falta configurar OPERATOR_SESSION_SECRET en las variables de entorno del servidor."
    );
  }
  return secret;
}

export async function hashIpOperador(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
  return createHmac("sha256", getSecret()).update(ip).digest("hex");
}

export type EstadoLimite =
  | { bloqueado: false }
  | { bloqueado: true; minutosRestantes: number };

/**
 * Se llama ANTES de comparar el PIN. Si la IP está bloqueada, ni siquiera se
 * revisan los operadores — evita además que un bloqueo activo se pueda
 * "resetear" probando de nuevo.
 */
export async function verificarLimiteIntentos(
  admin: SupabaseClient,
  ipHash: string
): Promise<EstadoLimite> {
  const { data } = await admin
    .from("operador_login_intentos")
    .select("bloqueado_hasta")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (!data?.bloqueado_hasta) return { bloqueado: false };

  const hasta = new Date(data.bloqueado_hasta).getTime();
  const restanteMs = hasta - Date.now();
  if (restanteMs <= 0) return { bloqueado: false };

  return { bloqueado: true, minutosRestantes: Math.ceil(restanteMs / 60000) };
}

/**
 * PIN incorrecto: suma un intento para esta IP. Al llegar al umbral, activa
 * el bloqueo y reinicia el contador (para que, cuando el bloqueo expire, la
 * IP tenga de nuevo el cupo completo de intentos en vez de quedar bloqueada
 * de por vida por un contador que nunca baja).
 */
export async function registrarIntentoFallido(
  admin: SupabaseClient,
  ipHash: string
): Promise<{ intentosRestantes: number }> {
  const { data } = await admin
    .from("operador_login_intentos")
    .select("intentos")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  const intentos = (data?.intentos ?? 0) + 1;

  if (intentos >= UMBRAL_INTENTOS) {
    const bloqueadoHasta = new Date(Date.now() + DURACION_BLOQUEO_MINUTOS * 60_000).toISOString();
    await admin.from("operador_login_intentos").upsert({
      ip_hash: ipHash,
      intentos: 0,
      bloqueado_hasta: bloqueadoHasta,
      ultimo_intento: new Date().toISOString(),
    });
    return { intentosRestantes: 0 };
  }

  await admin.from("operador_login_intentos").upsert({
    ip_hash: ipHash,
    intentos,
    bloqueado_hasta: null,
    ultimo_intento: new Date().toISOString(),
  });
  return { intentosRestantes: UMBRAL_INTENTOS - intentos };
}

/** PIN correcto: limpia cualquier historial de intentos fallidos de esta IP. */
export async function limpiarIntentos(admin: SupabaseClient, ipHash: string): Promise<void> {
  await admin.from("operador_login_intentos").delete().eq("ip_hash", ipHash);
}
