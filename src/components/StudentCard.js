// components/StudentCard.js

export default function StudentCard({ student, onClick }) {
  return (
    <div
      onClick={() => onClick(student)}
      className="cursor-pointer p-4 border rounded-lg shadow hover:shadow-lg transition"
    >
      <h2 className="text-lg font-bold">{student.matricula}</h2>
      <p className="text-sm font-semibold text-blue-600">{student.preferredName}</p>
      <p className="text-sm text-gray-700">{student.fullName}</p>
    </div>
  );
}