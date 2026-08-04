const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const DAY_KEY_MAP = { L: 'Lun', Ma: 'Mar', Mi: 'Mié', J: 'Jue', V: 'Vie' };
const TIME_SLOTS = Array.from({ length: 27 }, (_, i) => 420 + i * 30);

function formatTimeLabel(t) {
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

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
      for (const t of TIME_SLOTS) {
        const slotStart = t;
        const slotEnd = t + 30;
        if (startMin < slotEnd && endMin > slotStart) {
          if (!grid[dayLabel][t]) grid[dayLabel][t] = [];
          grid[dayLabel][t].push(m);
        }
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div
          className="grid gap-px bg-slate-700/30 rounded-xl overflow-hidden"
          style={{
            gridTemplateColumns: '80px repeat(5, 1fr)',
            gridTemplateRows: `repeat(${TIME_SLOTS.length}, 34px)`,
          }}
        >
          {/* Esquina */}
          <div className="bg-slate-800 p-2 z-10" style={{ gridRow: '1', gridColumn: '1' }} />

          {/* Encabezados de día */}
          {DAYS.map((d, di) => (
            <div
              key={d}
              className={`bg-slate-800 p-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-300 z-10 ${
                !activeDays.includes(d) ? 'opacity-30' : ''
              }`}
              style={{ gridRow: '1', gridColumn: di + 2 }}
            >
              {d}
            </div>
          ))}

          {/* Etiquetas de hora */}
          {TIME_SLOTS.map((t, ti) => (
            <div
              key={t}
              className="bg-slate-800/60 p-1 text-[10px] text-slate-400 flex items-center justify-center border-t border-slate-700/30 z-10"
              style={{ gridRow: ti + 2, gridColumn: '1' }}
            >
              {t % 60 === 0 ? formatTimeLabel(t) : <div className="h-px w-3 bg-slate-500/50" />}
            </div>
          ))}

          {/* Celdas de fondo */}
          {DAYS.map((d, di) => TIME_SLOTS.map((t, ti) => {
            const occupied = (grid[d]?.[t] || []).length > 0;
            const isActive = activeDays.includes(d);
            return (
              <div
                key={`${t}-${d}`}
                className={`border-t border-slate-700/30 ${
                  occupied ? 'bg-slate-800/80' : 'bg-slate-900/40'
                } ${!isActive ? 'opacity-30' : ''}`}
                style={{ gridRow: ti + 2, gridColumn: di + 2 }}
              />
            );
          }))}

          {/* Tarjetas de materias (una por materia y día, abarcando su duración) */}
          {plan.materias.flatMap(m =>
            m.dias.map(d => {
              const dayLabel = DAY_KEY_MAP[d] || d;
              const col = DAYS.indexOf(dayLabel) + 2;
              if (col < 2) return null;
              const h = getHorario(m, d);
              const startMin = timeToMinutes(h.start);
              const endMin = timeToMinutes(h.end);
              const startSlot = Math.floor((startMin - 420) / 30);
              const endSlot = Math.ceil((endMin - 420) / 30);
              const s = Math.max(0, startSlot);
              const e = Math.min(TIME_SLOTS.length, endSlot);
              if (e <= s) return null;
              return (
                <div
                  key={`${m.clave}-${m.grupo}-${d}`}
                  className={`rounded px-1 py-0.5 border text-[9px] leading-tight overflow-hidden flex flex-col items-center justify-center text-center ${
                    m.modalidad === 'flex'
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
                  }`}
                  style={{ gridRow: `${s + 2} / ${e + 2}`, gridColumn: col }}
                  title={`${m.materia} (${m.grupo}) ${dayLabel} ${h.start}-${h.end}`}
                >
                  <div className="break-words font-medium line-clamp-2">{m.materia}</div>
                  <div className="opacity-70 flex gap-1 flex-wrap">
                    <span>{m.grupo}</span>
                    <span className="font-mono">{m.clave}</span>
                  </div>
                </div>
              );
            })
          )}
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
