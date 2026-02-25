"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { idbGet, idbSet, idbRemove } from "@/lib/storage";

const STORAGE_KEY = "studentAppData";

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
  const [scheduleRows, setScheduleRows] = useState([]); // Filas de la hoja "Horario" del archivo base
  const [nomenclatureMap, setNomenclatureMap] = useState({}); // Mapa: clave de nomenclatura -> Nombre de actividad

  // Flag para evitar guardar mientras se cargan los datos iniciales
  const isInitialLoadDone = useRef(false);
  // Ref para debounce del guardado
  const saveTimerRef = useRef(null);

  // Cargar datos desde IndexedDB al iniciar (con migración desde localStorage si existe)
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        // 1. Intentar cargar desde IndexedDB
        let parsedData = await idbGet(STORAGE_KEY);

        // 2. Si no hay datos en IDB, intentar migrar desde localStorage
        if (!parsedData) {
          const legacyRaw = localStorage.getItem(STORAGE_KEY);
          if (legacyRaw) {
            try {
              parsedData = JSON.parse(legacyRaw);
              // Migrar a IndexedDB y eliminar de localStorage
              await idbSet(STORAGE_KEY, parsedData);
              localStorage.removeItem(STORAGE_KEY);
              console.log("Datos migrados de localStorage a IndexedDB");
            } catch {
              parsedData = null;
            }
          }
        }

        if (cancelled) return;

        if (parsedData && (parsedData.studentData?.length > 0 || Object.keys(parsedData.filteredData || {}).length > 0)) {
          // sólo incluyo alumnos que tengan materias
          const validStudentData = (parsedData.studentData || []).filter(student =>
            Object.keys(parsedData.filteredData || {}).includes(student.matricula)
          );

          setStudentData(validStudentData);
          setArchivedStudents(parsedData.archivedStudents || []);
          setFilteredData(parsedData.filteredData || {});
          setColumns(parsedData.columns || []);
          setVisibleColumns(parsedData.visibleColumns || {});
          setPonderationData(parsedData.ponderationData || {});
          setScheduleRows(parsedData.scheduleRows || []);
          setNomenclatureMap(parsedData.nomenclatureMap || {});
          setHasLoadedData(true);
          console.log("Datos cargados desde IndexedDB");
        } else {
          setHasLoadedData(false);
          console.log("No se encontraron datos guardados");
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        if (!cancelled) setHasLoadedData(false);
      } finally {
        if (!cancelled) isInitialLoadDone.current = true;
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // Guardar datos en IndexedDB cuando cambien (con debounce de 500 ms)
  useEffect(() => {
    // No guardar hasta que la carga inicial haya terminado
    if (!isInitialLoadDone.current) return;

    // Solo guardar si hay datos reales
    if (studentData.length === 0 && Object.keys(filteredData).length === 0) return;

    // Debounce para no saturar IDB con escrituras en cada micro-cambio
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const dataToSave = {
        studentData,
        archivedStudents,
        filteredData,
        columns,
        visibleColumns,
        ponderationData,
        scheduleRows,
        nomenclatureMap
      };
      idbSet(STORAGE_KEY, dataToSave).catch(err =>
        console.error("Error al guardar en IndexedDB:", err)
      );
    }, 500);

    return () => clearTimeout(saveTimerRef.current);
  }, [studentData, archivedStudents, filteredData, columns, visibleColumns, ponderationData, scheduleRows, nomenclatureMap]);

  const clearAllData = useCallback(async () => {
    try { await idbRemove(STORAGE_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setStudentData([]);
    setArchivedStudents([]);
    setFilteredData({});
    setColumns([]);
    setVisibleColumns({});
    setPonderationData({});
    setScheduleRows([]);
    setNomenclatureMap({});
    setFile1(null);
    setFile2(null);
    setHasLoadedData(false);
  }, []);

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
      // Leer archivo base con todas las hojas para mapear tutores (segunda hoja)
      const [baseWorkbookInfo, data2] = await Promise.all([
        readBaseExcel(fileToProcess1),
        readExcel(fileToProcess2)
      ]);

      const { data: data1, tutorMap, scheduleRows: horarioRows, nomenclatureMap: nomenMap, ponderationMap } = baseWorkbookInfo;

      // Validar formatos de archivos
      if (!data1[0]?.MATRICULA || !data1[0]?.ALUMNOS) {
        throw new Error("El archivo Base no tiene el formato correcto");
      }
      if (!data2[0]?.Matrícula) {
        throw new Error("El archivo de Monitoreos no tiene el formato correcto");
      }
      
      const matriculas = new Set(data1.map((row) => row.MATRICULA));
      const filtered = data2.filter((row) => matriculas.has(row.Matrícula));

      // Agrupar información de actividades por estudiante
      const groupedData = filtered.reduce((acc, row) => {
        const matricula = row.Matrícula;
        if (!acc[matricula]) acc[matricula] = [];
        acc[matricula].push(row);
        return acc;
      }, {});

      // Limpiar espacios en blanco de las actividades A1-A50
      Object.keys(groupedData).forEach((matricula) => {
        groupedData[matricula].forEach((materia) => {
          // Recorrer las columnas A1 hasta A50
          for (let i = 1; i <= 50; i++) {
            const key = `A${i}`;
            // Asegurarse de que la propiedad exista, si no existe, crearla como cadena vacía
            if (!(key in materia)) materia[key] = '';
            else if (typeof materia[key] === 'string' && materia[key].trim() === '') materia[key] = '';
          }
        });
      });

      // mapeo original de studentData
      const studentData = data1.map((row) => {
        if (!row?.MATRICULA || !row?.ALUMNOS) {
          console.warn("Fila de datos incompleta, se omite:", row);
          return {}; // No null/undefined; se filtrará después
        }
        const claveTutor = row['clave tutor'] || row['CLAVE TUTOR'] || row['Clave tutor'] || row['Clave Tutor'];
        return {
          matricula: row.MATRICULA,
          fullName: row.ALUMNOS,
          preferredName: row.ALUMNOS.split(" ")[parseInt(row.favName, 10) - 1]?.toUpperCase(),
          beca: row.BECA || row.Beca || null,
            equipoRepresentativo: row["EQUIPO REPRESENTATIVO"] || row["Equipo Representativa"] || null,
          tutorClave: claveTutor || null,
          tutor: (claveTutor && tutorMap[claveTutor]) ? tutorMap[claveTutor] : null,
        };
      });

      // filtro para quedarme sólo con los alumnos que sí tienen materias
      console.log(studentData)
      const filteredStudentData = studentData.filter(s => groupedData[s.matricula]?.length > 0);

      // Usar las ponderaciones obtenidas desde la hoja "Ponderaciones"
      const ponderationInfo = ponderationMap || {};

      // Identificar columnas visibles
      const uniqueColumns = Object.keys(filtered[0] || {}).filter((col) => !/^A\d+$/.test(col));
      const initialVisibleColumns = uniqueColumns.reduce((acc, col) => {
        acc[col] = defaultVisibleColumns[col] || false;
        return acc;
      }, {});

      setStudentData(filteredStudentData);
      setColumns(uniqueColumns);
      setVisibleColumns(initialVisibleColumns);
    setFilteredData(groupedData);
  setPonderationData(ponderationInfo);
  setScheduleRows(horarioRows || []);
  setNomenclatureMap(nomenMap || {});
      if (studentData.length == 0) {
        setHasLoadedData(false);
      } else {
        setHasLoadedData(true);
      }
    } catch (error) {
      console.error("Error al procesar archivos:", error);
      alert(error.message || "Error al procesar los archivos. Por favor, verifica el formato.");
      // No limpiamos los datos en caso de error, para no perder datos previos
      // Simplemente, mantenemos los datos existentes
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

  // Lee el archivo base y extrae hojas auxiliares:
  // - Tutor: mapa clave tutor -> nombre tutor (detectado por columnas)
  // - Horario: filas de la hoja "Horario"
  // - Nomenclatura: mapa codigo nomenclatura -> Nombre de actividad
  // - Ponderaciones: mapa materia -> { A1..A50: ponderación }
  const readBaseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data1 = XLSX.utils.sheet_to_json(firstSheet);
    let tutorMap = {};
    let scheduleRows = [];
    let nomenclatureMap = {};
    let ponderationMap = {};
    if (workbook.SheetNames.length > 1) {
      // Buscar hoja tutor y hoja Horario por nombre
      workbook.SheetNames.forEach(sheetName => {
        const lower = sheetName.toLowerCase();
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;
        // Detectar y construir tutorMap según columnas presentes
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (rows && rows.length) {
          const headers = Object.keys(rows[0] || {}).reduce((acc, key) => ({ ...acc, [key.toLowerCase()]: key }), {});
          const hasTutorCols = (
            headers['clave tutor'] || headers['clave_tutor'] || headers['clave']
          ) && (
            headers['tutor'] || headers['nombre tutor']
          );

          const hasNomenclatureCols = headers['nomenclatura'] && headers['nombre'];

          if (hasTutorCols) {
            // Construir mapa de tutores
            rows.forEach(r => {
              const clave = r[headers['clave tutor']] || r[headers['clave_tutor']] || r[headers['clave']];
              const tutor = r[headers['tutor']] || r[headers['nombre tutor']];
              if (clave && tutor && !tutorMap[clave]) tutorMap[clave] = tutor;
            });
          }

          if (hasNomenclatureCols) {
            // Construir mapa de nomenclatura -> Nombre
            rows.forEach(r => {
              const codeRaw = r[headers['nomenclatura']];
              const name = r[headers['nombre']];
              if (typeof codeRaw === 'string' && name) {
                const code = codeRaw.trim().toLowerCase();
                if (code) nomenclatureMap[code] = name;
              }
            });
          }
        }
        if (lower === 'horario') {
          scheduleRows = XLSX.utils.sheet_to_json(sheet);
          console.log("Leyendo hoja Horario", scheduleRows);
        }
        if (lower === 'ponderaciones') {
          const rows = XLSX.utils.sheet_to_json(sheet);
          // Se espera una columna para identificar la materia (preferimos CLAVE de materia)
          // y columnas A1..A50. Guardamos también alias por nombre para compatibilidad.
          const headers = Object.keys(rows[0] || {});

          const subjectCodeKey =
            headers.find(h => /clave/i.test(h) && /materia/i.test(h)) ||
            headers.find(h => /cve/i.test(h) && /materia/i.test(h)) ||
            headers.find(h => /codigo/i.test(h) && /materia/i.test(h)) ||
            null;

          const subjectNameKey =
            headers.find(h => /nombre/i.test(h) && /materia/i.test(h)) ||
            headers.find(h => /materia/i.test(h) && !/clave|cve|codigo/i.test(h)) ||
            null;

          const normalizeId = (v) => {
            if (v === undefined || v === null) return '';
            const s = typeof v === 'string' ? v : String(v);
            return s.trim();
          };

          rows.forEach(r => {
            const materiaClave = subjectCodeKey ? normalizeId(r[subjectCodeKey]) : '';
            const materiaNombre = subjectNameKey ? normalizeId(r[subjectNameKey]) : '';
            const materiaId = materiaClave || materiaNombre;
            if (!materiaId) return;
            const activities = {};
            for (let i = 1; i <= 50; i++) {
              const key = `A${i}`;
              if (Object.prototype.hasOwnProperty.call(r, key)) {
                activities[key] = r[key];
              }
            }
            // Clave (preferida)
            if (materiaClave) ponderationMap[materiaClave] = activities;
            // Alias por nombre (compatibilidad)
            if (materiaNombre) ponderationMap[materiaNombre] = activities;
          });
        }
      });
    }
    return { data: data1, tutorMap, scheduleRows, nomenclatureMap, ponderationMap };
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
    scheduleRows,
    nomenclatureMap,
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