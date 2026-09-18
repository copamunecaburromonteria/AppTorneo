import { createClient } from "@/lib/supabase/server";
import { MarcarPagadaForm } from "@/app/admin/marcar-pagada-form";
import { armarLinkWhatsApp } from "@/lib/whatsapp";

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ESTADO_EQUIPO_LABEL: Record<string, string> = {
  pendiente_validacion: "Pendiente de validación",
  validado: "Validado",
  lista_espera: "Lista de espera",
  rechazado: "Rechazado",
  preinscrito: "Preinscrito",
  invitado: "Invitado",
};

const ESTADO_EQUIPO_CLASE: Record<string, string> = {
  pendiente_validacion: "bg-amber-50 text-amber-700",
  validado: "bg-emerald-50 text-emerald-700",
  lista_espera: "bg-black/5 text-muneca-black/50",
  rechazado: "bg-rose-50 text-rose-700",
  preinscrito: "bg-sky-50 text-sky-700",
  invitado: "bg-violet-50 text-violet-700",
};

const ESTADO_CUOTA_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
};

const ESTADO_CUOTA_CLASE: Record<string, string> = {
  pendiente: "bg-amber-50 text-amber-700",
  pagada: "bg-emerald-50 text-emerald-700",
  vencida: "bg-rose-50 text-rose-700",
};

export default async function AdminPagosPage() {
  const supabase = await createClient();

  const [{ data: equiposRaw, error }, { data: enEspera, error: errorEspera }] = await Promise.all([
    supabase
      .from("teams")
      .select(
        `id, nombre_equipo, estado_inscripcion, orden_inscripcion, created_at,
         team_delegado(nombre, correo),
         payments(id, monto_total, monto_pagado, tipo_pago,
           payment_installments(id, numero_cuota, monto, fecha_limite, estado, fecha_pago, referencia_wompi))`
      )
      .neq("estado_inscripcion", "lista_espera")
      .neq("estado_inscripcion", "preinscrito")
      .neq("estado_inscripcion", "invitado")
      .order("created_at", { ascending: true }),
    supabase
      .from("teams")
      .select(
        `id, nombre_equipo, created_at,
         team_delegado(nombre, apellido, correo, contacto_principal, contacto_alterno, whatsapp_notificaciones)`
      )
      .eq("estado_inscripcion", "lista_espera")
      .order("created_at", { ascending: true }),
  ]);

  const equipos = equiposRaw;

  if (error) {
    return (
      <p className="text-sm text-rose-600">No se pudieron cargar los equipos: {error.message}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">
          Equipos y pagos
        </h1>
        <p className="mt-1 text-sm text-muneca-black/60">
          Mientras no está conectado el checkout de Wompi, valida aquí manualmente
          los pagos recibidos por transferencia, Nequi u otro medio.
        </p>
      </div>

      <section>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg uppercase tracking-wide text-muneca-black">
            Equipos en espera
          </h2>
          {enEspera && enEspera.length > 0 && (
            <span className="rounded-full bg-muneca-purple/10 px-2 py-0.5 text-xs font-bold text-muneca-purple">
              {enEspera.length}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muneca-black/60">
          Se inscribieron cuando los cupos ya estaban llenos. Si se libera un cupo, contáctalos en
          orden de llegada.
        </p>

        {errorEspera && (
          <p className="mt-3 text-sm text-rose-600">
            No se pudo cargar la lista de espera: {errorEspera.message}
          </p>
        )}

        {!errorEspera && (!enEspera || enEspera.length === 0) && (
          <p className="mt-3 rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-sm text-muneca-black/50">
            Nadie en lista de espera por ahora.
          </p>
        )}

        {enEspera && enEspera.length > 0 && (
          <div className="mt-3 space-y-3">
            {enEspera.map((equipo) => {
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
                    <p className="font-display text-base uppercase tracking-wide text-muneca-black">
                      {equipo.nombre_equipo}
                    </p>
                    <p className="text-sm text-muneca-black/60">
                      {[delegado?.nombre, delegado?.apellido].filter(Boolean).join(" ") || "Delegado sin nombre"}
                      {delegado?.correo ? ` · ${delegado.correo}` : ""}
                    </p>
                    {numeroContacto && (
                      <p className="text-xs text-muneca-black/40">{numeroContacto}</p>
                    )}
                    <p className="text-xs text-muneca-black/40">
                      Inscrito el {formatFecha(equipo.created_at)}
                    </p>
                  </div>

                  {linkWhatsApp ? (
                    <a
                      href={linkWhatsApp}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02]"
                    >
                      Contactar
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs text-muneca-black/40">Sin número de contacto</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {(!equipos || equipos.length === 0) && (
        <p className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-muneca-black/50">
          Todavía no hay equipos inscritos.
        </p>
      )}

      <div className="space-y-4">
        {equipos?.map((equipo) => {
          const delegadoRaw = equipo.team_delegado;
          const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;
          const pagoRaw = equipo.payments;
          const pago = Array.isArray(pagoRaw) ? pagoRaw[0] : pagoRaw;
          const cuotas = (pago?.payment_installments ?? []).slice().sort(
            (a: { numero_cuota: number }, b: { numero_cuota: number }) =>
              a.numero_cuota - b.numero_cuota
          );

          return (
            <div
              key={equipo.id}
              className="rounded-xl border border-black/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg uppercase tracking-wide text-muneca-black">
                      {equipo.nombre_equipo}
                    </h2>
                    {equipo.orden_inscripcion != null && (
                      <span className="rounded-full bg-muneca-purple/10 px-2 py-0.5 text-xs font-bold text-muneca-purple">
                        #{equipo.orden_inscripcion}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muneca-black/60">
                    {delegado?.nombre} · {delegado?.correo}
                  </p>
                  <p className="text-xs text-muneca-black/40">
                    Inscrito el {formatFecha(equipo.created_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    ESTADO_EQUIPO_CLASE[equipo.estado_inscripcion] ?? "bg-black/5 text-muneca-black/50"
                  }`}
                >
                  {ESTADO_EQUIPO_LABEL[equipo.estado_inscripcion] ?? equipo.estado_inscripcion}
                </span>
              </div>

              {pago && (
                <p className="mt-3 text-sm text-muneca-black/70">
                  Pagado {formatCOP(Number(pago.monto_pagado))} de{" "}
                  {formatCOP(Number(pago.monto_total))}
                </p>
              )}

              <div className="mt-4 divide-y divide-black/10 rounded-lg border border-black/10">
                {cuotas.map(
                  (cuota: {
                    id: string;
                    numero_cuota: number;
                    monto: number;
                    fecha_limite: string;
                    estado: string;
                    fecha_pago: string | null;
                    referencia_wompi: string | null;
                  }) => (
                    <div
                      key={cuota.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="text-sm">
                        <span className="font-semibold text-muneca-black">
                          Partida {cuota.numero_cuota}
                        </span>{" "}
                        <span className="text-muneca-black/60">
                          — {formatCOP(Number(cuota.monto))} · vence {formatFecha(cuota.fecha_limite)}
                        </span>
                        {cuota.estado === "pagada" && cuota.fecha_pago && (
                          <span className="ml-2 text-xs text-muneca-black/40">
                            pagada el {formatFecha(cuota.fecha_pago)}
                            {cuota.referencia_wompi ? ` · ref. ${cuota.referencia_wompi}` : ""}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            ESTADO_CUOTA_CLASE[cuota.estado] ?? "bg-black/5 text-muneca-black/50"
                          }`}
                        >
                          {ESTADO_CUOTA_LABEL[cuota.estado] ?? cuota.estado}
                        </span>
                        {cuota.estado !== "pagada" && <MarcarPagadaForm cuotaId={cuota.id} />}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
