"use client";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatoICS(fecha: Date): string {
  return (
    fecha.getUTCFullYear().toString() +
    pad(fecha.getUTCMonth() + 1) +
    pad(fecha.getUTCDate()) +
    "T" +
    pad(fecha.getUTCHours()) +
    pad(fecha.getUTCMinutes()) +
    pad(fecha.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Genera un .ics del lado del cliente (sin librería) y dispara la descarga
 * — funciona con Google Calendar, Outlook, Apple Calendar, etc. Se usa solo
 * para partidos "programado" (con fecha futura conocida).
 */
export function AgregarCalendarioBoton({
  titulo,
  inicioIso,
  duracionMinutos,
  ubicacion,
}: {
  titulo: string;
  inicioIso: string;
  duracionMinutos: number;
  ubicacion: string;
}) {
  function descargar() {
    const inicio = new Date(inicioIso);
    const fin = new Date(inicio.getTime() + duracionMinutos * 60000);
    const uid = `${inicio.getTime()}-${Math.random().toString(36).slice(2)}@copamunecaburro`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Copa Muñeca e'Burro//ES",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatoICS(new Date())}`,
      `DTSTART:${formatoICS(inicio)}`,
      `DTEND:${formatoICS(fin)}`,
      `SUMMARY:${titulo}`,
      `LOCATION:${ubicacion}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "partido-copa-muneca-eburro.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={descargar}
      className="mt-4 inline-flex items-center gap-2 rounded-md border border-muneca-purple px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-muneca-purple transition-colors hover:bg-muneca-purple hover:text-white"
    >
      📅 Agregar al calendario
    </button>
  );
}
