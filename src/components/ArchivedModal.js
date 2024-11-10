// components/ArchivedModal.js
"use client";

import { useEffect } from "react";
import StudentCard from "./StudentCard";

export default function ArchivedModal({ visible, onClose, archivedStudents, restoreStudent }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!visible) return null;

  const handleClickOutside = (e) => {
    if (e.target.id === "modal-background") onClose();
  };

  return (
    <div
      id="modal-background"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClickOutside}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg overflow-auto max-h-[80vh] w-[80vw]">
        <h2 className="text-xl text-gray-800 font-semibold mb-4">Estudiantes Archivados</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,200px))] gap-4 justify-center">
          {archivedStudents.map((student) => (
            <StudentCard
              key={student.matricula}
              student={student}
              studentsData={[]}
              onClick={() => restoreStudent(student.matricula)}
              onDelete={null} 
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}