import { createClient } from "@/lib/supabase/server";
import { armarLinkWhatsApp } from "@/lib/whatsapp";
import { PreguntasAcordeon, type PreguntaFrecuente } from "@/components/home/preguntas-acordeon";

// Mismo WhatsApp del torneo que ya usan `patrocinadores.tsx` y
// `/admin/cargos-tarjetas` — número de contacto general de la Copa.
const WHATSAPP_TORNEO = "573126070588";

function formatCOP(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}

function formatFechaLarga(fechaIso: string): string {
  return new Date(`${fechaIso}T00:00:00`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Sección "Preguntas frecuentes" del home (pedida por Fernando el
 * 2026-09-26). Los montos/fechas de inscripción se leen de `torneo_config`
 * en vez de quedar escritos a mano, para que esta sección nunca quede
 * contradiciendo el precio real que se cobra en `/inscripcion` — ver
 * `claude/reglamento.md` para el historial completo de esta decisión
 * (inscripción "todo incluido" $1.500.000, uniforme incluido, devolución de
 * dinero).
 *
 * Alcance: 9 preguntas, las más consultadas antes de inscribirse — no es el
 * reglamento completo. El link "Preguntas frecuentes" del footer sigue
 * apuntando a "#" (página propia pendiente, ver `plan-fases-tareas.md`);
 * cuando se construya, puede arrancar de esta misma lista.
 */
export async function PreguntasFrecuentes() {
  const supabase = await createClient();
  const { data: config } = await supabase
    .from("torneo_config")
    .select("monto_inscripcion, fecha_inicio_torneo, dias_previo_torneo_ultima_cuota, max_jugadores_por_equipo")
    .eq("id", 1)
    .maybeSingle();

  const montoInscripcion = Number(config?.monto_inscripcion ?? 1500000);
  const maxJugadores = config?.max_jugadores_por_equipo ?? 15;
  const fechaInicioTorneo = (config?.fecha_inicio_torneo as string | null) ?? null;
  const diasPrevio = config?.dias_previo_torneo_ultima_cuota ?? 5;

  let textoSegundaCuota = "unos días antes del inicio del torneo";
  if (fechaInicioTorneo) {
    const inicio = new Date(`${fechaInicioTorneo}T00:00:00`);
    const limite = new Date(inicio);
    limite.setDate(limite.getDate() - diasPrevio);
    textoSegundaCuota = `el ${formatFechaLarga(limite.toISOString().slice(0, 10))}`;
  }

  const linkPatrocinio = armarLinkWhatsApp(
    WHATSAPP_TORNEO,
    "Hola, quiero información sobre patrocinar la Copa Muñeca e'Burro."
  );

  const ITEMS: PreguntaFrecuente[] = [
    {
      pregunta: "¿Qué es la Copa Muñeca e'Burro?",
      respuesta:
        "Un torneo de fútbol 7, categoría libre, en Montería, Córdoba — 24 equipos jugando durante varias semanas, no un evento de un solo fin de semana.",
    },
    {
      pregunta: "¿Cómo es el formato del torneo?",
      respuesta:
        "4 grupos de 6 equipos, todos contra todos dentro del grupo (5 partidos garantizados). Clasifican los 4 primeros de cada grupo a octavos, y de ahí sigue la eliminación directa hasta la gran final.",
      linkHref: "/como-funciona",
      linkTexto: "Ver cómo funciona completo →",
    },
    {
      pregunta: "¿Cuándo empieza y en qué horarios se juega?",
      respuesta:
        "Fecha tentativa de inicio: 29 de octubre. Los partidos se juegan jueves, viernes y sábado, a las 7:00 y 8:00 p. m.",
    },
    {
      pregunta: "¿Cuánto cuesta inscribir un equipo y qué incluye?",
      respuesta: `${formatCOP(montoInscripcion)} COP por equipo — incluye uniforme oficial, cancha, hidratación, arbitraje y la plataforma web de la Copa.`,
    },
    {
      pregunta: "¿Puedo pagar la inscripción en cuotas?",
      respuesta: `Sí, en 2 cuotas: la primera el día de la inscripción, y la segunda ${textoSegundaCuota}.`,
    },
    {
      pregunta: "¿Hay devolución de dinero si mi equipo se retira antes de iniciar el torneo?",
      respuesta:
        "Sí. Si tu equipo solo pagó la primera cuota, se devuelve el 50% de esa cuota. Si ya pagaste la inscripción completa, se devuelve el 75% del valor total.",
    },
    {
      pregunta: "¿Cuántos jugadores puede tener mi plantilla?",
      respuesta: `Hasta ${maxJugadores} jugadores en la plantilla. En cancha juegan 7 a la vez (6 jugadores + 1 portero), más 1 DT — el resto queda como suplentes.`,
    },
    {
      pregunta: "¿Cómo funciona la votación del MVP?",
      respuesta:
        "Con un solo código QR para todo el torneo, disponible en ambas canchas. La votación se abre sola en los últimos minutos de cada partido y se mantiene abierta un rato después de terminado.",
    },
    {
      pregunta: "¿Cuál es la premiación?",
      respuesta:
        "$10.000.000 COP en premios — campeón, subcampeón, tercer puesto, mejor arquero, goleador, y 3 categorías sorpresa.",
      linkHref: "/premios",
      linkTexto: "Ver toda la premiación →",
    },
    {
      pregunta: "¿Cómo puede mi marca patrocinar la Copa?",
      respuesta:
        "Escríbenos por WhatsApp y te contamos los espacios y niveles de patrocinio disponibles.",
      linkHref: linkPatrocinio ?? undefined,
      linkTexto: "Escribir por WhatsApp →",
    },
  ];

  return (
    <section id="preguntas-frecuentes" className="bg-muneca-black">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <p className="border-l-4 border-muneca-yellow pl-3 text-sm font-bold uppercase tracking-widest text-muneca-yellow">
          Preguntas frecuentes
        </p>
        <h2 className="font-display mt-2 pl-3 text-3xl text-white sm:text-4xl">
          LO QUE MÁS PREGUNTAN
        </h2>

        <PreguntasAcordeon items={ITEMS} />
      </div>
    </section>
  );
}
