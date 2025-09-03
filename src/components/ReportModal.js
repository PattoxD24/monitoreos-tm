"use client";
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx-js-style';

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
  const [faltasMode, setFaltasMode] = useState('todas'); // 'todas' | 'porMateria' | 'ninguna'
  const [includeMatricula, setIncludeMatricula] = useState(true);
  const [includeFullName, setIncludeFullName] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    const criteria = calculateSortingCriteria(student);
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

  const buildRows = () => {
    // Filtrar alumnos
    const finalStudents = students.filter(s => filterByColors(s) && filterByStatuses(s));
    const rows = [];

    finalStudents.forEach(student => {
      const criteria = calculateSortingCriteria(student);
      const subjects = filteredData[student.matricula] || [];

      if (faltasMode === 'ninguna') {
        const row = {};
        const subs = filteredData[student.matricula] || [];
        if (includeMatricula) row['Matrícula'] = student.matricula;
        if (includeFullName) row['Nombre'] = student.fullName;
        row['Promedio Mínimo'] = criteria.minPonderado === Infinity ? '' : criteria.minPonderado;
        // NO agregamos faltas ni NE totals en este modo
        ['NE','SC','DA','SD'].forEach(st=>{ if (selectedStatuses.includes(st) || selectedStatuses.includes('todos')) {
          const count = countStatus(subs, st);
          if (count>0) row[`# ${st}`] = count;
        }});
        row.__bgColor = criteria.backgroundColor;
        rows.push(row);
      }
      // Consolidado de faltas
      else if (faltasMode === 'todas') {
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

  const generateExcel = () => {
    setIsGenerating(true);
    try {
      const rows = buildRows();
      if (rows.length === 0) { alert('No hay datos para exportar con los filtros seleccionados'); return; }
      const cleanRows = rows.map(r => { const clone = { ...r }; delete clone.__bgColor; return clone; });
      const ws = XLSX.utils.json_to_sheet(cleanRows);
      const headers = Object.keys(cleanRows[0]);
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
      // Colorear nombre
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
      const wb = XLSX.utils.book_new();
      ws['!cols'] = headers.map(()=>({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
      XLSX.writeFile(wb, `reporte_monitoreos_${Date.now()}.xlsx`, { bookType:'xlsx', type:'binary' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Generar Reporte</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Colores */}
          <div>
            <h3 className="font-semibold mb-2">Colores</h3>
            {COLOR_OPTIONS.map(opt => (
              <label key={opt.key} className="flex items-center gap-2 text-sm mb-1">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(opt.key)}
                  onChange={()=>toggleSelection(setSelectedColors, selectedColors, opt.key)}
                /> {opt.label}
              </label>
            ))}
          </div>
          {/* Estatus */}
          <div>
            <h3 className="font-semibold mb-2">Estatus (Actividades)</h3>
            {STATUS_OPTIONS.map(opt => (
              <label key={opt.key} className="flex items-center gap-2 text-sm mb-1">
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(opt.key)}
                  onChange={()=>toggleSelection(setSelectedStatuses, selectedStatuses, opt.key)}
                /> {opt.label}
              </label>
            ))}
          </div>
          {/* Faltas */}
          <div>
            <h3 className="font-semibold mb-2">Faltas</h3>
            <label className="flex items-center gap-2 text-sm mb-1">
              <input type="radio" name="faltasMode" value="todas" checked={faltasMode==='todas'} onChange={()=>setFaltasMode('todas')} /> Todas (consolidadas)
            </label>
            <label className="flex items-center gap-2 text-sm mb-1">
              <input type="radio" name="faltasMode" value="porMateria" checked={faltasMode==='porMateria'} onChange={()=>setFaltasMode('porMateria')} /> Por materia (solo con faltas)
            </label>
            <label className="flex items-center gap-2 text-sm mb-1">
              <input type="radio" name="faltasMode" value="ninguna" checked={faltasMode==='ninguna'} onChange={()=>setFaltasMode('ninguna')} /> No incluir faltas
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
