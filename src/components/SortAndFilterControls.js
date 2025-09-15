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
  uniqueSubjects = [],
  uniqueTutors = [],
  selectedTeacher,
  setSelectedTeacher,
  selectedGroup,
  setSelectedGroup,
  selectedSubject,
  setSelectedSubject,
  selectedTutor,
  setSelectedTutor,
}) {
  const [teacherSearch, setTeacherSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [showTeacherOptions, setShowTeacherOptions] = useState(false);
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const [showSubjectOptions, setShowSubjectOptions] = useState(false);
  const [tutorSearch, setTutorSearch] = useState("");
  const [showTutorOptions, setShowTutorOptions] = useState(false);

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

  const filteredSubjects = Array.isArray(uniqueSubjects)
    ? uniqueSubjects.filter(subject =>
        subject?.toString().includes(subjectSearch)
      )
    : [];

  const filteredTutors = Array.isArray(uniqueTutors)
    ? uniqueTutors.filter(tutor =>
        tutor?.toLowerCase().includes(tutorSearch.toLowerCase())
      )
    : [];

  const handleClickOutside = () => {
    setTimeout(() => {
      setShowTeacherOptions(false);
      setShowGroupOptions(false);
      setShowSubjectOptions(false);
      setShowTutorOptions(false);
    }, 200);
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Filtro de Materia */}
      <div className="relative">
        <input
          type="text"
          value={subjectSearch}
          onChange={(e) => {
            setSubjectSearch(e.target.value);
            setShowSubjectOptions(true);
          }}
          onFocus={() => setShowSubjectOptions(true)}
          onBlur={handleClickOutside}
          placeholder="Buscar materia..."
          className="border rounded-lg p-2 text-gray-700"
        />
        {showSubjectOptions && filteredSubjects.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto text-gray-700">
            <div
              className="p-2 hover:bg-gray-100 cursor-pointer text-gray-500"
              onClick={() => {
                setSelectedSubject("");
                setSubjectSearch("");
                setShowSubjectOptions(false);
              }}
            >
              Mostrar todos
            </div>
            {filteredSubjects.map((subject, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedSubject(subject);
                  setSubjectSearch(subject);
                  setShowSubjectOptions(false);
                }}
              >
                {subject}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtro de Tutor */}
      <div className="relative">
        <input
          type="text"
          value={tutorSearch}
          onChange={(e) => {
            setTutorSearch(e.target.value);
            setShowTutorOptions(true);
          }}
          onFocus={() => setShowTutorOptions(true)}
          onBlur={handleClickOutside}
          placeholder="Buscar tutor..."
          className="border rounded-lg p-2 text-gray-700"
        />
        {showTutorOptions && filteredTutors.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto text-gray-700">
            <div
              className="p-2 hover:bg-gray-100 cursor-pointer text-gray-500"
              onClick={() => {
                setSelectedTutor("");
                setTutorSearch("");
                setShowTutorOptions(false);
              }}
            >
              Mostrar todos
            </div>
            {filteredTutors.map((tutor, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedTutor(tutor);
                  setTutorSearch(tutor);
                  setShowTutorOptions(false);
                }}
              >
                {tutor}
              </div>
            ))}
          </div>
        )}
      </div>
      
      
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
        <option value="original">Ponderación</option>
        <option value="matricula">Matrícula</option>
        <option value="nombre">Nombre</option>
        <option value="faltas"># Faltas</option>
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