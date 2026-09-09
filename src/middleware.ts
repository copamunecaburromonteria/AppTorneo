import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Protege /admin y /portal: exige sesión iniciada. La verificación de rol
 * (admin vs equipo, y que el equipo tenga team_id) se hace en el layout de
 * cada sección, que sí puede consultar la tabla profiles.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

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

  const { pathname } = request.nextUrl;
  const seccion = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/portal")
      ? "portal"
      : null;

  if (!seccion) return response;

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
  matcher: ["/admin/:path*", "/portal/:path*"],
};
