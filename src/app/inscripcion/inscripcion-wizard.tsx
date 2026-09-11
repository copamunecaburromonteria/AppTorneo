"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { WizardShell } from "@/components/wizard/wizard-shell";
import {
  registrarEquipo,
  iniciarSesionTrasRegistro,
  type RegistroEquipoInput,
} from "./actions";

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
  anioFundacion: "",
  ciudadBarrio: "",
  descripcion: "",
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

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-2xl text-muneca-black">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-black/60">{subtitle}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function NavBotones({
  paso,
  onAtras,
  onSiguiente,
  submitting,
  textoSiguiente = "Siguiente →",
}: {
  paso: number;
  onAtras?: () => void;
  onSiguiente: () => void;
  submitting?: boolean;
  textoSiguiente?: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between">
      {paso > 1 ? (
        <button
          type="button"
          onClick={onAtras}
          className="rounded-md px-4 py-2.5 text-sm font-semibold text-muneca-black/60 transition-colors hover:text-muneca-black"
        >
          ← Atrás
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onSiguiente}
        disabled={submitting}
        className="rounded-md bg-muneca-yellow px-6 py-2.5 text-sm font-bold uppercase text-muneca-black transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {submitting ? "Registrando..." : textoSiguiente}
      </button>
    </div>
  );
}

export function InscripcionWizard({
  pricing,
  montoUniformeKit,
}: {
  pricing: Pricing;
  montoUniformeKit: number;
}) {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState<RegistroEquipoInput>(initialState);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function irAPaso2() {
    setError(null);
    if (!form.nombreEquipo.trim()) {
      setError("Falta el nombre del equipo.");
      return;
    }
    setPaso(2);
  }

  function irAPaso3() {
    setError(null);
    if (!form.correo.includes("@")) return setError("El correo no es válido.");
    if (form.password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (form.password !== confirmPassword) return setError("Las contraseñas no coinciden.");
    if (!form.delegadoNombre || !form.delegadoApellido || !form.delegadoDocumento || !form.delegadoContactoPrincipal) {
      return setError("Faltan datos obligatorios del delegado.");
    }
    setPaso(3);
  }

  async function finalizar(e?: FormEvent) {
    e?.preventDefault();
    setError(null);

    if (form.tieneUniformePropio === null) {
      setError("Indica si tu equipo ya cuenta con uniforme propio.");
      return;
    }

    setSubmitting(true);
    const res = await registrarEquipo(form);

    if (!res.success) {
      setSubmitting(false);
      setError(res.error);
      return;
    }

    const login = await iniciarSesionTrasRegistro(res.correo, form.password);
    setSubmitting(false);

    if (login.success) {
      router.push("/portal/inscripcion");
    } else {
      // Poco probable (la cuenta sí se creó), pero por si falla la sesión
      // automática, lo mandamos a loguearse manualmente.
      router.push("/portal/login");
    }
  }

  const teamPreview = {
    nombreEquipo: form.nombreEquipo,
    delegadoNombre: [form.delegadoNombre, form.delegadoApellido].filter(Boolean).join(" ") || undefined,
    delegadoContacto: form.delegadoContactoPrincipal || undefined,
    delegadoDocumento: form.delegadoDocumento || undefined,
  };

  return (
    <WizardShell
      pasoActual={paso}
      titulo="INSCRIBE TU EQUIPO"
      subtitulo="Copa Muñeca e'Burro · Categoría Libre · Montería, Córdoba"
      team={teamPreview}
      breadcrumbItems={[{ label: "Inicio", href: "/" }, { label: "Inscripción" }]}
    >
      <form onSubmit={finalizar} className="space-y-6">
        {paso === 1 && (
          <Card title="1. Datos del equipo" subtitle="Comencemos con la información principal de tu equipo.">
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
            <div className="sm:col-span-2">
              <Field label="Descripción del equipo (opcional)">
                <textarea
                  value={form.descripcion}
                  onChange={(e) => update("descripcion", e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Cuéntanos un poco sobre tu equipo..."
                />
              </Field>
            </div>
          </Card>
        )}

        {paso === 2 && (
          <>
            <Card title="2. Cuenta de acceso" subtitle="Con esto entras al portal de tu equipo.">
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
            </Card>

            <Card title="Datos del delegado">
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
            </Card>
          </>
        )}

        {paso === 3 && (
          <>
            <Card title="3. Cuerpo técnico" subtitle="Opcional — también lo puedes completar después desde el portal.">
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
            </Card>

            <Card title="Uniforme personalizado">
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
            </Card>

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
            </div>
          </>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
        )}

        {paso === 1 && <NavBotones paso={1} onSiguiente={irAPaso2} />}
        {paso === 2 && <NavBotones paso={2} onAtras={() => setPaso(1)} onSiguiente={irAPaso3} />}
        {paso === 3 && (
          <NavBotones
            paso={3}
            onAtras={() => setPaso(2)}
            onSiguiente={() => finalizar()}
            submitting={submitting}
            textoSiguiente="Registrar equipo →"
          />
        )}
      </form>
    </WizardShell>
  );
}
