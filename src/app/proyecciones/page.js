"use client";
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { SUBJECTS } from '@/Utils/Subjects';

export default function ProyeccionesPage() {
  const [parsedData, setParsedData] = useState([]);
  // estado para datos de alumno y calificaciones finales
  const [studentInfo, setStudentInfo] = useState({ name: '', matricula: '' });
  const [gradesData, setGradesData] = useState([]);

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
  const passedCodes = parsedData
    .filter(item => item.status === 'passed')
    .map(item => {
      const lowerName = item.name.toLowerCase();
      // ordenar por longitud de nombre para coincidir primero con nombres más largos
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
    .filter(Boolean);

  // lista de materias con disponibilidad según prerrequisitos
  const enrollmentList = SUBJECTS.subjects
    .slice()
    .sort((a, b) => a.semester - b.semester)
    .map(s => {
      const done = passedCodes.includes(s.code);
      const canTake = s.prerequisites.every(pr => passedCodes.includes(pr));
      return { ...s, done, canTake };
    });

  // Semestres de inicio según mes actual
  const month = new Date().getMonth() + 1;
  const allowedSemesters = month <= 5 ? [2, 4, 6] : [1, 3, 5];

  // estado para tipo de inscripción: regular, flex o verano
  const [typeMap, setTypeMap] = useState(() =>
    enrollmentList.reduce((m, s) => ({
      ...m,
      // materias aprobadas no tienen tipo
      [s.code]: s.done ? '' : (allowedSemesters.includes(s.semester) ? 'regular' : 'flex')
    }), {})
  );
  // lista aplanada para navegación
  const flatList = enrollmentList.slice().sort((a, b) => a.semester - b.semester);
  // índice de tarjeta seleccionada
  const [selectedIndex, setSelectedIndex] = useState(0);

  // grilla por semestre para navegación con flechas verticales
  const semGrid = [1,2,3,4,5,6].map(sem =>
    enrollmentList.filter(s => s.semester === sem)
  );

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
        setTypeMap(prev => ({ ...prev, [code]: newType }));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flatList, selectedIndex, semGrid]);

  // orden de disponibilidad: Disponible, Bloqueada, Aprobada
  const availOrder = (s) => s.canTake && !s.done ? 0 : (!s.canTake && !s.done ? 1 : 2);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Proyecciones</h1>
      {/* Subir archivo de Kardex para extraer nombre y matrícula */}
      <div className="mb-4">
        <label htmlFor="kardexFile" className="block font-medium mb-1">Subir Kardex</label>
        <input
          id="kardexFile"
          type="file"
          accept=".xlsx, .xls"
          onChange={handleKardexFileChange}
          className="border p-1 rounded"
        />
      </div>
      {/* Mostrar info del alumno si ya se cargó */}
      {studentInfo.name && (
        <p className="mb-4">Alumno: <strong>{studentInfo.name}</strong> ({studentInfo.matricula})</p>
      )}
      {/* Subir archivo de Monitoreo para calificaciones finales */}
      {/* <div className="mb-4">
        <label htmlFor="gradesFile" className="block font-medium mb-1">Subir Monitoreo</label>
        <input
          id="gradesFile"
          type="file"
          accept=".xlsx, .xls"
          onChange={handleGradesFileChange}
          className="border p-1 rounded"
        />
      </div> */}
      {parsedData.length > 0 && (
        <table className="mt-4 w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1">Nombre materia</th>
              <th className="border px-2 py-1">Calificación</th>
              <th className="border px-2 py-1">Estado</th>
              <th className="border px-2 py-1">Calificación numérica</th>
            </tr>
          </thead>
          <tbody>
            {parsedData
              // conservar índice original antes de ordenar
              .map((item, originalIndex) => ({ item, originalIndex }))
              .sort((a, b) => statusOrder[a.item.status] - statusOrder[b.item.status])
              .map(({ item, originalIndex }) => (
                <tr key={originalIndex} className="hover:bg-gray-100">
                  <td className="border px-2 py-1">{item.name}</td>
                  <td className="border px-2 py-1">{item.grade}</td>
                  <td className="border px-2 py-1">
                    <select
                      className="capitalize"
                      value={item.status}
                      onChange={e => handleStatusChange(originalIndex, e.target.value)}
                    >
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="passed">Passed</option>
                    </select>
                  </td>
                  <td className="border px-2 py-1">{item.numericGrade ?? '-'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {/* segunda tabla: disponibilidad */}
      {/* {parsedData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Disponibilidad de Materias</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1">Código</th>
                <th className="border px-2 py-1">Nombre</th>
                <th className="border px-2 py-1">Semestre</th>
                <th className="border px-2 py-1">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[...enrollmentList]
                .sort((a,b) => {
                  const oa = availOrder(a), ob = availOrder(b);
                  if (oa !== ob) return oa - ob;
                  return a.semester - b.semester;
                })
                .map((s, idx) => (
                <tr key={idx} className="hover:bg-gray-100">
                  <td className="border px-2 py-1">{s.code}</td>
                  <td className="border px-2 py-1">{s.name.es}</td>
                  <td className="border px-2 py-1">{s.semester}</td>
                  <td className="border px-2 py-1">
                    {s.done ? 'Aprobada' : s.canTake ? 'Disponible' : 'Bloqueada'}
                  </td>
                </tr>
              ))}
           </tbody>
         </table>
        </div>
      )} */}
      {parsedData.length > 0 && (
        // Lista simple de materias disponibles
        (() => {
          const available = enrollmentList.filter(s => s.canTake && !s.done);
          if (available.length === 0) return null;
          return (
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-1">Materias Disponibles</h2>
              <ul className="list-disc list-inside">
                {available.map((s, i) => (
                  <li key={i}>
                    {s.code} - {s.name.es} (Sem {s.semester}) - {allowedSemesters.includes(s.semester) ? 'regular' : 'flex'}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()
      )}
      {parsedData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Malla Curricular</h2>
          <div className="grid grid-cols-6 gap-4">
            {[1,2,3,4,5,6].map(sem => (
              <div key={sem}>
                <h3 className="font-medium mb-2 text-center">Semestre {sem}</h3>
                <div className="flex flex-col gap-2">
                  {enrollmentList.filter(s => s.semester === sem).map(s => {
                    const idx = flatList.findIndex(f => f.code === s.code);
                    const isSelected = idx === selectedIndex;
                    const type = typeMap[s.code];
                    const baseColor = s.done ? 'bg-green-200' : s.canTake ? 'bg-yellow-200' : 'bg-red-200';
                    return (
                    <div
                      key={s.code}
                      onClick={() => setSelectedIndex(idx)}
                      className={
                        `border rounded p-2 text-sm flex flex-col justify-between w-full h-32 cursor-pointer ` +
                        `${baseColor} ` +
                        `${isSelected ? 'ring-4 ring-blue-500' : ''}`
                      }
                    >
                     <p className="font-semibold">{s.name.es}</p>
                     <p className="text-xs">{s.code} ({type})</p>
                     <p className="text-xs">Horas: {s.hours} • Créditos: {s.credits}</p>
                    </div>);
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
