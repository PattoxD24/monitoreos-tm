import React, { useState } from "react";
import SearchBar from "./SearchBar";

export default function SortAndFilterControls({
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  toggleSortDirection,
  isAscending,
  uniqueTeachers = [],
  uniqueGroups = [],
  selectedTeacher,
  setSelectedTeacher,
  selectedGroup,
  setSelectedGroup,
}) {
  const [teacherSearch, setTeacherSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [showTeacherOptions, setShowTeacherOptions] = useState(false);
  const [showGroupOptions, setShowGroupOptions] = useState(false);

  const filteredTeachers = Array.isArray(uniqueTeachers) 
    ? uniqueTeachers.filter(teacher =>
        teacher?.toLowerCase().includes(teacherSearch.toLowerCase())
      )
    : [];

  const filteredGroups = Array.isArray(uniqueGroups)
    ? uniqueGroups.filter(group =>
        group?.toString().includes(groupSearch)
      )
    : [];

  const handleClickOutside = () => {
    setTimeout(() => {
      setShowTeacherOptions(false);
      setShowGroupOptions(false);
    }, 200);
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
      {/* Filtro de Profesor */}
      <div className="relative">
        <input
          type="text"
          value={teacherSearch}
          onChange={(e) => {
            setTeacherSearch(e.target.value);
            setShowTeacherOptions(true);
          }}
          onFocus={() => setShowTeacherOptions(true)}
          onBlur={handleClickOutside}
          placeholder="Buscar profesor..."
          className="border rounded-lg p-2 text-gray-700"
        />
        {showTeacherOptions && filteredTeachers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto text-gray-700">
            <div
              className="p-2 hover:bg-gray-100 cursor-pointer text-gray-500"
              onClick={() => {
                setSelectedTeacher("");
                setTeacherSearch("");
                setShowTeacherOptions(false);
              }}
            >
              Mostrar todos
            </div>
            {filteredTeachers.map((teacher, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedTeacher(teacher);
                  setTeacherSearch(teacher);
                  setShowTeacherOptions(false);
                }}
              >
                {teacher}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtro de Grupo */}
      <div className="relative">
        <input
          type="text"
          value={groupSearch}
          onChange={(e) => {
            setGroupSearch(e.target.value);
            setShowGroupOptions(true);
          }}
          onFocus={() => setShowGroupOptions(true)}
          onBlur={handleClickOutside}
          placeholder="Buscar grupo..."
          className="border rounded-lg p-2 text-gray-700"
        />
        {showGroupOptions && filteredGroups.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto text-gray-700">
            <div
              className="p-2 hover:bg-gray-100 cursor-pointer text-gray-700"
              onClick={() => {
                setSelectedGroup("");
                setGroupSearch("");
                setShowGroupOptions(false);
              }}
            >
              Mostrar todos
            </div>
            {filteredGroups.map((group, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedGroup(group);
                  setGroupSearch(group);
                  setShowGroupOptions(false);
                }}
              >
                {group}
              </div>
            ))}
          </div>
        )}
      </div>

      <select
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="border rounded-lg p-2 text-gray-700"
      >
        <option value="original">Orden original</option>
        <option value="matricula">Matrícula</option>
        <option value="nombre">Nombre</option>
      </select>

      <button
        onClick={toggleSortDirection}
        className="p-2 border rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
      >
        {isAscending ? "Ascendente" : "Descendente"}
      </button>
    </div>
  );
}