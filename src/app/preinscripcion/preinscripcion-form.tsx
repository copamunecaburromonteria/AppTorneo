"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { CANALES_PREINSCRIPCION } from "@/lib/canales-preinscripcion";
import { preinscribirEquipo, type PreinscripcionInput } from "./actions";

const initialState: PreinscripcionInput = {
  nombreEquipo: "",
  anioFundacion: "",
  ciudadBarrio: "",
  descripcion: "",
  comoSeEntero: "",
  correo: "",
  delegadoNombre: "",
  delegadoApellido: "",
  delegadoDocumento: "",
  delegadoContactoPrincipal: "",
  delegadoContactoAlterno: "",
  delegadoWhatsapp: "",
};

const inputClass =
  "mt-1.5 w-full rounded-md border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-muneca-yellow focus:outline-none focus:ring-2 focus:ring-muneca-yellow/20";

const labelClass = "block text-sm font-semibold text-white";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required && <span className="text-muneca-yellow"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <h2 className="font-display text-2xl text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

/**
 * Formulario corto de preinscripción — mismo dataset que ya usaba el
 * flujo (superado) de "lista de espera" dentro de `/inscripcion`: equipo +
 * delegado, sin uniforme, sin cuenta, sin cobro. Ver `actions.ts` para el
 * porqué de esta modalidad.
 */
export function PreinscripcionForm() {
  const [form, setForm] = useState<PreinscripcionInput>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ nombreEquipo: string; ordenPreinscripcion: number } | null>(
    null
  );

  function update<K extends keyof PreinscripcionInput>(key: K, value: PreinscripcionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nombreEquipo.trim()) return setError("Falta el nombre del equipo.");
    if (!form.correo.includes("@")) return setError("El correo no es válido.");
    if (
      !form.delegadoNombre ||
      !form.delegadoApellido ||
      !form.delegadoDocumento ||
      !form.delegadoContactoPrincipal
    ) {
      return setError("Faltan datos obligatorios del delegado.");
    }

    setSubmitting(true);
    const res = await preinscribirEquipo(form);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setResultado({ nombreEquipo: res.nombreEquipo, ordenPreinscripcion: res.ordenPreinscripcion });
  }

  const teamPreview = {
    nombreEquipo: form.nombreEquipo,
    delegadoNombre: [form.delegadoNombre, form.delegadoApellido].filter(Boolean).join(" ") || undefined,
    delegadoContacto: form.delegadoContactoPrincipal || undefined,
    delegadoDocumento: form.delegadoDocumento || undefined,
  };

  if (resultado) {
    return (
      <WizardShell
        pasoActual={1}
        titulo="PREINSCRIBE TU EQUIPO"
        subtitulo="Copa Muñeca e'Burro · Categoría Libre · Montería, Córdoba"
        team={teamPreview}
        breadcrumbItems={[{ label: "Inicio", href: "/" }, { label: "Preinscripción" }]}
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center sm:p-10">
          <p className="font-display text-2xl text-white sm:text-3xl">¡Quedaste preinscrito!</p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/70 sm:text-base">
            <strong>{resultado.nombreEquipo}</strong> quedó preinscrito en la Copa Muñeca e&apos;Burro.
            Todavía no hay cuenta ni cobro — te contactaremos por WhatsApp o correo cuando te toque
            completar la inscripción oficial y activar tu cupo.
          </p>
        </div>
      </WizardShell>
    );
  }

  return (
    <WizardShell
      pasoActual={1}
      titulo="PREINSCRIBE TU EQUIPO"
      subtitulo="Copa Muñeca e'Burro · Categoría Libre · Montería, Córdoba"
      team={teamPreview}
      breadcrumbItems={[{ label: "Inicio", href: "/" }, { label: "Preinscripción" }]}
    >
      <form onSubmit={enviar} className="space-y-6">
        <div className="rounded-2xl border border-muneca-purple/30 bg-muneca-purple/10 p-5 text-sm text-white/80 sm:p-6">
          <p className="font-display text-lg text-white sm:text-xl">Así funciona la preinscripción</p>
          <p className="mt-1.5">
            Déjanos los datos de tu equipo para hacer fila. Cuando confirmemos los 24 cupos, te
            contactamos por WhatsApp o correo para completar la inscripción oficial y el pago — nada
            se cobra en este paso.
          </p>
        </div>

        <Card title="Datos del equipo" subtitle="Comencemos con la información principal de tu equipo.">
          <div className="sm:col-span-2">
            <Field label="Nombre del equipo" required>
              <input
                required
                value={form.nombreEquipo}
                onChange={(e) => update("nombreEquipo", e.target.value)}
                className={inputClass}
                placeholder="Ej. Los Guerreros"
              />
            </Field>
          </div>
          <Field label="Año de fundación (opcional)">
            <input
              value={form.anioFundacion}
              onChange={(e) => update("anioFundacion", e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              maxLength={4}
              className={inputClass}
              placeholder="Ej. 2020"
            />
          </Field>
          <Field label="Ciudad / Barrio (opcional)">
            <input
              value={form.ciudadBarrio}
              onChange={(e) => update("ciudadBarrio", e.target.value)}
              className={inputClass}
              placeholder="Ej. Barrio, comuna o zona"
            />
          </Field>
          <Field label="¿Dónde te enteraste de la Copa? (opcional)">
            <select
              value={form.comoSeEntero}
              onChange={(e) => update("comoSeEntero", e.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona una opción</option>
              {CANALES_PREINSCRIPCION.map((canal) => (
                <option key={canal} value={canal}>
                  {canal}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        <Card title="Datos del delegado" subtitle="Para poder contactarte cuando te toque inscribirte oficialmente.">
          <Field label="Nombre" required>
            <input
              required
              value={form.delegadoNombre}
              onChange={(e) => update("delegadoNombre", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Apellido" required>
            <input
              required
              value={form.delegadoApellido}
              onChange={(e) => update("delegadoApellido", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Documento" required>
            <input
              required
              value={form.delegadoDocumento}
              onChange={(e) => update("delegadoDocumento", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Correo electrónico" required>
            <input
              required
              type="email"
              value={form.correo}
              onChange={(e) => update("correo", e.target.value)}
              className={inputClass}
              placeholder="delegado@correo.com"
            />
          </Field>
          <Field label="Contacto principal" required>
            <input
              required
              value={form.delegadoContactoPrincipal}
              onChange={(e) => update("delegadoContactoPrincipal", e.target.value)}
              className={inputClass}
              placeholder="Número de celular"
            />
          </Field>
          <Field label="WhatsApp (si es distinto)">
            <input
              value={form.delegadoWhatsapp}
              onChange={(e) => update("delegadoWhatsapp", e.target.value)}
              className={inputClass}
            />
          </Field>
        </Card>

        {error && <p className="rounded-md bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-muneca-yellow px-6 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting ? "Enviando..." : "Preinscribir mi equipo →"}
          </button>
        </div>
      </form>
    </WizardShell>
  );
}
