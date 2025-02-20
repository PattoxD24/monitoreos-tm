"use client";
import { useState, useEffect } from "react";
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
  const [ponderationData, setPonderationData] = useState({});
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '' });

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedData = localStorage.getItem('studentAppData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setStudentData(parsedData.studentData || []);
      setArchivedStudents(parsedData.archivedStudents || []);
      setFilteredData(parsedData.filteredData || {});
      setColumns(parsedData.columns || []);
      setVisibleColumns(parsedData.visibleColumns || {});
      setPonderationData(parsedData.ponderationData || {});
      setHasLoadedData(true);
    }
  }, []);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    const dataToSave = {
      studentData,
      archivedStudents,
      filteredData,
      columns,
      visibleColumns,
      ponderationData
    };
    localStorage.setItem('studentAppData', JSON.stringify(dataToSave));
  }, [studentData, archivedStudents, filteredData, columns, visibleColumns, ponderationData]);

  const clearAllData = () => {
    localStorage.removeItem('studentAppData');
    setStudentData([]);
    setArchivedStudents([]);
    setFilteredData({});
    setColumns([]);
    setVisibleColumns({});
    setPonderationData({});
    setFile1(null);
    setFile2(null);
    setHasLoadedData(false);
  };

  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 3000); // La notificación desaparecerá después de 3 segundos
  };

  const handleFile1Change = async (e) => {
    const newFile = e.target.files[0];
    setFile1(newFile);
    if (newFile && file2) {
      await handleProcessFiles(newFile, file2);
      showNotification('Archivo Base actualizado correctamente');
    }
  };

  const handleFile2Change = async (e) => {
    const newFile = e.target.files[0];
    setFile2(newFile);
    if (file1 && newFile) {
      await handleProcessFiles(file1, newFile);
      showNotification('Archivo de Monitoreos actualizado correctamente');
    }
  };

  const handleProcessFiles = async (file1Override = null, file2Override = null) => {
    const fileToProcess1 = file1Override || file1;
    const fileToProcess2 = file2Override || file2;

    if (!fileToProcess1 || !fileToProcess2) return alert("Por favor, sube ambos archivos.");

    try {
      const [data1, data2] = await Promise.all([
        readExcel(fileToProcess1), 
        readExcel(fileToProcess2)
      ]);
      
      const matriculas = new Set(data1.map((row) => row.MATRICULA));
      const filtered = data2.filter((row) => matriculas.has(row.Matrícula));
      const studentData = data1.map((row) => ({
        matricula: row.MATRICULA,
        fullName: row.ALUMNOS,
        preferredName: row.ALUMNOS.split(" ")[parseInt(row.favName, 10) - 1]?.toUpperCase(),
      }));

      // Procesar ponderaciones de materias desde archivo 1
      const ponderationInfo = {};
      data1.forEach((row) => {
        const materia = row["Nombre Materia"];
        if (!materia) return;

        const activities = Object.keys(row)
          .filter((col) => /^A\d+$/.test(col))
          .reduce((acc, col) => {
            acc[col] = parseFloat(row[col]) || 0;
            return acc;
          }, {});

        ponderationInfo[materia] = activities;
      });

      // Agrupar información de actividades por estudiante
      const groupedData = filtered.reduce((acc, row) => {
        const matricula = row.Matrícula;
        if (!acc[matricula]) acc[matricula] = [];
        acc[matricula].push(row);
        return acc;
      }, {});

      // Identificar columnas visibles
      const uniqueColumns = Object.keys(filtered[0] || {}).filter((col) => !/^A\d+$/.test(col));
      const initialVisibleColumns = uniqueColumns.reduce((acc, col) => {
        acc[col] = defaultVisibleColumns[col] || false;
        return acc;
      }, {});

      setStudentData(studentData);
      setColumns(uniqueColumns);
      setVisibleColumns(initialVisibleColumns);
      setFilteredData(groupedData);
      setPonderationData(ponderationInfo);
      setHasLoadedData(true);
    } catch (error) {
      console.error("Error al procesar archivos:", error);
      alert("Error al procesar los archivos. Por favor, verifica el formato.");
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
    ponderationData,
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
    clearAllData,
    notification,
    hasLoadedData,
  };
}