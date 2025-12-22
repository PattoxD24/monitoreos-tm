"use client";
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { SUBJECTS } from '@/Utils/Subjects';

export default function ProyeccionesPage() {
  const [parsedData, setParsedData] = useState([]);
  // estado para datos de alumno y calificaciones finales
  const [studentInfo, setStudentInfo] = useState({ name: '', matricula: '' });
  const [gradesData, setGradesData] = useState([]);
  const [period, setPeriod] = useState(() => {
    const month = new Date().getMonth() + 1;
    return month <= 5 ? 'enero-mayo' : 'agosto-diciembre';
  });
  const [targetSemester, setTargetSemester] = useState(() => {
    const month = new Date().getMonth() + 1;
    return month <= 5 ? 2 : 1;
  });

  // función para actualizar estado manualmente
  const handleStatusChange = (index, newStatus) => {
    console.log('handleStatusChange index, newStatus:', index, newStatus);
    setParsedData(prev => {
      // actualizar solo el elemento modificado
      const updated = prev.map((item, i) => i === index
        ? { ...item, status: newStatus, numericGrade: newStatus === 'passed' ? (item.numericGrade ?? 0) : null }
        : item
      );
      console.log('updated after change:', updated);
      // si se marca no pasado, bloquear seriadas
      if (newStatus !== 'passed') {
        const changed = updated[index];
        console.log('changed item:', changed);
        // buscar sujeto en Subjects
        const changedSubj = SUBJECTS.subjects.find(s => {
          const lower = changed.name.toLowerCase();
          const es = s.name.es.toLowerCase();
          const en = s.name.en?.toLowerCase() || '';
          return lower.includes(es) || (en && lower.includes(en));
        });
        console.log('matched changedSubj:', changedSubj);
        if (changedSubj) {
          // construir lista de bloqueadas recursivas
          const blocked = new Set([changedSubj.code]);
          let addedFlag = true;
          while (addedFlag) {
            addedFlag = false;
            SUBJECTS.subjects.forEach(s => {
              if (!blocked.has(s.code) && s.prerequisites.some(pr => blocked.has(pr))) {
                blocked.add(s.code);
                addedFlag = true;
              }
            });
          }
          console.log('blocked codes:', Array.from(blocked));
          // aplicar bloqueo
          return updated.map(item => {
            const subj = SUBJECTS.subjects.find(s => {
              const lower = item.name.toLowerCase();
              const es = s.name.es.toLowerCase();
              const en = s.name.en?.toLowerCase() || '';
              return lower.includes(es) || (en && lower.includes(en));
            });
            if (subj && blocked.has(subj.code) && subj.code !== changedSubj.code) {
              return { ...item, status: 'not_started', numericGrade: null };
            }
            return item;
          });
        }
      }
      return updated;
    });
  };

  // procesa archivo de kardex y materias cursadas
  const handleKardexFileChange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      // extraer matrícula y nombre de la hoja kardex
      const infoSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('Kardex')) || wb.SheetNames[0];
      const infoSheet = wb.Sheets[infoSheetName];
      const matricula = infoSheet['B1']?.v || '';
      const nombre = infoSheet['B3']?.v || '';
      setStudentInfo({ name: nombre, matricula });
      console.log(`Matrícula: ${matricula}, Nombre: ${nombre}`);
      setParsedData([]);
      
      // leer materias cursadas en la hoja correspondiente
      const matSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('materias cursadas'));
      if (!matSheetName) {
        alert("No se encontró la pestaña 'Materias cursadas'");
        return;
      }
      const matSheet = wb.Sheets[matSheetName];
      const rows = XLSX.utils.sheet_to_json(matSheet, { defval: '' });
      const validRows = rows.filter(r => r['Nombre materia']);
      const data = validRows.map(row => {
        const raw = row['Calificación'];
        let status = (raw === '-' || raw === '') ? 'not_started'
          : (raw === 'CU')    ? 'in_progress'
          : (!isNaN(raw))      ? 'passed'
          : 'unknown';
        return {
          name: row['Nombre materia']?.trim(),
          grade: raw,
          status,
          numericGrade: !isNaN(raw) ? Number(raw) : null
        };
      });
      // si ya tenemos monitoreo, actualizar materias in_progress
      const updated = data.map(item => {
        if (item.status === 'in_progress') {
          const match = gradesData.find(r => r['Nombre de la materia'] === item.name);
          if (match) {
            const rawF = match['Calificación final actual'];
            const num = Number(rawF);
            return { ...item, grade: rawF, numericGrade: isNaN(num) ? null : num, status: !isNaN(num) ? 'passed' : item.status };
          }
        }
        return item;
      });
      setParsedData(updated);
    };
    reader.readAsBinaryString(file);
  };

  // procesa archivo de calificaciones finales y actualiza materias en progreso
  const handleGradesFileChange = e => {
    if (!studentInfo.matricula) return;
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const sheetName = wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
      const filtered = rows.filter(r => r['Matrícula']?.toString() === studentInfo.matricula.toString());
      setGradesData(filtered);
      // actualizar parsedData para materias en progreso
      setParsedData(prev => prev.map(item => {
        if (item.status === 'in_progress') {
          const match = filtered.find(r => r['Nombre de la materia'] === item.name);
          if (match) {
            const raw = match['Calificación final actual'];
            const num = Number(raw);
            return { ...item, grade: raw, numericGrade: isNaN(num)?null:num, status: !isNaN(num)?'passed':item.status };
          }
        }
        return item;
      }));
    };
    reader.readAsBinaryString(file);
  };

  // orden para status de calificaciones
  const statusOrder = { in_progress: 0, not_started: 1, passed: 2, unknown: 3 };
  // IDs de materias aprobadas (matching por inclusión de texto)
  const passedCodes = useMemo(() => (
    parsedData
      .filter(item => item.status === 'passed')
      .map(item => {
        const lowerName = item.name.toLowerCase();
        const subj = SUBJECTS.subjects
          .slice()
          .sort((a, b) => b.name.es.length - a.name.es.length)
          .find(s => {
            const es = s.name.es.toLowerCase();
            const en = s.name.en?.toLowerCase() || '';
            return lowerName.includes(es) || (en && lowerName.includes(en));
          });
        return subj?.code;
      })
      .filter(Boolean)
  ), [parsedData]);

  const enrollmentList = useMemo(() => (
    SUBJECTS.subjects
      .slice()
      .sort((a, b) => a.semester - b.semester)
      .map(s => {
        const done = passedCodes.includes(s.code);
        const canTake = s.prerequisites.every(pr => passedCodes.includes(pr));
        const isProgress = !done && parsedData.some(item => {
          const lowerName = item.name.toLowerCase();
          const es = s.name.es.toLowerCase();
          const en = s.name.en?.toLowerCase() || '';
          return (lowerName.includes(es) || (en && lowerName.includes(en))) && item.status === 'in_progress';
        });
        return { ...s, done, canTake, isProgress };
      })
  ), [parsedData, passedCodes]);

  const allowedSemesters = useMemo(() => (
    period === 'enero-mayo' ? [2, 4, 6] : [1, 3, 5]
  ), [period]);

  const baseTypeMap = useMemo(() => (
    enrollmentList.reduce((m, s) => {
      m[s.code] = s.done ? '' : (allowedSemesters.includes(s.semester) ? 'regular' : 'flex');
      return m;
    }, {})
  ), [enrollmentList, allowedSemesters]);

  const [manualTypeMap, setManualTypeMap] = useState({});

  useEffect(() => {
    if (parsedData.length === 0) {
      setManualTypeMap({});
    }
  }, [parsedData.length]);

  const flatList = useMemo(() => enrollmentList.slice().sort((a, b) => a.semester - b.semester), [enrollmentList]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const semGrid = useMemo(() => (
    [1,2,3,4,5,6].map(sem => enrollmentList.filter(s => s.semester === sem))
  ), [enrollmentList]);

  // manejar flechas y teclas V, F, R
  useEffect(() => {
    const handler = e => {
      // horizontal
      if (['ArrowUp','ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        setSelectedIndex(idx => (idx + dir + flatList.length) % flatList.length);
      }
      // vertical
      if (['ArrowRight','ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        const current = flatList[selectedIndex];
        if (!current) return;
        const sem = current.semester;
        const row = semGrid[sem-1].findIndex(s => s.code === current.code);
        const nextSem = e.key === "ArrowLeft" ? sem - 1 : sem + 1;
        if (nextSem >= 1 && nextSem <= 6) {
          const targetArr = semGrid[nextSem-1];
          let target = targetArr[row] || targetArr[targetArr.length - 1];
          const newIdx = flatList.findIndex(s => s.code === target.code);
          if (newIdx >= 0) setSelectedIndex(newIdx);
        }
      }
      if (['f','F','r','R','v','V'].includes(e.key)) {
        e.preventDefault();
        const subj = flatList[selectedIndex];
        // no cambiar tipo de materias aprobadas
        if (!subj || subj.done) return;
        const code = subj.code;
        let newType = '';
        if (e.key.toLowerCase() === 'f') newType = 'flex';
        if (e.key.toLowerCase() === 'r') newType = 'regular';
        if (e.key.toLowerCase() === 'v') newType = 'verano';
        setManualTypeMap(prev => ({ ...prev, [code]: newType }));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flatList, selectedIndex, semGrid]);

  // orden de disponibilidad: Disponible, Bloqueada, Aprobada
  const availOrder = (s) => s.canTake && !s.done ? 0 : (!s.canTake && !s.done ? 1 : 2);

  const statusMap = useMemo(() => (
    parsedData.reduce((acc, item) => {
      const subj = SUBJECTS.subjects.find(s => {
        const lower = item.name.toLowerCase();
        const es = s.name.es.toLowerCase();
        const en = s.name.en?.toLowerCase() || '';
        return lower.includes(es) || (en && lower.includes(en));
      });
      if (subj) acc[subj.code] = item.status;
      return acc;
    }, {})
  ), [parsedData]);

  const availableSubjects = useMemo(
    () => enrollmentList.filter(s => s.canTake && !s.done && !s.isProgress && s.semester <= targetSemester),
    [enrollmentList, targetSemester]
  );

  const statusTotals = useMemo(() => (
    parsedData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, { passed: 0, in_progress: 0, not_started: 0 })
  ), [parsedData]);

  const summaryCards = useMemo(() => ([
    {
      label: 'Aprobadas',
      value: statusTotals.passed,
      accent: 'from-emerald-500/25 via-emerald-400/20 to-emerald-300/10 border-emerald-400/30'
    },
    {
      label: 'En curso',
      value: statusTotals.in_progress,
      accent: 'from-sky-500/25 via-blue-500/10 to-slate-800 border-sky-400/30'
    },
    {
      label: 'Pendientes',
      value: statusTotals.not_started,
      accent: 'from-amber-500/25 via-orange-500/10 to-slate-900 border-amber-400/30'
    }
  ]), [statusTotals]);

  const periodOptions = [
    { value: 'enero-mayo', label: 'Enero – Mayo', hint: 'Semestres pares (2,4,6)' },
    { value: 'agosto-diciembre', label: 'Agosto – Diciembre', hint: 'Semestres nones (1,3,5)' }
  ];
  const semesterOptions = [1,2,3,4,5,6];
  const statusBadges = {
    passed: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
    in_progress: 'bg-blue-500/15 text-blue-200 border border-blue-500/30',
    not_started: 'bg-slate-500/10 text-slate-200 border border-slate-500/30'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:px-10">
        <section className="rounded-[32px] border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/40 p-8 shadow-[0px_40px_120px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Planeación inteligente</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Proyecciones curriculares</h1>
              <p className="mt-4 max-w-2xl text-slate-300">
                Conecta el Kardex, descubre tus materias bloqueadas y organiza la carga ideal entre regular, flex y verano utilizando atajos de teclado.
              </p>
            </div>
            <div className="grid w-full gap-4 sm:grid-cols-3">
              {summaryCards.map(card => (
                <div
                  key={card.label}
                  className={`rounded-2xl border bg-gradient-to-br px-4 py-5 text-center ${card.accent}`}
                >
                  <p className="text-sm text-slate-200">{card.label}</p>
                  <p className="text-3xl font-semibold text-white">{card.value || 0}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Periodo de proyección</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Elige el semestre que quieres planear</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Cambia entre Enero–Mayo y Agosto–Diciembre para que las materias sugeridas se clasifiquen como regular o flex correctamente. Marca Verano desde la malla usando la tecla <span className="font-semibold text-white">V</span>.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
              {periodOptions.map(option => {
                const isActive = period === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPeriod(option.value)}
                    className={`flex-1 rounded-2xl border px-5 py-4 text-left transition ${isActive ? 'border-white/70 bg-white/10 shadow-lg shadow-emerald-500/10' : 'border-white/10 bg-transparent hover:border-white/40 hover:bg-white/5'}`}
                  >
                    <p className="flex items-center gap-2 text-base font-semibold text-white">
                      <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                      {option.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">{option.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Semestre objetivo</p>
            <p className="mt-2 text-base text-slate-300">Mostrar materias disponibles hasta el semestre seleccionado.<br className="hidden sm:block" /> Actualmente planeando para <span className="font-semibold text-white">Semestre {targetSemester}</span>.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {semesterOptions.map(num => {
                const isActive = targetSemester === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetSemester(num)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${isActive ? 'border-white/70 bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 text-white shadow-lg shadow-emerald-500/15' : 'border-white/10 bg-white/0 text-slate-200 hover:border-white/40 hover:bg-white/5'}`}
                  >
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Semestre</p>
                    <p className="text-2xl font-semibold text-white">{num}</p>
                    <p className="text-xs text-slate-400">Incluye materias de semestres ≤ {num}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Paso 1</p>
                <h2 className="text-2xl font-semibold text-white">Sube tu Kardex</h2>
              </div>
            </div>
            <label
              htmlFor="kardexFile"
              className="mt-5 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-900/40 px-6 text-center text-slate-300 transition hover:border-white/50 hover:bg-slate-900/60"
            >
              <span className="text-base font-medium">Arrastra el archivo o haz clic</span>
              <span className="mt-2 text-sm text-slate-400">Formatos admitidos: .xlsx, .xls</span>
              <input
                id="kardexFile"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleKardexFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Paso 2</p>
                <h2 className="text-2xl font-semibold text-white">Sincroniza Monitoreo</h2>
                <p className="mt-2 text-sm text-slate-300">Actualiza materias en curso al cargar el archivo de calificaciones finales.</p>
              </div>
              <label
                htmlFor="gradesFile"
                className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center text-slate-300 transition ${studentInfo.matricula ? 'border-white/20 bg-slate-900/40 hover:border-white/50 hover:bg-slate-900/60' : 'border-white/5 bg-slate-900/20 cursor-not-allowed text-slate-500'}`}
              >
                <span className="text-base font-medium">Subir Monitoreo</span>
                <span className="mt-2 text-sm">Necesitas cargar primero el Kardex</span>
                <input
                  id="gradesFile"
                  type="file"
                  accept=".xlsx, .xls"
                  disabled={!studentInfo.matricula}
                  onChange={handleGradesFileChange}
                  className="hidden"
                />
              </label>

              {studentInfo.name ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Alumno</p>
                  <p className="text-lg font-semibold text-white">{studentInfo.name}</p>
                  <p className="text-sm text-slate-300">Matrícula: {studentInfo.matricula}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-4 text-sm text-slate-400">
                  Carga tu Kardex para detectar automáticamente nombre y matrícula.
                </div>
              )}
            </div>
          </div>
        </section>

        {parsedData.length > 0 && (
          <section className="mt-12 space-y-8">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Materias cursadas</p>
                  <h3 className="text-2xl font-semibold text-white">Estado actual</h3>
                </div>
                <p className="text-sm text-slate-400">Usa las flechas y letras <span className="font-semibold text-white">R</span>, <span className="font-semibold text-white">F</span>, <span className="font-semibold text-white">V</span> para etiquetar.</p>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-slate-200">
                    <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Nombre materia</th>
                        <th className="px-4 py-3">Calificación</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Calificación numérica</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData
                        .map((item, originalIndex) => ({ item, originalIndex }))
                        .sort((a, b) => statusOrder[a.item.status] - statusOrder[b.item.status])
                        .map(({ item, originalIndex }) => (
                          <tr key={originalIndex} className="border-b border-white/5 last:border-transparent hover:bg-white/5">
                            <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                            <td className="px-4 py-3">{item.grade}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadges[item.status] || ''}`}>
                                  {item.status.replace('_', ' ')}
                                </span>
                                <select
                                  className="rounded-full border border-white/10 bg-transparent px-3 py-1 text-xs capitalize text-white focus:border-white/40"
                                  value={item.status}
                                  onChange={e => handleStatusChange(originalIndex, e.target.value)}
                                >
                                  <option className="text-black" value="not_started">Not started</option>
                                  <option className="text-black" value="in_progress">In progress</option>
                                  <option className="text-black" value="passed">Passed</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-4 py-3">{item.numericGrade ?? '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {availableSubjects.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Disponibilidad inmediata</p>
                    <h3 className="text-2xl font-semibold text-white">Materias recomendadas ({availableSubjects.length})</h3>
                  </div>
                  <p className="text-sm text-slate-400">Planeando carga hasta semestre {targetSemester}. Regular sugerida para {period === 'enero-mayo' ? 'semestres pares (2,4,6)' : 'semestres nones (1,3,5)'}.</p>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {availableSubjects.map(s => (
                    <div
                      key={s.code}
                      className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-lg"
                    >
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Sem {s.semester}</p>
                      <h4 className="mt-2 text-lg font-semibold text-white">{s.name.es}</h4>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">{s.code}</span>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300">{allowedSemesters.includes(s.semester) ? 'Regular' : 'Flex'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {parsedData.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Mapa completo</p>
                <h3 className="text-3xl font-semibold text-white">Malla curricular interactiva</h3>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="rounded-full border border-white/20 px-3 py-1 text-slate-300">R = Regular</span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-slate-300">F = Flex</span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-slate-300">V = Verano</span>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1,2,3,4,5,6].map(sem => (
                <div key={sem} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">Semestre {sem}</h4>
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-500">{semGrid[sem-1]?.length || 0} materias</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {enrollmentList.filter(s => s.semester === sem).map(s => {
                      const idx = flatList.findIndex(f => f.code === s.code);
                      const isSelected = idx === selectedIndex;
                      const type = manualTypeMap[s.code] ?? baseTypeMap[s.code];
                      const status = statusMap[s.code];
                      const cardPalette = s.isProgress
                        ? 'from-blue-500/20 via-blue-500/5 to-slate-900'
                        : s.done
                        ? 'from-emerald-500/25 via-emerald-500/10 to-slate-900'
                        : s.canTake
                        ? 'from-amber-500/25 via-amber-500/10 to-slate-900'
                        : 'from-rose-500/25 via-rose-500/10 to-slate-900';
                      return (
                        <button
                          key={s.code}
                          type="button"
                          onClick={() => setSelectedIndex(idx)}
                          className={`rounded-2xl border border-white/10 bg-gradient-to-br p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-white/40 ${cardPalette} ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-base font-semibold text-white">{s.name.es}</p>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadges[status] || 'bg-white/10 text-white'}`}>
                              {status ? status.replace('_', ' ') : (s.done ? 'passed' : s.canTake ? 'available' : 'blocked')}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-200">{s.code} · {type || 'Sin tipo'}</p>
                          <p className="mt-1 text-xs text-slate-400">Horas: {s.hours} • Créditos: {s.credits}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
