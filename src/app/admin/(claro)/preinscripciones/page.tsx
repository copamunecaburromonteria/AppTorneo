import { createClient } from "@/lib/supabase/server";
import { armarLinkWhatsApp } from "@/lib/whatsapp";
import {
  InvitarForm,
  ReenviarForm,
  ReenviarPreinscripcionForm,
  RevertirForm,
} from "@/app/admin/preinscripciones/preinscripcion-forms";

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Panel para administrar la nueva modalidad de preinscripción (2026-09-17,
 * ver `claude/plan-fases-tareas.md`): equipos que llenaron el formulario
 * abierto de `/preinscripcion` (sin cuenta ni cobro) y esperan a que el admin
 * los invite, uno por uno, a completar la inscripción oficial en
 * `/inscripcion` (donde sí se cobra). La decisión de a quién invitar y
 * cuándo es siempre manual — `orden_preinscripcion` solo orienta el orden de
 * llegada.
 */
export default async function AdminPreinscripcionesPage() {
  const supabase = await createClient();

  const [{ data: invitadosRaw, error: errorInvitados }, { data: preinscritosRaw, error: errorPreinscritos }] =
    await Promise.all([
      supabase
        .from("teams")
        .select(
          `id, nombre_equipo, orden_preinscripcion, fecha_invitado,
           team_delegado(nombre, apellido, correo, contacto_principal, contacto_alterno, whatsapp_notificaciones)`
        )
        .eq("estado_inscripcion", "invitado")
        .order("fecha_invitado", { ascending: true }),
      supabase
        .from("teams")
        .select(
          `id, nombre_equipo, orden_preinscripcion, created_at,
           team_delegado(nombre, apellido, correo, contacto_principal, contacto_alterno, whatsapp_notificaciones)`
        )
        .eq("estado_inscripcion", "preinscrito")
        .order("orden_preinscripcion", { ascending: true }),
    ]);

  const invitados = invitadosRaw ?? [];
  const preinscritos = preinscritosRaw ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">
          Preinscripciones
        </h1>
        <p className="mt-1 text-sm text-muneca-black/60">
          Equipos que hicieron fila en <code>/preinscripcion</code> sin cuenta ni cobro. Invita a los
          que quieras que completen la inscripción oficial y activen su cupo — normalmente en orden
          de llegada, pero la decisión es tuya.
        </p>
      </div>

      <section>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg uppercase tracking-wide text-muneca-black">
            Invitados — esperando pago
          </h2>
          {invitados.length > 0 && (
            <span className="rounded-full bg-muneca-purple/10 px-2 py-0.5 text-xs font-bold text-muneca-purple">
              {invitados.length}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muneca-black/60">
          Ya se les avisó — están completando la inscripción oficial en <code>/inscripcion</code>. Si
          uno se demora demasiado, puedes revertirlo para invitar al siguiente de la fila.
        </p>

        {errorInvitados && (
          <p className="mt-3 text-sm text-rose-600">
            No se pudo cargar la lista de invitados: {errorInvitados.message}
          </p>
        )}

        {!errorInvitados && invitados.length === 0 && (
          <p className="mt-3 rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-sm text-muneca-black/50">
            Nadie invitado por ahora.
          </p>
        )}

        {invitados.length > 0 && (
          <div className="mt-3 space-y-3">
            {invitados.map((equipo) => {
              const delegadoRaw = equipo.team_delegado;
              const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;
              const numeroContacto = delegado?.whatsapp_notificaciones || delegado?.contacto_principal;
              const linkWhatsApp = armarLinkWhatsApp(numeroContacto);

              return (
                <div
                  key={equipo.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-base uppercase tracking-wide text-muneca-black">
                        {equipo.nombre_equipo}
                      </p>
                      {equipo.orden_preinscripcion != null && (
                        <span className="rounded-full bg-muneca-purple/10 px-2 py-0.5 text-xs font-bold text-muneca-purple">
                          #{equipo.orden_preinscripcion}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muneca-black/60">
                      {[delegado?.nombre, delegado?.apellido].filter(Boolean).join(" ") || "Delegado sin nombre"}
                      {delegado?.correo ? ` · ${delegado.correo}` : ""}
                    </p>
                    {numeroContacto && <p className="text-xs text-muneca-black/40">{numeroContacto}</p>}
                    {equipo.fecha_invitado && (
                      <p className="text-xs text-muneca-black/40">
                        Invitado el {formatFecha(equipo.fecha_invitado)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {linkWhatsApp && (
                      <a
                        href={linkWhatsApp}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02]"
                      >
                        Contactar
                      </a>
                    )}
                    <ReenviarForm teamId={equipo.id} />
                    <RevertirForm teamId={equipo.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg uppercase tracking-wide text-muneca-black">
            Preinscritos — en fila
          </h2>
          {preinscritos.length > 0 && (
            <span className="rounded-full bg-muneca-purple/10 px-2 py-0.5 text-xs font-bold text-muneca-purple">
              {preinscritos.length}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muneca-black/60">
          Todavía no se les ha invitado a completar la inscripción oficial.
        </p>

        {errorPreinscritos && (
          <p className="mt-3 text-sm text-rose-600">
            No se pudo cargar la fila de preinscritos: {errorPreinscritos.message}
          </p>
        )}

        {!errorPreinscritos && preinscritos.length === 0 && (
          <p className="mt-3 rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-sm text-muneca-black/50">
            Nadie preinscrito por ahora.
          </p>
        )}

        {preinscritos.length > 0 && (
          <div className="mt-3 space-y-3">
            {preinscritos.map((equipo) => {
              const delegadoRaw = equipo.team_delegado;
              const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;
              const numeroContacto = delegado?.whatsapp_notificaciones || delegado?.contacto_principal;
              const linkWhatsApp = armarLinkWhatsApp(numeroContacto);

              return (
                <div
                  key={equipo.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-base uppercase tracking-wide text-muneca-black">
                        {equipo.nombre_equipo}
                      </p>
                      {equipo.orden_preinscripcion != null && (
                        <span className="rounded-full bg-muneca-purple/10 px-2 py-0.5 text-xs font-bold text-muneca-purple">
                          #{equipo.orden_preinscripcion}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muneca-black/60">
                      {[delegado?.nombre, delegado?.apellido].filter(Boolean).join(" ") || "Delegado sin nombre"}
                      {delegado?.correo ? ` · ${delegado.correo}` : ""}
                    </p>
                    {numeroContacto && <p className="text-xs text-muneca-black/40">{numeroContacto}</p>}
                    <p className="text-xs text-muneca-black/40">
                      Preinscrito el {formatFecha(equipo.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {linkWhatsApp && (
                      <a
                        href={linkWhatsApp}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02]"
                      >
                        Contactar
                      </a>
                    )}
                    <ReenviarPreinscripcionForm teamId={equipo.id} />
                    <InvitarForm teamId={equipo.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
