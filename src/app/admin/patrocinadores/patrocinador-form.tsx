"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { crearPatrocinador, actualizarPatrocinador } from "@/app/admin/patrocinadores/actions";
import { NIVEL_LABEL, NIVELES_PATROCINIO, type PatrocinadorPublico } from "@/lib/patrocinadores/tipos";
import { SLOTS_PATROCINIO } from "@/lib/patrocinadores/slots";

type EstadoForm = { success: boolean; error: string };

const estadoInicial: EstadoForm = { success: false, error: "" };

async function accionCrear(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const result = await crearPatrocinador({ success: false, error: "" }, formData);
  return result.success ? { success: true, error: "" } : { success: false, error: result.error };
}

async function accionEditar(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const result = await actualizarPatrocinador({ success: false, error: "" }, formData);
  return result.success ? { success: true, error: "" } : { success: false, error: result.error };
}

const inputClass =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-muneca-black outline-none focus:border-muneca-purple focus:ring-2 focus:ring-muneca-purple/20";

const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muneca-black/50";

/**
 * Formulario de patrocinador, compartido entre "crear" y "editar" — mismos
 * campos, distinta Server Action y distintos valores iniciales. Los slots
 * marcados `disponible: true` en `SLOTS_PATROCINIO` son seleccionables
 * (Fase 2, 2026-09-21: home, tabla de posiciones, votación MVP, resultado
 * de MVP y perfil de equipo); el resto (por ahora solo "galería") aparece
 * deshabilitado como catálogo de lo que viene, para que Fernando ya vea el
 * inventario completo.
 */
export function PatrocinadorForm({
  modo,
  patrocinador,
  onGuardado,
}: {
  modo: "crear" | "editar";
  patrocinador?: PatrocinadorPublico & { activo: boolean; activo_desde: string | null; activo_hasta: string | null };
  onGuardado?: () => void;
}) {
  const accion = modo === "crear" ? accionCrear : accionEditar;
  const [state, formAction, pending] = useActionState(accion, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);
  const [previaLogo, setPreviaLogo] = useState<string | null>(patrocinador?.logo_url ?? null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // Limpia la vista previa del logo (uncontrolled hasta ahora por el
      // input file) para que quede igual que justo después de guardar —
      // vuelve al logo actual en modo editar, o a "sin logo" al crear.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviaLogo(patrocinador?.logo_url ?? null);
      onGuardado?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const slotsActivos = new Set(patrocinador?.slots ?? (modo === "crear" ? ["home-slider"] : []));

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm sm:grid-cols-2"
    >
      {modo === "editar" && patrocinador && <input type="hidden" name="id" value={patrocinador.id} />}

      <div>
        <label className={labelClass}>Nombre de la marca *</label>
        <input name="nombre" required defaultValue={patrocinador?.nombre} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Nivel *</label>
        <select name="nivel" required defaultValue={patrocinador?.nivel ?? ""} className={inputClass}>
          <option value="" disabled>
            Selecciona un nivel
          </option>
          {NIVELES_PATROCINIO.map((nivel) => (
            <option key={nivel} value={nivel}>
              {NIVEL_LABEL[nivel]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Enlace (web / redes)</label>
        <input
          name="link_url"
          type="url"
          placeholder="https://..."
          defaultValue={patrocinador?.link_url ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Orden</label>
        <input
          name="orden"
          type="number"
          defaultValue={patrocinador?.orden ?? 0}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Vigente desde</label>
        <input
          name="activo_desde"
          type="date"
          defaultValue={patrocinador?.activo_desde ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Vigente hasta</label>
        <input
          name="activo_hasta"
          type="date"
          defaultValue={patrocinador?.activo_hasta ?? ""}
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass}>
          Logo {modo === "crear" ? "*" : "(déjalo vacío para conservar el actual)"}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {previaLogo && (
            <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-md border border-black/10 bg-black/[0.02] p-1.5">
              <Image
                src={previaLogo}
                alt=""
                width={120}
                height={80}
                className="h-full w-full object-contain"
                unoptimized
              />
            </div>
          )}
          <input
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            required={modo === "crear"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreviaLogo(URL.createObjectURL(file));
            }}
            className="flex-1 text-sm text-muneca-black/70 file:mr-3 file:rounded-md file:border-0 file:bg-muneca-purple/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:text-muneca-purple"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass}>Espacios donde aparece</label>
        <div className="flex flex-wrap gap-2">
          {SLOTS_PATROCINIO.map((slot) => (
            <label
              key={slot.id}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
                slot.disponible
                  ? "border-black/15 text-muneca-black/70"
                  : "border-black/5 bg-black/[0.02] text-muneca-black/30"
              }`}
            >
              <input
                type="checkbox"
                name="slots"
                value={slot.id}
                defaultChecked={slotsActivos.has(slot.id)}
                disabled={!slot.disponible}
              />
              {slot.label}
              {!slot.disponible && <span className="italic">(próximamente)</span>}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:col-span-2">
        <input
          id={`activo-${modo}-${patrocinador?.id ?? "nuevo"}`}
          type="checkbox"
          name="activo"
          defaultChecked={patrocinador?.activo ?? true}
        />
        <label
          htmlFor={`activo-${modo}-${patrocinador?.id ?? "nuevo"}`}
          className="text-sm text-muneca-black/70"
        >
          Visible en el sitio
        </label>
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-muneca-yellow px-4 py-2 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {pending ? "Guardando..." : modo === "crear" ? "Agregar patrocinador" : "Guardar cambios"}
        </button>
        {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
      </div>
    </form>
  );
}
