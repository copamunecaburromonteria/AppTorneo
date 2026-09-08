"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { registrarEquipo, type RegistroEquipoInput } from "./actions";

type Pricing = {
  montoInscripcion: number;
  precioUniforme: number;
  maxJugadoresPorEquipo: number;
  numeroCuotasSinUniforme: number;
  numeroCuotasConUniforme: number;
  diasPlazoSaldo: number;
};

const initialState: RegistroEquipoInput = {
  nombreEquipo: "",
  correo: "",
  password: "",
  delegadoNombre: "",
  delegadoApellido: "",
  delegadoDocumento: "",
  delegadoContactoPrincipal: "",
  delegadoContactoAlterno: "",
  delegadoWhatsapp: "",
  dtNombre: "",
  dtDocumento: "",
  preparadorNombre: "",
  preparadorDocumento: "",
  tieneUniformePropio: null,
  compraUniformeCopa: false,
};

const inputClass =
  "mt-1.5 w-full rounded-md border border-black/15 bg-white px-3.5 py-2.5 text-sm text-muneca-black placeholder:text-black/35 focus:border-muneca-purple focus:outline-none focus:ring-2 focus:ring-muneca-purple/20";

const labelClass = "block text-sm font-semibold text-muneca-black";

/**
 * Reparte `total` en `partes` montos enteros que suman exactamente `total`.
 * Espejo de la misma función en actions.ts, solo para previsualizar en el
 * navegador antes de enviar — el servidor vuelve a calcular el plan real.
 */
function repartirEnPartesIguales(total: number, partes: number): number[] {
  if (partes <= 0) return [total];
  const base = Math.floor(total / partes);
  const montos = Array.from({ length: partes }, () => base);
  montos[partes - 1] = total - base * (partes - 1);
  return montos;
}

function formatCOP(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}

function formatFecha(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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
        {required && <span className="text-muneca-purple"> *</span>}
      </span>
      {children}
    </label>
  );
}

function SectionCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muneca-purple text-lg text-muneca-white">
          {step}
        </span>
        <div>
          <h2 className="font-display text-2xl text-muneca-black">{title}</h2>
          {subtitle && <p className="text-sm text-black/60">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function InscripcionForm({
  pricing,
  montoUniformeKit,
}: {
  pricing: Pricing;
  montoUniformeKit: number;
}) {
  const [form, setForm] = useState<RegistroEquipoInput>(initialState);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof registrarEquipo>> | null>(null);

  function update<K extends keyof RegistroEquipoInput>(key: K, value: RegistroEquipoInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const compraUniformeActiva = form.tieneUniformePropio === false && form.compraUniformeCopa;
  const montoTotal = compraUniformeActiva
    ? pricing.montoInscripcion + montoUniformeKit
    : pricing.montoInscripcion;
  const numeroCuotas = compraUniformeActiva
    ? pricing.numeroCuotasConUniforme
    : pricing.numeroCuotasSinUniforme;
  const cuotasPreview = repartirEnPartesIguales(montoTotal, numeroCuotas);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.tieneUniformePropio === null) {
      setError("Indica si tu equipo ya cuenta con uniforme propio.");
      return;
    }

    setSubmitting(true);
    const res = await registrarEquipo(form);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error);
      return;
    }
    setResult(res);
  }

  if (result?.success) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="font-display text-3xl text-muneca-purple">¡EQUIPO REGISTRADO!</p>
        <p className="mt-3 text-black/70">
          <strong>{form.nombreEquipo}</strong> quedó registrado. Guarda tus datos de acceso
          (correo y contraseña) — los vas a necesitar para entrar al portal de tu equipo.
        </p>

        <div className="mt-8 rounded-2xl border border-black/10 bg-muneca-white p-6 text-left shadow-sm">
          <p className="text-sm uppercase tracking-wide text-black/50">Total a pagar</p>
          <p className="font-display mt-1 text-4xl text-muneca-black">
            {formatCOP(result.montoTotal)}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-black/60">
            <li>Inscripción: {formatCOP(result.montoInscripcion)}</li>
            {result.cantidadUniformes > 0 && (
              <li>
                Uniformes ({result.cantidadUniformes} × {formatCOP(pricing.precioUniforme)}):{" "}
                {formatCOP(result.montoUniformes)}
              </li>
            )}
          </ul>

          <p className="mt-5 text-sm uppercase tracking-wide text-black/50">
            Plan de pagos — {result.cuotas.length} partidas
          </p>
          <ul className="mt-2 divide-y divide-black/10">
            {result.cuotas.map((cuota) => (
              <li key={cuota.numeroCuota} className="flex items-center justify-between py-2 text-sm">
                <span className="text-black/70">
                  Partida {cuota.numeroCuota} · vence {formatFecha(cuota.fechaLimite)}
                </span>
                <span className="font-semibold text-muneca-black">{formatCOP(cuota.monto)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-sm text-black/60">
          El pago en línea con Wompi se habilita muy pronto — te avisaremos por correo y WhatsApp
          apenas esté listo para pagar la primera partida y activar tu equipo.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6 px-4 py-12 sm:px-6">
      <SectionCard step={1} title="Datos del equipo">
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
      </SectionCard>

      <SectionCard
        step={2}
        title="Cuenta de acceso"
        subtitle="Con esto entras al portal de tu equipo"
      >
        <div className="sm:col-span-2">
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
        </div>
        <Field label="Contraseña" required>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className={inputClass}
            placeholder="Mínimo 8 caracteres"
          />
        </Field>
        <Field label="Confirmar contraseña" required>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
      </SectionCard>

      <SectionCard step={3} title="Datos del delegado">
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
        <Field label="Contacto principal" required>
          <input
            required
            value={form.delegadoContactoPrincipal}
            onChange={(e) => update("delegadoContactoPrincipal", e.target.value)}
            className={inputClass}
            placeholder="Número de celular"
          />
        </Field>
        <Field label="Contacto alterno">
          <input
            value={form.delegadoContactoAlterno}
            onChange={(e) => update("delegadoContactoAlterno", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="WhatsApp para notificaciones">
          <input
            value={form.delegadoWhatsapp}
            onChange={(e) => update("delegadoWhatsapp", e.target.value)}
            className={inputClass}
            placeholder="Si es distinto al contacto principal"
          />
        </Field>
      </SectionCard>

      <SectionCard
        step={4}
        title="Cuerpo técnico"
        subtitle="Opcional — también lo puedes completar después desde el portal"
      >
        <Field label="Nombre del DT">
          <input
            value={form.dtNombre}
            onChange={(e) => update("dtNombre", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Documento del DT">
          <input
            value={form.dtDocumento}
            onChange={(e) => update("dtDocumento", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Nombre del preparador físico">
          <input
            value={form.preparadorNombre}
            onChange={(e) => update("preparadorNombre", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Documento del preparador físico">
          <input
            value={form.preparadorDocumento}
            onChange={(e) => update("preparadorDocumento", e.target.value)}
            className={inputClass}
          />
        </Field>
      </SectionCard>

      <SectionCard step={5} title="Uniforme personalizado">
        <div className="sm:col-span-2">
          <span className={labelClass}>
            ¿Tu equipo ya cuenta con uniforme propio? <span className="text-muneca-purple">*</span>
          </span>
          <div className="mt-2 flex gap-3">
            {[
              { label: "Sí, ya tenemos", value: true },
              { label: "No, todavía no", value: false },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => update("tieneUniformePropio", opt.value)}
                className={`rounded-md border px-5 py-2.5 text-sm font-semibold transition-colors ${
                  form.tieneUniformePropio === opt.value
                    ? "border-muneca-purple bg-muneca-purple text-muneca-white"
                    : "border-black/15 text-muneca-black hover:border-muneca-purple/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {form.tieneUniformePropio === false && (
          <div className="rounded-xl bg-muneca-purple/5 p-5 sm:col-span-2">
            <span className={labelClass}>
              ¿Deseas adquirir el uniforme oficial personalizado con la Copa Muñeca e&apos;Burro?
            </span>
            <p className="mt-1 text-sm text-black/60">
              Pedido de plantilla completa ({pricing.maxJugadoresPorEquipo} uniformes) a{" "}
              {formatCOP(pricing.precioUniforme)} c/u = {formatCOP(montoUniformeKit)}. La talla de
              cada jugador se pide después, al completar la plantilla en el portal.
            </p>
            <div className="mt-3 flex gap-3">
              {[
                { label: "Sí, lo quiero", value: true },
                { label: "No, gracias", value: false },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => update("compraUniformeCopa", opt.value)}
                  className={`rounded-md border px-5 py-2.5 text-sm font-semibold transition-colors ${
                    form.compraUniformeCopa === opt.value
                      ? "border-muneca-purple bg-muneca-purple text-muneca-white"
                      : "border-black/15 text-muneca-black hover:border-muneca-purple/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <div className="rounded-2xl bg-muneca-black p-6 text-muneca-white sm:p-8">
        <p className="text-sm uppercase tracking-wide text-donkey-gray">Resumen de pago</p>
        <div className="mt-3 space-y-1 text-sm text-white/80">
          <div className="flex justify-between">
            <span>Inscripción</span>
            <span>{formatCOP(pricing.montoInscripcion)}</span>
          </div>
          {compraUniformeActiva && (
            <div className="flex justify-between">
              <span>
                Uniformes ({pricing.maxJugadoresPorEquipo} × {formatCOP(pricing.precioUniforme)})
              </span>
              <span>{formatCOP(montoUniformeKit)}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-white/15 pt-3">
          <span className="font-display text-xl">Total</span>
          <span className="font-display text-3xl text-muneca-yellow">
            {formatCOP(montoTotal)}
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-donkey-gray">
            Se paga en {numeroCuotas} partidas, cada una {pricing.diasPlazoSaldo} días después de
            la anterior
          </p>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            {cuotasPreview.map((monto, index) => (
              <li key={index} className="flex justify-between">
                <span>Partida {index + 1}</span>
                <span>{formatCOP(monto)}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="mt-4 rounded-md bg-red-500/15 px-4 py-2.5 text-sm text-red-200">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-md bg-muneca-yellow px-8 py-4 text-base font-bold uppercase text-muneca-black transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
        >
          {submitting ? "Registrando..." : "Registrar equipo →"}
        </button>
      </div>
    </form>
  );
}
