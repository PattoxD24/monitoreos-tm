import { useEffect, useRef } from "react";
import html2canvas from "html2canvas";

export default function StudentModal({
  student,
  filteredData,
  columns,
  visibleColumns,
  closeModal,
  reorderColumns,
  getFilledAColumns
}) {
  const modalRef = useRef(null);
  const hiddenTableRef = useRef(null);

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

  const downloadTableAsImage = async () => {
    if (!hiddenTableRef.current) return;

    const canvas = await html2canvas(hiddenTableRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null, // Establece el fondo como transparente si es necesario
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
          <h2 className="text-xl font-bold mb-4">
            Detalles de {student.preferredName} ({student.matricula})
          </h2>

          <button
            onClick={downloadTableAsImage}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
          >
            Descargar Tabla como Imagen
          </button>

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