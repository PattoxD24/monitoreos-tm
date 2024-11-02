import React from "react";
import SearchBar from "./SearchBar";

export default function SortAndFilterControls({
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  toggleSortDirection,
  isAscending,
}) {

  // const handleSortChange = (e) => setSortOrder(e.target.value);
  return (
    <div className="mt-4">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <select
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="border rounded-lg p-2 text-gray-700 ml-2"
      >
        <option value="original">Orden original</option>
        <option value="matricula">Matrícula</option>
        <option value="nombre">Nombre</option>
      </select>
      <button
        onClick={toggleSortDirection}
        className="p-2 border rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 ml-2"
      >
        {isAscending ? "Ascendente" : "Descendente"}
      </button>
    </div>
  );
}