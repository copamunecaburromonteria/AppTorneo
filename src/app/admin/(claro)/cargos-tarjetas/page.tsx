import { createClient } from "@/lib/supabase/server";
import { armarLinkWhatsApp } from "@/lib/whatsapp";
import { LABEL_TIPO_TARJETA } from "@/lib/pagos/confirmar-cargos";
import { MarcarCargosPagadosForm } from "@/app/admin/cargos-tarjetas/marcar-pagados-form";

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

type Delegado = {
  nombre: string;
  whatsapp_notificaciones: string | null;
  contacto_principal: string | null;
};
type TeamInfo = { id: string; nombre_equipo: string; team_delegado: Delegado | Delegado[] | null };
type TeamRel = TeamInfo | TeamInfo[] | null;
type JugadorInfo = { nombre: string };
type JugadorRel = JugadorInfo | JugadorInfo[] | null;

function unwrap<T>(rel: T | T[] | null): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

/**
 * Vista admin de cargos por tarjetas pendientes, agrupados por equipo — para
 * saber a quién avisar y, mientras Wompi no cubra el 100% de los pagos,
 * poder validar manualmente los que llegan por transferencia/Nequi/efectivo
 * (mismo patrón que "Equipos y pagos", ver `marcar-pagados-form.tsx`). El
 * link de WhatsApp abre el chat con el mensaje ya armado — no hay envío
 * automático (no hay WhatsApp Business API conectada, ver `lib/whatsapp.ts`).
 *
 * Vive dentro del grupo de rutas `(claro)` (igual que arbitros/operadores/
 * partidos/preinscripciones/accesos) para heredar el layout con
 * SiteHeader/Footer, breadcrumbs y AdminNav — los archivos de soporte
 * (actions.ts, marcar-pagados-form.tsx) se quedan en la carpeta plana
 * `admin/cargos-tarjetas/`, mismo patrón que esas otras secciones.
 */
export default async function AdminCargosTarjetasPage() {
  const supabase = await createClient();

  const { data: cargosRaw, error } = await supabase
    .from("cargos_tarjetas")
    .select(
      "id, tipo_tarjeta, monto, created_at, metodo_pago_declarado, pago_reportado_at, comprobante_url, jugador:jugador_id(nombre), teams:team_id(id, nombre_equipo, team_delegado(nombre, whatsapp_notificaciones, contacto_principal))"
    )
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });

  if (error) {
    return <p className="text-sm text-rose-600">No se pudieron cargar los cargos: {error.message}</p>;
  }

  const porEquipo = new Map<
    string,
    {
      equipo: TeamInfo;
      items: { id: string; jugadorNombre: string; tipo: string; monto: number }[];
      reportadoAt: string | null;
      comprobanteUrl: string | null;
    }
  >();

  for (const c of cargosRaw ?? []) {
    const equipo = unwrap<TeamInfo>(c.teams as TeamRel);
    if (!equipo) continue;
    const jugador = unwrap<JugadorInfo>(c.jugador as JugadorRel);
    const entrada = porEquipo.get(equipo.id) ?? { equipo, items: [], reportadoAt: null, comprobanteUrl: null };
    entrada.items.push({
      id: c.id as string,
      jugadorNombre: jugador?.nombre ?? "—",
      tipo: LABEL_TIPO_TARJETA[c.tipo_tarjeta as string] ?? (c.tipo_tarjeta as string),
      monto: Number(c.monto),
    });
    if (c.pago_reportado_at) entrada.reportadoAt = c.pago_reportado_at as string;
    if (c.comprobante_url) entrada.comprobanteUrl = c.comprobante_url as string;
    porEquipo.set(equipo.id, entrada);
  }

  const equipos = Array.from(porEquipo.values()).sort(
    (a, b) => b.items.reduce((s, i) => s + i.monto, 0) - a.items.reduce((s, i) => s + i.monto, 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">Cargos por tarjeta</h1>
        <p className="mt-1 text-sm text-muneca-black/60">
          Un jugador con tarjetas sin pagar no debe jugar hasta saldar la deuda. El equipo puede pagar
          en línea desde su portal o por jugador en /pagos-tarjetas; acá puedes validar manualmente lo
          que llegue por otro medio.
        </p>
      </div>

      {equipos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-muneca-black/50">
          No hay cargos pendientes por ahora.
        </p>
      ) : (
        <div className="space-y-4">
          {equipos.map(({ equipo, items, reportadoAt, comprobanteUrl }) => {
            const delegado = unwrap<Delegado>(equipo.team_delegado);
            const numeroContacto = delegado?.whatsapp_notificaciones || delegado?.contacto_principal;
            const total = items.reduce((s, i) => s + i.monto, 0);
            const mensaje = `Hola ${delegado?.nombre ?? ""}, te escribimos de la Copa Muñeca e'Burro: ${
              equipo.nombre_equipo
            } tiene ${formatCOP(total)} en tarjetas sin pagar. Recuerda que un jugador con tarjetas pendientes no debe jugar hasta saldarlas. Puedes pagar desde el portal (${
              "https://xn--copamuecaburro-vnb.com"
            }/portal) o por jugador en /pagos-tarjetas.`;
            const linkWhatsApp = armarLinkWhatsApp(numeroContacto, mensaje);

            return (
              <div key={equipo.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base uppercase tracking-wide text-muneca-black">
                      {equipo.nombre_equipo}
                    </p>
                    <p className="text-sm text-muneca-black/60">
                      {delegado?.nombre ?? "Delegado sin nombre"}
                      {numeroContacto ? ` · ${numeroContacto}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {linkWhatsApp && (
                      <a
                        href={linkWhatsApp}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase text-white transition-transform hover:scale-[1.03]"
                      >
                        Avisar por WhatsApp
                      </a>
                    )}
                    <MarcarCargosPagadosForm teamId={equipo.id} />
                  </div>
                </div>

                {reportadoAt && (
                  <p className="mt-2 rounded-md bg-muneca-purple/10 px-3 py-1.5 text-xs font-semibold text-muneca-purple">
                    💜 Reportó transferencia el{" "}
                    {new Date(reportadoAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}
                    {comprobanteUrl && (
                      <>
                        {" · "}
                        <a href={comprobanteUrl} target="_blank" rel="noreferrer" className="underline">
                          Ver comprobante
                        </a>
                      </>
                    )}
                  </p>
                )}

                <ul className="mt-3 divide-y divide-black/5 rounded-lg bg-black/[0.02]">
                  {items.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="text-muneca-black/70">
                        {i.jugadorNombre} — {i.tipo}
                      </span>
                      <span className="font-semibold text-muneca-black">{formatCOP(i.monto)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-right text-sm font-bold text-muneca-black">Total: {formatCOP(total)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
