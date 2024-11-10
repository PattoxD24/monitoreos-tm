import React from "react";
import StudentCard from "./StudentCard";

export default function StudentList({ students, studentsData, openModal, handleDeleteStudent }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] gap-4 mt-8 w-full">
      {students.map((student) => (
        <StudentCard
          key={student.matricula}
          student={student}
          studentsData={studentsData}
          onClick={() => openModal(student)}
          onDelete={handleDeleteStudent}
        />
      ))}
    </div>
  );
}