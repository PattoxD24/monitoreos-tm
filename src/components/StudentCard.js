// components/StudentCard.js

export default function StudentCard({ student, onClick, onDelete }) {
  return (
    <div
      onClick={() => onClick(student)}
      className="relative cursor-pointer p-4 border rounded-lg shadow hover:shadow-lg transition"
      style={{ backgroundColor: student.backgroundColor }} // Aplicar el color de fondo
    >
      <h2 className="text-lg font-bold text-grey-600">{student.matricula}</h2>
      <p className="text-sm font-semibold text-blue-600">{student.preferredName}</p>
      <p className="text-sm text-gray-700">{student.fullName}</p>
      
      {/* Botón de eliminar */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Evita que el clic en el botón abra el modal
          onDelete(student.matricula);
        }}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
      >
        ✕
      </button>
    </div>
  );
}