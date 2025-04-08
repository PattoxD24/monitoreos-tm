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

      if (parsedData.studentData?.length === 0) {
        setHasLoadedData(false);
      } else {
        setHasLoadedData(true);
      }
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
    
    try {
      localStorage.setItem('studentAppData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error al guardar en localStorage:", error);
      // Opcional: Mostrar una notificación al usuario
    }
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
    if (newFile) {
      try {
        setIsLoading(true);
        const data = await readExcel(newFile);
        // Verificar si el archivo tiene el formato esperado
        if (!data[0]?.MATRICULA || !data[0]?.ALUMNOS) {
          alert("El archivo Base no tiene el formato correcto");
          return;
        }
        setFile1(newFile);
        if (file2) {
          await handleProcessFiles(newFile, file2);
          showNotification('Archivo Base actualizado correctamente');
        }
      } catch (error) {
        console.error("Error al procesar archivo Base:", error);
        alert("Error al procesar el archivo Base");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFile2Change = async (e) => {
    const newFile = e.target.files[0];
    if (newFile) {
      try {
        setIsLoading(true);
        const data = await readExcel(newFile);
        // Verificar si el archivo tiene el formato esperado
        if (!data[0]?.Matrícula) {
          alert("El archivo de Monitoreos no tiene el formato correcto");
          return;
        }
        setFile2(newFile);
        if (file1) {
          await handleProcessFiles(file1, newFile);
          showNotification('Archivo de Monitoreos actualizado correctamente');
        }
      } catch (error) {
        console.error("Error al procesar archivo de Monitoreos:", error);
        alert("Error al procesar el archivo de Monitoreos");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleProcessFiles = async (file1Override = null, file2Override = null) => {
    const fileToProcess1 = file1Override || file1;
    const fileToProcess2 = file2Override || file2;

    if (!fileToProcess1 || !fileToProcess2) return alert("Por favor, sube ambos archivos.");

    try {
      setIsLoading(true);
      const [data1, data2] = await Promise.all([
        readExcel(fileToProcess1), 
        readExcel(fileToProcess2)
      ]);

      // Validar formatos de archivos
      if (!data1[0]?.MATRICULA || !data1[0]?.ALUMNOS) {
        throw new Error("El archivo Base no tiene el formato correcto");
      }
      if (!data2[0]?.Matrícula) {
        throw new Error("El archivo de Monitoreos no tiene el formato correcto");
      }
      
      const matriculas = new Set(data1.map((row) => row.MATRICULA));
      const filtered = data2.filter((row) => matriculas.has(row.Matrícula));

      if (filtered.length === 0) {
        throw new Error("No se encontraron coincidencias entre los archivos");
      }

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
            acc[col] = row[col] || 0;
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

      // Limpiar espacios en blanco de las actividades A1-A50 manteniendo todas las columnas
      Object.keys(groupedData).forEach((matricula) => {
        groupedData[matricula].forEach((materia) => {
          // Recorrer las columnas A1 hasta A50
          for (let i = 1; i <= 50; i++) {
            const activityKey = `A${i}`;
            // Asegurarse de que la propiedad exista, si no existe, crearla como cadena vacía
            if (!(activityKey in materia)) {
              materia[activityKey] = '';
            } else if (typeof materia[activityKey] === 'string' && materia[activityKey].trim() === '') {
              materia[activityKey] = '';
            }
          }
        });
      });

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
      if (studentData.length == 0) {
        setHasLoadedData(false);
      } else {
        setHasLoadedData(true);
      }
    } catch (error) {
      console.error("Error al procesar archivos:", error);
      alert(error.message || "Error al procesar los archivos. Por favor, verifica el formato.");
      // Limpiar estados en caso de error
      clearAllData();
    } finally {
      setIsLoading(false);
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