"use client";

import Image from "next/image";
import { useState } from "react";
import * as XLSX from "xlsx";
import FileUploader from "../components/FileUploader";
import StudentCard from "../components/StudentCard";
import StudentModal from "../components/StudentModal";
import ColumnSelector from "../components/ColumnSelector";
import SearchBar from "../components/SearchBar";

export default function Home() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [studentData, setStudentData] = useState([]);
  const [filteredData, setFilteredData] = useState({});
  const [columns, setColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleFile1Change = (e) => {
    setFile1(e.target.files[0]);
  };

  const handleFile2Change = (e) => {
    setFile2(e.target.files[0]);
  };


  const handleProcessFiles = async () => {
    if (!file1 || !file2) {
      alert("Por favor, sube ambos archivos.");
      return;
    }

    try {
      const [data1, data2] = await Promise.all([readExcel(file1), readExcel(file2)]);
      const matriculas = new Set(data1.map((row) => row.MATRICULA));
      const filtered = data2.filter((row) => matriculas.has(row.Matrícula));

      // Extraer datos de los alumnos y generar nombre preferido en mayúsculas
      const studentData = data1.map((row) => {
        const names = row.ALUMNOS.split(" ");
        const preferredNameIndex = parseInt(row.favName, 10) - 1;
        const preferredName = names[preferredNameIndex]?.toUpperCase() || names[0].toUpperCase();

        return {
          matricula: row.MATRICULA,
          fullName: row.ALUMNOS,
          preferredName,
        };
      });

      // Agrupar por matrícula para el modal de detalles
      const groupedData = filtered.reduce((acc, row) => {
        const matricula = row.Matrícula;
        if (!acc[matricula]) acc[matricula] = [];
        acc[matricula].push(row);
        return acc;
      }, {});

      // Obtener columnas excluyendo las "A" y aplicar visibilidad predeterminada
      const uniqueColumns = Object.keys(filtered[0] || {}).filter(
        (col) => !/^A\d+$/.test(col)
      );
      const initialVisibleColumns = uniqueColumns.reduce((acc, col) => {
        acc[col] = defaultVisibleColumns[col] || false;
        return acc;
      }, {});

      setStudentData(studentData);
      setColumns(uniqueColumns);
      setVisibleColumns(initialVisibleColumns);
      setFilteredData(groupedData);
    } catch (error) {
      console.error("Error al procesar archivos:", error);
    }
  };

  const readExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
  };

  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

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

  const filteredStudents = studentData.filter((student) => {
    const search = searchTerm.toLowerCase();
    return (
      student.matricula.toLowerCase().includes(search) ||
      student.preferredName.toLowerCase().includes(search) ||
      student.fullName.toLowerCase().includes(search)
    );
  });

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full">
        <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={180} height={38} priority />

        <h1 className="text-2xl font-bold">Cargar Archivos de Matrícula</h1>

        {/* Cargar Archivos */}
        <FileUploader onFile1Change={handleFile1Change} onFile2Change={handleFile2Change} onProcessFiles={handleProcessFiles} />


        {Object.keys(filteredData).length > 0 && (
          <div>
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="rounded-full bg-blue-500 text-white px-4 py-2 mt-4"
            >
              Columnas
            </button>

            {/* Selector de Columnas */}
            {showColumnSelector && (
              <ColumnSelector columns={columns} visibleColumns={visibleColumns} toggleColumnVisibility={toggleColumnVisibility} />
            )}
            <div className="mt-4">
              {/* Barra de búsqueda */}
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>
          </div>
        )}
            

        {/* Tarjetas de Estudiantes */}
        <div className="grid grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] gap-4 mt-8 w-full">
          {filteredStudents.map((student) => (
            <StudentCard key={student.matricula} student={student} onClick={openModal} />
          ))}
        </div>

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
          />
        )}
      </main>
    </div>
  );
}