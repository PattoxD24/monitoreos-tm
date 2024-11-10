"use client";

import Image from "next/image";
import { useState } from "react";
import StudentModal from "@/components/StudentModal";
import downloadZipWithImages from "@/Utils/downloadZipWithImages";
import ArchivedModal from "@/components/ArchivedModal";
import StudentList from "@/components/StudentList";
import useStudentData from "@/hooks/useStudentData";
import Loading from "@/components/Loading";
import Sidebar from "@/components/Sidebar";
import ColumnModal from "@/components/ColumnModal";
import ScriptsModal from "@/components/ScriptsModal";
import dynamic from "next/dynamic";

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
    selectedStudent,
    setSelectedStudent,
    setArchivedStudents,
    handleFile1Change,
    handleFile2Change,
    handleProcessFiles,
    filteredData,
    setVisibleColumns,
  } = useStudentData(defaultVisibleColumns);

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
  
    return { neCount, minPonderado, backgroundColor };
  };

  const sortStudents = (students) => {
    return [...students].sort((a, b) => {
      let comparison = 0;
      if (sortOrder === "matricula") {
        comparison = a.matricula.localeCompare(b.matricula);
      } else if (sortOrder === "nombre") {
        comparison = a.preferredName.localeCompare(b.preferredName);
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
    return (
      student.matricula.toLowerCase().includes(search) ||
      student.preferredName.toLowerCase().includes(search) ||
      student.fullName.toLowerCase().includes(search)
    );
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

  const downloadZip = () => { downloadZipWithImages(studentData, filteredData, getFilledAColumns, reorderColumns, visibleColumns, setIsLoading)};

  return (
    <div className="flex">
      {Object.keys(filteredData).length > 0 && (
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
      />
      )}
      <ScriptsModal
        visible={showScriptsModal}
        onClose={toggleShowScriptsModal}
        scripts={scripts}
        setScripts={setScripts}
      />
      <main className={`flex-1 p-8 pb-20 min-h-screen sm:p-20 transition-all duration-300 ${showColumnSelector ? 'ml-64' : 'ml-16'}`}>
        <div className="flex flex-col gap-8 items-center sm:items-start w-full">
          <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={180} height={38} priority />

          <h1 className="text-2xl font-bold">Cargar Archivos de Monitoreos</h1>

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

          {/* Tarjetas de Estudiantes */}
          <StudentList students={filteredStudents} studentsData={filteredData} openModal={openModal} handleDeleteStudent={handleDeleteStudent} />

          {/* Sección de Archivados */}
          <ArchivedModal
            visible={showArchivedModal}
            onClose={() => setShowArchivedModal(false)}
            archivedStudents={archivedStudents}
            restoreStudent={restoreStudent}
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
            />
          )}
        </div>
      </main>
      </div>
  );
}