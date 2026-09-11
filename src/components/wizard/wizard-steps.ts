export type WizardStep = {
  id: number;
  label: string;
  description: string;
  /** Ruta base donde vive este paso: pública (antes de crear la cuenta) o en el portal (ya logueado). */
  zona: "publica" | "portal";
};

/**
 * Los 7 pasos del wizard de inscripción, compartidos entre /inscripcion
 * (pasos 1-3, público) y /portal/inscripcion (pasos 4-7, ya logueado).
 * El sidebar del wizard siempre muestra los 7, marcando como "completados"
 * los anteriores al paso actual — así el equipo ve todo el recorrido sin
 * importar en qué página esté parado.
 */
export const WIZARD_STEPS: WizardStep[] = [
  { id: 1, label: "Datos del equipo", description: "Información principal", zona: "publica" },
  { id: 2, label: "Delegado", description: "Datos de contacto", zona: "publica" },
  { id: 3, label: "Cuerpo técnico", description: "Entrenador y uniforme", zona: "publica" },
  { id: 4, label: "Plantilla de jugadores", description: "Registra a tus jugadores", zona: "portal" },
  { id: 5, label: "Documentos", description: "Carga los archivos", zona: "portal" },
  { id: 6, label: "Pago de inscripción", description: "Realiza el pago", zona: "portal" },
  { id: 7, label: "Confirmación", description: "¡Listo para el torneo!", zona: "portal" },
];

export const TOTAL_PASOS = WIZARD_STEPS.length;
