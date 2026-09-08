import { createClient } from "@/lib/supabase/server";
import { MarcarPagadaForm } from "@/app/admin/marcar-pagada-form";

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
};

const ESTADO_EQUIPO_CLASE: Record<string, string> = {
  pendiente_validacion: "bg-yellow-500/15 text-yellow-300",
  validado: "bg-emerald-500/15 text-emerald-300",
  lista_espera: "bg-white/10 text-white/70",
  rechazado: "bg-red-500/15 text-red-300",
};

const ESTADO_CUOTA_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
};

const ESTADO_CUOTA_CLASE: Record<string, string> = {
  pendiente: "bg-yellow-500/15 text-yellow-300",
  pagada: "bg-emerald-500/15 text-emerald-300",
  vencida: "bg-red-500/15 text-red-300",
};

export default async function AdminPagosPage() {
  const supabase = await createClient();

  const { data: equipos, error } = await supabase
    .from("teams")
    .select(
      `id, nombre_equipo, estado_inscripcion, orden_inscripcion, created_at,
       team_delegado(nombre, correo),
       payments(id, monto_total, monto_pagado, tipo_pago,
         payment_installments(id, numero_cuota, monto, fecha_limite, estado, fecha_pago, referencia_wompi))`
    )
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <p className="text-red-400">No se pudieron cargar los equipos: {error.message}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide">
          Equipos y pagos
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Mientras no está conectado el checkout de Wompi, valida aquí manualmente
          los pagos recibidos por transferencia, Nequi u otro medio.
        </p>
      </div>

      {(!equipos || equipos.length === 0) && (
        <p className="text-white/60">Todavía no hay equipos inscritos.</p>
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
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg uppercase tracking-wide">
                      {equipo.nombre_equipo}
                    </h2>
                    {equipo.orden_inscripcion != null && (
                      <span className="rounded-full bg-muneca-purple/30 px-2 py-0.5 text-xs font-bold">
                        #{equipo.orden_inscripcion}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60">
                    {delegado?.nombre} · {delegado?.correo}
                  </p>
                  <p className="text-xs text-white/40">
                    Inscrito el {formatFecha(equipo.created_at)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    ESTADO_EQUIPO_CLASE[equipo.estado_inscripcion] ?? "bg-white/10 text-white/70"
                  }`}
                >
                  {ESTADO_EQUIPO_LABEL[equipo.estado_inscripcion] ?? equipo.estado_inscripcion}
                </span>
              </div>

              {pago && (
                <p className="mt-3 text-sm text-white/70">
                  Pagado {formatCOP(Number(pago.monto_pagado))} de{" "}
                  {formatCOP(Number(pago.monto_total))}
                </p>
              )}

              <div className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10">
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
                        <span className="font-semibold">Partida {cuota.numero_cuota}</span>{" "}
                        <span className="text-white/60">
                          — {formatCOP(Number(cuota.monto))} · vence {formatFecha(cuota.fecha_limite)}
                        </span>
                        {cuota.estado === "pagada" && cuota.fecha_pago && (
                          <span className="ml-2 text-xs text-white/40">
                            pagada el {formatFecha(cuota.fecha_pago)}
                            {cuota.referencia_wompi ? ` · ref. ${cuota.referencia_wompi}` : ""}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            ESTADO_CUOTA_CLASE[cuota.estado] ?? "bg-white/10 text-white/70"
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
