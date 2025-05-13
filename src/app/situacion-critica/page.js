"use client";

import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import useStudentData from "@/hooks/useStudentData";
import Loading from "@/components/Loading";
import StudentModal from "@/components/StudentModal";
import SidebarNav from "@/components/SidebarNav";

export default function SituacionCriticaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [criticStudents, setCriticStudents] = useState([]);
  const [filterType, setFilterType] = useState("todos"); // todos, faltas, ne, ponderado
  const [activeTab, setActiveTab] = useState("critico"); // Por defecto mostramos la pestaña de situación crítica

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
    Status: true,
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

  const processStudentsInCriticalSituation = useCallback(() => {
    const studentsInCritical = [];

    Object.keys(filteredData).forEach(matricula => {
      const studentRows = filteredData[matricula] || [];
      const student = studentData.find(s => s.matricula === matricula);
      
      if (!student) return;

      // Procesando las materias del estudiante
      const criticalSubjects = studentRows.filter(row => {
        const limiteFaltas = parseInt(row["Límite de faltas"]) || 0;
        const faltasAlumno = parseInt(row["Faltas del alumno"]) || 0;
        const faltasPercentage = limiteFaltas > 0 ? (faltasAlumno / limiteFaltas) * 100 : 0;
        
        const limiteNE = parseInt(row["Límite de NE"]) || 0;
        const neAlumno = parseInt(row["NE alumno"]) || 0;
        const nePercentage = limiteNE > 0 ? (neAlumno / limiteNE) * 100 : 0;
        
        const ponderado = parseFloat(row["Ponderado"]) || 0;
        
        // Criterios para situación crítica
        return (faltasPercentage >= 80 || nePercentage >= 80 || ponderado < 70);
      });

      if (criticalSubjects.length > 0) {
        // Determinar el estatus general del alumno basado en sus materias críticas
        let status = "peligro"; // amarillo por defecto
        
        // Verificar si hay materias en estatus de extraordinario o recursar
        const hasExtraordinario = criticalSubjects.some(subject => {
          const ponderado = parseFloat(subject["Ponderado"]) || 0;
          return ponderado >= 60 && ponderado < 70;
        });
        
        const hasRecursar = criticalSubjects.some(subject => {
          const ponderado = parseFloat(subject["Ponderado"]) || 0;
          return ponderado < 60;
        });
        
        if (hasRecursar) {
          status = "recursar"; // rojo
        } else if (hasExtraordinario) {
          status = "extraordinario"; // naranja
        }
        
        // Agregar estadísticas generales del alumno
        const totalFaltas = criticalSubjects.reduce((sum, subject) => sum + parseInt(subject["Faltas del alumno"] || 0), 0);
        const totalLimiteFaltas = criticalSubjects.reduce((sum, subject) => sum + parseInt(subject["Límite de faltas"] || 0), 0);
        const faltasPercentage = totalLimiteFaltas > 0 ? (totalFaltas / totalLimiteFaltas) * 100 : 0;
        
        const totalNE = criticalSubjects.reduce((sum, subject) => sum + parseInt(subject["NE alumno"] || 0), 0);
        const totalLimiteNE = criticalSubjects.reduce((sum, subject) => sum + parseInt(subject["Límite de NE"] || 0), 0);
        const nePercentage = totalLimiteNE > 0 ? (totalNE / totalLimiteNE) * 100 : 0;
        
        const avgPonderado = criticalSubjects.reduce((sum, subject) => sum + parseFloat(subject["Ponderado"] || 0), 0) / criticalSubjects.length;
        
        studentsInCritical.push({
          ...student,
          criticalSubjects,
          status,
          faltasStats: {
            total: totalFaltas,
            limite: totalLimiteFaltas,
            percentage: faltasPercentage.toFixed(1)
          },
          neStats: {
            total: totalNE,
            limite: totalLimiteNE,
            percentage: nePercentage.toFixed(1)
          },
          avgPonderado: avgPonderado.toFixed(1)
        });
      }
    });

    // Filtrar según el tipo seleccionado
    let filteredStudents = [...studentsInCritical];
    if (filterType === "faltas") {
      filteredStudents = studentsInCritical.filter(student => 
        parseFloat(student.faltasStats.percentage) >= 80);
    } else if (filterType === "ne") {
      filteredStudents = studentsInCritical.filter(student => 
        parseFloat(student.neStats.percentage) >= 80);
    } else if (filterType === "ponderado") {
      filteredStudents = studentsInCritical.filter(student => 
        parseFloat(student.avgPonderado) < 70);
    }

    setCriticStudents(filteredStudents);
  }, [filteredData, studentData, filterType]);

  useEffect(() => {
    if (Object.keys(filteredData).length > 0) {
      processStudentsInCriticalSituation();
    }
  }, [filteredData, filterType, processStudentsInCriticalSituation]);

  const handleOpenStudentModal = (student) => {
    setSelectedStudent({...student, activeTab: "critico"});
  };

  const handleCloseStudentModal = () => {
    setSelectedStudent(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "peligro":
        return "bg-yellow-500";
      case "extraordinario":
        return "bg-orange-500";
      case "recursar":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      <SidebarNav />
      
      <main className="flex-1 p-8 ml-64">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">
              Alumnos en Situación Crítica
            </h1>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded-md ${filterType === "todos" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800"}`}
                onClick={() => setFilterType("todos")}
              >
                Todos
              </button>
              <button
                className={`px-3 py-1 rounded-md ${filterType === "faltas" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800"}`}
                onClick={() => setFilterType("faltas")}
              >
                Faltas ≥80%
              </button>
              <button
                className={`px-3 py-1 rounded-md ${filterType === "ne" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800"}`}
                onClick={() => setFilterType("ne")}
              >
                NE ≥80%
              </button>
              <button
                className={`px-3 py-1 rounded-md ${filterType === "ponderado" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800"}`}
                onClick={() => setFilterType("ponderado")}
              >
                Ponderado &lt;70
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <Loading />
          ) : criticStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-lg text-gray-500">
                No se encontraron alumnos que cumplan con los criterios.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-950">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Matrícula
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Alumno
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Faltas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          NE
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ponderado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Materias
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {criticStudents.map((student) => (
                        <tr key={student.matricula} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {student.matricula}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {student.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`${getStatusColor(student.status)} px-2 py-1 rounded-full text-xs text-white`}>
                              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center">
                              <div className="mr-2">{student.faltasStats.total}/{student.faltasStats.limite}</div>
                              <div className={`px-1.5 py-0.5 rounded text-xs text-white ${parseFloat(student.faltasStats.percentage) >= 80 ? 'bg-red-500' : 'bg-green-500'}`}>
                                {student.faltasStats.percentage}%
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center">
                              <div className="mr-2">{student.neStats.total}/{student.neStats.limite}</div>
                              <div className={`px-1.5 py-0.5 rounded text-xs text-white ${parseFloat(student.neStats.percentage) >= 80 ? 'bg-red-500' : 'bg-green-500'}`}>
                                {student.neStats.percentage}%
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`px-1.5 py-0.5 rounded text-xs text-white ${parseFloat(student.avgPonderado) < 70 ? 'bg-red-500' : parseFloat(student.avgPonderado) < 80 ? 'bg-yellow-500' : 'bg-green-500'}`}>
                              {student.avgPonderado}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {student.criticalSubjects.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleOpenStudentModal(student)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Ver detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedStudent && (
          <StudentModal
            student={selectedStudent}
            closeModal={handleCloseStudentModal}
            filteredData={filteredData}
            columns={columns}
            visibleColumns={visibleColumns}
            reorderColumns={(cols) => cols}
            getFilledAColumns={() => []}
            scripts={scripts || []}
            whatsapp={whatsapp}
            ponderationData={ponderationData}
          />
        )}
      </main>
    </div>
  );
}
