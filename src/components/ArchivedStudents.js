import React from "react";
import StudentCard from "./StudentCard";

export default function ArchivedStudents({ archivedStudents, restoreStudent }) {
  return (
    archivedStudents.length > 0 && (
      <div className="mt-10 w-full">
        <h2 className="text-xl font-bold mb-4">Archivados</h2>
        <div className="grid grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] gap-4">
          {archivedStudents.map((student) => (
            <StudentCard
              key={student.matricula}
              student={student}
              onClick={() => restoreStudent(student.matricula)}
              onDelete={null} // No acción de eliminación
            />
          ))}
        </div>
      </div>
    )
  );
}