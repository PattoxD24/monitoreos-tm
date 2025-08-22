"use client";

import { useState, useEffect } from "react";

/**
 * Simple access gate requiring a single code before rendering the app.
 * Usage: set NEXT_PUBLIC_ACCESS_CODE in .env.local (recommended) or edit FALLBACK_CODE below.
 */
const FALLBACK_CODE = "12345"; // Cambia este valor o usa la variable de entorno
const STORAGE_KEY = "monitoreos_access_granted";

export default function AccessGate({ children }) {
  const [enteredCode, setEnteredCode] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  const VALID_CODE = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_ACCESS_CODE || FALLBACK_CODE) : FALLBACK_CODE;

  useEffect(() => {
    try {
      const flag = localStorage.getItem(STORAGE_KEY);
      if (flag === "true") setAuthorized(true);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (enteredCode.trim() === VALID_CODE) {
      setAuthorized(true);
      setError("");
      try { localStorage.setItem(STORAGE_KEY, "true"); } catch (e) {}
    } else {
      setError("Código incorrecto");
    }
  };

  const handleLogout = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    setAuthorized(false);
    setEnteredCode("");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-4 border border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 text-center">Acceso Restringido</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center">Ingresa el código de acceso para continuar.</p>
          <input
            type="password"
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Código"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value)}
            autoFocus
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
          >
            Entrar
          </button>
          <div className="text-[10px] text-center text-gray-400">Protegido con código local</div>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-2 right-2 z-50">
        <button
          onClick={handleLogout}
          className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded shadow text-gray-700 dark:text-gray-200"
        >
          Salir
        </button>
      </div>
      {children}
    </>
  );
}
