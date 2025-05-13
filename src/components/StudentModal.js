"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import html2canvas from "html2canvas";
import ScriptsModal from "./ScriptsModal";
import { ClientPageRoot } from "next/dist/client/components/client-page";

export default function StudentModal({
  student,
  filteredData,
  columns,
  visibleColumns,
  closeModal,
  reorderColumns,
  getFilledAColumns,
  scripts,
  whatsapp,
  ponderationData
}) {
  const [activeTab, setActiveTab] = useState("info");
  const [copiedScript, setCopiedScript] = useState(null);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [isPonderationTableVisible, setIsPonderationTableVisible] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState("");
  const [activityColumns, setActivityColumns] = useState([]);
  const [lastActivityColumn, setLastActivityColumn] = useState("");
  const [originalLastActivityColumn, setOriginalLastActivityColumn] = useState("");
  const [manualGrades, setManualGrades] = useState({});
  const [editableInputs, setEditableInputs] = useState({});
  const [editedCells, setEditedCells] = useState({});
  const [includeImage, setIncludeImage] = useState(false);
  const modalRef = useRef(null);
  const hiddenTableRef = useRef(null);
  const [showScriptContent, setShowScriptContent] = useState(false);
  const [automaticGrades, setAutomaticGrades] = useState({});
  const [showAutomaticTable, setShowAutomaticTable] = useState(false);
  
  // Verificar si el estudiante tiene materias en situación crítica
  const hasCriticalSubjects = Array.isArray(student?.criticalSubjects) && student.criticalSubjects.length > 0;

  const toggleTableVisibility = () => {
    setIsTableVisible((prev) => !prev);
  }

  const togglePonderationTableVisibility = () => {
    setIsPonderationTableVisible((prev) => !prev);
  };

  const toggleScriptContent = () => setShowScriptContent((prev) => !prev);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeModal]);

  const calculatePonderations = () => {
    const studentData = filteredData[student.matricula] || [];
    const results = [];
    let lastActivity = "";

    studentData.forEach((row) => {
      const materia = row["Nombre de la materia"];
      if (materia === selectedMateria) {
        // Obtener la última actividad real del estudiante
        const lastRealActivity = Object.keys(row)
          .filter((column) => /^A\d+$/.test(column) && row[column].replace(/\s/g, ''))
          .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
          .pop();

        // Obtener la última actividad modificada manualmente
        const lastManualActivity = Object.keys(manualGrades)
          .filter((column) => /^A\d+$/.test(column) && manualGrades[column])
          .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
          .pop();

        // Comparar números de actividad y usar el mayor
        const lastRealActivityNum = lastRealActivity ? parseInt(lastRealActivity.slice(1)) : 0;
        const lastManualActivityNum = lastManualActivity ? parseInt(lastManualActivity.slice(1)) : 0;

        lastActivity = lastManualActivityNum > lastRealActivityNum ? 
          lastManualActivity : lastRealActivity;

        const ponderations = ponderationData[materia] || {};
        const activityResults = Object.keys(ponderations)
          .map((activity) => {
            const ponderation = ponderations[activity];
            
            // Extraer sufijo para determinar el tipo de actividad
            const activityType = extractActivityType(ponderation);
            
            const grade =
              manualGrades[activity] !== undefined
                ? parseFloat(manualGrades[activity])
                : parseFloat(row[activity].replace(/\s/g,'')) || 0;
            const gradeValue = parseFloat(row[activity].replace(/\s/g,'')) || '';

            // Exclude rows with grade "SD"
            if (row[activity].replace(/\s/g,'') === "SD" || manualGrades[activity] === "SD") return null;
            const color = row[activity].replace(/\s/g,'') === "NE" ? "bg-red-300" : row[activity].replace(/\s/g,'') === "SC" ? "bg-yellow-300" : row[activity].replace(/\s/g,'') === "DA" ? "bg-green-300" : "";
            const ponderado = row['Ponderado'];

            if (gradeValue) {
              // lastActivity = activity;
            }

            const result = (grade * (parseFloat(ponderation) / 100)).toFixed(2);
            return { activity, ponderation, grade, result, color, ponderado, lastActivity, activityType };
          })
          .filter(Boolean); // Remove null entries

        if (activityResults.length > 0) {
          results.push({ 
            materia, 
            activities: activityResults, 
            color: activityResults[0].color, 
            ponderado: activityResults[0].ponderado, 
            lastActivity 
          });
        }
      }
    });
    return { results, lastActivity };
  }

  // Función para extraer el tipo de actividad desde la ponderación
  const extractActivityType = (ponderation) => {
    // Si es un string y contiene una letra al final después de un número
    if (typeof ponderation === 'string' && ponderation.match(/\d+[a-zA-Z]+$/)) {
      const suffix = ponderation.match(/([a-zA-Z]+)$/)[1].toLowerCase();
      
      switch(suffix) {
        case 'a': return 'Actividad';
        case 'ap': return 'Actividad Previa';
        case 'cl': return 'Comprobación de lectura';
        case 'e': return 'Evidencia';
        case 'j': return 'Ejercicio';
        case 'evf': return 'Evidencia final';
        case 'er': return 'Examen rápido';
        case 'ep': return 'Examen parcial';
        case 'ef': return 'Examen final';
        case 'g': return 'Gamificaión';
        case 'ae': return 'Avance de evidencia';
        case 'cta': return 'Certificación de tercer año';
        case 'r': return 'Reto';
        case 'pv': return 'Propósito de vida';
        case 'cp': return 'Celebrando propósito';
        case 'rf': return 'Reto final';
        case 'v': return 'VIVE';
        case 'q': return 'Quiz';
        default: return null;
      }
    }
    return null; // Si no hay sufijo reconocible
  }

  // Función para obtener el nombre descriptivo de la actividad
  const getActivityName = (activity, activities) => {
    // Buscar el tipo de actividad correspondiente
    const activityData = activities.find(a => a.activity === activity);
    const activityType = activityData?.activityType;

    if (!activityType) return activity;

    // Crear un mapa de contadores por tipo de actividad
    const counters = {};
    
    // Ordenar las actividades por su número
    const sortedActivities = activities
      .filter(a => a.activityType === activityType)
      .sort((a, b) => {
        const numA = parseInt(a.activity.replace('A', ''));
        const numB = parseInt(b.activity.replace('A', ''));
        return numA - numB;
      });

    // Encontrar el índice de la actividad actual
    const currentIndex = sortedActivities.findIndex(a => a.activity === activity);
    
    // El consecutivo es el índice + 1
    const consecutivo = currentIndex + 1;

    return `${activityType} ${consecutivo}`;
  }

  const { results: ponderationResults, lastActivity } = calculatePonderations();

  useEffect(() => {
    if (lastActivity) {
      setLastActivityColumn(lastActivity);
      setOriginalLastActivityColumn(lastActivity);
    }
  }, [lastActivity]);

  const handleMateriaChange = (e) => {
    const materia = e.target.value;
    setSelectedMateria(e.target.value);
    setActivityColumns(Object.keys(ponderationData[materia] || {}));
    setLastActivityColumn("");
    setManualGrades({});
    setEditableInputs({});
    setEditedCells({});
    setAutomaticGrades({});
  }

  const handleGradeChange = (activity, value) => {
    // Limitar el valor a 100
    const limitedValue = Math.min(parseFloat(value) || 0, 100);
    setManualGrades((prev) => ({ ...prev, [activity]: limitedValue }));
    setEditedCells((prev) => ({ ...prev, [activity]: true }));

    if (value === "" || value === "0") {
      const { [activity]: removed, ...rest } = manualGrades;
      setManualGrades(rest);
    }
  }

  const toggleEditable = (activity) => {
    setEditableInputs((prev) => ({ ...prev, [activity]: !prev[activity] }));
  }

  const materias = useMemo(() => [
    ...new Set(
      (filteredData[student.matricula] || [])
        .filter(
          (row) =>
            !Object.values(row)
              .filter((_, index) => /^A\d+$/.test(Object.keys(row)[index]))
              .includes("SD")
        )
        .map((row) => row["Nombre de la materia"])
    ),
  ], [filteredData, student.matricula]);

  useEffect(() => {
    // Only initialize the selectedMateria and activityColumns on the first load
    if (materias.length > 0 && selectedMateria === "") {
      const defaultMateria = materias[0];
      setSelectedMateria(defaultMateria); // Select the first materia
      setActivityColumns(Object.keys(ponderationData[defaultMateria] || {})); // Initialize activity columns
    }
  }, [materias, selectedMateria, ponderationData]);

  // const nombre = student.preferredName.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  const replaceVariables = (content) => {
    const nombre = student.preferredName.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    const matricula = student.matricula;

    const neMaterias = findMateriasWithLastColumnNE(filteredData[student.matricula]);
    const scMaterias = findMateriasWithLastColumnSC(filteredData[student.matricula]);
    const lowPonderacionMaterias = findMateriasWithLowPonderacion(filteredData[student.matricula]);
    const highPonderacionMaterias = findMateriasWithHighPonderacion(filteredData[student.matricula]);

    const faltasMaterias = findMateriasWithFaltas(filteredData[student.matricula]);
  
    const neMessage = neMaterias.length > 0 
      ? `Me aparece que traes NE en ${neMaterias.length>1 ? "las materias":"la materia"}: ${neMaterias.join(", ")}, es muy importante que te acerques con los maestros para verificar si aun puedes entregarlo y ellos pueden evaluarte esta actividad no entregada. Te recuerdo es muy importante no exceder el numero de No Entregables, para evitar reprobar la materia de forma automática por esta situación.` 
      : "";

    const scMessage = scMaterias.length > 0 ? `Me aparece que traes SC en ${scMaterias.length > 1 ? "las materias":"la materia"}: ${scMaterias.join(", ")}, por favor acércate con el maestro para verificar la situación y saber cuándo actualizará la calificación y podemos tener el promedio real de la materia.` : "";
  
    const ponderacionMessage = lowPonderacionMaterias.length > 0 
      ? `Me aparece que ${lowPonderacionMaterias.length > 1 ?"las materias":"la materia"} de: ${lowPonderacionMaterias.join(", ")} se encuentran por debajo del promedio mínimo de 70, recuerda que es muy importante aumentar la calificación en las próximas entregas para que el promedio sea aprobatorio.` 
      : "";
    
    const faltasMessage = faltasMaterias.length > 0 ? `Me aparece que tienes faltas en las materias de: ${faltasMaterias.join(", ")}.
Recuerda que es muy importante cuidar el número de faltas asignadas a cada materia, ya que las faltas no se justifican y si se excede el número de faltas asignado la materia se reprueba de forma automática.
    `: "";

    const primerParcial = lowPonderacionMaterias.length > 0 ? `Recuerda realizar las próximas entregas de evidencias, tareas y actividades con calificación superior a 70, para que el promedio aumente y la materia se mantenga como aprobatoria. ` : "";

    const segundoParcial = lowPonderacionMaterias.length > 0 ? `Acércate conmigo para que podamos verificar las ponderaciones tentativas para que la materia se mantenga como aprobatoria. ` : "";

    const muyBien = highPonderacionMaterias.length < 1 ? `¡Felicidades! Estás haciendo muy buen trabajo, continúa así en tus próximas entregas. 
` : "";
  
    return content
      .replaceAll("{{alumno}}", nombre)
      .replaceAll("{{matricula}}", matricula)
      .replaceAll("{{ne}}", neMessage)
      .replaceAll("{{ponderacion}}", ponderacionMessage)
      .replaceAll("{{sc}}", scMessage)
      .replaceAll("{{faltas}}", faltasMessage)
      .replaceAll("{{primerParcial}}", primerParcial)
      .replaceAll("{{segundoParcial}}", segundoParcial)
      .replaceAll("{{muyBien}}", muyBien);
  };
  
  // Función para encontrar materias con "NE" en la última columna A con valor
  const findMateriasWithLastColumnNE = (rows) => {
    const materias = new Set();
  
    rows.forEach(row => {
      // Obtener todas las columnas "A" con valores en el orden correcto
      const lastAColumn = Object.keys(row)
        .filter(column => /^A\d+$/.test(column) && row[column]) // Filtrar solo columnas "A" con valores
        .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1))) // Ordenar numéricamente
        .pop(); // Obtener la última columna
  
      // Verificar si la última columna A tiene "NE"
      if (lastAColumn && row[lastAColumn] === "NE") {
        materias.add(row["Nombre de la materia"] || "Materia desconocida");
      }
    });
  
    return Array.from(materias); // Convertir Set a Array para manipulación y unión
  };

  const findMateriasWithLastColumnSC = (rows) => {
    const materias = new Set();

    rows.forEach(row => {
      const lastAColumn = Object.keys(row)
        .filter(column => /^A\d+$/.test(column) && row[column])
        .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
        .pop();
      
      if (lastAColumn && row[lastAColumn] === "SC") {
        materias.add(row["Nombre de la materia"] || "Materia desconocida");
      }
    });

    return Array.from(materias);
  };
  
  const findMateriasWithLowPonderacion = (rows) => {
    return rows
      .filter(row => row.Ponderado && parseInt(row.Ponderado) < 70)
      .map(row => row["Nombre de la materia"] || "Materia desconocida");
  };

  const findMateriasWithHighPonderacion = (rows) => {
    return rows
      .filter(row => row.Ponderado && parseInt(row.Ponderado) < 85)
      .map(row => row["Nombre de la materia"] || "Materia desconocida");
  };

  const findMateriasWithFaltas = (rows) => {
    return rows
      .filter(row => row["Faltas del alumno"] && parseInt(row["Faltas del alumno"]) > 0)
      .map(row => row["Nombre de la materia"] || "Materia desconocida");
  };

  const handleSendWhatsApp = async (message) => {
    const phoneNumber = whatsapp || "";
    if (!phoneNumber) {
      alert("Por favor, ingresa un número de Whatsapp");
      return;
    }
    let formattedMessage = encodeURIComponent(replaceVariables(message));

    if (includeImage) {
      const canvas = await html2canvas(hiddenTableRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imageData = canvas.toDataURL("image/png");
      const blob = await fetch(imageData).then(res => res.blob());
      const file = new File([blob], `${student.matricula}.png`, { type: "image/png" });
      const imageURL = URL.createObjectURL(file);

      formattedMessage += `&image=${imageURL} `;
    }

    const whatsappURL = `whatsapp://send?text=${formattedMessage}&phone=${phoneNumber}`;
    // const whatsappURL = `https://wa.me/${phoneNumber}?text=${formattedMessage}`;
    window.open(whatsappURL, "_blank");
  }

  const downloadTableAsImage = async () => {
    if (!hiddenTableRef.current) return;

    const canvas = await html2canvas(hiddenTableRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `${student.matricula}.png`;
    link.click();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(replaceVariables(text));
    setCopiedScript(text);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  // Función para calcular la predicción máxima posible
  const calculateMaxPrediction = (activities) => {
    // Separar actividades completadas y futuras
    const completedActivities = activities.filter(activity => {
      const activityNumber = parseInt(activity.activity.slice(1));
      const lastActivityNumber = lastActivity ? parseInt(lastActivity.slice(1)) : 0;
      return activityNumber <= lastActivityNumber;
    });

    const futureActivities = activities.filter(activity => {
      const activityNumber = parseInt(activity.activity.slice(1));
      const lastActivityNumber = lastActivity ? parseInt(lastActivity.slice(1)) : 0;
      return activityNumber > lastActivityNumber;
    });

    // Calcular suma de actividades completadas
    const completedSum = completedActivities.reduce((sum, activity) => {
      const grade = Math.round(parseFloat(activity.grade)) || 0;
      const ponderation = parseFloat(activity.ponderation) || 0;
      return sum + (grade * ponderation / 100);
    }, 0);

    // Calcular suma máxima posible de actividades futuras (asumiendo 100 en cada una)
    const maxFutureSum = futureActivities.reduce((sum, activity) => {
      const ponderation = parseFloat(activity.ponderation) || 0;
      return sum + (100 * ponderation / 100);
    }, 0);

    return Math.round(completedSum + maxFutureSum);
  };

  // Función para actualizar calificaciones basadas en predicción
  const updateGradesForPrediction = (targetPrediction, activities) => {
    const newGrades = { ...automaticGrades };
    
    // Separar actividades completadas y futuras
    const completedActivities = activities.filter(activity => {
      const activityNumber = parseInt(activity.activity.slice(1));
      const lastActivityNumber = lastActivity ? parseInt(lastActivity.slice(1)) : 0;
      return activityNumber <= lastActivityNumber;
    });

    const futureActivities = activities.filter(activity => {
      const activityNumber = parseInt(activity.activity.slice(1));
      const lastActivityNumber = lastActivity ? parseInt(lastActivity.slice(1)) : 0;
      return activityNumber > lastActivityNumber;
    });

    // Calcular la suma actual de ponderaciones y calificaciones de actividades completadas
    const completedSum = completedActivities.reduce((sum, activity) => {
      const grade = Math.round(parseFloat(activity.grade)) || 0;
      const ponderation = parseFloat(activity.ponderation) || 0;
      return sum + (grade * ponderation / 100);
    }, 0);

    // Calcular la suma total de ponderaciones de actividades futuras
    const futurePonderationSum = futureActivities.reduce((sum, activity) => 
      sum + parseFloat(activity.ponderation), 0);

    if (futureActivities.length > 0 && futurePonderationSum > 0) {
      // Calcular cuánto necesitamos para alcanzar la predicción deseada
      const neededTotal = targetPrediction - completedSum;
      
      // Calcular la calificación base necesaria para todas las actividades futuras
      const baseGrade = (neededTotal * 100) / futurePonderationSum;

      // Asignar la misma calificación base a todas las actividades futuras
      futureActivities.forEach(activity => {
        const grade = Math.round(Math.min(100, Math.max(0, baseGrade)));
        newGrades[activity.activity] = grade;
      });
    }

    setAutomaticGrades(newGrades);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{student.fullName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Matrícula: {student.matricula}</p>
          </div>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-200 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 ${activeTab === "info" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-600 dark:text-gray-300"}`}
            onClick={() => setActiveTab("info")}
          >
            Información
          </button>
          {hasCriticalSubjects && (
            <button
              className={`px-4 py-2 ${activeTab === "critico" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-600 dark:text-gray-300"}`}
              onClick={() => setActiveTab("critico")}
            >
              Situación Crítica
            </button>
          )}
          <button
            className={`px-4 py-2 ${activeTab === "materias" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-600 dark:text-gray-300"}`}
            onClick={() => setActiveTab("materias")}
          >
            Materias
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {activeTab === "info" && (
            <>
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={toggleTableVisibility}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
                >
                  {isTableVisible ? "Ocultar Monitoreo" : "Mostrar Monitoreo"}
                </button>
                <button
                  onClick={togglePonderationTableVisibility}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
                >
                  {isPonderationTableVisible ? "Ocultar Predicciones" : "Mostrar Predicciones"}
                </button>
                <button
                  onClick={() => setShowAutomaticTable(prev => !prev)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 transition"
                >
                  {showAutomaticTable ? "Ocultar Predicción Automática" : "Mostrar Predicción Automática"}
                </button>
              </div>

              {/* Tabla de Monitoreo */}
              {isTableVisible && (
                <div className="overflow-auto">
                  <table className="table-fixed border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        {reorderColumns(
                          columns.filter((col) => visibleColumns[col]),
                          getFilledAColumns(filteredData[student.matricula] || [])
                        ).map((col, idx) => (
                          <th key={idx} className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 min-w-[80px]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                    {(filteredData[student.matricula] || []).map((row, idx) => {
                      const hasDA = Object.values(row).some((value) => value === "DA");
                      const hasSD = Object.values(row).some((value) => value === "SD");
                      const ponderado = parseFloat(row["Ponderado"]) || 0;
            
                      return (
                        <tr key={idx}>
                          {reorderColumns(
                            columns.filter((col) => visibleColumns[col]),
                            getFilledAColumns(filteredData[student.matricula] || [])
                          ).map((col, valIdx) => (
                            <td
                              key={valIdx}
                              className={`border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 text-nowrap ${
                                row[col] === "DA" ? "bg-green-300" : row[col] === "NE" ?  "bg-red-300" : row[col] === "SC" ? "bg-yellow-300" : row[col] === "SD" ? "bg-blue-300" : ""
                              }`}
                            >
                              {row[col] || ""}
                            </td>
                          ))}
                          {hasDA && ponderado < 70 && ponderado > 49 && (
                            <td
                              className="border px-2 py-1 text-sm text-red-500 font-bold text-nowrap"
                              colSpan={columns.length}
                            >
                              {"El estudiante no puede realizar examen extraordinario (Ponderado < 70 y DA)"}
                            </td>
                          )}
                          {ponderado < 50 && !hasSD && (
                            <td
                              className="border px-2 py-1 text-sm text-red-500 font-bold text-nowrap"
                              colSpan={columns.length}
                            >
                              {"El estudiante no puede realizar examen extraordinario (Ponderado < 50)"}
                            </td>
                          )}
                          {hasSD && (
                            <td
                              className="border px-2 py-1 text-sm text-red-500 font-bold text-nowrap"
                              colSpan={columns.length}
                            >
                              {"El estudiante no puede realizar examen extraordinario (SD)"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tabla de Predicciones Manual */}
              {isPonderationTableVisible && (
                <div className="overflow-auto">
                  {/* Selector de materias */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Seleccionar Materia</h3>
                    <select
                      value={selectedMateria}
                      onChange={handleMateriaChange}
                      className="border p-2 rounded w-full text-gray-700 "
                    >
                      {materias.map((materia) => (
                        <option key={materia} value={materia}>
                          {materia}
                        </option>
                      ))}
                    </select>
                  </div>
                  <table className="table-fixed border-collapse border border-gray-300 mb-4">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Nombre de la Materia</th>
                        <th className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Detalle</th>
                        {activityColumns.map((col) => {
                          // Obtener el tipo de actividad para la columna actual
                          const currentMateria = ponderationResults.find(result => result.materia === selectedMateria);
                          const activityType = currentMateria ? 
                            getActivityName(col, currentMateria.activities) : col;
                          
                          return (
                            <th key={col} className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                              {activityType}
                            </th>
                          );
                        })}
                        <th className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Ponderación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ponderationResults
                        .filter(({ materia }) => materia === selectedMateria)
                        .map(({ materia, activities, ponderado }, index) => {
                          // Calculate averages for each criterion
                          const avgGrade = ponderado;

                          let sumPonderation = 0;

                          const lastActivityColumnNumber = parseInt(lastActivityColumn.slice(1));
                          activities.map(activity => {
                            const activityNumber = parseInt(activity.activity.slice(1));
                            if (activityNumber <= lastActivityColumnNumber) {
                              sumPonderation += parseFloat(activity.ponderation || 0);
                            }
                            return activity;
                          });
                        
                          const avgPonderation = (
                            activities.reduce((sum, activity) => sum + parseFloat(activity.ponderation || 0), 0).toFixed(0));

                          const avgFinalPonderation = (
                            activities.reduce((sum, activity) => sum + parseFloat(activity.result || 0), 0)).toFixed(2);
                          
                          const avg = ((avgFinalPonderation * 100) / sumPonderation).toFixed(0);

                          return (
                          <React.Fragment key={index}>
                            {/* Fila de Materias */}
                            <tr>
                              <td rowSpan={3} className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 text-nowrap">{materia}</td>
                              <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Calificación del Alumno</td>
                              {activities.map((activity) => (
                                <td key={activity.activity} className={`border px-0 py-0 text-sm text-gray-700 ${activity.color}`} style={{ padding: 0 }}>
                                  <input
                                    value={manualGrades[activity.activity] || activity.grade || "0"}
                                    onChange={(e) => handleGradeChange(activity.activity, e.target.value)}
                                    className="w-full h-full border-none"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    readOnly={!editableInputs[activity.activity]}
                                    onDoubleClick={() => toggleEditable(activity.activity)}
                                    style={{
                                      backgroundColor: editedCells[activity.activity] ? "#e9d5ff" : editableInputs[activity.activity] ? "white" : "#B5B5B5",
                                      cursor: editableInputs[activity.activity] ? "text" : "default",
                                      WebkitAppearance: "none",
                                      MozAppearance: "textfield",
                                      margin: 0,
                                      padding: "4px 8px",
                                      boxSizing: "border-box",
                                      width: "100%",
                                      height: "100%",
                                      minHeight: "30px",
                                      display: "block",
                                      outline: "none",
                                      border: "1px solid #e2e8f0"
                                    }}
                                  />
                                </td>
                              ))}
                              <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 font-bold">Banner: {avgGrade} <br/> Pred: { avg}</td>
                            </tr>
                            {/* Fila de Ponderaciones */}
                            <tr>
                              <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Ponderación Materia</td>
                              {activities.map((activity, idx) => (
                                <td key={idx} className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">{(activity.ponderation || '').toString().replace(/[a-zA-Z]/g, '')}</td>
                              ))}
                              <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 font-bold">{avgPonderation}</td>
                            </tr>
                            {/* Fila de Ponderaciones Finales */}
                            <tr>
                              <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Ponderación Final</td>
                              {activities.map((activity, idx) => (
                                <td key={idx} className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">{activity.result}</td>
                              ))}
                              <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 font-bold">{avgFinalPonderation}</td>
                            </tr>
                          </React.Fragment>
                        )})}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Nueva Tabla de Predicción Automática */}
              {showAutomaticTable && (
                <div className="overflow-auto mt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Predicción Automática</h3>
                  <div className="mb-4">
                    <select
                      value={selectedMateria}
                      onChange={handleMateriaChange}
                      className="border p-2 rounded w-full text-gray-700"
                    >
                      {materias.map((materia) => (
                        <option key={materia} value={materia}>
                          {materia}
                        </option>
                      ))}
                    </select>
                  </div>
                  <table className="table-fixed border-collapse border border-gray-300 mb-4">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Materia</th>
                        <th className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Detalle</th>
                        {activityColumns.map((col) => (
                          <th key={col} className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                            {getActivityName(col, ponderationResults[0]?.activities || [])}
                          </th>
                        ))}
                        <th className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Predicción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ponderationResults
                        .filter(({ materia }) => materia === selectedMateria)
                        .map(({ materia, activities, ponderado }, index) => {
                          const avgGrade = ponderado;
                          const maxPrediction = calculateMaxPrediction(activities);
                          const currentPrediction = activities.reduce((sum, activity) => {
                            const activityNumber = parseInt(activity.activity.slice(1));
                            const lastActivityNumber = lastActivity ? parseInt(lastActivity.slice(1)) : 0;
                            const isFutureActivity = activityNumber > lastActivityNumber;
                            
                            const grade = automaticGrades[activity.activity] !== undefined ?
                              parseFloat(automaticGrades[activity.activity]) :
                              (isFutureActivity ? 100 : parseFloat(activity.grade)) || 0;
                            
                            return sum + (grade * parseFloat(activity.ponderation) / 100);
                          }, 0);

                          return (
                            <React.Fragment key={index}>
                              {/* Fila de Calificaciones */}
                              <tr>
                                <td rowSpan={3} className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 text-nowrap">{materia}</td>
                                <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Calificación</td>
                                {activities.map((activity) => {
                                  const activityNumber = parseInt(activity.activity.slice(1));
                                  const lastActivityNumber = lastActivity ? parseInt(lastActivity.slice(1)) : 0;
                                  const isFutureActivity = activityNumber > lastActivityNumber;

                                  return (
                                    <td key={activity.activity} className="border px-2 py-1 text-sm text-gray-700">
                                      <input
                                        type="number"
                                        value={isFutureActivity ? 
                                          (automaticGrades[activity.activity] !== undefined ? 
                                            automaticGrades[activity.activity] : "100") : 
                                          (activity.grade || "0")}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (isFutureActivity) {
                                            const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
                                            setAutomaticGrades(prev => ({
                                              ...prev,
                                              [activity.activity]: numValue
                                            }));
                                          }
                                        }}
                                        className="w-full border-none text-center"
                                        min="0"
                                        max="100"
                                        style={{
                                          backgroundColor: isFutureActivity ? "white" : "#B5B5B5",
                                          cursor: isFutureActivity ? "text" : "default"
                                        }}
                                      />
                                    </td>
                                  );
                                })}
                                <td className="border px-2 py-1 text-sm text-gray-700">
                                  <div className="flex items-center justify-between">
                                    <input
                                      type="number"
                                      value={Math.round(currentPrediction)}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "" || isNaN(value)) return;
                                        const numValue = parseInt(value);
                                        if (numValue >= 0 && numValue <= maxPrediction) {
                                          updateGradesForPrediction(numValue, activities);
                                        }
                                      }}
                                      className="w-20 border rounded px-1"
                                      min="0"
                                      max={maxPrediction}
                                    />
                                    <span className="text-xs text-gray-500 ml-1">
                                      (Max: {Math.round(maxPrediction)})
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              {/* Fila de Ponderaciones */}
                              <tr>
                                <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Ponderación</td>
                                {activities.map((activity, idx) => (
                                  <td key={idx} className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 text-center">
                                    {parseFloat(activity.ponderation).toFixed(0)}
                                  </td>
                                ))}
                                <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 text-center">100</td>
                              </tr>
                              {/* Fila de Resultados */}
                              <tr>
                                <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200">Resultado</td>
                                {activities.map((activity, idx) => {
                                  const activityNumber = parseInt(activity.activity.slice(1));
                                  const lastActivityNumber = lastActivity ? parseInt(lastActivity.slice(1)) : 0;
                                  const isFutureActivity = activityNumber > lastActivityNumber;
                                  const grade = isFutureActivity ? 
                                    (automaticGrades[activity.activity] !== undefined ? automaticGrades[activity.activity] : 100) : 
                                    parseFloat(activity.grade) || 0;
                                  const result = (grade * parseFloat(activity.ponderation) / 100).toFixed(2);

                                  return (
                                    <td key={idx} className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 text-center">
                                      {result}
                                    </td>
                                  );
                                })}
                                <td className="border px-2 py-1 text-sm text-gray-700 dark:text-gray-200 text-center font-bold">
                                  {(currentPrediction).toFixed(2)}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sección de Scripts */}
              {scripts.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Scripts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scripts.map((script, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-white dark:bg-gray-700 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800 dark:text-white">{script.name}</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyToClipboard(script.content)}
                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
                          >
                            {copiedScript === script.content ? (
                              <span className="text-green-500">¡Copiado!</span>
                            ) : (
                              "Copiar"
                            )}
                          </button>
                          {whatsapp && (
                            <button
                              onClick={() => handleSendWhatsApp(script.content)}
                              className="text-green-500 hover:text-green-600"
                            >
                              WhatsApp
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {replaceVariables(script.content)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </>
          )}
          
          {activeTab === "critico" && hasCriticalSubjects && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Materias en Situación Crítica</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2">Materia</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Ponderado</th>
                      <th className="px-4 py-2">Faltas</th>
                      <th className="px-4 py-2">NE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(student.criticalSubjects || []).map((subject, index) => {
                      // Cálculo de status para cada materia
                      const ponderado = parseFloat(subject["Ponderado"]) || 0;
                      let statusText = "Peligro";
                      let statusColor = "bg-yellow-500";
                      
                      // Cálculo de porcentajes
                      const faltasAlumno = parseInt(subject["Faltas del alumno"]) || 0;
                      const limiteFaltas = parseInt(subject["Límite de faltas"]) || 1;
                      const porcentajeFaltas = ((faltasAlumno / limiteFaltas) * 100).toFixed(1);
                      
                      const neAlumno = parseInt(subject["NE alumno"]) || 0;
                      const limiteNE = parseInt(subject["Límite de NE"]) || 1;
                      const porcentajeNE = ((neAlumno / limiteNE) * 100).toFixed(1);
                      
                      if (porcentajeFaltas > 100 || porcentajeNE > 100 || ponderado < 50) {
                        statusText = "Recursar";
                        statusColor = "bg-red-500";
                      } else if ((porcentajeFaltas >= 80 || porcentajeNE >= 80) || (ponderado < 70 )) {
                        statusText = "Peligro";
                        statusColor = "bg-yellow-500";
                      }
                      return (
                        <tr key={index} className="border-b dark:border-gray-600">
                          <td className="px-4 py-2">{subject["Nombre de la materia"]}</td>
                          <td className="px-4 py-2">
                            <span className={`${statusColor} text-white text-xs px-2 py-1 rounded-full`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="px-4 py-2">{ponderado}</td>
                          <td className="px-4 py-2">
                            {faltasAlumno}/{limiteFaltas} ({porcentajeFaltas}%)
                          </td>
                          <td className="px-4 py-2">
                            {neAlumno}/{limiteNE} ({porcentajeNE}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === "materias" && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Materias del Alumno</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2">Materia</th>
                      <th className="px-4 py-2">Grupo</th>
                      <th className="px-4 py-2">Ponderado</th>
                      <th className="px-4 py-2">Faltas</th>
                      <th className="px-4 py-2">NE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredData[student.matricula] || []).map((row, index) => {
                      const ponderado = parseFloat(row["Ponderado"]) || 0;
                      const faltasAlumno = parseInt(row["Faltas del alumno"]) || 0;
                      const limiteFaltas = parseInt(row["Límite de faltas"]) || 1;
                      const porcentajeFaltas = ((faltasAlumno / limiteFaltas) * 100).toFixed(1);
                      
                      const neAlumno = parseInt(row["NE alumno"]) || 0;
                      const limiteNE = parseInt(row["Límite de NE"]) || 1;
                      const porcentajeNE = ((neAlumno / limiteNE) * 100).toFixed(1);
                      
                      // Determinar color del ponderado
                      let ponderadoColor = "bg-green-500";
                      if (ponderado < 70) ponderadoColor = "bg-red-500";
                      else if (ponderado < 80) ponderadoColor = "bg-yellow-500";
                      
                      // Determinar color de faltas y NE
                      const faltasColor = parseFloat(porcentajeFaltas) >= 80 ? "bg-red-500" : "bg-green-500";
                      const neColor = parseFloat(porcentajeNE) >= 80 ? "bg-red-500" : "bg-green-500";
                      
                      return (
                        <tr key={index} className="border-b dark:border-gray-600">
                          <td className="px-4 py-2">{row["Nombre de la materia"]}</td>
                          <td className="px-4 py-2">{row["# Grupo"]}</td>
                          <td className="px-4 py-2">
                            <span className={`${ponderadoColor} text-white text-xs px-2 py-1 rounded-full`}>
                              {ponderado}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              <div className="mr-2">{faltasAlumno}/{limiteFaltas}</div>
                              <div className={`px-1.5 py-0.5 rounded text-xs text-white ${faltasColor}`}>
                                {porcentajeFaltas}%
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              <div className="mr-2">{neAlumno}/{limiteNE}</div>
                              <div className={`px-1.5 py-0.5 rounded text-xs text-white ${neColor}`}>
                                {porcentajeNE}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}