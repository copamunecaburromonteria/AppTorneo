import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Delegado = { nombre: string; correo: string; contacto_principal: string | null } | null;
type DelegadoRel = Delegado | Delegado[] | null;

type Cuota = { estado: string };

type Pago = { monto_total: number; monto_pagado: number; payment_installments: Cuota[] | null } | null;
type PagoRel = Pago | Pago[] | null;

type EquipoFila = {
  nombre_equipo: string;
  estado_inscripcion: string;
  created_at: string;
  team_delegado: DelegadoRel;
  payments: PagoRel;
};

function unwrap<T>(rel: T | T[] | null): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

/** Escapa un valor para una celda CSV (RFC 4180): solo hace falta envolver
 * en comillas si trae coma, comilla o salto de línea. */
function celda(valor: string | number): string {
  const texto = String(valor);
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/**
 * Exporta equipos + estado de pago como CSV — la "Exportar reportes" del
 * panel admin. Reporte único por ahora (equipos y pagos, que es lo que hoy
 * existe de verdad en la plataforma); si más adelante hace falta un reporte
 * de partidos/árbitros, se agrega como su propia ruta junto a esta.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No hay sesión activa." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("teams")
    .select(
      `nombre_equipo, estado_inscripcion, created_at,
       team_delegado(nombre, correo, contacto_principal),
       payments(monto_total, monto_pagado, payment_installments(estado))`
    )
    .order("created_at", { ascending: true })
    .returns<EquipoFila[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const encabezado = [
    "Equipo",
    "Estado inscripción",
    "Delegado",
    "Correo",
    "Contacto",
    "Monto pagado",
    "Monto total",
    "Cuotas pendientes",
    "Cuotas vencidas",
    "Fecha de inscripción",
  ];

  const filas = (data ?? []).map((equipo) => {
    const delegado = unwrap(equipo.team_delegado);
    const pago = unwrap(equipo.payments);
    const cuotas = pago?.payment_installments ?? [];
    const cuotasPendientes = cuotas.filter((c) => c.estado === "pendiente").length;
    const cuotasVencidas = cuotas.filter((c) => c.estado === "vencida").length;

    return [
      celda(equipo.nombre_equipo),
      celda(equipo.estado_inscripcion),
      celda(delegado?.nombre ?? ""),
      celda(delegado?.correo ?? ""),
      celda(delegado?.contacto_principal ?? ""),
      celda(Number(pago?.monto_pagado ?? 0)),
      celda(Number(pago?.monto_total ?? 0)),
      celda(cuotasPendientes),
      celda(cuotasVencidas),
      celda(new Date(equipo.created_at).toLocaleDateString("es-CO")),
    ].join(",");
  });

  const csv = "﻿" + [encabezado.join(","), ...filas].join("\n");
  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="copa-equipos-pagos-${fecha}.csv"`,
    },
  });
}
