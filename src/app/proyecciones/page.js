"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { SUBJECTS } from '@/Utils/Subjects';

export default function ProyeccionesPage() {
  const [parsedData, setParsedData] = useState([]);
  // estado para datos de alumno y calificaciones finales
  const [studentInfo, setStudentInfo] = useState({ name: '', matricula: '' });
  const [gradesData, setGradesData] = useState([]);

  // función para actualizar estado manualmente
  const handleStatusChange = (index, newStatus) => {
    setParsedData(prev => prev.map((item, i) => i === index
      ? {
          ...item,
          status: newStatus,
          numericGrade: newStatus === 'passed' ? (item.numericGrade ?? 0) : null
        }
      : item
    ));
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
          name: row['Nombre materia'],
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

  // IDs de materias aprobadas
  const passedCodes = parsedData
    .filter(item => item.status === 'passed')
    .map(item => {
      const subj = SUBJECTS.subjects.find(s => s.name.es === item.name);
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
      <div className="mb-4">
        <label htmlFor="gradesFile" className="block font-medium mb-1">Subir Monitoreo</label>
        <input
          id="gradesFile"
          type="file"
          accept=".xlsx, .xls"
          onChange={handleGradesFileChange}
          className="border p-1 rounded"
        />
      </div>
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
            {parsedData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="border px-2 py-1">{item.name}</td>
                <td className="border px-2 py-1">{item.grade}</td>
                {/* reemplazamos texto estático por selector */}
                <td className="border px-2 py-1">
                  <select
                    className="capitalize"
                    value={item.status}
                    onChange={e => handleStatusChange(idx, e.target.value)}
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
      {parsedData.length > 0 && (
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
              {enrollmentList.map((s, idx) => (
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
      )}
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
    </div>
  );
}
