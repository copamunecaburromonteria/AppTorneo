import { Users, FileText, DollarSign, CalendarDays, ShieldCheck, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard, type StatCardColor } from "@/components/admin/stat-card";

function formatCOP(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

type Stat = {
  label: string;
  valor: string;
  detalle: string;
  icon: LucideIcon;
  color: StatCardColor;
};

/**
 * Fila de estadísticas del panel admin — se muestra igual en todas las
 * pestañas (Equipos y pagos, Preinscripciones, Partidos, Árbitros,
 * Operadores), justo debajo del título. Todos los valores salen de
 * consultas reales, no son placeholders: equipos validados sobre el cupo
 * configurado en `torneo_config`, preinscritos/invitados de la nueva
 * modalidad de preinscripción (ver `claude/plan-fases-tareas.md`),
 * recaudado sobre la meta de inscripciones (cupo × valor de inscripción —
 * todavía no hay una meta de patrocinio propia en el sistema, ver brief
 * original sección 6), partidos programados/finalizados y árbitros activos.
 */
export async function AdminHeaderStats() {
  const supabase = await createClient();

  const [
    { count: validados },
    { count: preinscritos },
    { count: invitados },
    { data: config },
    { data: pagos },
    { count: partidosProgramados },
    { count: partidosFinalizados },
    { count: arbitrosActivos },
  ] = await Promise.all([
    supabase.from("teams").select("*", { count: "exact", head: true }).eq("estado_inscripcion", "validado"),
    supabase.from("teams").select("*", { count: "exact", head: true }).eq("estado_inscripcion", "preinscrito"),
    supabase.from("teams").select("*", { count: "exact", head: true }).eq("estado_inscripcion", "invitado"),
    supabase.from("torneo_config").select("numero_equipos_torneo, monto_inscripcion").eq("id", 1).maybeSingle(),
    supabase.from("payments").select("monto_pagado"),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("estado", "programado"),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("estado", "finalizado"),
    supabase.from("arbitros").select("*", { count: "exact", head: true }).eq("activo", true),
  ]);

  const cupo = (config?.numero_equipos_torneo as number | undefined) ?? 0;
  const montoInscripcion = Number(config?.monto_inscripcion ?? 0);
  const recaudado = (pagos ?? []).reduce((acc, p) => acc + Number(p.monto_pagado ?? 0), 0);
  const metaInscripciones = cupo * montoInscripcion;

  const stats: Stat[] = [
    {
      label: "Equipos validados",
      valor: `${validados ?? 0}/${cupo || "—"}`,
      detalle: "cupo del torneo",
      icon: Users,
      color: "purple",
    },
    {
      label: "Preinscritos",
      valor: `${preinscritos ?? 0}`,
      detalle: `${invitados ?? 0} invitados esperando pago`,
      icon: FileText,
      color: "yellow",
    },
    {
      label: "Recaudado",
      valor: formatCOP(recaudado),
      detalle: metaInscripciones > 0 ? `de ${formatCOP(metaInscripciones)} en inscripciones` : "en inscripciones",
      icon: DollarSign,
      color: "green",
    },
    {
      label: "Partidos programados",
      valor: `${partidosProgramados ?? 0}`,
      detalle: `${partidosFinalizados ?? 0} finalizados`,
      icon: CalendarDays,
      color: "purple",
    },
    {
      label: "Árbitros activos",
      valor: `${arbitrosActivos ?? 0}`,
      detalle: "en la nómina",
      icon: ShieldCheck,
      color: "red",
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
      {stats.map((s) => (
        <StatCard
          key={s.label}
          icon={s.icon}
          color={s.color}
          label={s.label}
          valor={s.valor}
          detalle={s.detalle}
        />
      ))}
    </div>
  );
}
