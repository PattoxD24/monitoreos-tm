// components/Sidebar.js
"use client";
import React, { useState } from "react";
import ColumnSelector from "./ColumnSelector";
import { FaAngleLeft, FaAngleRight, FaUpload, FaTrash } from "react-icons/fa";

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
  onShowScriptsModal,
  clearAllData,
  handleFile1Change,
  handleFile2Change
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleToggle = () => setIsCollapsed(!isCollapsed);

  const toggleShowWhatsappInput = (val) => setShowWhatsappInput(!showWhatsappInput);

  return (
    <div className={`fixed left-0 top-0 h-screen p-4 bg-gray-800 text-white transition-all duration-300 z-10 flex flex-col justify-between ${
      isCollapsed ? "w-16" : "w-64"
    }`}>
      <div>
        <div className="flex justify-between items-center mb-4">
          {!isCollapsed && <h2 className="text-xl font-bold">Opciones</h2>}
          <button
            onClick={handleToggle}
            className="text-white hover:text-gray-400 transition"
          >
            {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
          </button>
        </div>

        {!isCollapsed && (
          <>
            <button
              onClick={() => setShowColumnModal(true)}
              className="w-full rounded bg-blue-500 px-4 py-2 hover:bg-blue-600 mb-2"
            >
              Columnas
            </button>

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

            {showColumnSelector && (
              <ColumnSelector
                columns={columns}
                visibleColumns={visibleColumns}
                toggleColumnVisibility={toggleColumnVisibility}
              />
            )}
          </>
        )}
      </div>

      {!isCollapsed && (
        <div className="mt-auto">
          <div className="border-t border-gray-600 pt-4 space-y-2">
            <input
              type="file"
              id="updateFile1"
              onChange={handleFile1Change}
              className="hidden"
              accept=".xlsx, .xls"
            />
            <label
              htmlFor="updateFile1"
              className="w-full flex items-center justify-center rounded bg-blue-500 px-4 py-2 hover:bg-blue-600 cursor-pointer"
            >
              <FaUpload className="mr-2" /> Actualizar Base
            </label>

            <input
              type="file"
              id="updateFile2"
              onChange={handleFile2Change}
              className="hidden"
              accept=".xlsx, .xls"
            />
            <label
              htmlFor="updateFile2"
              className="w-full flex items-center justify-center rounded bg-green-500 px-4 py-2 hover:bg-green-600 cursor-pointer"
            >
              <FaUpload className="mr-2" /> Actualizar Monitoreos
            </label>

            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de que quieres borrar todos los datos?')) {
                  clearAllData();
                }
              }}
              className="w-full flex items-center justify-center rounded bg-red-500 px-4 py-2 hover:bg-red-600"
            >
              <FaTrash className="mr-2" /> Borrar Datos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}