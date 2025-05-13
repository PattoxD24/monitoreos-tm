"use client";

import { useState, useEffect, useCallback } from "react";
import useStudentData from "@/hooks/useStudentData";
import Loading from "@/components/Loading";
import StudentModal from "@/components/StudentModal";
import SidebarNav from "@/components/SidebarNav";
import StatusFilter from "@/components/StatusFilter";

export default function RiesgoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [riesgoStudents, setRiesgoStudents] = useState([]);
  const [filterType, setFilterType] = useState("todos"); // todos, faltas, ne, ponderado
  const [statusFilter, setStatusFilter] = useState("todos"); // todos, recursar, extraordinario, peligro

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
        const nombreMateria = row["Nombre de la materia"];
        const ponderado = parseFloat(row["Ponderado"]) || 0;
        
        // Calcular porcentaje de faltas
        const faltasAlumno = parseFloat(row["Faltas del alumno"]) || 0;
        const limiteFaltas = parseFloat(row["Límite de faltas"]) || 1;
        const porcentajeFaltas = (faltasAlumno / limiteFaltas) * 100;
        
        // Calcular porcentaje de NE
        const neAlumno = parseFloat(row["NE alumno"]) || 0;
        const limiteNE = parseFloat(row["Límite de NE"]) || 1;
        const porcentajeNE = (neAlumno / limiteNE) * 100;
        
        // Verificar condiciones de riesgo basadas en el filtro actual
        let enRiesgo = false;
        
        switch(filterType) {
          case "faltas":
            enRiesgo = porcentajeFaltas >= 80;
            break;
          case "ne":
            enRiesgo = porcentajeNE >= 80;
            break;
          case "ponderado":
            enRiesgo = ponderado < 70;
            break;
          default: // "todos"
            enRiesgo = (porcentajeFaltas >= 80) || (porcentajeNE >= 80) || (ponderado < 70);
        }
        
        if (enRiesgo) {
          let statusClass = "";
          let statusText = "";
          
          // Determinar el estatus de riesgo
          // Determinar el máximo ponderado que puede alcanzar el estudiante
          const maxPosiblePonderado = ponderationData && 
            ponderationData[matricula] && 
            ponderationData[matricula][nombreMateria] ? 
            ponderationData[matricula][nombreMateria].maxPosible || ponderado : 
            ponderado;
            
          // Verificar faltas y NE primero
          if (porcentajeFaltas > 100 || porcentajeNE > 100) {
            statusClass = "bg-red-100 border-red-500 text-red-700";
            statusText = "Recursar";
          } 
          // Luego verificar ponderado
          else if (ponderado < 50 && maxPosiblePonderado < 50) {
            statusClass = "bg-red-100 border-red-500 text-red-700";
            statusText = "Recursar";
          } 
          else if (ponderado < 70 && maxPosiblePonderado < 70) {
            statusClass = "bg-yellow-100 border-yellow-500 text-yellow-700";
            statusText = "Peligro";
          } 
          else if ((porcentajeFaltas >= 80 || porcentajeNE >= 80) || (ponderado < 70 && maxPosiblePonderado > 70)) {
            statusClass = "bg-yellow-100 border-yellow-500 text-yellow-700";
            statusText = "Peligro";
          }
          
          // Solo agregar si coincide con el filtro de status
          if (statusFilter === "todos" || statusText.toLowerCase() === statusFilter.toLowerCase()) {
            materiasEnRiesgo.push({
              nombreMateria,
              ponderado,
              faltasAlumno,
              limiteFaltas,
              porcentajeFaltas,
              neAlumno,
              limiteNE,
              porcentajeNE,
              statusClass,
              statusText
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
        "Ponderado": parseFloat(materia.ponderado || 0),
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

    Object.keys(filteredData).forEach(matricula => {
      const studentRows = filteredData[matricula] || [];
      let hasRecursar = false;
      let hasPeligro = false;

      studentRows.forEach(row => {
        const ponderado = parseFloat(row["Ponderado"]) || 0;
        const faltasAlumno = parseFloat(row["Faltas del alumno"]) || 0;
        const limiteFaltas = parseFloat(row["Límite de faltas"]) || 1;
        const porcentajeFaltas = (faltasAlumno / limiteFaltas) * 100;
        
        const neAlumno = parseFloat(row["NE alumno"]) || 0;
        const limiteNE = parseFloat(row["Límite de NE"]) || 1;
        const porcentajeNE = (neAlumno / limiteNE) * 100;

        if (porcentajeFaltas > 100 || porcentajeNE > 100 || ponderado < 50) {
          hasRecursar = true;
        } else if (porcentajeFaltas >= 80 || porcentajeNE >= 80 || ponderado < 70) {
          hasPeligro = true;
        }
      });

      if (hasRecursar) recursarCount++;
      else if (hasPeligro) peligroCount++;
    });

    return { peligroCount, recursarCount };
  }, [filteredData]);

  // Para manejar el estado del sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const handleSidebarToggle = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };

  const { peligroCount, recursarCount } = getStatusCounts();

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
                        <th className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">Faltas</th>
                        <th className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">NE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.materiasEnRiesgo.map((materia, index) => {
                        console.log(materia);
                        return (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                          <td className="py-2 px-4 border-b dark:border-gray-600 text-gray-800 dark:text-gray-200">{materia.nombreMateria}</td>
                          <td className="py-2 px-4 border-b dark:border-gray-600 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium status-badge ${
                              materia.statusText === "Recursar" ? "bg-red-100 border-red-500 text-red-700" : 
                              materia.statusText === "Extraordinario" ? "bg-orange-100 border-orange-500 text-orange-700" : 
                              "bg-yellow-100 border-yellow-500 text-yellow-700"
                            }`}>
                              {materia.statusText}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b dark:border-gray-600 text-center text-gray-800 dark:text-gray-200">
                            {materia.ponderado}
                            {ponderationData?.[student.matricula]?.[materia.nombreMateria]?.maxPosible && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                (Máx: {ponderationData[student.matricula][materia.nombreMateria].maxPosible})
                              </span>
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
