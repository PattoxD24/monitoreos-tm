// components/SearchBar.js

export default function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="mb-4 w-full">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por matrícula, nombre preferido o nombre completo"
        className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:border-blue-500 text-gray-700"
      />
    </div>
  );
}