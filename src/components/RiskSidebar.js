"use client";

import React, { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function RiskSidebar() {
  // Estado para manejar filtros si son necesarios
  const [activeFilters, setActiveFilters] = useState({});

  return (
    <div className="w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Filtros de Riesgo</h3>
        <div className="space-y-4">
          {/* Aquí puedes agregar más filtros específicos si es necesario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nivel de Riesgo
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="riesgo-alto"
                  className="h-4 w-4 text-blue-600 dark:text-blue-500 rounded border-gray-300 dark:border-gray-600"
                  onChange={() => {
                    setActiveFilters(prev => ({
                      ...prev,
                      alto: !prev.alto
                    }));
                  }}
                />
                <label htmlFor="riesgo-alto" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Alto (Recursar)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="riesgo-medio"
                  className="h-4 w-4 text-blue-600 dark:text-blue-500 rounded border-gray-300 dark:border-gray-600"
                  onChange={() => {
                    setActiveFilters(prev => ({
                      ...prev,
                      medio: !prev.medio
                    }));
                  }}
                />
                <label htmlFor="riesgo-medio" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Medio (Extraordinario)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="riesgo-bajo"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  onChange={() => {
                    setActiveFilters(prev => ({
                      ...prev,
                      bajo: !prev.bajo
                    }));
                  }}
                />
                <label htmlFor="riesgo-bajo" className="ml-2 text-sm text-gray-700">
                  Bajo (Peligro)
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtros por Indicadores
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="faltas"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  onChange={() => {
                    setActiveFilters(prev => ({
                      ...prev,
                      faltas: !prev.faltas
                    }));
                  }}
                />
                <label htmlFor="faltas" className="ml-2 text-sm text-gray-700">
                  Faltas ≥ 80%
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ne"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  onChange={() => {
                    setActiveFilters(prev => ({
                      ...prev,
                      ne: !prev.ne
                    }));
                  }}
                />
                <label htmlFor="ne" className="ml-2 text-sm text-gray-700">
                  NE ≥ 80%
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ponderado"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  onChange={() => {
                    setActiveFilters(prev => ({
                      ...prev,
                      ponderado: !prev.ponderado
                    }));
                  }}
                />
                <label htmlFor="ponderado" className="ml-2 text-sm text-gray-700">
                  Ponderado &lt; 70
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-xs text-gray-500">
          Esta barra lateral muestra filtros adicionales para la página de Alumnos en Riesgo.
        </p>
      </div>
    </div>
  );
}