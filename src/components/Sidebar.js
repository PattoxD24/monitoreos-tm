// components/Sidebar.js
"use client";
import React, { useState } from "react";
import SortAndFilterControls from "./SortAndFilterControls";
import ColumnSelector from "./ColumnSelector";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

export default function Sidebar({
  showColumnSelector,
  setShowColumnSelector,
  setShowColumnModal,
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
  onShowArchivedModal
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleToggle = () => setIsCollapsed(!isCollapsed);

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
          <SortAndFilterControls
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            toggleSortDirection={toggleSortDirection}
            isAscending={isAscending}
          />
        </>
      )}
    </div>
  );
}