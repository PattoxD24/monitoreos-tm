"use client";
import React, { useEffect, useState } from 'react';
import WeeklySchedule from '@/components/WeeklySchedule';
import SidebarNav from '@/components/SidebarNav';


export default function HorarioPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const handleSidebarToggle = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  }
  return (
    <div className="flex">
      <SidebarNav onToggle={handleSidebarToggle} />
      <main className={`flex-1 p-4 dark:bg-gray-950 min-h-screen transition-colors ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <WeeklySchedule />
      </main>
    </div>
  );
}
