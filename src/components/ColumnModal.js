// components/ColumnModal.js
import { useEffect } from "react";

export default function ColumnModal({ visible, onClose, columns, visibleColumns, toggleColumnVisibility }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!visible) return null;

  const handleClickOutside = (e) => {
    if (e.target.id === "modal-background") onClose();
  };

  return (
    <div
      id="modal-background"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClickOutside}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg w-full">
        <h2 className="text-xl text-gray-800 font-semibold mb-4">Selecciona las columnas a mostrar:</h2>
        <div className="grid grid-rows-[repeat(11,minmax(0,1fr))] grid-flow-col gap-2 w-full">
          {columns.map((col) => (
            <label key={col} className="flex items-center text-gray-700">
              <input
                type="checkbox"
                checked={visibleColumns[col]}
                onChange={() => toggleColumnVisibility(col)}
                className="mr-2"
              />
              {col}
            </label>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}