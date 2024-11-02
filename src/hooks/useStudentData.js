"use client"
import { useState } from "react";
import * as XLSX from "xlsx";

export default function useStudentData(defaultVisibleColumns) {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [studentData, setStudentData] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [filteredData, setFilteredData] = useState({});
  const [columns, setColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile1Change = (e) => setFile1(e.target.files[0]);
  const handleFile2Change = (e) => setFile2(e.target.files[0]);

  const handleProcessFiles = async () => {
    if (!file1 || !file2) return alert("Por favor, sube ambos archivos.");

    try {
      const [data1, data2] = await Promise.all([readExcel(file1), readExcel(file2)]);
      const matriculas = new Set(data1.map((row) => row.MATRICULA));
      const filtered = data2.filter((row) => matriculas.has(row.Matrícula));
      const studentData = data1.map((row) => ({
        matricula: row.MATRICULA,
        fullName: row.ALUMNOS,
        preferredName: row.ALUMNOS.split(" ")[parseInt(row.favName, 10) - 1]?.toUpperCase(),
      }));

      const groupedData = filtered.reduce((acc, row) => {
        const matricula = row.Matrícula;
        if (!acc[matricula]) acc[matricula] = [];
        acc[matricula].push(row);
        return acc;
      }, {});

      const uniqueColumns = Object.keys(filtered[0] || {}).filter((col) => !/^A\d+$/.test(col));
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

  return {
    file1,
    file2,
    studentData,
    setStudentData,
    archivedStudents,
    columns,
    visibleColumns,
    selectedStudent,
    isLoading,
    setFile1,
    setFile2,
    setSelectedStudent,
    setArchivedStudents,
    handleFile1Change,
    handleFile2Change,
    handleProcessFiles,
    filteredData,
    setVisibleColumns,
    setFilteredData,
  };
}