import { useState, useMemo } from 'react';
import ScheduleCalendar from './ScheduleCalendar';

const DAY_LABELS = { L: 'Lun', Ma: 'Mar', Mi: 'Mié', J: 'Jue', V: 'Vie' };

function timeToMinutes(t) {
  if (!t) return 0;
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0);
}

function getHorario(seccion, dia) {
  if (seccion.horarios && seccion.horarios[dia]) return seccion.horarios[dia];
  return seccion.horario;
}

function formatHorarios(m) {
  return m.dias.map(d => {
    const h = getHorario(m, d);
    return `${DAY_LABELS[d] || d} ${h.start}-${h.end}`;
  }).join(', ');
}

function hasTimeConflict(seccion, plan) {
  for (const m of plan) {
    if (m.clave === seccion.clave) continue;
    for (const dia of seccion.dias) {
      if (!m.dias.includes(dia)) continue;
      const aHorario = getHorario(seccion, dia);
      const bHorario = getHorario(m, dia);
      const aStart = timeToMinutes(aHorario.start);
      const aEnd = timeToMinutes(aHorario.end);
      const bStart = timeToMinutes(bHorario.start);
      const bEnd = timeToMinutes(bHorario.end);
      if (aStart < bEnd && bStart < aEnd) return true;
    }
  }
  return false;
}

export default function ScheduleEditor({ plan, oferta, doneCodes, onSave, onCancel }) {
  const [editedPlan, setEditedPlan] = useState(plan ? [...plan.materias] : []);
  const [search, setSearch] = useState('');

  const availableCodes = useMemo(() => {
    return [...new Set(oferta.map(s => s.clave))];
  }, [oferta]);

  const filteredOferta = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return oferta.filter(s =>
      !editedPlan.some(m => m.clave === s.clave && m.grupo === s.grupo) &&
      !doneCodes.has(s.curriculumCode) &&
      (s.materia.toLowerCase().includes(q) || s.clave.toLowerCase().includes(q) || String(s.grupo).toLowerCase().includes(q))
    );
  }, [oferta, editedPlan, search, doneCodes]);

  const totalHoras = editedPlan.reduce((sum, m) => sum + m.hrs, 0);
  const flexCount = editedPlan.filter(m => m.modalidad === 'flex').length;
  const isSobrecarga = totalHoras > 29;

  const handleAddSubject = (seccion) => {
    if (editedPlan.length >= 7) return;
    if (totalHoras + seccion.hrs > 34) return;
    if (seccion.modalidad === 'flex' && flexCount >= 2) return;
    if (hasTimeConflict(seccion, editedPlan)) {
      alert('Conflicto de horario con una materia ya agregada');
      return;
    }
    setEditedPlan([...editedPlan, seccion]);
    setSearch('');
  };

  const handleRemoveSubject = (idx) => {
    setEditedPlan(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (editedPlan.length === 0) {
      alert('Agrega al menos una materia');
      return;
    }
    if (editedPlan.length > 7) {
      alert('Máximo 7 materias');
      return;
    }
    if (totalHoras > 34) {
      alert('Máximo 34 horas');
      return;
    }
    onSave({
      id: plan?.id || `${Date.now()}`,
      materias: editedPlan,
      totalHoras,
      warnings: [],
      score: editedPlan.length * 10,
    });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left: calendar + current plan table */}
      <div className="flex-1 overflow-x-auto flex flex-col">
        <ScheduleCalendar plan={{ materias: editedPlan, totalHoras }} />

        {editedPlan.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="text-left py-2 pr-3 font-medium">Materia</th>
                  <th className="text-left py-2 pr-3 font-medium">Clave</th>
                  <th className="text-left py-2 pr-3 font-medium">Grupo</th>
                  <th className="text-left py-2 pr-3 font-medium">Horario</th>
                  <th className="text-left py-2 pr-3 font-medium">Hrs</th>
                  <th className="text-left py-2 pr-3 font-medium">Mod</th>
                  <th className="w-10 py-2" />
                </tr>
              </thead>
              <tbody>
                {editedPlan.map((m, i) => (
                  <tr key={`${m.clave}-${m.grupo}-${i}`} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="py-2.5 pr-3 text-white font-medium">{m.materia}</td>
                    <td className="py-2.5 pr-3 text-slate-300">{m.clave}</td>
                    <td className="py-2.5 pr-3 text-slate-300">{m.grupo}</td>
                    <td className="py-2.5 pr-3 text-slate-300">
                      {formatHorarios(m)}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">{m.hrs}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        m.modalidad === 'flex' ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'
                      }`}>{m.modalidad}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(i)}
                        className="text-slate-500 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-500/10"
                        title="Quitar"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editedPlan.length === 0 && (
          <div className="mt-6 text-center text-sm text-slate-400 py-12 border-2 border-dashed border-slate-700/50 rounded-2xl">
            No hay materias en el plan. Busca y agrega desde la sección de la derecha.
          </div>
        )}

        <div className="mt-4 space-y-2">
          <div className="text-sm text-slate-400">
            <p>{editedPlan.length}/7 materias · <span className={isSobrecarga ? 'text-amber-400 font-semibold' : ''}>{totalHoras}/29 horas</span> · {flexCount}/2 flex</p>
          </div>
          {isSobrecarga && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-200">
              <span className="text-amber-400">⚠️</span>
              <span>Sobrecarga de materias: más de 29 horas requiere aprobación especial</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 flex gap-3 justify-end border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/15 px-5 py-2 text-sm text-slate-300 hover:bg-white/10 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition"
          >
            Guardar Plan
          </button>
        </div>
      </div>

      {/* Right: materia picker */}
      <div className="w-full xl:w-80 shrink-0 flex flex-col max-h-[70vh]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col h-full">
          <p className="text-sm font-semibold text-white mb-3">Agregar materias</p>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, clave o grupo..."
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/40"
          />

          <div className="mt-3 flex-1 overflow-y-auto space-y-2 min-h-0">{filteredOferta.slice(0, 50).map((seccion, i) => (
              <button
                key={`${seccion.clave}-${seccion.grupo}-${i}`}
                type="button"
                onClick={() => handleAddSubject(seccion)}
                disabled={
                  editedPlan.length >= 7 ||
                  totalHoras + seccion.hrs > 34 ||
                  (seccion.modalidad === 'flex' && flexCount >= 2) ||
                  hasTimeConflict(seccion, editedPlan)
                }
                className="w-full text-left rounded-xl border border-white/10 bg-slate-900/40 p-3 text-xs transition hover:bg-slate-800/60 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-white truncate">{seccion.materia} <span className="font-mono text-slate-400 font-normal">{seccion.clave}</span></span>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    seccion.modalidad === 'flex' ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'
                  }`}>
                    {seccion.modalidad}
                  </span>
                </div>
                  <div className="mt-1 text-slate-400">
                  {seccion.clave} · Grupo {seccion.grupo} · {seccion.hrs}h
                  · {formatHorarios(seccion)}
                  · Disp: {seccion.disponibilidad}
                </div>
              </button>
            ))}
            {search && filteredOferta.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">Sin resultados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
