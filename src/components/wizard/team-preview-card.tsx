type TeamPreviewData = {
  nombreEquipo: string;
  escudoUrl?: string | null;
  delegadoNombre?: string;
  delegadoContacto?: string;
  delegadoDocumento?: string;
};

function Escudo({ url }: { url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-14 w-14 rounded-xl object-cover" />;
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muneca-purple/10 text-muneca-purple">
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
        <path
          d="M12 2 4 5v6c0 5 3.4 8.7 8 9.9 4.6-1.2 8-4.9 8-9.9V5l-8-3Z"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Tarjeta de resumen a la derecha del wizard — visible desde xl hacia arriba. */
export function TeamPreviewCard({ team }: { team: TeamPreviewData }) {
  const tieneNombre = team.nombreEquipo.trim().length > 0;

  return (
    <div className="hidden xl:block">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Escudo url={team.escudoUrl} />
          <div className="min-w-0">
            <p className="truncate font-display text-lg uppercase tracking-wide text-muneca-black">
              {tieneNombre ? team.nombreEquipo : "Tu equipo"}
            </p>
            <span className="inline-block rounded-full bg-muneca-purple/10 px-2.5 py-0.5 text-xs font-semibold text-muneca-purple">
              Categoría Libre
            </span>
          </div>
        </div>

        {(team.delegadoNombre || team.delegadoContacto || team.delegadoDocumento) && (
          <dl className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
            {team.delegadoNombre && (
              <div className="flex items-center gap-2 text-black/70">
                <span className="text-black/40">Delegado</span>
                <span className="font-medium text-muneca-black">{team.delegadoNombre}</span>
              </div>
            )}
            {team.delegadoContacto && (
              <div className="flex items-center gap-2 text-black/70">
                <span className="text-black/40">Contacto</span>
                <span className="font-medium text-muneca-black">{team.delegadoContacto}</span>
              </div>
            )}
            {team.delegadoDocumento && (
              <div className="flex items-center gap-2 text-black/70">
                <span className="text-black/40">Documento</span>
                <span className="font-medium text-muneca-black">{team.delegadoDocumento}</span>
              </div>
            )}
          </dl>
        )}
      </div>

      <div className="relative mt-5 overflow-hidden rounded-2xl bg-muneca-black p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_100%,rgba(123,31,162,0.45),transparent)]"
        />
        <p className="font-display relative text-xl leading-tight text-muneca-yellow">
          GRANDES EQUIPOS
          <br />
          HACEN GRANDES
          <br />
          HISTORIAS
        </p>
      </div>
    </div>
  );
}
