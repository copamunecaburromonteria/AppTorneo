import { randomUUID, createHmac } from "crypto";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "cme_device_token";
const DURACION_SEGUNDOS = 60 * 60 * 24 * 365; // 1 año — un mismo dispositivo no vuelve a votar el mismo partido

/**
 * Antifraude del voto por QR (brief original, sección 20: "un voto por
 * dispositivo/navegador" + "control de IP cuando sea apropiado"):
 *  - `device_token`: cookie de larga duración, httpOnly — es lo que de
 *    verdad bloquea el doble voto (unique constraint en
 *    `mvp_votes`/`arbitraje_votes` sobre `match_id, device_token`).
 *  - `ip_hash`: hash HMAC de la IP, guardado junto al voto — no bloquea por
 *    sí solo (una red compartida en la cancha tendría la misma IP para
 *    varios aficionados), pero queda como señal para detectar patrones
 *    anormales más adelante (brief, sección 20) sin guardar la IP en
 *    texto plano.
 */
export async function obtenerOCrearDeviceToken(): Promise<string> {
  const store = await cookies();
  const existente = store.get(COOKIE_NAME)?.value;
  if (existente) return existente;

  const nuevo = randomUUID();
  store.set(COOKIE_NAME, nuevo, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
  return nuevo;
}

export async function hashIpActual(): Promise<string> {
  const secret = process.env.VOTE_HASH_SECRET;
  if (!secret) {
    throw new Error(
      "Falta configurar VOTE_HASH_SECRET en las variables de entorno del servidor."
    );
  }
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconocida";
  return createHmac("sha256", secret).update(ip).digest("hex");
}
