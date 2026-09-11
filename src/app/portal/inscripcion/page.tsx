import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { evaluarEstadoPlantilla } from "@/lib/portal/plantilla";
import { agregarJugador, editarJugador, eliminarJugador } from "@/app/portal/actions";
import { WizardShell } from "@/components/wizard/wizard-shell";

const inputClass =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-muneca-black outline-none transition-colors focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20 disabled:bg-black/[0.03] disabled:opacity-60";

const secondaryButtonClass =
  "rounded-md bg-black/5 px-4 py-2 text-sm font-semibold text-muneca-black transition-colors hover:bg-black/10";

const yellowButtonClass =
  "rounded-md bg-muneca-yellow px-6 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02]";

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

const ESTADO_CUOTA_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
};

function Card({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-2xl text-muneca-black">{titulo}</h2>
      {subtitulo && <p className="mt-1 text-sm text-black/60">{subtitulo}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function PasoNav({ atras, siguiente, textoSiguiente = "Siguiente →" }: { atras?: string; siguiente?: string; textoSiguiente?: string }) {
  return (
    <div className="mt-6 flex items-center justify-between">
      {atras ? (
        <Link href={atras} className="rounded-md px-4 py-2.5 text-sm font-semibold text-muneca-black/60 transition-colors hover:text-muneca-black">
          ← Atrás
        </Link>
      ) : (
        <span />
      )}
      {siguiente && (
        <Link href={siguiente} className={yellowButtonClass}>
          {textoSiguiente}
        </Link>
      )}
    </div>
  );
}

export default async function PortalInscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ paso?: string }>;
}) {
  const { paso: pasoRaw } = await searchParams;
  const paso = Math.min(7, Math.max(4, Number(pasoRaw) || 4));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, team_id")
    .eq("id", user.id)
    .single();

  if (profile?.rol !== "equipo" || !profile.team_id) redirect("/portal");

  const teamId = profile.team_id as string;

  const [{ data: team }, { data: delegado }, { data: players }, { data: config }, { data: pago }, estadoPlantilla] =
    await Promise.all([
      supabase.from("teams").select("nombre_equipo, escudo_url, compra_uniforme_copa").eq("id", teamId).single(),
      supabase.from("team_delegado").select("nombre, apellido, documento, contacto_principal").eq("team_id", teamId).maybeSingle(),
      supabase.from("players").select("*").eq("team_id", teamId).order("created_at"),
      supabase.from("torneo_config").select("max_jugadores_por_equipo").eq("id", 1).single(),
      supabase
        .from("payments")
        .select("monto_total, monto_pagado, payment_installments(numero_cuota, monto, fecha_limite, estado)")
        .eq("team_id", teamId)
        .maybeSingle(),
      evaluarEstadoPlantilla(supabase, teamId),
    ]);

  const maxJugadores = config?.max_jugadores_por_equipo ?? 15;
  const compraUniformeCopa = Boolean(team?.compra_uniforme_copa);
  const delegadoNombreCompleto = delegado ? [delegado.nombre, delegado.apellido].filter(Boolean).join(" ") : undefined;
  const cuotas = (pago?.payment_installments ?? []).slice().sort(
    (a: { numero_cuota: number }, b: { numero_cuota: number }) => a.numero_cuota - b.numero_cuota
  );

  return (
    <WizardShell
      pasoActual={paso}
      titulo="COMPLETA TU INSCRIPCIÓN"
      subtitulo={team?.nombre_equipo ?? "Tu equipo"}
      userChip={
        delegadoNombreCompleto
          ? { nombre: delegadoNombreCompleto, rol: "Delegado", equipo: team?.nombre_equipo ?? undefined }
          : undefined
      }
      team={{
        nombreEquipo: team?.nombre_equipo ?? "",
        escudoUrl: team?.escudo_url,
        delegadoNombre: delegadoNombreCompleto,
        delegadoContacto: delegado?.contacto_principal ?? undefined,
        delegadoDocumento: delegado?.documento ?? undefined,
      }}
    >
      <div className="space-y-6">
        {paso === 4 && (
          <Card titulo={`4. Plantilla de jugadores (${(players ?? []).length}/${maxJugadores})`} subtitulo="Registra a tus jugadores — puedes seguir editando esto después desde el portal.">
            {estadoPlantilla.motivo && (
              <p className={`mb-4 rounded-md px-3 py-2 text-sm ${estadoPlantilla.puedeEditar ? "bg-amber-50 text-amber-700" : "bg-black/5 text-black/60"}`}>
                {estadoPlantilla.motivo}
              </p>
            )}

            <div className="space-y-3">
              {(players ?? []).map((p) => (
                <form key={p.id} action={editarJugador.bind(null, p.id)} className="grid gap-2 rounded-lg border border-black/10 p-3 sm:grid-cols-6">
                  <input name="nombre" defaultValue={p.nombre} disabled={!estadoPlantilla.puedeEditar} placeholder="Nombre" required className={`${inputClass} px-2 py-1.5 sm:col-span-2`} />
                  <select name="tipo_documento" defaultValue={p.tipo_documento} disabled={!estadoPlantilla.puedeEditar} className={`${inputClass} px-2 py-1.5`}>
                    <option value="TI">TI</option>
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="RC">RC</option>
                    <option value="PA">PA</option>
                  </select>
                  <input name="numero_documento" defaultValue={p.numero_documento} disabled={!estadoPlantilla.puedeEditar} placeholder="N° documento" required className={`${inputClass} px-2 py-1.5`} />
                  <input name="numero_camiseta" type="number" min={0} defaultValue={p.numero_camiseta ?? ""} disabled={!estadoPlantilla.puedeEditar} placeholder="N° camiseta" className={`${inputClass} px-2 py-1.5`} />
                  <select name="posicion" defaultValue={p.posicion ?? ""} disabled={!estadoPlantilla.puedeEditar} className={`${inputClass} px-2 py-1.5`}>
                    <option value="">Posición</option>
                    <option value="Arquero">Arquero</option>
                    <option value="Defensa">Defensa</option>
                    <option value="Mediocampista">Mediocampista</option>
                    <option value="Delantero">Delantero</option>
                  </select>
                  <input name="eps" defaultValue={p.eps ?? ""} disabled={!estadoPlantilla.puedeEditar} placeholder="EPS" className={`${inputClass} px-2 py-1.5 sm:col-span-2`} />
                  {compraUniformeCopa && (
                    <select name="talla_uniforme" defaultValue={p.talla_uniforme ?? ""} disabled={!estadoPlantilla.puedeEditar} className={`${inputClass} px-2 py-1.5`}>
                      <option value="">Talla uniforme</option>
                      {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  )}
                  {estadoPlantilla.puedeEditar && (
                    <div className="flex gap-2 sm:col-span-2">
                      <button type="submit" className="rounded-md bg-muneca-yellow px-3 py-1.5 text-xs font-bold uppercase text-muneca-black">Guardar</button>
                      <button type="submit" formAction={eliminarJugador.bind(null, p.id)} className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100">Eliminar</button>
                    </div>
                  )}
                </form>
              ))}
              {(players ?? []).length === 0 && <p className="text-sm text-black/50">Todavía no has cargado jugadores.</p>}
            </div>

            {estadoPlantilla.puedeEditar && (players ?? []).length < maxJugadores && (
              <form action={agregarJugador} className="mt-4 grid gap-2 rounded-lg border border-dashed border-black/20 p-3 sm:grid-cols-6">
                <input name="nombre" placeholder="Nombre" required className={`${inputClass} px-2 py-1.5 sm:col-span-2`} />
                <select name="tipo_documento" defaultValue="CC" className={`${inputClass} px-2 py-1.5`}>
                  <option value="TI">TI</option>
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="RC">RC</option>
                  <option value="PA">PA</option>
                </select>
                <input name="numero_documento" placeholder="N° documento" required className={`${inputClass} px-2 py-1.5`} />
                <input name="numero_camiseta" type="number" min={0} placeholder="N° camiseta" className={`${inputClass} px-2 py-1.5`} />
                <select name="posicion" defaultValue="" className={`${inputClass} px-2 py-1.5`}>
                  <option value="">Posición</option>
                  <option value="Arquero">Arquero</option>
                  <option value="Defensa">Defensa</option>
                  <option value="Mediocampista">Mediocampista</option>
                  <option value="Delantero">Delantero</option>
                </select>
                <input name="eps" placeholder="EPS" className={`${inputClass} px-2 py-1.5 sm:col-span-2`} />
                {compraUniformeCopa && (
                  <select name="talla_uniforme" defaultValue="" className={`${inputClass} px-2 py-1.5`}>
                    <option value="">Talla uniforme</option>
                    {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                )}
                <div className="sm:col-span-2">
                  <button type="submit" className={`w-full ${secondaryButtonClass}`}>Agregar jugador</button>
                </div>
              </form>
            )}

            <PasoNav siguiente="/portal/inscripcion?paso=5" />
          </Card>
        )}

        {paso === 5 && (
          <Card titulo="5. Documentos" subtitulo="Carga los archivos del equipo.">
            <div className="rounded-xl border border-dashed border-black/20 bg-black/[0.02] p-8 text-center">
              <p className="font-display text-lg text-muneca-black">Próximamente</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-black/60">
                Muy pronto vas a poder cargar aquí la cédula del delegado, la de cada jugador y los
                demás documentos del equipo. Si necesitas enviarlos ahora, escríbenos por WhatsApp y
                los dejamos guardados.
              </p>
            </div>
            <PasoNav atras="/portal/inscripcion?paso=4" siguiente="/portal/inscripcion?paso=6" />
          </Card>
        )}

        {paso === 6 && (
          <Card titulo="6. Pago de inscripción" subtitulo="Plan de pagos por partidas.">
            {pago ? (
              <>
                <div className="rounded-xl bg-muneca-black p-5 text-muneca-white">
                  <p className="text-xs uppercase tracking-wide text-donkey-gray">Total a pagar</p>
                  <p className="font-display mt-1 text-3xl text-muneca-yellow">{formatCOP(Number(pago.monto_total))}</p>
                  <p className="mt-1 text-sm text-white/70">Pagado {formatCOP(Number(pago.monto_pagado))}</p>
                </div>
                {cuotas.length > 0 && (
                  <ul className="mt-4 divide-y divide-black/10 rounded-xl border border-black/10">
                    {cuotas.map((c: { numero_cuota: number; monto: number; fecha_limite: string; estado: string }) => (
                      <li key={c.numero_cuota} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="text-black/70">
                          Partida {c.numero_cuota} — {formatCOP(Number(c.monto))} · vence {formatFecha(c.fecha_limite)}
                        </span>
                        <span className="font-semibold text-muneca-black">{ESTADO_CUOTA_LABEL[c.estado] ?? c.estado}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-sm text-black/60">
                  El pago en línea con Wompi se habilita muy pronto — te avisaremos por correo y
                  WhatsApp apenas esté listo para pagar la primera partida.
                </p>
              </>
            ) : (
              <p className="text-sm text-black/60">Todavía no se generó tu plan de pagos.</p>
            )}
            <PasoNav atras="/portal/inscripcion?paso=5" siguiente="/portal/inscripcion?paso=7" />
          </Card>
        )}

        {paso === 7 && (
          <Card titulo="7. Confirmación" subtitulo="¡Listo para el torneo!">
            <div className="rounded-xl bg-muneca-purple/5 p-6 text-center">
              <p className="font-display text-2xl text-muneca-purple">¡{team?.nombre_equipo ?? "Tu equipo"} ESTÁ EN LA COPA!</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-black/70">
                Ya completaste el recorrido de inscripción. Puedes seguir editando tu plantilla,
                cuerpo técnico y colores del equipo cuando quieras desde el portal.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/portal" className={yellowButtonClass}>Ir a mi equipo →</Link>
                <Link href="/" className={secondaryButtonClass}>Ver el sitio</Link>
              </div>
            </div>
            <PasoNav atras="/portal/inscripcion?paso=6" />
          </Card>
        )}
      </div>
    </WizardShell>
  );
}
