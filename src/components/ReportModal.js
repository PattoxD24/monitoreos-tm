"use client";
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx-js-style';
import { getPlanDeEstudiosFromRow, getSubjectSemester, getSubjectKeyFromRow } from '@/Utils/subjectIdentity';
import { SUBJECTS } from '@/Utils/Subjects';

/*
 Modal para generar reporte con filtros:
 1. Secciones de colores (backgroundColor de alumnos): Rojo, Naranja, Amarillo, Verde, Todos.
 2. Sección de estatus por actividades: NE, SC, DA, SD, Todos (solo alumnos que tengan al menos uno seleccionado)
 3. Faltas: Todas (agrega todos los alumnos) o Por materia (solo materias con faltas > 0). Incluye límite de faltas, faltas, porcentaje. 
 4. Si selecciona NE (o Todos en estatus) incluir límite de NE y NE alumno y porcentaje NE.
 5. Pintar la celda del nombre del alumno con el color de su tarjeta.

 Props esperadas:
  - visible
  - onClose
  - students (array base de estudiantes ya filtrados en pantalla)
  - filteredData (mapa matricula -> materias[])
  - calculateSortingCriteria (func para obtener backgroundColor y métricas)
*/

const COLOR_OPTIONS = [
  { key: 'rojo', label: 'Rojos', match: (c) => c === '#FFCCCC' },
  { key: 'naranja', label: 'Naranjas', match: (c) => c === '#FFD9B3' },
  { key: 'amarillo', label: 'Amarillos', match: (c) => c === '#FFFFCC' },
  { key: 'verde', label: 'Verdes', match: (c) => c === '#CCFFCC' },
  { key: 'todos', label: 'Todos', match: () => true }
];

const STATUS_OPTIONS = [
  { key: 'NE', label: 'NE' },
  { key: 'SC', label: 'SC' },
  { key: 'DA', label: 'DA' },
  { key: 'SD', label: 'SD' },
  { key: 'todos', label: 'Todos' }
];

export default function ReportModal({ visible, onClose, students, filteredData, calculateSortingCriteria }) {
  const [selectedColors, setSelectedColors] = useState(['todos']);
  const [selectedStatuses, setSelectedStatuses] = useState(['todos']);
  const [faltasMode, setFaltasMode] = useState('ninguna'); // 'todas' | 'porMateria' | 'ninguna'
  const [isGeneralReport, setIsGeneralReport] = useState(false);
  const [applyColorFilter, setApplyColorFilter] = useState(true);
  const [applyStatusFilter, setApplyStatusFilter] = useState(true);
  const [includeMatricula, setIncludeMatricula] = useState(true);
  const [includeFullName, setIncludeFullName] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [selectedSemesters, setSelectedSemesters] = useState([1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isGeneralReport) return;
    // En modo General no aplican filtros ni faltas
    setSelectedColors(['todos']);
    setSelectedStatuses(['todos']);
    setFaltasMode('ninguna');
    setApplyColorFilter(false);
    setApplyStatusFilter(false);
  }, [isGeneralReport]);

  if (!visible) return null;

  const toggleSelection = (setter, state, key, allKey='todos') => {
    if (key === allKey) {
      setter([allKey]);
      return;
    }
    let next = state.includes(allKey) ? [] : [...state];
    if (next.includes(key)) next = next.filter(k => k !== key); else next.push(key);
    if (next.length === 0) next = [allKey];
    setter(next.filter((v,i,a)=>a.indexOf(v)===i));
  };

  const filterByColors = (student) => {
    if (selectedColors.includes('todos')) return true;
      return COLOR_OPTIONS.some(opt => selectedColors.includes(opt.key) && opt.match(criteria.backgroundColor));
  };

  const studentHasStatus = (student, statusKey) => {
    const subjects = filteredData[student.matricula] || [];
    if (statusKey === 'SD') {
      return subjects.some(s => s.Ponderado === 'SD');
    }
    // Buscar en columnas A#
    return subjects.some(s => Object.keys(s).some(col => /^A\d+$/.test(col) && s[col] === statusKey));
  };

  const filterByStatuses = (student) => {
    if (selectedStatuses.includes('todos')) return true;
    return selectedStatuses.some(st => studentHasStatus(student, st));
  };

  const calculatePonderadoAverage = (subjects) => {
    const values = (subjects || [])
      .map((row) => parseFloat(row?.Ponderado))
      .filter((value) => !isNaN(value));

    if (values.length === 0) return '';
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.round(avg * 100) / 100;
  };

  const buildRows = () => {
    // Filtrar alumnos
    const finalStudents = students.filter(s => (
      (!applyColorFilter || filterByColors(s)) &&
      (!applyStatusFilter || filterByStatuses(s))
    ));
    const rows = [];

    const effectiveFaltasMode = isGeneralReport ? 'ninguna' : faltasMode;

    finalStudents.forEach(student => {
      const criteria = calculateSortingCriteria(student);
      const subjects = filteredData[student.matricula] || [];

      if (effectiveFaltasMode === 'ninguna') {
        const row = {};
        const subs = filteredData[student.matricula] || [];
        if (includeMatricula) row['Matrícula'] = student.matricula;
        if (includeFullName) row['Nombre'] = student.fullName;
        row['Promedio General'] = calculatePonderadoAverage(subs);
        row['Promedio Mínimo'] = criteria.minPonderado === Infinity ? '' : criteria.minPonderado;
        // En modo General no aplican estatus ni contadores
        if (!isGeneralReport) {
          ['NE','SC','DA','SD'].forEach(st=>{ if (selectedStatuses.includes(st) || selectedStatuses.includes('todos')) {
            const count = countStatus(subs, st);
            if (count>0) row[`# ${st}`] = count;
          }});
        }
        row.__bgColor = criteria.backgroundColor;
        rows.push(row);
      }
      // Consolidado de faltas
      else if (effectiveFaltasMode === 'todas') {
        let totalFaltas = 0, totalLimite = 0, totalNE = 0, totalLimiteNE = 0;
        subjects.forEach(sub => {
          const f = parseFloat(sub['Faltas del alumno']) || 0;
            const l = parseFloat(sub['Límite de faltas']) || 0;
            totalFaltas += f; totalLimite += l;
            const neA = parseFloat(sub['NE alumno']) || 0;
            const limNE = parseFloat(sub['Límite de NE']) || 0;
            totalNE += neA; totalLimiteNE += limNE;
        });
        const pctF = totalLimite>0 ? (totalFaltas/totalLimite)*100 : 0;
        const pctNE = totalLimiteNE>0 ? (totalNE/totalLimiteNE)*100 : 0;
        const row = {};
        if (includeMatricula) row['Matrícula'] = student.matricula;
        if (includeFullName) row['Nombre'] = student.fullName;
        row['Promedio General'] = calculatePonderadoAverage(subjects);
        row['Promedio Mínimo'] = criteria.minPonderado === Infinity ? '' : criteria.minPonderado;
        row['Total Faltas'] = totalFaltas;
        row['Límite Faltas'] = totalLimite;
        row['% Faltas'] = pctF.toFixed(2);
        if (selectedStatuses.includes('NE') || selectedStatuses.includes('todos')) {
          row['Total NE'] = totalNE;
          row['Límite NE'] = totalLimiteNE;
          row['% NE'] = pctNE.toFixed(2);
        }
        // Contadores de estatus
        ['NE','SC','DA','SD'].forEach(st=>{ if (selectedStatuses.includes(st) || selectedStatuses.includes('todos')) {
          row[`# ${st}`] = countStatus(subjects, st);
        }});
        row.__bgColor = criteria.backgroundColor; // meta para colorear
        rows.push(row);
  } else { // porMateria
        // Por materia: cada materia con faltas > 0
        subjects.forEach(sub => {
          const faltas = parseFloat(sub['Faltas del alumno']) || 0;
          const limiteF = parseFloat(sub['Límite de faltas']) || 0;
          if (faltas <= 0) return; // solo materias con faltas
          const pctF = limiteF>0 ? (faltas/limiteF)*100 : 0;
          const neA = parseFloat(sub['NE alumno']) || 0;
          const limNE = parseFloat(sub['Límite de NE']) || 0;
          const pctNE = limNE>0 ? (neA/limNE)*100 : 0;
          const row = {};
          if (includeMatricula) row['Matrícula'] = student.matricula;
          if (includeFullName) row['Nombre'] = student.fullName;
          row['Promedio General'] = calculatePonderadoAverage(subjects);
          row['Materia'] = sub['Nombre de la materia'] || sub.Materia || '';
          row['Faltas'] = faltas;
          row['Límite Faltas'] = limiteF;
          row['% Faltas'] = pctF.toFixed(2);
          if ((selectedStatuses.includes('NE') || selectedStatuses.includes('todos')) && (neA>0 || limNE>0)) {
            row['NE'] = neA;
            row['Límite NE'] = limNE;
            row['% NE'] = pctNE.toFixed(2);
          }
          ['NE','SC','DA','SD'].forEach(st=>{ if (selectedStatuses.includes(st) || selectedStatuses.includes('todos')) {
            const count = countStatus([sub], st);
            if (count>0) row[`# ${st}`] = count;
          }});
          row['Ponderado'] = sub.Ponderado;
          row.__bgColor = criteria.backgroundColor;
          rows.push(row);
        });
      }
    });
    return rows;
  };

  const countStatus = (subjects, st) => {
    if (st === 'SD') return subjects.filter(s => s.Ponderado === 'SD').length;
    let count = 0;
    subjects.forEach(s => {
      Object.keys(s).forEach(col => { if (/^A\d+$/.test(col) && s[col] === st) count++; });
    });
    return count;
  };

  const getSubjectCredited = (ponderado) => {
    const val = parseFloat(ponderado);
    return !isNaN(val) && val >= 70;
  };

  const buildSemestralRows = () => {
    const rows = [];

    students.forEach(student => {
      const subjects = filteredData[student.matricula] || [];
      if (subjects.length === 0) return;

      // Extraer planes únicos de las materias del alumno
      const plansMap = {};
      subjects.forEach(sub => {
        const plan = getPlanDeEstudiosFromRow(sub);
        if (!plan) return;
        if (!plansMap[plan]) plansMap[plan] = [];
        plansMap[plan].push(sub);
      });

      const plans = Object.keys(plansMap);
      if (plans.length === 0) {
        // Si ninguna materia tiene plan, crear una fila sin plan
        plansMap[''] = subjects;
        plans.push('');
      }

      plans.forEach(plan => {
        const planSubjects = plansMap[plan];

        // Identificar columnas de actividades (A1, A2, …)
        const activityColumns = Object.keys(planSubjects[0] || {}).filter(col => /^A\d+$/i.test(col));

        // Agrupar materias por Clave de materia (columna del Excel) o nombre como fallback
        const subjectGroups = {};
        planSubjects.forEach(sub => {
          const clave = getSubjectKeyFromRow(sub);
          const name = sub['Nombre de la materia'];
          if (!clave && !name) return;

          const key = clave || name;
          if (!subjectGroups[key]) subjectGroups[key] = { name: name || clave, clave: clave || '', entries: [] };
          subjectGroups[key].entries.push(sub);
        });

        // Evaluar cada grupo: si tiene múltiples intentos, ver la calificación más alta
        let allEventuallyAccredited = true;
        const observaciones = [];
        let totalAccredited = 0;
        const accreditedGrades = [];
        const semesterCount = {};
        const matchedSemesters = new Set();
        let hasDA = false;
        let daSubject = '';

        Object.values(subjectGroups).forEach(group => {
          const entries = group.entries;

          // Ignorar materias optativas (clave empieza con "V")
          if (group.clave && group.clave.startsWith('V')) return;

          // Contar semestres (1 por grupo, no por entrada)
          const groupSem = getSubjectSemester(entries[0]['Nombre de la materia']);
          if (groupSem) {
            matchedSemesters.add(groupSem);
            semesterCount[groupSem] = (semesterCount[groupSem] || 0) + 1;
          }

        // Detectar DA en cualquier actividad del grupo y registrar pérdida de mención
          if (!hasDA) {
            entries.some(sub => {
              return activityColumns.some(col => {
                const val = String(sub[col] || '').trim();
                if (val === 'DA') {
                  hasDA = true;
                  daSubject = group.name || sub['Nombre de la materia'] || '';
                  return true;
                }
                return false;
              });
            });
          }

          if (entries.length === 1) {
            const sub = entries[0];
            if (getSubjectCredited(sub.Ponderado)) {
              totalAccredited++;
              accreditedGrades.push(parseFloat(sub.Ponderado));
            } else {
              allEventuallyAccredited = false;
              observaciones.push(`${sub['Nombre de la materia']}: ${sub.Ponderado} (no acreditada)`);
            }
          } else {
            // Misma materia con varios registros (ej. reprobó y la volvió a cursar)
            const grades = entries.map(sub => ({
              name: sub['Nombre de la materia'],
              raw: sub.Ponderado,
              numeric: parseFloat(sub.Ponderado),
            }));

            const best = grades.reduce((max, g) => {
              const gVal = isNaN(g.numeric) ? -1 : g.numeric;
              const maxVal = isNaN(max.numeric) ? -1 : max.numeric;
              return gVal > maxVal ? g : max;
            }, grades[0]);

            const last = grades[grades.length - 1];
            const bestPassed = !isNaN(best.numeric) && best.numeric >= 70;
            const lastPassed = !isNaN(last.numeric) && last.numeric >= 70;

            if (bestPassed) {
              totalAccredited++;
              accreditedGrades.push(best.numeric);
              const progression = grades.map(g => g.raw).join(' → ');
              observaciones.push(`${group.name}: ${progression} (acreditada)`);
            } else {
              allEventuallyAccredited = false;
              const progression = grades.map(g => g.raw).join(' → ');
              observaciones.push(`${group.name}: ${progression} (no acreditada)`);
            }
          }
        });

        // Determinar semestre real del alumno (moda, no máximo, para evitar que 1 materia adelantada lo desplace)
        let modeSemester = 0;
        let maxCount = 0;
        let maxSemester = 0;
        for (const [sem, count] of Object.entries(semesterCount)) {
          const semNum = parseInt(sem);
          if (count > maxCount) { maxCount = count; modeSemester = semNum; }
          if (semNum > maxSemester) maxSemester = semNum;
        }
        const currentSemester = (maxSemester > modeSemester && (semesterCount[maxSemester] || 0) <= 1 && maxCount >= 2)
          ? modeSemester
          : maxSemester;

        // Verificar mínimo de materias acreditadas según el semestre
        // Calcular materias esperadas acumuladas desde Subjects.js
        const subjectsPerSemester = {};
        SUBJECTS.subjects.forEach(s => {
          subjectsPerSemester[s.semester] = (subjectsPerSemester[s.semester] || 0) + 1;
        });
        let expectedAccredited = 0;
        for (let sem = 1; sem <= currentSemester; sem++) {
          expectedAccredited += subjectsPerSemester[sem] || 0;
        }
        const insufficientAccredited = currentSemester > 0 && totalAccredited < expectedAccredited;

        if (insufficientAccredited) {
          allEventuallyAccredited = false;
          observaciones.push(
            `Materias acreditadas insuficientes: ${totalAccredited}/${expectedAccredited} (se esperan ${expectedAccredited} para el semestre ${currentSemester})`
          );
        }

        const status = allEventuallyAccredited ? 'REGULAR' : 'IRREGULAR';
        const cag = status === 'REGULAR' ? 'SI' : '';

        // Promedio total de materias acreditadas
        const totalAverage = accreditedGrades.length > 0
          ? Math.round((accreditedGrades.reduce((a, b) => a + b, 0) / accreditedGrades.length) * 100) / 100
          : '';

        // Mención honorífica (50% del plan cursado + promedio >= 95)
        const totalCurriculum = SUBJECTS.subjects.length;
        const hasHalfCurriculum = totalAccredited >= Math.ceil(totalCurriculum / 2);

        if (hasDA && hasHalfCurriculum && typeof totalAverage === 'number' && totalAverage >= 95) {
          observaciones.push(`Pierde mención honorífica por DA en: ${daSubject}`);
        }

        const row = {
          'Matrícula': student.matricula,
          'Nombre': student.fullName,
          'Clave plan de estudios': plan,
          'Estatus': status,
          'Materias acreditadas': totalAccredited,
          'Inscrito': '',
          'CAG': cag,
          'Promedio total': totalAverage,
          'Mención': '', // se llena tras el segundo pase
          _noMencion: hasDA,
        };

        // Promedios por semestre seleccionado
        selectedSemesters.forEach(sem => {
          const semSubjects = planSubjects.filter(sub => {
            const s = getSubjectSemester(sub['Nombre de la materia']);
            return s === sem;
          });
          const values = semSubjects
            .map(s => parseFloat(s.Ponderado))
            .filter(v => !isNaN(v));
          const avg = values.length > 0
            ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
            : '';
          row[`Promedio monitoreo Sem ${sem}`] = avg;
          row[`Promedio kardex Sem ${sem}`] = '';
        });

        row['Observaciones'] = observaciones.length > 0 ? observaciones.join('; ') : '';
        rows.push(row);
      });
    });

    // Segundo pase: determinar menciones honoríficas
    const candidates = rows
      .filter(r => {
        if (r._noMencion) return false;
        const avg = r['Promedio total'];
        const totalCurriculum = SUBJECTS.subjects.length;
        const hasHalf = r['Materias acreditadas'] >= Math.ceil(totalCurriculum / 2);
        return hasHalf && typeof avg === 'number' && avg >= 95;
      })
      .sort((a, b) => b['Promedio total'] - a['Promedio total']);

    const excelsior = candidates.length > 0 && candidates[0]['Promedio total'] >= 96 ? candidates[0] : null;

    rows.forEach(r => {
      if (r === excelsior) {
        r['Mención'] = 'Excelencia';
      } else if (candidates.includes(r)) {
        r['Mención'] = 'Honorífica';
      }
    });

    return rows;
  };

  const generateExcel = () => {
    setIsGenerating(true);
    try {
      const isSemestral = activeTab === 'semestral';
      const rows = isSemestral ? buildSemestralRows() : buildRows();
      if (rows.length === 0) { alert('No hay datos para exportar con los filtros seleccionados'); return; }
      const cleanRows = rows.map(r => { const clone = { ...r }; delete clone.__bgColor; delete clone._noMencion; return clone; });
      const headers = [];
      cleanRows.forEach((r) => {
        Object.keys(r).forEach((k) => {
          if (!headers.includes(k)) headers.push(k);
        });
      });
      const ws = XLSX.utils.json_to_sheet(cleanRows, { header: headers });
      // Encabezados estilizados
      headers.forEach((_, idx) => {
        const ref = XLSX.utils.encode_cell({ r:0, c:idx });
        if (ws[ref]) ws[ref].s = {
          font: { bold: true, color:{ rgb:'FFFFFF' } },
          fill: { patternType:'solid', fgColor:{ rgb:'1E3A8A' } },
          alignment: { horizontal:'center', vertical:'center' },
          border: { top:{style:'thin',color:{rgb:'FFFFFF'}}, bottom:{style:'thin',color:{rgb:'FFFFFF'}}, left:{style:'thin',color:{rgb:'FFFFFF'}}, right:{style:'thin',color:{rgb:'FFFFFF'}} }
        };
      });
      // Colorear nombre (solo para reporte general)
      if (!isSemestral) {
        rows.forEach((r, i) => {
          const rowIndex = i + 1; // data row
          const nameIdx = headers.indexOf('Nombre');
          if (nameIdx !== -1) {
            const ref = XLSX.utils.encode_cell({ r: rowIndex, c: nameIdx });
            if (ws[ref]) ws[ref].s = {
              fill: { patternType:'solid', fgColor:{ rgb: (r.__bgColor||'#FFFFFF').replace('#','') } },
              border: { top:{style:'thin',color:{rgb:'DDDDDD'}}, bottom:{style:'thin',color:{rgb:'DDDDDD'}}, left:{style:'thin',color:{rgb:'DDDDDD'}}, right:{style:'thin',color:{rgb:'DDDDDD'}} }
            };
          }
        });
      }
      const wb = XLSX.utils.book_new();
      ws['!cols'] = headers.map(()=>({ wch: isSemestral ? 20 : 18 }));
      XLSX.utils.book_append_sheet(wb, ws, isSemestral ? 'Reporte Semestral' : 'Reporte');
      XLSX.writeFile(wb, `${isSemestral ? 'reporte_semestral' : 'reporte_monitoreos'}_${Date.now()}.xlsx`, { bookType:'xlsx', type:'binary' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Pestañas */}
        <div className="flex gap-6 mb-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2 text-sm font-semibold transition-colors ${
              activeTab === 'general'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('semestral')}
            className={`pb-2 text-sm font-semibold transition-colors ${
              activeTab === 'semestral'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Semestral
          </button>
        </div>

        {activeTab === 'general' && (
          <>
            <div className="mb-4 p-3 rounded border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-2">Tipo</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isGeneralReport}
                  onChange={(e)=>setIsGeneralReport(e.target.checked)}
                />
                General (ignora colores, estatus y faltas)
              </label>

              {!isGeneralReport && (
                <div className="flex flex-wrap gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={applyColorFilter}
                      onChange={(e)=>setApplyColorFilter(e.target.checked)}
                    />
                    Aplicar filtro de colores
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={applyStatusFilter}
                      onChange={(e)=>setApplyStatusFilter(e.target.checked)}
                    />
                    Aplicar filtro de estatus
                  </label>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Colores */}
              <div>
                <h3 className="font-semibold mb-2">Colores</h3>
                {COLOR_OPTIONS.map(opt => (
                  <label
                    key={opt.key}
                    className={`flex items-center gap-2 text-sm mb-1 ${(!applyColorFilter || isGeneralReport) ? 'opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      disabled={!applyColorFilter || isGeneralReport}
                      checked={selectedColors.includes(opt.key)}
                      onChange={()=>toggleSelection(setSelectedColors, selectedColors, opt.key)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Estatus */}
              <div>
                <h3 className="font-semibold mb-2">Estatus (Actividades)</h3>
                {STATUS_OPTIONS.map(opt => (
                  <label
                    key={opt.key}
                    className={`flex items-center gap-2 text-sm mb-1 ${(!applyStatusFilter || isGeneralReport) ? 'opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      disabled={!applyStatusFilter || isGeneralReport}
                      checked={selectedStatuses.includes(opt.key)}
                      onChange={()=>toggleSelection(setSelectedStatuses, selectedStatuses, opt.key)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Faltas */}
              <div>
                <h3 className="font-semibold mb-2">Faltas</h3>
                <label className={`flex items-center gap-2 text-sm mb-1 ${isGeneralReport ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    name="faltasMode"
                    value="todas"
                    disabled={isGeneralReport}
                    checked={faltasMode==='todas'}
                    onChange={()=>setFaltasMode('todas')}
                  />
                  Todas (consolidadas)
                </label>
                <label className={`flex items-center gap-2 text-sm mb-1 ${isGeneralReport ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    name="faltasMode"
                    value="porMateria"
                    disabled={isGeneralReport}
                    checked={faltasMode==='porMateria'}
                    onChange={()=>setFaltasMode('porMateria')}
                  />
                  Por materia (solo con faltas)
                </label>
                <label className={`flex items-center gap-2 text-sm mb-1 ${isGeneralReport ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    name="faltasMode"
                    value="ninguna"
                    disabled={isGeneralReport}
                    checked={faltasMode==='ninguna'}
                    onChange={()=>setFaltasMode('ninguna')}
                  />
                  No incluir faltas
                </label>

                <h3 className="font-semibold mt-4 mb-2">Columnas básicas</h3>
                <label className="flex items-center gap-2 text-sm mb-1">
                  <input type="checkbox" checked={includeMatricula} onChange={()=>setIncludeMatricula(v=>!v)} /> Matrícula
                </label>
                <label className="flex items-center gap-2 text-sm mb-1">
                  <input type="checkbox" checked={includeFullName} onChange={()=>setIncludeFullName(v=>!v)} /> Nombre completo
                </label>
              </div>
            </div>
          </>
        )}

        {activeTab === 'semestral' && (
          <div className="mb-4 p-3 rounded border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold mb-2">Seleccionar semestres para promedios</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Se generarán columnas de promedio por cada semestre seleccionado.
            </p>
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3, 4, 5, 6].map(sem => (
                <label key={sem} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedSemesters.includes(sem)}
                    onChange={() => {
                      setSelectedSemesters(prev =>
                        prev.includes(sem)
                          ? prev.filter(s => s !== sem)
                          : [...prev, sem].sort((a, b) => a - b)
                      );
                    }}
                  />
                  Semestre {sem}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Se generará una fila por cada alumno + plan de estudios. Si un alumno tiene materias de dos planes, aparecerá en dos filas.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-sm">Cancelar</button>
          <button disabled={isGenerating} onClick={generateExcel} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm">
            {isGenerating? 'Generando...' : 'Descargar Excel'}
          </button>
        </div>

        <p className="text-xs mt-4 text-gray-500 dark:text-gray-400">Nota: El color del nombre puede no mostrarse en algunos visores debido a limitaciones de estilos en la librería.</p>
      </div>
    </div>
  );
}
