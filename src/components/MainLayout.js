"use client";

import { useState, useEffect } from 'react';
import SidebarNav from './SidebarNav';

export default function MainLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Esta función será expuesta para que SidebarNav pueda actualizar el estado
  const updateSidebarState = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  };
  
  // Cargar el estado del sidebar al inicio
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-800">
      <SidebarNav onToggle={updateSidebarState} initialState={sidebarCollapsed} />
      
      <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {children}
      </main>
    </div>
  );
}
