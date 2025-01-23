// components/Sidebar.js
"use client";
import React, { useState } from "react";
import ColumnSelector from "./ColumnSelector";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

export default function Sidebar({
  showColumnSelector,
  setShowColumnSelector,
  setShowColumnModal,
  showWhatsappInput,
  setShowWhatsappInput,
  whatsapp,
  setWhatsapp,
  downloadZip,
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  toggleSortDirection,
  isAscending,
  columns,
  visibleColumns,
  toggleColumnVisibility,
  onShowArchivedModal,
  onShowScriptsModal
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleToggle = () => setIsCollapsed(!isCollapsed);

  const toggleShowWhatsappInput = (val) => setShowWhatsappInput(!showWhatsappInput);

  return (
    <div
      className={`fixed left-0 top-0 h-screen p-4 bg-gray-800 text-white transition-all duration-300 z-10 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        {!isCollapsed && <h2 className="text-xl font-bold">Opciones</h2>}
        <button
          onClick={handleToggle}
          className="text-white hover:text-gray-400 transition"
        >
          {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
        </button>
      </div>

      {/* Botón de Columnas */}
      {!isCollapsed && (
        <>
          <button
            onClick={() => setShowColumnModal(true)}
            className="w-full rounded bg-blue-500 px-4 py-2 hover:bg-blue-600 mb-2"
          >
            Columnas
          </button>

          {/* Botón de Descargar Imágenes */}
          <button
            onClick={downloadZip}
            className="w-full rounded bg-green-500 px-4 py-2 hover:bg-green-600 mb-2"
          >
            Descargar ZIP
          </button>

          <button 
            onClick={onShowScriptsModal}
            className="w-full rounded bg-yellow-500 px-4 py-2 hover:bg-yellow-600 mb-2"
          >
            Scripts
          </button>

          <button
            onClick={toggleShowWhatsappInput}
            className="w-full rounded bg-pink-500 px-4 py-2 hover:bg-pink-600 mb-2"
          >
            Whatsapp
          </button>

          {showWhatsappInput && (
            <input
              type="phone"
              placeholder="Número de Whatsapp"
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:border-blue-500 text-gray-700"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          )}

          <button
            onClick={onShowArchivedModal}
            className="w-full rounded bg-purple-500 px-4 py-2 hover:bg-purple-600 mb-2"
          >
            Archivados
          </button>

          {/* Selector de Columnas */}
          {showColumnSelector && (
            <ColumnSelector
              columns={columns}
              visibleColumns={visibleColumns}
              toggleColumnVisibility={toggleColumnVisibility}
            />
          )}

          {/* Barra de búsqueda y ordenación */}
        </>
      )}
    </div>
  );
}