"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

export default function StudentModal({
  student,
  filteredData,
  columns,
  visibleColumns,
  closeModal,
  reorderColumns,
  getFilledAColumns,
  scripts,
  whatsapp
}) {
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [includeImage, setIncludeImage] = useState(false);
  const modalRef = useRef(null);
  const hiddenTableRef = useRef(null);
  const [showScriptContent, setShowScriptContent] = useState(false);

  const toggleTableVisibility = () => {
    setIsTableVisible((prev) => !prev);
  }

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

  // const nombre = student.preferredName.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  const replaceVariables = (content) => {
    const nombre = student.preferredName.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    const matricula = student.matricula;
  
    const neMaterias = findMateriasWithLastColumnNE(filteredData[student.matricula]);
    const lowPonderacionMaterias = findMateriasWithLowPonderacion(filteredData[student.matricula]);
  
    const neMessage = neMaterias.length > 0 
      ? `Tienes un NE en ${neMaterias.length>1 ? "las materias":"la materia"}: ${neMaterias.join(", ")}.` 
      : "";
  
    const ponderacionMessage = lowPonderacionMaterias.length > 0 
      ? `Tienes una ponderación baja de menos de 80 en ${lowPonderacionMaterias.length > 1 ?"las materias":"la materia"}: ${lowPonderacionMaterias.join(", ")}.` 
      : "";
  
    // Reemplazar variables en el contenido
    return content
      .replace("{{nombre}}", nombre)
      .replace("{{matricula}}", matricula)
      .replace("{{ultima_columna_NE}}", neMessage)
      .replace("{{ultima_columna_ponderacion}}", ponderacionMessage);
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
  
  // Función para encontrar materias con ponderación menor a 80 en la columna "Ponderado"
  const findMateriasWithLowPonderacion = (rows) => {
    return rows
      .filter(row => row.Ponderado && parseInt(row.Ponderado) < 80)
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

    const whatsappURL = `https://wa.me/${phoneNumber}?text=${formattedMessage}`;
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
            Descargar Tabla como Imagen
          </button>
          <button
            onClick={toggleTableVisibility}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
          >
            {isTableVisible ? "Ocultar Tabla" : "Mostrar Tabla"}
          </button>

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
                  onClick={() => handleSendWhatsApp(script.content)}
                  className="bg-green-500 text-white px-4 py-1 rounded text-sm"
                >
                  Enviar por WhatsApp
                </button>
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