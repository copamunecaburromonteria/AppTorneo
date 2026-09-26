import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { evaluarEstadoPlantilla } from "@/lib/portal/plantilla";
import {
  guardarDelegado,
  guardarColores,
  agregarStaff,
  eliminarStaff,
  agregarJugador,
  editarJugador,
  eliminarJugador,
} from "@/app/portal/actions";
import { PagarWompiButton } from "@/app/portal/inscripcion/pagar-wompi-button";
import { PagarCargosEquipoButton } from "@/app/portal/pagar-cargos-equipo-button";
import { LABEL_TIPO_TARJETA } from "@/lib/pagos/confirmar-cargos";
import { OpcionesPago } from "@/components/pagos/opciones-pago";
import { calcularMontoConRecargoWompi } from "@/lib/pagos/recargo-wompi";
import { calcularTextoLimiteReporte, estaATiempo } from "@/lib/pagos/reportar-transferencia";
import { reportarTransferenciaCuota } from "@/app/portal/inscripcion/transferencia-actions";
import { reportarTransferenciaCargosEquipo } from "@/app/portal/transferencia-cargos-actions";

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CO", {
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

const ESTADO_CUOTA_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
};

const STAFF_LABEL: Record<string, string> = {
  dt: "Director técnico",
  // Renombrado el 2026-09-26 a pedido de Fernando (el valor guardado sigue
  // siendo "preparador_fisico", solo cambia la etiqueta que se muestra).
  preparador_fisico: "Asistente Técnico",
};

const ROL_CUERPO_TECNICO_LABEL: Record<string, string> = {
  dt: "DT",
  asistente_tecnico: "Asistente Técnico",
};

const inputClass =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-muneca-black outline-none transition-colors focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20 disabled:bg-black/[0.03] disabled:opacity-60";

const secondaryButtonClass =
  "rounded-md bg-black/5 px-4 py-2 text-sm font-semibold text-muneca-black transition-colors hover:bg-black/10";

const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-black/50";

// Un jugador puede marcarse también como DT o Asistente Técnico del equipo —
// así no hay que registrarlo dos veces (una en la plantilla, otra en
// "Cuerpo técnico") cuando el cuerpo técnico también juega en cancha.
function CampoRolCuerpoTecnico({ defaultValue, disabled }: { defaultValue?: string; disabled?: boolean }) {
  return (
    <label className="col-span-2 block">
      <span className={labelClass}>¿También es del cuerpo técnico?</span>
      <select name="rol_cuerpo_tecnico" defaultValue={defaultValue ?? ""} disabled={disabled} className={`${inputClass} px-2 py-1.5`}>
        <option value="">No, solo juega</option>
        <option value="dt">También es el DT</option>
        <option value="asistente_tecnico">También es Asistente Técnico</option>
      </select>
    </label>
  );
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-display mb-5 flex items-center gap-2 text-xl uppercase tracking-wide text-muneca-black">
        <span className="h-2 w-2 rounded-full bg-muneca-purple" aria-hidden="true" />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Campo({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold text-muneca-black/70">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className={inputClass}
      />
    </label>
  );
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user!.id)
    .single();

  const teamId = profile!.team_id as string;

  const [
    { data: team },
    { data: delegado },
    { data: staff },
    { data: players },
    { data: pago },
    { data: config },
    estadoPlantilla,
    { data: cargosRaw },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("nombre_equipo, estado_inscripcion, orden_inscripcion, color_primario, color_secundario, compra_uniforme_copa")
      .eq("id", teamId)
      .single(),
    supabase.from("team_delegado").select("*").eq("team_id", teamId).maybeSingle(),
    supabase.from("team_staff").select("*").eq("team_id", teamId).order("rol"),
    supabase.from("players").select("*").eq("team_id", teamId).order("created_at"),
    supabase
      .from("payments")
      .select(
        "monto_total, monto_pagado, tipo_pago, payment_installments(id, numero_cuota, monto, fecha_limite, estado, pago_reportado_at)"
      )
      .eq("team_id", teamId)
      .maybeSingle(),
    supabase
      .from("torneo_config")
      .select(
        "max_jugadores_por_equipo, recargo_wompi_pct, horas_plazo_notificacion_transferencia, llave_pago_transferencia"
      )
      .eq("id", 1)
      .single(),
    evaluarEstadoPlantilla(supabase, teamId),
    supabase
      .from("cargos_tarjetas")
      .select("id, tipo_tarjeta, monto, created_at, pago_reportado_at, jugador:jugador_id(nombre)")
      .eq("team_id", teamId)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false }),
  ]);

  const maxJugadores = config?.max_jugadores_por_equipo ?? 15;
  const recargoWompiPct = Number(config?.recargo_wompi_pct ?? 0);
  const horasPlazoTransferencia = config?.horas_plazo_notificacion_transferencia ?? 24;
  const llavePago = config?.llave_pago_transferencia ?? "@FGC368";
  const QR_PAGO_SRC = "/brand/pagos/qr-nu.png";
  const cuotas = (pago?.payment_installments ?? []).slice().sort(
    (a: { numero_cuota: number }, b: { numero_cuota: number }) => a.numero_cuota - b.numero_cuota
  );
  // Se paga en orden — ver la misma nota en `portal/inscripcion/page.tsx`.
  const proximaCuotaPendiente = cuotas.find((c: { estado: string }) => c.estado === "pendiente");
  const compraUniformeCopa = Boolean(team?.compra_uniforme_copa);
  const inscripcionIncompleta = (players ?? []).length === 0;

  const cargosPendientes = (cargosRaw ?? []).map((c) => {
    const jugador = Array.isArray(c.jugador) ? c.jugador[0] : c.jugador;
    return {
      id: c.id as string,
      tipo: LABEL_TIPO_TARJETA[c.tipo_tarjeta as string] ?? (c.tipo_tarjeta as string),
      monto: Number(c.monto),
      jugadorNombre: jugador?.nombre ?? "—",
    };
  });
  const totalCargos = cargosPendientes.reduce((sum, c) => sum + c.monto, 0);

  // Estado del reporte de transferencia de la próxima cuota y del lote de
  // tarjetas — ver `OpcionesPago` y `lib/pagos/reportar-transferencia.ts`.
  const cuotaYaReportada =
    proximaCuotaPendiente?.pago_reportado_at != null
      ? {
          at: proximaCuotaPendiente.pago_reportado_at as string,
          aTiempo: estaATiempo(
            proximaCuotaPendiente.pago_reportado_at as string,
            new Date(`${proximaCuotaPendiente.fecha_limite}T00:00:00`),
            horasPlazoTransferencia
          ),
        }
      : null;
  const cuotaDeadlineTexto = proximaCuotaPendiente
    ? calcularTextoLimiteReporte(
        new Date(`${proximaCuotaPendiente.fecha_limite}T00:00:00`),
        horasPlazoTransferencia
      )
    : "";

  const cargosRawPendientes = cargosRaw ?? [];
  const cargosTodosReportados =
    cargosRawPendientes.length > 0 && cargosRawPendientes.every((c) => c.pago_reportado_at);
  const cargoMasAntiguo = cargosRawPendientes.reduce(
    (min: string, c) => ((c.created_at as string) < min ? (c.created_at as string) : min),
    cargosRawPendientes[0]?.created_at as string
  );
  const cargosYaReportados = cargosTodosReportados
    ? {
        at: cargosRawPendientes[0].pago_reportado_at as string,
        aTiempo: estaATiempo(
          cargosRawPendientes[0].pago_reportado_at as string,
          new Date(cargoMasAntiguo),
          horasPlazoTransferencia
        ),
      }
    : null;
  const cargosDeadlineTexto = cargosRawPendientes.length > 0
    ? calcularTextoLimiteReporte(new Date(cargoMasAntiguo), horasPlazoTransferencia)
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">Mi equipo</h1>
        <p className="mt-1 text-sm text-black/60">
          {team?.nombre_equipo}
          {team?.orden_inscripcion != null && ` · Cupo #${team.orden_inscripcion}`}
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
      )}

      {inscripcionIncompleta && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-muneca-yellow/40 bg-muneca-yellow/10 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-muneca-black">Todavía no completas tu inscripción</p>
            <p className="text-sm text-black/60">
              Te falta cargar la plantilla de jugadores y revisar tu plan de pago.
            </p>
          </div>
          <Link
            href="/portal/inscripcion?paso=4"
            className="shrink-0 rounded-md bg-muneca-yellow px-4 py-2 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02]"
          >
            Continuar inscripción →
          </Link>
        </div>
      )}

      <section className="rounded-2xl bg-muneca-black p-6 text-muneca-white sm:p-8">
        <p className="text-xs uppercase tracking-wide text-donkey-gray">Estado de tu inscripción</p>
        <p className="mt-2 text-sm text-white/70">
          Estado:{" "}
          <span className="font-semibold text-muneca-yellow">
            {ESTADO_EQUIPO_LABEL[team?.estado_inscripcion ?? ""] ?? team?.estado_inscripcion}
          </span>
        </p>
        {pago && (
          <p className="mt-1 text-sm text-white/70">
            Pagado {formatCOP(Number(pago.monto_pagado))} de {formatCOP(Number(pago.monto_total))}
          </p>
        )}
        {cuotas.length > 0 && (
          <ul className="mt-4 divide-y divide-white/10 rounded-xl bg-white/5">
            {cuotas.map(
              (c: { id: string; numero_cuota: number; monto: number; fecha_limite: string; estado: string }) => (
                <li
                  key={c.numero_cuota}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="text-white/80">
                    Partida {c.numero_cuota} — {formatCOP(Number(c.monto))} · vence{" "}
                    {formatFecha(c.fecha_limite)}
                  </span>
                  {c.id === proximaCuotaPendiente?.id ? (
                    <span className="font-semibold text-muneca-yellow">Paga abajo ↓</span>
                  ) : (
                    <span className="text-white/50">
                      {ESTADO_CUOTA_LABEL[c.estado] ?? c.estado}
                    </span>
                  )}
                </li>
              )
            )}
          </ul>
        )}

        {proximaCuotaPendiente && (
          <div className="mt-5 rounded-2xl bg-white p-4 sm:p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muneca-black/60">
              Pagar partida {proximaCuotaPendiente.numero_cuota} — {formatCOP(Number(proximaCuotaPendiente.monto))}
            </p>
            <OpcionesPago
              montoBase={Number(proximaCuotaPendiente.monto)}
              montoWompi={calcularMontoConRecargoWompi(Number(proximaCuotaPendiente.monto), recargoWompiPct)}
              llave={llavePago}
              qrSrc={QR_PAGO_SRC}
              deadlineTexto={cuotaDeadlineTexto}
              yaReportado={cuotaYaReportada}
              onReportar={reportarTransferenciaCuota.bind(null, proximaCuotaPendiente.id)}
              wompiBoton={<PagarWompiButton cuotaId={proximaCuotaPendiente.id} />}
            />
          </div>
        )}
      </section>

      {cargosPendientes.length > 0 && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display flex items-center gap-2 text-xl uppercase tracking-wide text-rose-700">
                🟨 Jugadores con tarjeta
              </h2>
              <p className="mt-1 text-sm text-rose-700/80">
                Un jugador con tarjetas sin pagar no debe jugar hasta saldar la deuda.
              </p>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-rose-200/60 rounded-xl bg-white/60">
            {cargosPendientes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <span className="text-muneca-black/80">
                  {c.jugadorNombre} — {c.tipo}
                </span>
                <span className="font-semibold text-muneca-black">{formatCOP(c.monto)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-2xl bg-white p-4 sm:p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muneca-black/60">
              Pagar todo el equipo — {formatCOP(totalCargos)}
            </p>
            <OpcionesPago
              montoBase={totalCargos}
              montoWompi={calcularMontoConRecargoWompi(totalCargos, recargoWompiPct)}
              llave={llavePago}
              qrSrc={QR_PAGO_SRC}
              deadlineTexto={cargosDeadlineTexto}
              yaReportado={cargosYaReportados}
              onReportar={reportarTransferenciaCargosEquipo}
              wompiBoton={<PagarCargosEquipoButton />}
            />
          </div>

          <p className="mt-3 text-xs text-rose-700/60">
            También se puede pagar por jugador, individualmente, en /pagos-tarjetas.
          </p>
        </section>
      )}

      <Card titulo="Datos del delegado">
        <form action={guardarDelegado} className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nombre" name="nombre" defaultValue={delegado?.nombre ?? ""} required />
          <Campo label="Apellido" name="apellido" defaultValue={delegado?.apellido ?? ""} required />
          <Campo label="Documento" name="documento" defaultValue={delegado?.documento ?? ""} required />
          <Campo
            label="Contacto principal"
            name="contacto_principal"
            defaultValue={delegado?.contacto_principal ?? ""}
            required
          />
          <Campo
            label="Contacto alterno (opcional)"
            name="contacto_alterno"
            defaultValue={delegado?.contacto_alterno ?? ""}
          />
          <Campo
            label="WhatsApp para notificaciones (opcional)"
            name="whatsapp"
            defaultValue={delegado?.whatsapp_notificaciones ?? ""}
          />
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-muneca-yellow px-4 py-2 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02]"
            >
              Guardar delegado
            </button>
          </div>
        </form>
      </Card>

      <Card titulo="Cuerpo técnico">
        <ul className="mb-4 divide-y divide-black/10 rounded-lg border border-black/10">
          {(staff ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between px-3 py-2 text-sm text-muneca-black">
              <span>
                {s.nombre} · {STAFF_LABEL[s.rol] ?? s.rol}
                {s.documento ? ` · ${s.documento}` : ""}
              </span>
              <form action={eliminarStaff.bind(null, s.id)}>
                <button type="submit" className="text-xs text-rose-600 hover:underline">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
          {(players ?? [])
            .filter((p) => p.rol_cuerpo_tecnico)
            .map((p) => (
              <li key={`jugador-staff-${p.id}`} className="px-3 py-2 text-sm text-muneca-black">
                {p.nombre} · {ROL_CUERPO_TECNICO_LABEL[p.rol_cuerpo_tecnico] ?? p.rol_cuerpo_tecnico}{" "}
                <span className="text-black/50">(también juega — {p.posicion ?? "sin posición"})</span>
              </li>
            ))}
          {(staff ?? []).length === 0 && (players ?? []).every((p) => !p.rol_cuerpo_tecnico) && (
            <li className="px-3 py-2 text-sm text-black/50">Todavía no has agregado a nadie.</li>
          )}
        </ul>
        <p className="mb-3 text-xs text-black/50">
          Si el DT o el Asistente Técnico también juegan, no hace falta agregarlos aquí — márcalo directamente en
          su fila dentro de la Plantilla, más abajo.
        </p>
        <form action={agregarStaff} className="grid gap-3 sm:grid-cols-4">
          <label className="block text-sm sm:col-span-1">
            <span className="mb-1 block font-semibold text-muneca-black/70">Rol</span>
            <select name="rol" defaultValue="dt" className={inputClass}>
              <option value="dt">Director técnico</option>
              <option value="preparador_fisico">Asistente Técnico</option>
            </select>
          </label>
          <div className="sm:col-span-1">
            <Campo label="Nombre" name="nombre" required />
          </div>
          <div className="sm:col-span-1">
            <Campo label="Documento (opcional)" name="documento" />
          </div>
          <div className="flex items-end sm:col-span-1">
            <button type="submit" className={`w-full ${secondaryButtonClass}`}>
              Agregar
            </button>
          </div>
        </form>
      </Card>

      <Card titulo="Colores del equipo">
        <form action={guardarColores} className="flex flex-wrap items-end gap-6">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-muneca-black/70">Color primario</span>
            <input
              type="color"
              name="color_primario"
              defaultValue={team?.color_primario ?? "#7b1fa2"}
              className="h-10 w-16 rounded-md border border-black/15 bg-white"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-muneca-black/70">Color secundario</span>
            <input
              type="color"
              name="color_secundario"
              defaultValue={team?.color_secundario ?? "#f5c518"}
              className="h-10 w-16 rounded-md border border-black/15 bg-white"
            />
          </label>
          <button type="submit" className={secondaryButtonClass}>
            Guardar colores
          </button>
        </form>
      </Card>

      <Card titulo={`Plantilla (${(players ?? []).length}/${maxJugadores})`}>
        {estadoPlantilla.motivo && (
          <p
            className={`mb-4 rounded-md px-3 py-2 text-sm ${
              estadoPlantilla.puedeEditar
                ? "bg-amber-50 text-amber-700"
                : "bg-black/5 text-black/60"
            }`}
          >
            {estadoPlantilla.motivo}
          </p>
        )}

        <div className="space-y-3">
          {(players ?? []).map((p) => (
            <form
              key={p.id}
              action={editarJugador.bind(null, p.id)}
              className="grid grid-cols-2 gap-3 rounded-lg border border-black/10 p-3 sm:grid-cols-4"
            >
              <label className="col-span-2 block">
                <span className={labelClass}>Nombre</span>
                <input
                  name="nombre"
                  defaultValue={p.nombre}
                  disabled={!estadoPlantilla.puedeEditar}
                  required
                  className={`${inputClass} px-2 py-1.5`}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Tipo doc.</span>
                <select
                  name="tipo_documento"
                  defaultValue={p.tipo_documento}
                  disabled={!estadoPlantilla.puedeEditar}
                  className={`${inputClass} px-2 py-1.5`}
                >
                  <option value="TI">TI</option>
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="RC">RC</option>
                  <option value="PA">PA</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>N° documento</span>
                <input
                  name="numero_documento"
                  defaultValue={p.numero_documento}
                  disabled={!estadoPlantilla.puedeEditar}
                  required
                  className={`${inputClass} px-2 py-1.5`}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Posición</span>
                <select
                  name="posicion"
                  defaultValue={p.posicion ?? ""}
                  disabled={!estadoPlantilla.puedeEditar}
                  className={`${inputClass} px-2 py-1.5`}
                >
                  <option value="">Elige</option>
                  <option value="Arquero">Arquero</option>
                  <option value="Jugador de Campo">Jugador de Campo</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>N° camiseta</span>
                <input
                  name="numero_camiseta"
                  type="number"
                  min={0}
                  defaultValue={p.numero_camiseta ?? ""}
                  disabled={!estadoPlantilla.puedeEditar}
                  className={`${inputClass} px-2 py-1.5`}
                />
              </label>
              <label className="col-span-2 block sm:col-span-1">
                <span className={labelClass}>EPS (opcional)</span>
                <input
                  name="eps"
                  defaultValue={p.eps ?? ""}
                  disabled={!estadoPlantilla.puedeEditar}
                  className={`${inputClass} px-2 py-1.5`}
                />
              </label>
              {compraUniformeCopa && (
                <label className="block">
                  <span className={labelClass}>Talla uniforme</span>
                  <select
                    name="talla_uniforme"
                    defaultValue={p.talla_uniforme ?? ""}
                    disabled={!estadoPlantilla.puedeEditar}
                    className={`${inputClass} px-2 py-1.5`}
                  >
                    <option value="">Elige</option>
                    {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <CampoRolCuerpoTecnico defaultValue={p.rol_cuerpo_tecnico ?? ""} disabled={!estadoPlantilla.puedeEditar} />
              {estadoPlantilla.puedeEditar && (
                <div className="col-span-2 flex gap-2 sm:col-span-4">
                  <button
                    type="submit"
                    className="rounded-md bg-muneca-yellow px-3 py-1.5 text-xs font-bold uppercase text-muneca-black"
                  >
                    Guardar
                  </button>
                  <button
                    type="submit"
                    formAction={eliminarJugador.bind(null, p.id)}
                    className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </form>
          ))}
          {(players ?? []).length === 0 && (
            <p className="text-sm text-black/50">Todavía no has cargado jugadores.</p>
          )}
        </div>

        {estadoPlantilla.puedeEditar && (players ?? []).length < maxJugadores && (
          <form
            action={agregarJugador}
            className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-dashed border-black/20 p-3 sm:grid-cols-4"
          >
            <label className="col-span-2 block">
              <span className={labelClass}>Nombre</span>
              <input name="nombre" required className={`${inputClass} px-2 py-1.5`} />
            </label>
            <label className="block">
              <span className={labelClass}>Tipo doc.</span>
              <select name="tipo_documento" defaultValue="CC" className={`${inputClass} px-2 py-1.5`}>
                <option value="TI">TI</option>
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="RC">RC</option>
                <option value="PA">PA</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>N° documento</span>
              <input name="numero_documento" required className={`${inputClass} px-2 py-1.5`} />
            </label>
            <label className="block">
              <span className={labelClass}>Posición</span>
              <select name="posicion" defaultValue="" className={`${inputClass} px-2 py-1.5`}>
                <option value="">Elige</option>
                <option value="Arquero">Arquero</option>
                <option value="Jugador de Campo">Jugador de Campo</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>N° camiseta</span>
              <input name="numero_camiseta" type="number" min={0} className={`${inputClass} px-2 py-1.5`} />
            </label>
            <label className="col-span-2 block sm:col-span-1">
              <span className={labelClass}>EPS (opcional)</span>
              <input name="eps" className={`${inputClass} px-2 py-1.5`} />
            </label>
            {compraUniformeCopa && (
              <label className="block">
                <span className={labelClass}>Talla uniforme</span>
                <select name="talla_uniforme" defaultValue="" className={`${inputClass} px-2 py-1.5`}>
                  <option value="">Elige</option>
                  {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <CampoRolCuerpoTecnico />
            <div className="col-span-2 sm:col-span-4">
              <button type="submit" className={`w-full ${secondaryButtonClass}`}>
                Agregar jugador
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
