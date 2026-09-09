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
  preparador_fisico: "Preparador físico",
};

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="font-display mb-4 text-lg uppercase tracking-wide">{titulo}</h2>
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
      <span className="mb-1 block text-white/70">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-white outline-none focus:border-muneca-yellow"
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
      .select("monto_total, monto_pagado, tipo_pago, payment_installments(numero_cuota, monto, fecha_limite, estado)")
      .eq("team_id", teamId)
      .maybeSingle(),
    supabase.from("torneo_config").select("max_jugadores_por_equipo").eq("id", 1).single(),
    evaluarEstadoPlantilla(supabase, teamId),
  ]);

  const maxJugadores = config?.max_jugadores_por_equipo ?? 15;
  const cuotas = (pago?.payment_installments ?? []).slice().sort(
    (a: { numero_cuota: number }, b: { numero_cuota: number }) => a.numero_cuota - b.numero_cuota
  );
  const compraUniformeCopa = Boolean(team?.compra_uniforme_copa);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide">Mi equipo</h1>
        <p className="mt-1 text-sm text-white/60">
          {team?.nombre_equipo}
          {team?.orden_inscripcion != null && ` · Cupo #${team.orden_inscripcion}`}
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <Card titulo="Estado de tu inscripción">
        <p className="text-sm text-white/70">
          Estado:{" "}
          <span className="font-semibold text-white">
            {ESTADO_EQUIPO_LABEL[team?.estado_inscripcion ?? ""] ?? team?.estado_inscripcion}
          </span>
        </p>
        {pago && (
          <p className="mt-2 text-sm text-white/70">
            Pagado {formatCOP(Number(pago.monto_pagado))} de {formatCOP(Number(pago.monto_total))}
          </p>
        )}
        {cuotas.length > 0 && (
          <ul className="mt-3 divide-y divide-white/10 rounded-lg border border-white/10">
            {cuotas.map(
              (c: { numero_cuota: number; monto: number; fecha_limite: string; estado: string }) => (
                <li
                  key={c.numero_cuota}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span>
                    Partida {c.numero_cuota} — {formatCOP(Number(c.monto))} · vence{" "}
                    {formatFecha(c.fecha_limite)}
                  </span>
                  <span className="text-white/60">
                    {ESTADO_CUOTA_LABEL[c.estado] ?? c.estado}
                  </span>
                </li>
              )
            )}
          </ul>
        )}
      </Card>

      <Card titulo="Datos del delegado">
        <form action={guardarDelegado} className="grid gap-3 sm:grid-cols-2">
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
        <ul className="mb-4 divide-y divide-white/10 rounded-lg border border-white/10">
          {(staff ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>
                {s.nombre} · {STAFF_LABEL[s.rol] ?? s.rol}
                {s.documento ? ` · ${s.documento}` : ""}
              </span>
              <form action={eliminarStaff.bind(null, s.id)}>
                <button type="submit" className="text-xs text-red-400 hover:underline">
                  Eliminar
                </button>
              </form>
            </li>
          ))}
          {(staff ?? []).length === 0 && (
            <li className="px-3 py-2 text-sm text-white/50">Todavía no has agregado a nadie.</li>
          )}
        </ul>
        <form action={agregarStaff} className="grid gap-3 sm:grid-cols-4">
          <label className="block text-sm sm:col-span-1">
            <span className="mb-1 block text-white/70">Rol</span>
            <select
              name="rol"
              defaultValue="dt"
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-white outline-none focus:border-muneca-yellow"
            >
              <option value="dt">Director técnico</option>
              <option value="preparador_fisico">Preparador físico</option>
            </select>
          </label>
          <div className="sm:col-span-1">
            <Campo label="Nombre" name="nombre" required />
          </div>
          <div className="sm:col-span-1">
            <Campo label="Documento (opcional)" name="documento" />
          </div>
          <div className="flex items-end sm:col-span-1">
            <button
              type="submit"
              className="w-full rounded-md bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Agregar
            </button>
          </div>
        </form>
      </Card>

      <Card titulo="Colores del equipo">
        <form action={guardarColores} className="flex flex-wrap items-end gap-6">
          <label className="block text-sm">
            <span className="mb-1 block text-white/70">Color primario</span>
            <input
              type="color"
              name="color_primario"
              defaultValue={team?.color_primario ?? "#7b1fa2"}
              className="h-10 w-16 rounded-md border border-white/15 bg-white/5"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-white/70">Color secundario</span>
            <input
              type="color"
              name="color_secundario"
              defaultValue={team?.color_secundario ?? "#f5c518"}
              className="h-10 w-16 rounded-md border border-white/15 bg-white/5"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
          >
            Guardar colores
          </button>
        </form>
      </Card>

      <Card titulo={`Plantilla (${(players ?? []).length}/${maxJugadores})`}>
        {estadoPlantilla.motivo && (
          <p
            className={`mb-4 rounded-md px-3 py-2 text-sm ${
              estadoPlantilla.puedeEditar
                ? "bg-yellow-500/10 text-yellow-300"
                : "bg-white/10 text-white/70"
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
              className="grid gap-2 rounded-lg border border-white/10 p-3 sm:grid-cols-6"
            >
              <input
                name="nombre"
                defaultValue={p.nombre}
                disabled={!estadoPlantilla.puedeEditar}
                placeholder="Nombre"
                required
                className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow disabled:opacity-50 sm:col-span-2"
              />
              <select
                name="tipo_documento"
                defaultValue={p.tipo_documento}
                disabled={!estadoPlantilla.puedeEditar}
                className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow disabled:opacity-50"
              >
                <option value="TI">TI</option>
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="RC">RC</option>
                <option value="PA">PA</option>
              </select>
              <input
                name="numero_documento"
                defaultValue={p.numero_documento}
                disabled={!estadoPlantilla.puedeEditar}
                placeholder="N° documento"
                required
                className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow disabled:opacity-50"
              />
              <input
                name="numero_camiseta"
                type="number"
                min={0}
                defaultValue={p.numero_camiseta ?? ""}
                disabled={!estadoPlantilla.puedeEditar}
                placeholder="N° camiseta"
                className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow disabled:opacity-50"
              />
              <select
                name="posicion"
                defaultValue={p.posicion ?? ""}
                disabled={!estadoPlantilla.puedeEditar}
                className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow disabled:opacity-50"
              >
                <option value="">Posición</option>
                <option value="Arquero">Arquero</option>
                <option value="Defensa">Defensa</option>
                <option value="Mediocampista">Mediocampista</option>
                <option value="Delantero">Delantero</option>
              </select>
              <input
                name="eps"
                defaultValue={p.eps ?? ""}
                disabled={!estadoPlantilla.puedeEditar}
                placeholder="EPS"
                className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow disabled:opacity-50 sm:col-span-2"
              />
              {compraUniformeCopa && (
                <select
                  name="talla_uniforme"
                  defaultValue={p.talla_uniforme ?? ""}
                  disabled={!estadoPlantilla.puedeEditar}
                  className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow disabled:opacity-50"
                >
                  <option value="">Talla uniforme</option>
                  {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
              {estadoPlantilla.puedeEditar && (
                <div className="flex gap-2 sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded-md bg-muneca-yellow px-3 py-1.5 text-xs font-bold uppercase text-muneca-black"
                  >
                    Guardar
                  </button>
                  <button
                    type="submit"
                    formAction={eliminarJugador.bind(null, p.id)}
                    className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </form>
          ))}
          {(players ?? []).length === 0 && (
            <p className="text-sm text-white/50">Todavía no has cargado jugadores.</p>
          )}
        </div>

        {estadoPlantilla.puedeEditar && (players ?? []).length < maxJugadores && (
          <form
            action={agregarJugador}
            className="mt-4 grid gap-2 rounded-lg border border-dashed border-white/20 p-3 sm:grid-cols-6"
          >
            <input
              name="nombre"
              placeholder="Nombre"
              required
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow sm:col-span-2"
            />
            <select
              name="tipo_documento"
              defaultValue="CC"
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow"
            >
              <option value="TI">TI</option>
              <option value="CC">CC</option>
              <option value="CE">CE</option>
              <option value="RC">RC</option>
              <option value="PA">PA</option>
            </select>
            <input
              name="numero_documento"
              placeholder="N° documento"
              required
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow"
            />
            <input
              name="numero_camiseta"
              type="number"
              min={0}
              placeholder="N° camiseta"
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow"
            />
            <select
              name="posicion"
              defaultValue=""
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow"
            >
              <option value="">Posición</option>
              <option value="Arquero">Arquero</option>
              <option value="Defensa">Defensa</option>
              <option value="Mediocampista">Mediocampista</option>
              <option value="Delantero">Delantero</option>
            </select>
            <input
              name="eps"
              placeholder="EPS"
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow sm:col-span-2"
            />
            {compraUniformeCopa && (
              <select
                name="talla_uniforme"
                defaultValue=""
                className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-muneca-yellow"
              >
                <option value="">Talla uniforme</option>
                {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full rounded-md bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
              >
                Agregar jugador
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
