"use client";

import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import ScriptsModal from "./ScriptsModal";

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
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [isPonderationTableVisible, setIsPonderationTableVisible] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState("");
  const [activityColumns, setActivityColumns] = useState([]);
  const [manualGrades, setManualGrades] = useState({});
  const [editableInputs, setEditableInputs] = useState({});
  const [includeImage, setIncludeImage] = useState(false);
  const modalRef = useRef(null);
  const hiddenTableRef = useRef(null);
  const [showScriptContent, setShowScriptContent] = useState(false);
  const [copiedScript, setCopiedScript] = useState(null);

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
    console.log(studentData);

    studentData.forEach((row) => {
      const materia = row["Nombre de la materia"];
      if (materia === selectedMateria) {
        const ponderations = ponderationData[materia] || {};
        const activityResults = Object.keys(ponderations)
          .map((activity) => {
            const ponderation = ponderations[activity];
            const grade =
              manualGrades[activity] !== undefined
                ? parseFloat(manualGrades[activity])
                : parseFloat(row[activity]) || 0;

            // Exclude rows with grade "SD"
            if (row[activity] === "SD" || manualGrades[activity] === "SD") return null;
            const color = row[activity] === "NE" ? "bg-red-300" : row[activity] === "SC" ? "bg-yellow-300" : row[activity] === "DA" ? "bg-green-300" : "";

            const result = (grade * (ponderation / 100)).toFixed(2);
            return { activity, ponderation, grade, result, color };
          })
          .filter(Boolean); // Remove null entries

        if (activityResults.length > 0) {
          results.push({ materia, activities: activityResults, color: activityResults[0].color });
        }
      }
    });
    return results;
  }

  const ponderationResults = calculatePonderations();

  const handleMateriaChange = (e) => {
    const materia = e.target.value;
    setSelectedMateria(e.target.value);
    setActivityColumns(Object.keys(ponderationData[materia] || {}));
  }

  const handleGradeChange = (activity, value) => {
    setManualGrades((prev) => ({ ...prev, [activity]: value }));
  }

  const toggleEditable = (activity) => {
    setEditableInputs((prev) => ({ ...prev, [activity]: !prev[activity] }));
  }

  // Get list of materias from ponderationData, excluding those with "SD" grades
  const materias = Object.keys(ponderationData || {}).filter((materia) => {
    const studentData = filteredData[student.matricula] || [];
    const materiaRow = studentData.find((row) => row["Nombre de la materia"] === materia);
    // Exclude the subject if it has an "SD" grade in any activity
    if (!materiaRow) return true;
    return !Object.keys(ponderationData[materia] || {}).some(
      (activity) => materiaRow[activity] === "SD"
    );
  });

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

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
        <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto">
          <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500">X</button>
          <h2 className="text-xl text-gray-800 font-bold mb-4">
            Detalles de {student.preferredName} ({student.matricula})
          </h2>

          <button
            onClick={downloadTableAsImage}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
          >
            Descargar Monitoreo como Imagen
          </button>
          <button
            onClick={toggleTableVisibility}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
          >
            {isTableVisible ? "Ocultar Monitoreo" : "Mostrar Monitoreo"}
          </button>
          <button
            onClick={togglePonderationTableVisibility}
            className="mb-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
          >
            {isPonderationTableVisible ? "Ocultar Predicciones" : "Mostrar Predicciones"}
          </button>

          {/* Tabla de Ponderaciones */}
          {isPonderationTableVisible && (
            <div className="overflow-auto">
            {/* Selector de materias */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800">Seleccionar Materia</h3>
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
              <table className="table-fixed border-collapse border border-gray-300 mb-4 ">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 text-sm text-gray-700">Nombre de la Materia</th>
                    <th className="border px-2 py-1 text-sm text-gray-700">Detalle</th>
                    {activityColumns.map((col) => (
                      <th key={col} className="border px-2 py-1 text-sm text-gray-700">{col}</th>
                    ))}
                    {/* {getFilledAColumns(filteredData[student.matricula] || []).map((col) => (
                      <th key={col} className="border px-2 py-1 text-sm text-gray-700">{col}</th>
                    ))} */}
                    <th className="border px-2 py-1 text-sm text-gray-700">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {ponderationResults
                    .filter(({ materia }) => materia === selectedMateria)
                    .map(({ materia, activities }, index) => {
                      // Calculate averages for each criterion
                      
                      console.log(activities);
                      const avgGrade = (
                        activities.reduce((sum, activity) => sum + parseFloat(activity.grade || 0), 0) / activities.length
                      ).toFixed(2);

                      const avgPonderation = (
                        activities.reduce((sum, activity) => sum + parseFloat(activity.ponderation || 0), 0).toFixed(2));

                      const avgFinalPonderation = (
                        activities.reduce((sum, activity) => sum + parseFloat(activity.result || 0), 0)).toFixed(2);

                      return (
                      <React.Fragment key={index}>
                        {/* Fila de Materias */}
                        <tr>
                          <td rowSpan={3} className="border px-2 py-1 text-sm text-gray-700 text-nowrap">{materia}</td>
                          <td className="border px-2 py-1 text-sm text-gray-700">Calificación del Alumno</td>
                          {activities.map((activity) => (
                            <td key={activity.activity} className={`border px-2 py-1 text-sm text-gray-700 ${activity.color}`}>
                              <input
                                value={manualGrades[activity.activity] || activity.grade || "0"}
                                onChange={(e) =>
                                  handleGradeChange(activity.activity, e.target.value)
                                }
                                className="w-full border border-gray-400 rounded px-1"
                                min="0"
                                max="100"
                                readOnly={!editableInputs[activity.activity]}
                                onDoubleClick={() => toggleEditable(activity.activity)}
                                style={{
                                  backgroundColor: editableInputs[activity.activity] ? "white" : "#f0f0f0",
                                  cursor: editableInputs[activity.activity] ? "text" : "default",
                                }}
                              />
                            </td>
                          ))}
                          <td className="border px-2 py-1 text-sm text-gray-700 font-bold">{avgGrade}</td>
                        </tr>
                        {/* Fila de Ponderaciones */}
                        <tr>
                          <td className="border px-2 py-1 text-sm text-gray-700">Ponderación Materia</td>
                          {activities.map((activity, idx) => (
                            <td key={idx} className="border px-2 py-1 text-sm text-gray-700">{activity.ponderation}</td>
                          ))}
                          <td className="border px-2 py-1 text-sm text-gray-700 font-bold">{avgPonderation}</td>
                        </tr>
                        {/* Fila de Ponderaciones Finales */}
                        <tr>
                          <td className="border px-2 py-1 text-sm text-gray-700">Ponderación Final</td>
                          {activities.map((activity, idx) => (
                            <td key={idx} className="border px-2 py-1 text-sm text-gray-700">{activity.result}</td>
                          ))}
                          <td className="border px-2 py-1 text-sm text-gray-700 font-bold">{avgFinalPonderation}</td>
                        </tr>
                      </React.Fragment>
                    )})}
                </tbody>
              </table>
            </div>
          )}

          {isTableVisible && (
          <div className="overflow-auto">
            <table className="table-fixed border-collapse border border-gray-300">
              <thead>
                <tr>
                  {reorderColumns(
                    columns.filter((col) => visibleColumns[col]),
                    getFilledAColumns(filteredData[student.matricula] || [])
                  ).map((col, idx) => (
                    <th key={idx} className="border px-2 py-1 text-sm text-gray-700 min-w-[80px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(filteredData[student.matricula] || []).map((row, idx) => (
                  <tr key={idx}>
                    {reorderColumns(
                      columns.filter((col) => visibleColumns[col]),
                      getFilledAColumns(filteredData[student.matricula] || [])
                    ).map((col, valIdx) => (
                      <td key={valIdx} className="border px-2 py-1 text-sm text-gray-700 text-nowrap">
                        {row[col] || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          {/* Scripts Section */}
        <h3 className="text-lg text-gray-800 font-semibold mb-2">Scripts Disponibles</h3>
        <ul className="space-y-2">
          {scripts.map((script, index) => (
            <li key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded" title={replaceVariables(script.content)}>
              <span
                className="text-gray-100 border border-dashed border-gray-400 cursor-pointer rounded px-2 py-1 bg-purple-400"
                onClick={toggleScriptContent}>
                {script.name}
              </span>
              {showScriptContent && (
              <span className="text-gray-500 text-sm">
                {script.content.length > 20 ? `${replaceVariables(script.content).slice(0, -1)}...` : replaceVariables(script.content)}
              </span>
              )}
              <div className="flex items-center">
                {/* <input
                  type="checkbox"
                  checked={includeImage}
                  onChange={() => setIncludeImage((prev) => !prev)}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700 mr-4">Incluir Imagen</label> */}
                <button
                    onClick={() => copyToClipboard(script.content)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Copiar
                </button>
                {whatsapp && (
                  <button
                    onClick={() => handleSendWhatsApp(script.content)}
                    className="bg-green-500 text-white px-4 py-1 rounded text-sm"
                  >
                    Enviar por WhatsApp
                  </button>
                )}
                {copiedScript === script.content && (
                  <span className="text-green-500 text-sm ml-2">Copiado!</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        </div>
      </div>

      {/* Tabla oculta con estilos inline */}
      <div ref={hiddenTableRef} style={{ position: "absolute", top: "-9999px", left: "-9999px" }} className="bg-white">
        <table style={{ borderCollapse: "collapse", width: "100%", fontFamily: "Arial, sans-serif" }}>
          <thead>
            <tr>
              {reorderColumns(
                columns.filter((col) => visibleColumns[col]),
                getFilledAColumns(filteredData[student.matricula] || [])
              ).map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    fontSize: "12px",
                    color: "#333",
                    minWidth: "80px",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(filteredData[student.matricula] || []).map((row, idx) => (
              <tr key={idx}>
                {reorderColumns(
                  columns.filter((col) => visibleColumns[col]),
                  getFilledAColumns(filteredData[student.matricula] || [])
                ).map((col, valIdx) => (
                  <td
                    key={valIdx}
                    style={{
                      border: "1px solid #ccc",
                      padding: "8px",
                      fontSize: "12px",
                      color: "#333",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row[col] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}