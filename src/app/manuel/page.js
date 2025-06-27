"use client"
import React, { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { SUBJECTS } from '@/Utils/Subjects'

export default function Page() {
  const [records, setRecords] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalItems, setModalItems] = useState([])
  const [modalAlumno, setModalAlumno] = useState("")

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target.result
      const workbook = XLSX.read(bstr, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(sheet)
      const mapped = json.map(row => ({
        periodo: row['Nombre del periodo'],
        matricula: row['Matrícula'],
        alumno: row['Nombre del alumno'],
        materia: row['Nombre de la materia'],
        claveMateria: row['Clave de materia'],
        calificacion: row['Calificación final actual'],
        clavePlan: row['Clave plan de estudios'],
        situacion: row['SITUACIÓN'],
      }))
      setRecords(mapped)
    }
    reader.readAsBinaryString(file)
  }

  const bgForSituation = (sit) => {
    if (sit === 'Aprobado') return 'bg-green-100'
    if (sit === 'Reprobado') return 'bg-red-100'
    if (sit === 'Condicional') return 'bg-yellow-100'
    return 'bg-gray-100'
  }

  const openModal = (alumno, items) => {
    setModalAlumno(alumno)
    setModalItems(items)
    setIsModalOpen(true)
  }
  const closeModal = () => setIsModalOpen(false)

  const getSortedPeriodos = (items) => {
    const order = ["Ene-May", "Verano Semestral", "Ago - Dic"]
    const unique = [...new Set(items.map(it => it.periodo))]
    return unique.sort((a, b) => {
      const idxA = a.indexOf(" ")
      const idxB = b.indexOf(" ")
      const yearA = parseInt(a.substring(0, idxA))
      const yearB = parseInt(b.substring(0, idxB))
      const semA = a.substring(idxA + 1)
      const semB = b.substring(idxB + 1)
      if (yearA !== yearB) return yearA - yearB
      return order.indexOf(semA) - order.indexOf(semB)
    })
  }

  const curricularBySemester = useMemo(() => {
    // Helper to normalize text
    const normalize = str => str?.trim().toLowerCase();
    const passedCodes = modalItems
      .filter(i => Number(i.calificacion) > 69)
      .map(i => {
        const matNorm = normalize(i.materia);
        const subj = SUBJECTS.subjects.find(s => {
          // comparar nombre en español, inglés o adicionales
          if (normalize(s.name.es) === matNorm || normalize(s.name.en) === matNorm) {
            return true;
          }
          // lista de nombres adicionales (separados por coma)
          if (s.name.additional) {
            const extras = s.name.additional.split(',').map(n => normalize(n));
            if (extras.includes(matNorm)) return true;
          }
          return false;
        });
        return subj?.code;
      })
     .filter(Boolean);
    console.log(passedCodes);
    return SUBJECTS.subjects
      .slice()
      .sort((a, b) => a.semester - b.semester)
      .reduce((acc, s) => {
        const done = passedCodes.includes(s.code)
        const canTake = s.prerequisites.every(pr => passedCodes.includes(pr))
        acc[s.semester] = acc[s.semester] || []
        acc[s.semester].push({ ...s, done, canTake })
        return acc
      }, {})
  }, [modalItems])

  // Determinar estado de alumno según materias aprobadas en semestres 1-4
  const statusForAlumno = (items) => {
    const normalize = str => str?.trim().toLowerCase();
    // códigos de materias aprobadas
    const passedCodes = items
      .filter(it => Number(it.calificacion) > 69)
      .map(it => {
        const matNorm = normalize(it.materia);
        const subj = SUBJECTS.subjects.find(s => {
          if (normalize(s.name.es) === matNorm || normalize(s.name.en) === matNorm) return true;
          if (s.name.additional) {
            const extras = s.name.additional.split(',').map(n => normalize(n));
            if (extras.includes(matNorm)) return true;
          }
          return false;
        });
        return subj?.code;
      })
      .filter(Boolean);
    // materias requeridas semestres 1 a 4
    const required = SUBJECTS.subjects
      .filter(s => s.semester <= 4)
      .map(s => s.code);
    const isRegular = required.every(code => passedCodes.includes(code));
    return isRegular ? 'Regular' : 'Irregular';
  }

  // Exportar datos a Excel con dos hojas: Regulares e Irregulares
  const handleExport = () => {
    // Mapeo fijo de periodos a etiqueta y semestre
    const periodMapping = {
      '2023 Ago - Dic': { label: 'AD - 2023', sem: '1ERO' },
      '2024 Ene - May': { label: 'EM - 2024', sem: '2DO' },
      '2024 Verano semestral': { label: 'VS - 2024', sem: '' },
      '2024 Verano Semestral': { label: 'VS - 2024', sem: '' },
      '2024 Ago - Dic': { label: 'AD - 2024', sem: '3ERO' },
      '2025 Ene - May': { label: 'EM - 2025', sem: '4TO' },
      '2025 Ene- May': { label: 'EM - 2025', sem: '4TO' },
    };
     // Helper para normalizar nombres
     const normalize = str => str?.trim().toLowerCase();
     // Agrupar registros por alumno
     const groups = records.reduce((acc, item) => {
      acc[item.alumno] = acc[item.alumno] ? [...acc[item.alumno], item] : [item]
      return acc
    }, {})
    // Preparar filas con status
    const rows = Object.entries(groups).flatMap(([alumno, items]) => {
      const status = statusForAlumno(items)
      return items.map(it => ({
        alumno,
        matricula: it.matricula,
        periodo: it.periodo,
        materia: it.materia,
        calificacion: it.calificacion,
        situacion: it.situacion,
        claveMateria: it.claveMateria,
        clavePlan: it.clavePlan,
        status,
      }))
    })
    // Filtrar por status
    const regularRows = rows.filter(r => r.status === 'Regular')
    const irregularRows = rows.filter(r => r.status === 'Irregular')
    // Generar workbook con encabezados y datos usando array of arrays
    const wb = XLSX.utils.book_new()
    // Definir encabezado con columnas No., B Semestre, C Recuento, luego columnas solicitadas
    const header = ['No.', 'Semestre', 'Count', 'Periodo', 'Matrícula', 'Alumno', 'Materia', 'Clave materia', 'Calificación', 'Clave plan de estudios', 'Estatus']
    // Agrupar registros por alumno y asignar semestres
    const periodGroupsReg = {}
    regularRows.forEach(r => {
      // usar etiqueta custom de periodo
      const map = periodMapping[r.periodo] || { label: r.periodo, sem: '' };
      const periodoEtiq = map.label;
      const key = `${r.alumno}__${periodoEtiq}`;
      if (!periodGroupsReg[key]) periodGroupsReg[key] = { rows: [], sem: '' }
      periodGroupsReg[key].rows.push({ ...r, periodo: periodoEtiq })
      // asignar sem de mapeo fijo
      periodGroupsReg[key].sem = map.sem;
    })
    const dataReg = [header]
    // Ordenar por alumno y luego periodo y numerar alumnos
    const alumnosReg = [...new Set(regularRows.map(r => r.alumno))].sort((a, b) => a.localeCompare(b))
    const comparePeriodoStr = (a, b) => {
      const periodOrder = ["AD - 2023", "EM - 2024", "VS - 2024", "AD - 2024", "EM - 2025"];
      const idxA = periodOrder.indexOf(a);
      const idxB = periodOrder.indexOf(b);
      return idxA - idxB;
    }
    alumnosReg.forEach((alumno, alumnoIdx) => {
      const numAlumno = alumnoIdx + 1
      const periodos = [...new Set(Object.values(periodGroupsReg)
        .filter(g => g.rows[0].alumno === alumno)
        .map(g => g.rows[0].periodo))].sort(comparePeriodoStr)
      periodos.forEach(periodo => {
        const group = periodGroupsReg[`${alumno}__${periodo}`]
        group.rows.forEach((r, idx) => {
          const estatus = Number(r.calificacion) > 69 ? 'Aprobada' : 'Reprobada'
          const subj = SUBJECTS.subjects.find(s => normalize(s.name.es) === normalize(r.materia) || normalize(s.name.en) === normalize(r.materia) || (s.name.additional && s.name.additional.split(',').map(n => normalize(n)).includes(normalize(r.materia))));
          const code = subj?.code || r.claveMateria;
          dataReg.push([numAlumno, group.sem, idx + 1, r.periodo, r.matricula, r.alumno, r.materia, code, r.calificacion, r.clavePlan, estatus])
        })
      })
    })
    const wsReg = XLSX.utils.aoa_to_sheet([dataReg[0], ...dataReg.slice(1)])
    // Merges en columna A por alumno y en columna B por alumno y periodo
    const mergesAReg = alumnosReg.flatMap((alumno) => {
      const idxs = dataReg.slice(1).map((row, i) => row[5] === alumno ? i : -1).filter(i => i >= 0)
      if (idxs.length <= 1) return []
      const start = Math.min(...idxs) + 1
      const end = Math.max(...idxs) + 1
      return [{ s: { r: start, c: 0 }, e: { r: end, c: 0 } }]
    })
    const mergesBReg = Object.entries(periodGroupsReg).flatMap(([key, group]) => {
      if (group.rows.length <= 1) return []
      const [alumno, periodo] = key.split('__')
      const idxs = dataReg.slice(1).map((row, i) => row[5] === alumno && row[3] === periodo ? i : -1).filter(i => i >= 0)
      const start = Math.min(...idxs) + 1
      const end = Math.max(...idxs) + 1
      return [{ s: { r: start, c: 1 }, e: { r: end, c: 1 } }]
    })
    wsReg['!merges'] = [...mergesAReg, ...mergesBReg]
    XLSX.utils.book_append_sheet(wb, wsReg, 'Regulares')
    // Construir datos para Irregulares similarmente
    const periodGroupsIrreg = {}
    irregularRows.forEach(r => {
      const map = periodMapping[r.periodo] || { label: r.periodo, sem: '' };
      const periodoEtiq = map.label;
      const key = `${r.alumno}__${periodoEtiq}`;
      if (!periodGroupsIrreg[key]) periodGroupsIrreg[key] = { rows: [], sem: '' }
      periodGroupsIrreg[key].rows.push({ ...r, periodo: periodoEtiq })
      periodGroupsIrreg[key].sem = map.sem;
    })
    const dataIrreg = [header]
    const alumnosIrreg = [...new Set(irregularRows.map(r => r.alumno))].sort((a, b) => a.localeCompare(b))
    alumnosIrreg.forEach((alumno, alumnoIdx) => {
      const numAlumno = alumnoIdx + 1
      const periodos = [...new Set(Object.values(periodGroupsIrreg)
        .filter(g => g.rows[0].alumno === alumno)
        .map(g => g.rows[0].periodo))].sort(comparePeriodoStr)
      periodos.forEach(periodo => {
        const group = periodGroupsIrreg[`${alumno}__${periodo}`]
        group.rows.forEach((r, idx) => {
          const estatus = Number(r.calificacion) > 69 ? 'Aprobada' : 'Reprobada'
          const subjIr = SUBJECTS.subjects.find(s => normalize(s.name.es) === normalize(r.materia) || normalize(s.name.en) === normalize(r.materia) || (s.name.additional && s.name.additional.split(',').map(n => normalize(n)).includes(normalize(r.materia))));
          const codeIr = subjIr?.code || r.claveMateria;
          dataIrreg.push([numAlumno, group.sem, idx + 1, r.periodo, r.matricula, r.alumno, r.materia, codeIr, r.calificacion, r.clavePlan, estatus])
        })
      })
    })
    const wsIrreg = XLSX.utils.aoa_to_sheet([dataIrreg[0], ...dataIrreg.slice(1)])
    // Merges en columna A e B para Irregulares
    const mergesAIr = alumnosIrreg.flatMap(alumno => {
      const idxs = dataIrreg.slice(1).map((row, i) => row[5] === alumno ? i : -1).filter(i => i >= 0)
      if (idxs.length <= 1) return []
      const start = Math.min(...idxs) + 1
      const end = Math.max(...idxs) + 1
      return [{ s: { r: start, c: 0 }, e: { r: end, c: 0 } }]
    })
    const mergesBIr = Object.entries(periodGroupsIrreg).flatMap(([key, group]) => {
      if (group.rows.length <= 1) return []
      const [alumno, periodo] = key.split('__')
      const idxs = dataIrreg.slice(1).map((row, i) => row[5] === alumno && row[3] === periodo ? i : -1).filter(i => i >= 0)
      const start = Math.min(...idxs) + 1
      const end = Math.max(...idxs) + 1
      return [{ s: { r: start, c: 1 }, e: { r: end, c: 1 } }]
    })
    wsIrreg['!merges'] = [...mergesAIr, ...mergesBIr]
    XLSX.utils.book_append_sheet(wb, wsIrreg, 'Irregulares')
    // Descargar archivo
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reporte_estudiantes.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-4"
      />
            <button
              onClick={handleExport}
              className="mb-4 ml-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Exportar Excel
            </button>
      {/* Agrupar alumnos por nombre */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(
          records.reduce((acc, item) => {
            acc[item.alumno] = acc[item.alumno] ? [...acc[item.alumno], item] : [item]
            return acc
          }, {})
        ).map(([alumno, items], idx) => {
          const status = statusForAlumno(items)
          const cardBg = status === 'Regular' ? 'bg-green-100' : 'bg-yellow-100'
          return (
            <div
              key={idx}
              className={`${cardBg} p-4 rounded shadow cursor-pointer`}
              onClick={() => openModal(alumno, items)}
            >
              {/* Información general */}
              <p className='font-semibold'>Alumno: {alumno}</p>
              <p>Matrícula: {items[0].matricula}</p>
              <p className='mt-2 font-extrabold text-lg'>{status}</p>
              {/* Haz clic para ver periodos */}
            </div>
          );
        })}
       </div>
       {isModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
           <div className="bg-white p-6 rounded shadow-lg w-5/6 h-5/6 overflow-auto">
             <h2 className="text-xl font-semibold mb-4">{modalAlumno} - Periodos</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-auto">
               {getSortedPeriodos(modalItems).map((per, i) => (
                 <div key={i} className="mb-4">
                   <h3 className="font-medium mb-2">{per}</h3>
                   <table className="w-full text-sm">
                     <thead>
                       <tr>
                         <th className="border px-2 py-1">Materia</th>
                         <th className="border px-2 py-1">Calificación</th>
                         <th className="border px-2 py-1">Situación</th>
                       </tr>
                     </thead>
                     <tbody>
                       {modalItems.filter(it => it.periodo === per).map((it, j) => (
                         <tr key={j} className={bgForSituation(it.situacion)}>
                           <td className="border px-2 py-1">{it.materia}</td>
                           <td className="border px-2 py-1">{it.calificacion}</td>
                           <td className="border px-2 py-1">{it.situacion}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               ))}
             </div>
             <div className="mt-6">
               <h2 className="text-lg font-semibold mb-2">Malla Curricular</h2>
               <div
                 className="grid gap-4"
                 style={{ gridTemplateColumns: `repeat(${Object.keys(curricularBySemester).length}, minmax(0, 1fr))` }}
               >
                 {Object.entries(curricularBySemester).map(([sem, list]) => (
                   <div key={sem}>
                     <h3 className="font-medium mb-1 text-center">Semestre {sem}</h3>
                     <ul className="space-y-1">
                       {list.map(sub => (
                         <li
                           key={sub.code}
                           className={`p-2 rounded w-full h-16 flex items-center justify-center text-center ${sub.done ? 'bg-green-200' : 'bg-red-200'}`}
                         >{sub.name.es}</li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
             </div>
             <div className="flex justify-end mt-4">
               <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded">Cerrar</button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}