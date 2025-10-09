"use client";

import { useState, useEffect } from 'react';
import SidebarNav from './SidebarNav';

export default function MainLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Esta función será expuesta para que SidebarNav pueda actualizar el estado
  const updateSidebarState = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
    try {
      localStorage.setItem('sidebarCollapsed', String(isCollapsed));
      localStorage.setItem('sidebarcollapsed', String(isCollapsed)); // compat
    } catch (e) {
      console.error('Error saving sidebarCollapsed:', e);
    }
  };
  
  // Cargar el estado del sidebar al inicio
  useEffect(() => {
    try {
      const savedStateCamel = localStorage.getItem('sidebarCollapsed');
      const savedStateLower = localStorage.getItem('sidebarcollapsed');
      const savedState = savedStateCamel ?? savedStateLower;
      if (savedState !== null) {
        const collapsed = savedState === 'true';
        setSidebarCollapsed(collapsed);
        // Normaliza ambas claves para que queden alineadas
        localStorage.setItem('sidebarCollapsed', String(collapsed));
        localStorage.setItem('sidebarcollapsed', String(collapsed));
      } else {
        // Inicializa el item si no existe
        localStorage.setItem('sidebarCollapsed', 'false');
        localStorage.setItem('sidebarcollapsed', 'false');
        setSidebarCollapsed(false);
      }
    } catch (e) {
      console.error('Error reading/writing sidebarCollapsed:', e);
    }
  }, []);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-800">
      {/* Sidebar fijo */}
      <SidebarNav onToggle={updateSidebarState} initialState={sidebarCollapsed} />
      {/* Contenido: ancho dinámico calculado restando el ancho del sidebar */}
      <main
        className="p-4 md:p-8 transition-all duration-300 min-h-screen"
        style={{
          marginLeft: sidebarCollapsed ? '4rem' : '16rem',
          width: `calc(100% - ${sidebarCollapsed ? '4rem' : '16rem'})`
        }}
      >
        {children}
      </main>
    </div>
  );
}
