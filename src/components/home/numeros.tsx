import { createClient } from "@/lib/supabase/server";

/**
 * El premio al campeón todavía no vive en `torneo_config` — no es un dato
 * operativo del sistema, es una decisión comercial que Fernando aún no ha
 * cerrado (ver brief original, sección 7: "$10.000.000" es una propuesta
 * inicial, no un valor definitivo). Se mantiene como referencia manual
 * mientras se confirma la premiación real; cuando exista una fuente de
 * verdad para esto (columna en `torneo_config` o similar), reemplazar esta
 * constante por una consulta real.
 */
const PREMIO_CAMPEON_REFERENCIA = "$10M";

export async function Numeros() {
  const supabase = await createClient();

  const [
    { count: totalEquipos },
    { count: totalJugadores },
    { count: totalPartidos },
    { data: config },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("estado_inscripcion", "validado"),
    supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("es_jugador", true)
      .neq("estado", "dado_de_baja"),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase
      .from("torneo_config")
      .select("equipos_por_grupo, numero_grupos, clasificados_por_grupo")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  // Partidos máximo por equipo = partidos garantizados de grupo (todos
  // contra todos dentro del grupo) + rondas de eliminación directa desde
  // los clasificados. Se calcula a partir de `torneo_config`, no se deja
  // fijo, para que siga siendo correcto si cambia el formato en una futura
  // edición (brief original, sección 11: "los números definitivos deben
  // poder actualizarse dinámicamente").
  let partidosMax: number | null = null;
  if (config) {
    const partidosDeGrupo = config.equipos_por_grupo - 1;
    const totalClasificados = config.numero_grupos * config.clasificados_por_grupo;
    const rondasEliminacion = Math.round(Math.log2(totalClasificados));
    partidosMax = partidosDeGrupo + rondasEliminacion;
  }

  const ITEMS = [
    { valor: `${totalEquipos ?? 0}`, label: "Equipos" },
    { valor: `${totalJugadores ?? 0}`, label: "Jugadores" },
    { valor: `${totalPartidos ?? 0}`, label: "Partidos" },
    { valor: partidosMax !== null ? `${partidosMax}` : "—", label: "Partidos máximo por equipo" },
    { valor: PREMIO_CAMPEON_REFERENCIA, label: "En premios" },
  ];

  return (
    <section
      className="relative bg-[url('/brand/numeros-bg-mobile.jpg')] bg-cover bg-center text-muneca-white sm:bg-[url('/brand/numeros-bg-desktop.jpg')]"
    >
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-muneca-yellow">
          — El torneo
        </p>
        <h2 className="font-display mt-2 text-center text-4xl sm:text-5xl">
          EL TORNEO EN NÚMEROS
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-white/70">
          Cifras que hablan de una gran experiencia.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-6 text-center sm:grid-cols-5">
          {ITEMS.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span className="font-display text-4xl text-muneca-yellow sm:text-5xl">
                {item.valor}
              </span>
              <span className="max-w-[10rem] text-xs font-semibold uppercase tracking-wide text-white/70">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
