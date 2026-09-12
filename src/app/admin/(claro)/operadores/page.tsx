import { createClient } from "@/lib/supabase/server";
import { NuevoOperadorForm } from "@/app/admin/operadores/nuevo-operador-form";
import { OperadorAcciones } from "@/app/admin/operadores/operador-acciones";

export default async function OperadoresPage() {
  const supabase = await createClient();

  const { data: operadores } = await supabase
    .from("operadores")
    .select("id, nombre, activo, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-muneca-black">
          Operadores de cancha
        </h1>
        <p className="mt-1 text-sm text-muneca-black/60">
          Cada operador entra a{" "}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">/operador/login</code> con su
          PIN — no usan correo ni contraseña. La cancha se elige en el momento de operar, no queda
          fija por operador.
        </p>
      </div>

      <NuevoOperadorForm />

      {/* Lista mobile-first: una card por operador, apilada. Se ve igual de
          bien en pantalla grande (no hace falta una tabla ancha para 2-3
          operadores). */}
      <div className="space-y-3">
        {(operadores ?? []).map((op) => (
          <div
            key={op.id}
            className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-muneca-black">{op.nombre}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  op.activo ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-muneca-black/50"
                }`}
              >
                {op.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="mt-3">
              <OperadorAcciones operadorId={op.id} activo={op.activo} />
            </div>
          </div>
        ))}

        {(operadores ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-muneca-black/50">
            Todavía no hay operadores registrados.
          </p>
        )}
      </div>
    </div>
  );
}
