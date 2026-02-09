"use client";

import { useState, useEffect, useCallback } from "react";
import useStudentData from "@/hooks/useStudentData";
import Loading from "@/components/Loading";
import StudentModal from "@/components/StudentModal";
import SidebarNav from "@/components/SidebarNav";
import StatusFilter from "@/components/StatusFilter";
import { computeSubjectStatus } from "@/Utils/predictions";
import { getPonderationsForRow, getSubjectNameFromRow } from "@/Utils/subjectIdentity";

export default function RiesgoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [riesgoStudents, setRiesgoStudents] = useState([]);
  const [filterType, setFilterType] = useState("todos"); // todos, faltas, ne, ponderado
  const [statusFilter, setStatusFilter] = useState("todos"); // todos, recursar, extraordinario, peligro, bajo promedio, faltas, ne

  const defaultVisibleColumns = {
    Matrícula: true,
    "Nombre del alumno": true,
    "Nombre de la materia": true,
    "# Grupo": true,
    "Límite de faltas": true,
    "Faltas del alumno": true,
    "Límite de NE": true,
    "NE alumno": true,
    Ponderado: true,
  };

  const {
    studentData,
    filteredData,
    columns,
    visibleColumns,
    ponderationData,
    scripts,
    whatsapp
  } = useStudentData(defaultVisibleColumns);

  const processStudentsAtRisk = useCallback(() => {
    const studentsAtRisk = [];

    Object.keys(filteredData).forEach(matricula => {
      const studentRows = filteredData[matricula] || [];
      const student = studentData.find(s => s.matricula === matricula);
      
      if (!student) return;

      // Verificar cada materia del estudiante
      const materiasEnRiesgo = [];
      
      studentRows.forEach(row => {
        const nombreMateria = getSubjectNameFromRow(row) || row["Nombre de la materia"];
        const ponderacionesMateria = getPonderationsForRow(row, ponderationData);
        const status = computeSubjectStatus(row, ponderacionesMateria);

        // Filtro por tipo de indicador original (mantener opciones de UI)
        const faltasAlumno = parseFloat(row["Faltas del alumno"]) || 0;
        const limiteFaltas = parseFloat(row["Límite de faltas"]) || 1;
        const porcentajeFaltas = (faltasAlumno / limiteFaltas) * 100;
        const neAlumno = parseFloat(row["NE alumno"]) || 0;
        const limiteNE = parseFloat(row["Límite de NE"]) || 1;
        const porcentajeNE = (neAlumno / limiteNE) * 100;
        const ponderado = row["Ponderado"];
        const ponderadoNumerico = parseFloat(ponderado) || 0;

        let includeByFilter = false;
        switch (filterType) {
          case 'faltas':
            includeByFilter = porcentajeFaltas >= 80;
            break;
          case 'ne':
            includeByFilter = porcentajeNE >= 80;
            break;
          case 'ponderado':
            includeByFilter = (ponderado === 'NP') || ponderadoNumerico < 70;
            break;
          default:
            includeByFilter = true;
        }

        if (includeByFilter && (status.statusText === 'NP' || status.statusText === 'Recursar' || status.statusText === 'Extraordinario' || status.statusText === 'Peligro' || status.statusText === 'Bajo promedio' || status.statusText === 'Faltas' || status.statusText === 'NE')) {
          const statusClass =
            status.statusText === 'NP'
              ? 'bg-purple-100 border-purple-500 text-purple-700'
              : status.statusText === 'Recursar'
              ? 'bg-red-100 border-red-500 text-red-700'
              : status.statusText === 'Extraordinario'
              ? 'bg-orange-100 border-orange-500 text-orange-700'
              : status.statusText === 'Peligro'
              ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
              : status.statusText === 'Faltas'
              ? 'bg-pink-100 border-pink-500 text-pink-700'
              : status.statusText === 'NE'
              ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
              : 'bg-blue-100 border-blue-500 text-blue-700'; // Bajo promedio

          if (statusFilter === 'todos' || status.statusText.toLowerCase() === statusFilter.toLowerCase()) {
            materiasEnRiesgo.push({
              nombreMateria,
              ponderado,
              ponderadoNumerico,
              tieneNP: status.statusText === 'NP',
              faltasAlumno,
              limiteFaltas,
              porcentajeFaltas,
              neAlumno,
              limiteNE,
              porcentajeNE,
              statusClass,
              statusText: status.statusText,
              maxPrediction: status.maxPrediction,
              reason: status.reason,
            });
          }
        }
      });
      
      if (materiasEnRiesgo.length > 0) {
        studentsAtRisk.push({
          ...student,
          materiasEnRiesgo
        });
      }
    });

    setRiesgoStudents(studentsAtRisk);
  }, [filteredData, studentData, filterType, ponderationData, statusFilter]);

  useEffect(() => {
    if (Object.keys(filteredData).length > 0) {
      processStudentsAtRisk();
    }
  }, [filteredData, filterType, processStudentsAtRisk]);
  
  const openModal = (student) => {
    // Transformar las materias en riesgo a la estructura esperada por StudentModal
    const parsedCriticalSubjects = student.materiasEnRiesgo.map(materia => {
      // Asegurarse de que todos los valores sean del tipo correcto
      return {
        "Nombre de la materia": materia.nombreMateria,
        "Ponderado": materia.tieneNP ? "NP" : parseFloat(materia.ponderadoNumerico || 0),
        "Faltas del alumno": parseInt(materia.faltasAlumno || 0),
        "Límite de faltas": parseInt(materia.limiteFaltas || 1),
        "NE alumno": parseInt(materia.neAlumno || 0),
        "Límite de NE": parseInt(materia.limiteNE || 1)
      };
    });
    
    setSelectedStudent({
      ...student,
      criticalSubjects: parsedCriticalSubjects
    });
  };

  const closeModal = () => {
    setSelectedStudent(null);
  };

  // Calcular conteos de estudiantes por status
  const getStatusCounts = useCallback(() => {
    let peligroCount = 0;
    let recursarCount = 0;
    let npCount = 0;
    let extraordinarioCount = 0;
  let bajoPromedioCount = 0;
  let faltasCount = 0;
  let neCountLocal = 0;

    Object.keys(filteredData).forEach(matricula => {
      const studentRows = filteredData[matricula] || [];
  let hasRecursar = false;
  let hasPeligro = false;
  let hasNP = false;
  let hasBajoPromedio = false;
  let hasExtraordinario = false;
  let hasFaltas = false;
  let hasNE = false;

      studentRows.forEach(row => {
        const nombreMateria = getSubjectNameFromRow(row) || row['Nombre de la materia'];
        const ponderacionesMateria = getPonderationsForRow(row, ponderationData);
        const status = computeSubjectStatus(row, ponderacionesMateria);

        if (status.statusText === 'NP') hasNP = true;
        else if (status.statusText === 'Recursar') hasRecursar = true;
        else if (status.statusText === 'Peligro') hasPeligro = true;
        else if (status.statusText === 'Faltas') hasFaltas = true;
        else if (status.statusText === 'NE') hasNE = true;
        else if (status.statusText === 'Bajo promedio') hasBajoPromedio = true;
        else if (status.statusText === 'Extraordinario') hasExtraordinario = true;
      });

      // Contar según prioridad por alumno: NP > Recursar > Peligro > Bajo promedio > Extraordinario
      if (hasNP) npCount++;
      else if (hasRecursar) recursarCount++;
      else if (hasPeligro) peligroCount++;
      else if (hasFaltas) faltasCount++;
      else if (hasNE) neCountLocal++;
      else if (hasBajoPromedio) bajoPromedioCount++;
      else if (hasExtraordinario) extraordinarioCount++;
    });

    return { peligroCount, recursarCount, npCount, extraordinarioCount, bajoPromedioCount, faltasCount, neCountLocal };
  }, [filteredData, ponderationData]);

  // Para manejar el estado del sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const handleSidebarToggle = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };

  const { peligroCount, recursarCount, npCount, extraordinarioCount, bajoPromedioCount, faltasCount, neCountLocal } = getStatusCounts();

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-800">
      <SidebarNav onToggle={handleSidebarToggle} />
      
      <main className={`flex-1 p-8 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Alumnos en Riesgo Académico</h1>
            <p className="text-gray-600 dark:text-gray-200 mt-2">
              Listado de alumnos con indicadores académicos críticos
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-700 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Filtrar por tipo de riesgo</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${filterType === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
              onClick={() => setFilterType('todos')}
            >
              Todos los criterios
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${filterType === 'faltas' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
              onClick={() => setFilterType('faltas')}
            >
              Faltas ≥ 80%
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${filterType === 'ne' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
              onClick={() => setFilterType('ne')}
            >
              NE ≥ 80%
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors ${filterType === 'ponderado' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
              onClick={() => setFilterType('ponderado')}
            >
              Ponderado &lt; 70
            </button>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-200 dark:border-gray-600 my-6"></div>

        {/* Filtros por Status */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-700 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Filtrar por status</h2>
          <div className="flex gap-4">
            <button 
              className={`px-4 py-2 rounded-md transition-colors relative ${
                statusFilter === 'todos' ? 'bg-blue-600 text-white' : 
                'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
              onClick={() => setStatusFilter('todos')}
            >
              Todos
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors relative ${
                statusFilter === 'bajo promedio' ? 'bg-blue-500 text-white' : 
                'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
              onClick={() => setStatusFilter('bajo promedio')}
            >
              Bajo promedio
              <span className="ml-2 inline-flex items-center justify-center bg-blue-200 text-blue-800 text-xs font-bold rounded-full h-5 w-5">
                {bajoPromedioCount}
              </span>
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors relative ${
                statusFilter === 'peligro' ? 'bg-yellow-500 text-white' : 
                'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }`}
              onClick={() => setStatusFilter('peligro')}
            >
              Peligro
              <span className="ml-2 inline-flex items-center justify-center bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full h-5 w-5">
                {peligroCount}
              </span>
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors relative ${
                statusFilter === 'faltas' ? 'bg-pink-500 text-white' : 
                'bg-pink-100 text-pink-800 hover:bg-pink-200'
              }`}
              onClick={() => setStatusFilter('faltas')}
            >
              Faltas
              <span className="ml-2 inline-flex items-center justify-center bg-pink-200 text-pink-800 text-xs font-bold rounded-full h-5 w-5">
                {faltasCount}
              </span>
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors relative ${
                statusFilter === 'ne' ? 'bg-indigo-500 text-white' : 
                'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
              }`}
              onClick={() => setStatusFilter('ne')}
            >
              NE
              <span className="ml-2 inline-flex items-center justify-center bg-indigo-200 text-indigo-800 text-xs font-bold rounded-full h-5 w-5">
                {neCountLocal}
              </span>
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors relative ${
                statusFilter === 'np' ? 'bg-purple-500 text-white' : 
                'bg-purple-100 text-purple-800 hover:bg-purple-200'
              }`}
              onClick={() => setStatusFilter('np')}
            >
              NP
              <span className="ml-2 inline-flex items-center justify-center bg-purple-200 text-purple-800 text-xs font-bold rounded-full h-5 w-5">
                {npCount}
              </span>
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors relative ${
                statusFilter === 'extraordinario' ? 'bg-orange-500 text-white' : 
                'bg-orange-100 text-orange-800 hover:bg-orange-200'
              }`}
              onClick={() => setStatusFilter('extraordinario')}
            >
              Extraordinario
              <span className="ml-2 inline-flex items-center justify-center bg-orange-200 text-orange-800 text-xs font-bold rounded-full h-5 w-5">
                {extraordinarioCount}
              </span>
            </button>
            <button 
              className={`px-4 py-2 rounded-md transition-colors relative ${
                statusFilter === 'recursar' ? 'bg-red-500 text-white' : 
                'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
              onClick={() => setStatusFilter('recursar')}
            >
              Recursar
              <span className="ml-2 inline-flex items-center justify-center bg-red-200 text-red-800 text-xs font-bold rounded-full h-5 w-5">
                {recursarCount}
              </span>
            </button>
          </div>
        </div>

        {/* Lista de estudiantes */}
        {isLoading ? (
          <Loading />
        ) : riesgoStudents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {riesgoStudents.map(student => (
              <div key={student.matricula} className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{student.fullName}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{student.matricula}</p>
                  </div>
                  <button 
                    onClick={() => openModal(student)} 
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Ver Detalles
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white dark:bg-gray-700 border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="py-2 px-4 border-b dark:border-gray-600 text-left text-gray-800 dark:text-gray-200">Materia</th>
                        <th className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">Status</th>
                        <th className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">Ponderado</th>
                        <th className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">Pred. Máx</th>
                        <th className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">Faltas</th>
                        <th className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">NE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.materiasEnRiesgo.map((materia, index) => {
                        return (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                          <td className="py-2 px-4 border-b dark:border-gray-600 text-gray-800 dark:text-gray-200">{materia.nombreMateria}</td>
                          <td className="py-2 px-4 border-b dark:border-gray-600 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium status-badge ${
                              materia.statusText === "NP" ? "bg-purple-100 border-purple-500 text-purple-700" :
                              materia.statusText === "Recursar" ? "bg-red-100 border-red-500 text-red-700" : 
                              materia.statusText === "Extraordinario" ? "bg-orange-100 border-orange-500 text-orange-700" : 
                              materia.statusText === "Peligro" ? "bg-yellow-100 border-yellow-500 text-yellow-700" :
                              materia.statusText === "Faltas" ? "bg-pink-100 border-pink-500 text-pink-700" :
                              materia.statusText === "NE" ? "bg-indigo-100 border-indigo-500 text-indigo-700" :
                              "bg-blue-100 border-blue-500 text-blue-700"  
                            }`}>
                              {materia.statusText}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">
                            {materia.tieneNP ? "NP" : materia.ponderadoNumerico}
                          </td>
                          <td className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">
                            {materia.maxPrediction !== undefined ? Math.round(materia.maxPrediction) : '-'}
                            {materia.reason && (
                              <div className="text-[10px] text-gray-500 mt-1">{materia.reason}</div>
                            )}
                          </td>
                          <td className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">
                            {materia.faltasAlumno}/{materia.limiteFaltas} 
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({materia.porcentajeFaltas.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">
                            {materia.neAlumno}/{materia.limiteNE}
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({materia.porcentajeNE.toFixed(1)}%)
                            </span>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="text-center p-10 bg-white dark:bg-gray-700 rounded-lg shadow">
              <p className="text-xl text-gray-600 dark:text-gray-300">No hay estudiantes que cumplan con los criterios de riesgo seleccionados.</p>
            </div>
          )}
        </main>
    
          {selectedStudent && (
            <StudentModal
              student={selectedStudent}
              filteredData={filteredData}
              columns={columns}
              visibleColumns={visibleColumns}
              closeModal={closeModal}
              reorderColumns={(cols) => cols}
              getFilledAColumns={() => []}
              scripts={scripts || []}
              whatsapp={whatsapp}
              ponderationData={ponderationData}
            />
          )}
      </div>
  );
}
