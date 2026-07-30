function getHorario(seccion, dia) {
  if (seccion.horarios && seccion.horarios[dia]) return seccion.horarios[dia];
  return seccion.horario;
}

const DAY_LABELS = { L: 'Lun', Ma: 'Mar', Mi: 'Mié', J: 'Jue', V: 'Vie' };
const MODALITY_COLORS = {
  regular: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
  flex: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
};

export default function SchedulePlanCard({ plan, rank, onView, onEdit, onExport }) {
  const uniqueGroups = new Set(plan.materias.map(m => m.grupo)).size;
  const hasWarnings = plan.warnings.length > 0;

  return (
    <div className={`rounded-2xl border p-5 transition hover:border-white/40 ${
      rank === 1 ? 'border-emerald-400/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-900' : 'border-white/10 bg-white/[0.04]'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              rank === 1 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-300'
            }`}>
              Plan {rank}{rank === 1 ? ' ★ Recomendado' : ''}
            </span>
            <span className="text-sm text-slate-400">Score: {plan.score}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="text-white font-medium">{plan.materias.length} materias</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-200">{plan.totalHoras} hrs</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-200">{uniqueGroups} grupo{uniqueGroups !== 1 ? 's' : ''}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {plan.materias.map((m, i) => (
              <span
                key={`${m.clave}-${m.grupo}-${i}`}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs border ${
                  MODALITY_COLORS[m.modalidad] || 'bg-white/5 text-slate-300 border-white/10'
                }`}
                title={`${m.clave} - ${m.materia} - ${m.dias.map(d => `${DAY_LABELS[d] || d} ${getHorario(m, d).start}-${getHorario(m, d).end}`).join(', ')}`}
              >
                <span className="truncate max-w-[110px] shrink-0">{m.materia}</span>
                <span className="opacity-60 font-mono text-[10px]">{m.clave}</span>
                <span className="opacity-60">({m.grupo})</span>
              </span>
            ))}
          </div>

          {hasWarnings && (
            <div className="mt-3 space-y-1">
              {plan.warnings.map((w, i) => (
                <p key={i} className="flex items-start gap-2 text-xs text-amber-400">
                  <span className="mt-0.5 shrink-0">⚠️</span>
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-xl border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 transition"
          >
            Calendario
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 transition"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded-xl border border-emerald-400/30 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-500/10 transition"
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}
