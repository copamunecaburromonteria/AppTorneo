import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PREVIEW_COOKIE = "cme_preview";

const STATIC_FILE_RE =
  /\.(png|jpe?g|gif|svg|webp|ico|css|js|mjs|json|xml|txt|woff2?|ttf|map)$/i;

/**
 * Sitio "en construcción" para el público. Mientras la variable de entorno
 * MAINTENANCE_MODE sea "true", toda ruta pública (todo menos /admin,
 * /portal, /operador, /lider-arbitros, /api y archivos estáticos) se sirve
 * como /en-construccion.
 *
 * Quien tenga el enlace de vista previa (visitar una vez
 * /api/preview?key=PREVIEW_BYPASS_SECRET) recibe una cookie y ve el sitio
 * real con normalidad — así Fernando puede seguir revisando los cambios en
 * producción mientras el público ve la página de construcción.
 */
function aplicarModoConstruccion(request: NextRequest): NextResponse | null {
  if (process.env.MAINTENANCE_MODE !== "true") return null;

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

  const secreto = process.env.PREVIEW_BYPASS_SECRET;
  const cookie = request.cookies.get(PREVIEW_COOKIE)?.value;
  if (secreto && cookie === secreto) return null;

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
  const gate = aplicarModoConstruccion(request);
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
    url.pathname = `/${seccion}/login`;
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
