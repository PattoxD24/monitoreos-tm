const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const DAY_KEY_MAP = { L: 'Lun', Ma: 'Mar', Mi: 'Mié', J: 'Jue', V: 'Vie' };
const DAY_KEY_REVERSE = Object.fromEntries(Object.entries(DAY_KEY_MAP).map(([k, v]) => [v, k]));
const HOUR_RANGE = Array.from({ length: 14 }, (_, i) => i + 7);

function timeToMinutes(t) {
  if (!t) return 0;
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0);
}

function getActiveDays(plan) {
  const active = new Set();
  plan.materias.forEach(m => m.dias.forEach(d => active.add(DAY_KEY_MAP[d] || d)));
  return DAYS.filter(d => active.has(d));
}

function getHorario(seccion, dia) {
  if (seccion.horarios && seccion.horarios[dia]) return seccion.horarios[dia];
  return seccion.horario;
}

export default function ScheduleCalendar({ plan }) {
  const activeDays = getActiveDays(plan);

  const grid = {};
  for (const m of plan.materias) {
    for (const dia of m.dias) {
      const dayLabel = DAY_KEY_MAP[dia] || dia;
      if (!grid[dayLabel]) grid[dayLabel] = {};
      const h = getHorario(m, dia);
      const startMin = timeToMinutes(h.start);
      const endMin = timeToMinutes(h.end);
      for (const hh of HOUR_RANGE) {
        const hourStart = hh * 60;
        const hourEnd = (hh + 1) * 60;
        if (startMin < hourEnd && endMin > hourStart) {
          if (!grid[dayLabel][hh]) grid[dayLabel][hh] = [];
          grid[dayLabel][hh].push(m);
        }
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-px bg-slate-700/30 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-800 p-2"></div>
          {DAYS.map(d => (
            <div key={d} className={`bg-slate-800 p-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-300 ${
              !activeDays.includes(d) ? 'opacity-30' : ''
            }`}>
              {d}
            </div>
          ))}

          {/* Rows */}
          {HOUR_RANGE.map(h => (
            <div key={h} className="contents">
              <div className="bg-slate-800/60 p-2 text-xs text-slate-400 flex items-center justify-center border-t border-slate-700/30">
                {`${h}:00`}
              </div>
              {DAYS.map(d => {
                const cells = grid[d]?.[h] || [];
                const isActive = activeDays.includes(d);
                return (
                  <div
                    key={`${h}-${d}`}
                    className={`min-h-[52px] p-1 border-t border-slate-700/30 ${
                      cells.length > 0 ? 'bg-slate-800/80' : 'bg-slate-900/40'
                    } ${!isActive ? 'opacity-30' : ''}`}
                  >
                    {cells.map((m, i) => (
                      <div
                        key={`${m.clave}-${m.grupo}-${i}`}
                        className={`text-[10px] leading-tight rounded px-1 py-0.5 mb-0.5 border ${
                          m.modalidad === 'flex'
                            ? 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
                        }`}
                        title={`${m.materia} (${m.grupo}) ${d} ${getHorario(m, DAY_KEY_REVERSE[d] || d).start}-${getHorario(m, DAY_KEY_REVERSE[d] || d).end}`}
                      >
                        <div className="break-words font-medium line-clamp-3">{m.materia}</div>
                        <div className="opacity-70 flex gap-1 flex-wrap">
                          <span>{m.grupo}</span>
                          <span className="font-mono">{m.clave}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30"></span>
          Regular
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30"></span>
          Flex
        </div>
        <div className="text-slate-500">
          Total: {plan.materias.length} materias · {plan.totalHoras} horas
        </div>
      </div>
    </div>
  );
}
