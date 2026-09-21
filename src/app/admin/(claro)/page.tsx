import { Users, Download, UserPlus2, Clock, CreditCard, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { armarLinkWhatsApp } from "@/lib/whatsapp";
import { MarcarPagadaForm } from "@/app/admin/marcar-pagada-form";
import { ReenviarRecordatorioForm } from "@/app/admin/reenvio-forms";
import { IconHeading } from "@/components/admin/icon-heading";
import { MiniStat } from "@/components/admin/mini-stat";
import { EquiposTabla, type EquipoFila, type Cuota } from "@/app/admin/equipos-tabla";

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Rediseño "más colorido" (2026-09-21, a partir de una captura de
 * referencia que le gustó a Fernando): tabla real con búsqueda/filtros
 * (`equipos-tabla.tsx`) en vez de la lista de tarjetas siempre-expandidas
 * de antes, fila de mini-estadísticas, y una tarjeta nueva de "Pagos
 * pendientes de validación" (antes las cuotas pendientes solo se veían
 * dentro de cada equipo expandido). Las consultas a Supabase y las Server
 * Actions (marcar pagada, reenviar recordatorio/confirmación/registro)
 * siguen exactamente igual — no se tocó nada del flujo de validación de
 * pagos, solo la presentación.
 */
export default async function AdminPagosPage() {
  const supabase = await createClient();

  const [
    { data: equiposRaw, error },
    { data: enEspera, error: errorEspera },
    { data: gruposRaw },
    { data: teamGroupRaw },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select(
        `id, nombre_equipo, escudo_url, estado_inscripcion, orden_inscripcion, created_at,
         team_delegado(nombre, apellido, correo),
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
    supabase.from("groups").select("id, letra").order("letra", { ascending: true }),
    supabase.from("team_group").select("group_id, team_id"),
  ]);

  if (error) {
    return <p className="text-sm text-rose-600">No se pudieron cargar los equipos: {error.message}</p>;
  }

  const letraPorGrupoId = new Map((gruposRaw ?? []).map((g) => [g.id, g.letra]));
  const grupoPorEquipo = new Map(
    (teamGroupRaw ?? []).map((tg) => [tg.team_id, letraPorGrupoId.get(tg.group_id) ?? null])
  );

  type DelegadoRaw = { nombre: string | null; apellido: string | null; correo: string | null } | null;
  function unwrapDelegado(raw: unknown): DelegadoRaw {
    return Array.isArray(raw) ? (raw[0] ?? null) : (raw as DelegadoRaw);
  }

  const equipos: EquipoFila[] = (equiposRaw ?? []).map((e) => {
    const delegado = unwrapDelegado(e.team_delegado);
    const pagoRaw = e.payments;
    const pago = Array.isArray(pagoRaw) ? pagoRaw[0] : pagoRaw;
    const cuotas: Cuota[] = ((pago?.payment_installments ?? []) as Cuota[])
      .slice()
      .sort((a, b) => a.numero_cuota - b.numero_cuota);

    return {
      id: e.id,
      nombre_equipo: e.nombre_equipo,
      escudo_url: e.escudo_url,
      estado_inscripcion: e.estado_inscripcion,
      orden_inscripcion: e.orden_inscripcion,
      created_at: e.created_at,
      grupo: grupoPorEquipo.get(e.id) ?? null,
      delegadoNombre: [delegado?.nombre, delegado?.apellido].filter(Boolean).join(" "),
      delegadoCorreo: delegado?.correo ?? null,
      montoPagado: Number(pago?.monto_pagado ?? 0),
      montoTotal: Number(pago?.monto_total ?? 0),
      cuotas,
    };
  });

  const grupos = (gruposRaw ?? []).map((g) => g.letra).filter((l): l is string => Boolean(l));

  const pagoPendiente = equipos.filter((e) => e.montoTotal > 0 && e.montoPagado < e.montoTotal).length;
  const pagoConfirmado = equipos.filter((e) => e.montoTotal > 0 && e.montoPagado >= e.montoTotal).length;
  const validados = equipos.filter((e) => e.estado_inscripcion === "validado").length;
  const enRevision = equipos.filter((e) => e.estado_inscripcion === "pendiente_validacion").length;

  // Cuotas pendientes de todos los equipos, aplanadas, para la tarjeta de
  // "Pagos pendientes de validación" — antes solo se veían dentro de cada
  // equipo expandido, una por una.
  const cuotasPendientes = equipos
    .flatMap((e) =>
      e.cuotas
        .filter((c) => c.estado !== "pagada")
        .map((c) => ({ equipo: e.nombre_equipo, equipoId: e.id, cuota: c }))
    )
    .sort((a, b) => new Date(a.cuota.fecha_limite).getTime() - new Date(b.cuota.fecha_limite).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <IconHeading icon={Users} color="purple" size="lg">
            Equipos y pagos
          </IconHeading>
          <p className="mt-1 text-sm text-muneca-black/60">
            Gestiona las inscripciones, valida pagos y lleva el control de los equipos del torneo.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/admin/reportes/equipos.csv"
            className="flex items-center gap-1.5 rounded-md border border-black/15 px-3.5 py-2 text-sm font-semibold text-muneca-black transition-colors hover:border-muneca-purple/40 hover:text-muneca-purple"
          >
            <Download size={15} />
            Exportar
          </a>
          <button
            type="button"
            disabled
            title="Próximamente — por ahora los equipos se inscriben desde /inscripcion o se invitan desde Preinscripciones"
            className="flex items-center gap-1.5 rounded-md bg-muneca-yellow px-3.5 py-2 text-sm font-bold uppercase text-muneca-black opacity-50"
          >
            <UserPlus2 size={15} />
            Agregar equipo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <MiniStat color="purple" valor={equipos.length} label="Equipos inscritos" />
        <MiniStat color="yellow" valor={pagoPendiente} label="Pago pendiente" />
        <MiniStat color="green" valor={pagoConfirmado} label="Pago confirmado" />
        <MiniStat color="blue" valor={validados} label="Validados" />
        <MiniStat color="gray" valor={enRevision} label="En revisión" />
      </div>

      <EquiposTabla equipos={equipos} grupos={grupos} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconHeading icon={Clock} color="yellow">
              Equipos en espera
            </IconHeading>
            {enEspera && enEspera.length > 0 && (
              <span className="rounded-full bg-muneca-purple/10 px-2 py-0.5 text-xs font-bold text-muneca-purple">
                {enEspera.length}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muneca-black/60">
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
            <div className="mt-3 space-y-2">
              {enEspera.map((equipo) => {
                const delegadoRaw = equipo.team_delegado;
                const delegado = Array.isArray(delegadoRaw) ? delegadoRaw[0] : delegadoRaw;
                const numeroContacto = delegado?.whatsapp_notificaciones || delegado?.contacto_principal;
                const linkWhatsApp = armarLinkWhatsApp(numeroContacto);

                return (
                  <div
                    key={equipo.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-muneca-black">{equipo.nombre_equipo}</p>
                      <p className="text-xs text-muneca-black/50">
                        {[delegado?.nombre, delegado?.apellido].filter(Boolean).join(" ") || "Delegado sin nombre"}
                        {" · "}
                        Inscrito el {formatFecha(equipo.created_at)}
                      </p>
                    </div>
                    {linkWhatsApp && (
                      <a
                        href={linkWhatsApp}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.02]"
                      >
                        Contactar
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconHeading icon={CreditCard} color="green">
              Pagos pendientes de validación
            </IconHeading>
            {cuotasPendientes.length > 0 && (
              <span className="rounded-full bg-muneca-purple/10 px-2 py-0.5 text-xs font-bold text-muneca-purple">
                {cuotasPendientes.length}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muneca-black/60">
            Mientras no está conectado el checkout de Wompi, valida aquí manualmente los pagos
            recibidos por transferencia, Nequi u otro medio.
          </p>

          {cuotasPendientes.length === 0 && (
            <p className="mt-3 rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-sm text-muneca-black/50">
              Todavía no hay pagos por validar.
            </p>
          )}

          {cuotasPendientes.length > 0 && (
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {cuotasPendientes.map(({ equipo, cuota }) => (
                <div
                  key={cuota.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 p-3"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-muneca-black">{equipo}</p>
                    <p className="text-xs text-muneca-black/50">
                      Partida {cuota.numero_cuota} — {formatCOP(Number(cuota.monto))} · vence{" "}
                      {formatFecha(cuota.fecha_limite)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ReenviarRecordatorioForm cuotaId={cuota.id} />
                    <MarcarPagadaForm cuotaId={cuota.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-muneca-purple/15 bg-muneca-purple/5 p-4 text-sm text-muneca-black/70">
        <Info size={18} className="mt-0.5 shrink-0 text-muneca-purple" />
        <p>
          <span className="font-bold text-muneca-purple">Importante: </span>
          Recuerda mantener actualizada la información de los equipos y validar manualmente los
          pagos mientras no esté activo el checkout de Wompi.
        </p>
      </div>
    </div>
  );
}
