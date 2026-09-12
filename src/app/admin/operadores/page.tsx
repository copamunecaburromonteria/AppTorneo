import { createClient } from "@/lib/supabase/server";
import { NuevoOperadorForm } from "./nuevo-operador-form";
import { OperadorAcciones } from "./operador-acciones";

export default async function OperadoresPage() {
  const supabase = await createClient();

  const { data: operadores } = await supabase
    .from("operadores")
    .select("id, nombre, activo, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide">Operadores de cancha</h1>
        <p className="mt-1 text-sm text-white/60">
          Cada operador entra a{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">/operador/login</code> con su
          PIN — no usan correo ni contraseña. La cancha se elige en el momento de operar, no queda
          fija por operador.
        </p>
      </div>

      <NuevoOperadorForm />

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {(operadores ?? []).map((op) => (
              <tr key={op.id}>
                <td className="px-4 py-3 font-medium">{op.nombre}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      op.activo ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {op.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <OperadorAcciones operadorId={op.id} activo={op.activo} />
                </td>
              </tr>
            ))}
            {(operadores ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-white/50">
                  Todavía no hay operadores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
