// components/Sidebar.js
"use client";
import React, { useState } from "react";
import ColumnSelector from "./ColumnSelector";
import ThemeToggle from "./ThemeToggle";
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
    <div className={`fixed left-0 top-0 h-screen p-4 bg-gray-800 dark:bg-gray-900 text-white transition-all duration-300 z-10 flex flex-col justify-between ${
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
          <div className="mb-4 flex justify-end">
            {/* <ThemeToggle /> */}
          </div>
        )}

        {!isCollapsed && (
          <>
            <button
              onClick={() => setShowColumnModal(true)}
              className="w-full rounded bg-blue-500 dark:bg-blue-600 px-4 py-2 hover:bg-blue-600 dark:hover:bg-blue-700 mb-2 transition-colors"
            >
              Columnas
            </button>

            <button
              onClick={downloadZip}
              className="w-full rounded bg-green-500 dark:bg-green-600 px-4 py-2 hover:bg-green-600 dark:hover:bg-green-700 mb-2 transition-colors"
            >
              Descargar ZIP
            </button>

            <button 
              onClick={onShowScriptsModal}
              className="w-full rounded bg-yellow-500 dark:bg-yellow-600 px-4 py-2 hover:bg-yellow-600 dark:hover:bg-yellow-700 mb-2 transition-colors"
            >
              Scripts
            </button>

            <button
              onClick={toggleShowWhatsappInput}
              className="w-full rounded bg-pink-500 dark:bg-pink-600 px-4 py-2 hover:bg-pink-600 dark:hover:bg-pink-700 mb-2 transition-colors"
            >
              Whatsapp
            </button>

            {showWhatsappInput && (
              <input
                type="phone"
                placeholder="Número de Whatsapp"
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-700 dark:text-gray-200 dark:bg-gray-700 mb-2"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            )}

            <button
              onClick={onShowArchivedModal}
              className="w-full rounded bg-purple-500 dark:bg-purple-600 px-4 py-2 hover:bg-purple-600 dark:hover:bg-purple-700 mb-2 transition-colors"
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
              className="w-full flex items-center justify-center rounded bg-red-500 dark:bg-red-600 px-4 py-2 hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
            >
              <FaTrash className="mr-2" /> Borrar Datos
            </button>
          </div>
          
          <div className="mt-4 flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}