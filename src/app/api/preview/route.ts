import { NextResponse, type NextRequest } from "next/server";

const PREVIEW_COOKIE = "cme_preview";

/**
 * Vista previa para saltarse la página "en construcción" mientras
 * MAINTENANCE_MODE está activo. Visitar esta URL una vez con la clave
 * correcta (?key=PREVIEW_BYPASS_SECRET) deja una cookie de 180 días en el
 * navegador; desde ahí ese navegador ve el sitio real con normalidad.
 *
 * Siempre alcanzable (excluida del gate en middleware.ts), sin importar el
 * modo mantenimiento.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const secreto = process.env.PREVIEW_BYPASS_SECRET;

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";

  const response = NextResponse.redirect(url);

  if (secreto && key === secreto) {
    response.cookies.set(PREVIEW_COOKIE, secreto, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180, // 180 días
    });
  }

  return response;
}
