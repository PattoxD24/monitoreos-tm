"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaAngleLeft, FaAngleRight, FaHome, FaExclamationTriangle, FaBell } from "react-icons/fa";

export default function SidebarNav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const handleToggle = () => setIsCollapsed(!isCollapsed);

  const navLinks = [
    { href: "/", label: "Inicio", icon: <FaHome /> },
    { href: "/riesgo", label: "Alumnos en Riesgo", icon: <FaExclamationTriangle /> },
    { href: "/situacion-critica", label: "Situación Crítica", icon: <FaBell /> }
  ];

  return (
    <div className={`fixed left-0 top-0 h-screen p-4 bg-gray-800 text-white transition-all duration-300 z-20 flex flex-col justify-between ${
      isCollapsed ? "w-16" : "w-64"
    }`}>
      <div>
        <div className="flex justify-between items-center mb-8">
          {!isCollapsed && <h2 className="text-xl font-bold">Monitoreos</h2>}
          <button
            onClick={handleToggle}
            className="text-white hover:text-gray-400 transition"
          >
            {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center rounded p-2 transition-colors ${
                pathname === link.href ? "bg-blue-600" : "hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {!isCollapsed && <span className="ml-3">{link.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}