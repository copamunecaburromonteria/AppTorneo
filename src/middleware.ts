import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PREVIEW_COOKIE = "cme_preview";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const STATIC_FILE_RE =
  /\.(png|jpe?g|gif|svg|webp|ico|css|js|mjs|json|xml|txt|woff2?|ttf|map)$/i;

/**
 * Consulta liviana (REST directo, sin el cliente SSR completo) de
 * `torneo_config.modo_construccion_activo` — el interruptor de la página
 * "en construcción" que Fernando prende/apaga desde /admin/construccion,
 * sin tocar variables de entorno ni redeploy (reemplaza el viejo
 * `MAINTENANCE_MODE` por variable de entorno, 2026-10-17). Con
 * `revalidate` corto para no pegarle a Supabase en cada request mientras
 * el modo está apagado (el caso normal).
 */
async function modoConstruccionActivo(): Promise<boolean> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/torneo_config?id=eq.1&select=modo_construccion_activo`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        next: { revalidate: 10 },
      }
    );
    if (!res.ok) return false;
    const filas = (await res.json()) as { modo_construccion_activo: boolean }[];
    return !!filas[0]?.modo_construccion_activo;
  } catch {
    // Si Supabase no responde, no tumbamos el sitio completo: se asume
    // apagado y se sirve el sitio real con normalidad.
    return false;
  }
}

/**
 * ¿La sesión de este visitante es de un admin? Se usa SOLO cuando el modo
 * construcción está activo, para dejar pasar a Fernando (o a cualquier
 * cuenta con `profiles.rol = 'admin'`) al sitio real mientras el público ve
 * `/en-construccion` — así puede seguir revisando/ajustando contenido en
 * producción sin necesidad de un link secreto. Cliente de solo lectura
 * (`setAll` vacío): esta verificación no debe reescribir cookies de sesión,
 * eso lo sigue haciendo el bloque de /admin, /portal, /lider-arbitros más
 * abajo cuando corresponde.
 */
async function esSesionAdmin(request: NextRequest): Promise<boolean> {
  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // intencionalmente vacío — ver docstring de la función.
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    return profile?.rol === "admin";
  } catch {
    return false;
  }
}

/**
 * Sitio "en construcción" para el público. Mientras
 * `torneo_config.modo_construccion_activo` sea `true`, toda ruta pública
 * (todo menos /admin, /portal, /operador, /lider-arbitros, /api y archivos
 * estáticos) se sirve como /en-construccion.
 *
 * Dos formas de seguir viendo el sitio real mientras tanto:
 *  1. Sesión de admin iniciada (`esSesionAdmin`) — la forma normal para
 *     Fernando, 2026-10-17.
 *  2. Link secreto de vista previa, histórico (visitar una vez
 *     /api/preview?key=PREVIEW_BYPASS_SECRET) — se deja como respaldo por
 *     si alguna vez hace falta dar acceso puntual sin crear cuenta.
 */
async function aplicarModoConstruccion(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  const rutaExcluida =
    pathname === "/en-construccion" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/operador") ||
    pathname.startsWith("/lider-arbitros") ||
    pathname.startsWith("/api") ||
    STATIC_FILE_RE.test(pathname);

  if (rutaExcluida) return null;

  const activo = await modoConstruccionActivo();
  if (!activo) return null;

  const secreto = process.env.PREVIEW_BYPASS_SECRET;
  const cookiePreview = request.cookies.get(PREVIEW_COOKIE)?.value;
  if (secreto && cookiePreview === secreto) return null;

  if (await esSesionAdmin(request)) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/en-construccion";
  return NextResponse.rewrite(url);
}

/**
 * Protege /admin, /portal y /lider-arbitros: exige sesión iniciada. La
 * verificación de rol (admin vs equipo vs lider_arbitros, y que el equipo
 * tenga team_id) se hace en el layout de cada sección, que sí puede
 * consultar la tabla profiles.
 *
 * /operador tiene su propio esquema de sesión (cookie firmada, sin Supabase
 * Auth) validado en cada Server Action/página de esa sección — no pasa por
 * este middleware.
 */
export async function middleware(request: NextRequest) {
  const gate = await aplicarModoConstruccion(request);
  if (gate) return gate;

  const { pathname } = request.nextUrl;
  const seccion = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/portal")
      ? "portal"
      : pathname.startsWith("/lider-arbitros")
        ? "lider-arbitros"
        : null;

  let response = NextResponse.next({ request });

  if (!seccion) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // No quitar este await: refresca el token de sesión en las cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = pathname === `/${seccion}/login`;

  if (!isLoginRoute && !user) {
    const url = request.nextUrl.clone();
    const destinoOriginal = pathname + request.nextUrl.search;
    url.pathname = `/${seccion}/login`;
    url.search = "";
    url.searchParams.set("next", destinoOriginal);
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${seccion}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
