"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import StudentModal from "@/components/StudentModal";
import downloadZipWithImages from "@/Utils/downloadZipWithImages";
import ArchivedModal from "@/components/ArchivedModal";
import StudentList from "@/components/StudentList";
import useStudentData from "@/hooks/useStudentData";
import Loading from "@/components/Loading";
import Sidebar from "@/components/Sidebar";
import SortAndFilterControls from "@/components/SortAndFilterControls"
import ColumnModal from "@/components/ColumnModal";
import ScriptsModal from "@/components/ScriptsModal";
import dynamic from "next/dynamic";
import SidebarNav from "@/components/SidebarNav";
import Link from "next/link";

const FileUploader = dynamic(() => import("@/components/FileUploader"),{ ssr: false });

export default function Home() {
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [showScriptsModal, setShowScriptsModal] = useState(false);
  const [showWhatsappInput, setShowWhatsappInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("original");
  const [isAscending, setIsAscending] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [scripts, setScripts] = useState([]);
  const [whatsapp, setWhatsapp] = useState("");
  const [uniqueTeachers, setUniqueTeachers] = useState([]);
  const [uniqueGroups, setUniqueGroups] = useState([]);
  const [uniqueSubjects, setUniqueSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
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
    setStudentData,
    archivedStudents,
    columns,
    visibleColumns,
    ponderationData,
    selectedStudent,
    setSelectedStudent,
    setArchivedStudents,
    handleFile1Change,
    handleFile2Change,
    handleProcessFiles,
    filteredData,
    setVisibleColumns,
    clearAllData,
    hasLoadedData,
    notification,
  } = useStudentData(defaultVisibleColumns);

  useEffect(() => {
    if (hasLoadedData || Object.keys(filteredData).length > 0) {
      setShowUploader(false);
    } else {
      setShowUploader(true);
    }
  }, [hasLoadedData, filteredData]);

  useEffect(() => {
    const teachers = new Set();
    const groups = new Set();
    const materias = new Set();

    Object.values(filteredData).forEach(subjects => {
      subjects.forEach(subject => {
        if (subject['Nombre del profesor']) {
          teachers.add(subject['Nombre del profesor']);
        }
        if (subject['# Grupo']) {
          groups.add(subject['# Grupo']);
        }
        if (subject['Nombre de la materia']) {
          materias.add(subject['Nombre de la materia']);
        }
      });
    });

    setUniqueTeachers(Array.from(teachers).sort());
    setUniqueGroups(Array.from(groups).sort());
    setUniqueSubjects(Array.from(materias).sort());
  }, [filteredData]);

  const handleProcessFilesWithHide = async () => {
    await handleProcessFiles();
    setShowUploader(false);
  }

  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const toggleShowScriptsModal = () => setShowScriptsModal(!showScriptsModal);
  const closeScriptsModal = () => setShowScriptsModal(false);

  const getFilledAColumns = (rows) => {
    const maxColumns = 50;
    const alphanumericPattern = /^[a-zA-Z0-9]+$/;

    return Array.from({ length: maxColumns }, (_, i) => `A${i + 1}`).filter((col) =>
      rows.some((row) => alphanumericPattern.test(row[col] || ""))
    );
  };

  const reorderColumns = (columnsToDisplay, aColumns) => {
    const indexOfPonderado = columnsToDisplay.indexOf("Ponderado");
    if (indexOfPonderado === -1) return [...columnsToDisplay, ...aColumns];

    return [
      ...columnsToDisplay.slice(0, indexOfPonderado),
      ...aColumns,
      ...columnsToDisplay.slice(indexOfPonderado),
    ];
  };

  const openModal = (student) => {
    setSelectedStudent(student);
  };

  const closeModal = () => {
    setSelectedStudent(null);
  };

  // Calcular número de "NE" y mínimo "Ponderado" por estudiante
  const calculateSortingCriteria = (student) => {
    const studentMatricula = student.matricula;
    const studentSubjects = filteredData[studentMatricula] || [];
  
    let neCount = 0;
    let minPonderado = Infinity;
    let totalFaltas = 0;
  
    studentSubjects.forEach((subject) => {
      const lastAColumn = Object.keys(subject)
        .filter((col) => /^A\d+$/.test(col) && subject[col])
        .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
        .pop();
  
      if (lastAColumn && subject[lastAColumn] === "NE") {
        neCount += 1;
      }
  
      if (subject.Ponderado && !isNaN(subject.Ponderado)) {
        minPonderado = Math.min(minPonderado, parseInt(subject.Ponderado));
      }
  
      // Sumar faltas de cada materia
      if (subject["Faltas del alumno"] && !isNaN(subject["Faltas del alumno"])) {
        totalFaltas += parseInt(subject["Faltas del alumno"]);
      }
    });
  
    // Determinar el color de fondo según el valor de `minPonderado`
    let backgroundColor = "";
    if (minPonderado < 70) {
      backgroundColor = "#FFCCCC"; // Rojo suave
    } else if (minPonderado >= 70 && minPonderado <= 75) {
      backgroundColor = "#FFD9B3"; // Naranja suave
    } else if (minPonderado >= 76 && minPonderado <= 84) {
      backgroundColor = "#FFFFCC"; // Amarillo suave
    } else {
      backgroundColor = "#CCFFCC"; // Verde suave
    }
  
    return { neCount, minPonderado, backgroundColor, totalFaltas };
  };

  const sortStudents = (students) => {
    return [...students].sort((a, b) => {
      let comparison = 0;
      if (sortOrder === "matricula") {
        comparison = a.matricula.localeCompare(b.matricula);
      } else if (sortOrder === "nombre") {
        comparison = a.preferredName.localeCompare(b.preferredName);
      } else if (sortOrder === "faltas") {
        comparison = a.totalFaltas - b.totalFaltas;
      } else if (sortOrder === "original") {
        comparison = (a.neCount !== b.neCount ) ? b.neCount - a.neCount : a.minPonderado - b.minPonderado;
      }
      return isAscending ? comparison : -comparison;
    });
  };
  
  // Ordenar los estudiantes
  const sortedStudents = sortStudents([...studentData].map((student) => {
    const criteria = calculateSortingCriteria(student);
    return { ...student, ...criteria };
  }));

  // Filtrar los estudiantes según el término de búsqueda
  const filteredStudents = sortedStudents.filter((student) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = student.matricula.toLowerCase().includes(search) ||
      student.preferredName.toLowerCase().includes(search) ||
      student.fullName.toLowerCase().includes(search);

    const studentSubjects = filteredData[student.matricula] || [];
    const matchesTeacher = !selectedTeacher || 
      studentSubjects.some(subject => subject['Nombre del profesor'] === selectedTeacher);
    const matchesGroup = !selectedGroup ||
      studentSubjects.some(subject => subject['# Grupo'].toString() === selectedGroup.toString());
    const matchesSubject = !selectedSubject ||
      studentSubjects.some(subject => subject['Nombre de la materia'] === selectedSubject);

    return matchesSearch && matchesTeacher && matchesGroup && matchesSubject;
  });

  const handleDeleteStudent = (matricula) => {
    setStudentData((prevData) => {
      const updatedData = prevData.filter((student) => student.matricula !== matricula);
      const archivedStudent = prevData.find((student) => student.matricula === matricula);
      setArchivedStudents((prevArchived) => {
        if (!prevArchived.some((student) => student.matricula === matricula)) {
          return [...prevArchived, archivedStudent]; 
        }
        return prevArchived;
      });
      return updatedData;
    });
  };

  const restoreStudent = (matricula) => {
    setArchivedStudents((prevArchived) => {
      const updatedArchived = prevArchived.filter((student) => student.matricula !== matricula);
      const restoredStudent = prevArchived.find((student) => student.matricula === matricula);
      setStudentData((prevData) => {
        if (!prevData.some((student) => student.matricula === matricula)) {
          return [...prevData, restoredStudent];
        }
        return prevData;
      })
      return updatedArchived;
    });
  };

  const restoreAllStudents = () => {

    setArchivedStudents((prevArchived) => {
      const updatedArchived = [];
      prevArchived.forEach((student) => {
        setStudentData((prevData) => {
          if (!prevData.some((studentPrev) => studentPrev.matricula === student.matricula)) {
            return [...prevData, student];
          }
          return prevData;
        });
      });
      return updatedArchived;
    }
    );
  };

  const toggleSortDirection = () => setIsAscending(!isAscending)

  const downloadZip = () => { downloadZipWithImages(studentData, filteredData, getFilledAColumns, reorderColumns, visibleColumns, setIsLoading)};

  const handleClearAllData = () => {
    clearAllData();
    setShowUploader(true);
  };

  // Calculate the status counters for students
  const calculateStatusCounters = () => {
    let peligroCount = 0;
    let recursarCount = 0;

    Object.entries(filteredData).forEach(([studentId, subjects]) => {
      let hasRecursar = false;
      let hasPeligro = false;

      subjects.forEach(subject => {
        const ponderado = parseFloat(subject.Ponderado) || 0;
        const faltasAlumno = parseFloat(subject["Faltas del alumno"]) || 0;
        const limiteFaltas = parseFloat(subject["Límite de faltas"]) || 1;
        const porcentajeFaltas = (faltasAlumno / limiteFaltas) * 100;
        
        const neAlumno = parseFloat(subject["NE alumno"]) || 0;
        const limiteNE = parseFloat(subject["Límite de NE"]) || 1;
        const porcentajeNE = (neAlumno / limiteNE) * 100;

        if (porcentajeFaltas > 100 || porcentajeNE > 100 || ponderado < 50) {
          hasRecursar = true;
        } else if (!hasRecursar && (porcentajeFaltas >= 80 || porcentajeNE >= 80 || ponderado < 70)) {
          hasPeligro = true;
        }
      });

      // Solo contamos al alumno una vez, y si tiene materias para recursar,
      // solo se cuenta en recursarCount aunque tenga otras en peligro
      if (hasRecursar) {
        recursarCount++;
      } else if (hasPeligro) {
        peligroCount++;
      }
    });

    return { peligroCount, recursarCount };
  };

  // Calculate status counters whenever filteredData changes
  const { peligroCount, recursarCount } = calculateStatusCounters();

  return (
    <div className="flex">
      {/* Notificación */}
      {notification.show && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out">
          {notification.message}
        </div>
      )}

      {/* Status counters */}
      {Object.keys(filteredData).length > 0 && (
        <div className="fixed top-4 right-4 flex gap-4 z-40">
          <div className="relative inline-flex items-center">
            <Link href="/riesgo" className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
              <span className="text-2xl font-bold text-yellow-800">P</span>
            </div>
            <div className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full">
              <span href="/riesgo" className="text-xs font-bold text-white">{peligroCount}</span>
              </div>
            </Link>
          </div>
          <div className="relative inline-flex items-center">
            <Link href="/riesgo" className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
              <span className="text-2xl font-bold text-red-800">R</span>
            </div>
            <div className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
              <span href="/riesgo" className="text-xs font-bold text-white">{recursarCount}</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {Object.keys(filteredData).length > 0 && (
        <>
          <Sidebar
            showColumnSelector={showColumnSelector}
            setShowColumnSelector={setShowColumnSelector}
            setShowColumnModal={setShowColumnModal}  
            downloadZip={downloadZip}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            toggleSortDirection={() => setIsAscending(!isAscending)}
            isAscending={isAscending}
            columns={columns}
            visibleColumns={visibleColumns}
            toggleColumnVisibility={toggleColumnVisibility}
            onShowArchivedModal={() => setShowArchivedModal(true)}
            onShowScriptsModal={toggleShowScriptsModal}  
            setShowWhatsappInput={setShowWhatsappInput}
            showWhatsappInput={showWhatsappInput}
            whatsapp={whatsapp}
            setWhatsapp={setWhatsapp}
            clearAllData={handleClearAllData}
            handleFile1Change={handleFile1Change}
            handleFile2Change={handleFile2Change}
          />
        </>
      )}
      <ScriptsModal
        visible={showScriptsModal}
        onClose={closeScriptsModal}
        scripts={scripts}
        setScripts={setScripts}
      />
      <main className={`flex-1 p-8 pb-20 min-h-screen sm:p-20 transition-all duration-300 bg-gray-50 dark:bg-gray-800 ${showColumnSelector ? 'ml-64' : 'ml-16'}`}>
        <div className="flex flex-col gap-8 items-center sm:items-start w-full">
          <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={180} height={38} priority />

          <h1 className="text-2xl font-bold dark:text-white">Cargar Archivos de Monitoreos</h1>

          {/* Cargar Archivos */}
          {showUploader && (
            <FileUploader
              onFile1Change={handleFile1Change}
              onFile2Change={handleFile2Change}
              onProcessFiles={handleProcessFilesWithHide}
            />
          )}

          <Loading isLoading={isLoading} />

          {/* Modal de selección de columnas */}
          <ColumnModal
            visible={showColumnModal}
            onClose={() => setShowColumnModal(false)}
            columns={columns}
            visibleColumns={visibleColumns}
            toggleColumnVisibility={toggleColumnVisibility}
          />

          {!showUploader && ( 
          <SortAndFilterControls
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            toggleSortDirection={toggleSortDirection}
            isAscending={isAscending}
            uniqueTeachers={uniqueTeachers}
            uniqueGroups={uniqueGroups}
            selectedTeacher={selectedTeacher}
            setSelectedTeacher={setSelectedTeacher}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            uniqueSubjects={uniqueSubjects}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
          />
          )}
          {/* Tarjetas de Estudiantes */}
          <StudentList students={filteredStudents} studentsData={filteredData} openModal={openModal} handleDeleteStudent={handleDeleteStudent} />

          {/* Sección de Archivados */}
          <ArchivedModal
            visible={showArchivedModal}
            onClose={() => setShowArchivedModal(false)}
            archivedStudents={archivedStudents}
            restoreStudent={restoreStudent}
            restoreAllStudents={restoreAllStudents}
          />

          {/* Modal de Detalles */}
          {selectedStudent && (
            <StudentModal
              student={selectedStudent}
              filteredData={filteredData}
              columns={columns}
              visibleColumns={visibleColumns}
              closeModal={closeModal}
              reorderColumns={reorderColumns}
              getFilledAColumns={getFilledAColumns}
              scripts={scripts}
              whatsapp={whatsapp}
              ponderationData={ponderationData}
            />
          )}
        </div>
      </main>
      </div>
  );
}