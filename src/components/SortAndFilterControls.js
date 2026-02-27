import React, { useState } from "react";
import SearchBar from "./SearchBar";

export default function SortAndFilterControls({
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  toggleSortDirection,
  isAscending,
  visibleCount = 0,
  uniqueTeachers = [],
  uniqueGroups = [],
  uniqueSubjects = [],
  uniqueTutors = [],
  uniqueScholarships = [],
  uniqueTeams = [],
  selectedTeacher,
  setSelectedTeacher,
  selectedGroup,
  setSelectedGroup,
  selectedSubject,
  setSelectedSubject,
  selectedTutor,
  setSelectedTutor,
  selectedScholarship,
  setSelectedScholarship,
  selectedTeam,
  setSelectedTeam,
  selectedColor,
  setSelectedColor,
}) {
  const [teacherSearch, setTeacherSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [showTeacherOptions, setShowTeacherOptions] = useState(false);
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const [showSubjectOptions, setShowSubjectOptions] = useState(false);
  const [tutorSearch, setTutorSearch] = useState("");
  const [showTutorOptions, setShowTutorOptions] = useState(false);
  const [scholarshipSearch, setScholarshipSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [showScholarshipOptions, setShowScholarshipOptions] = useState(false);
  const [showTeamOptions, setShowTeamOptions] = useState(false);

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

  const filteredScholarships = Array.isArray(uniqueScholarships)
    ? uniqueScholarships.filter((scholarship) =>
        scholarship?.toString().toLowerCase().includes(scholarshipSearch.toLowerCase())
      )
    : [];

  const filteredTeams = Array.isArray(uniqueTeams)
    ? uniqueTeams.filter((team) =>
        team?.toString().toLowerCase().includes(teamSearch.toLowerCase())
      )
    : [];

  const handleClickOutside = () => {
    setTimeout(() => {
      setShowTeacherOptions(false);
      setShowGroupOptions(false);
      setShowSubjectOptions(false);
      setShowTutorOptions(false);
      setShowScholarshipOptions(false);
      setShowTeamOptions(false);
    }, 200);
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Filtro por Color */}
      <select
        value={selectedColor}
        onChange={(e) => setSelectedColor(e.target.value)}
        className="border rounded-lg p-2 text-gray-700"
      >
        <option value="">Todos los colores</option>
        <option value="#FFCCCC" style={{ backgroundColor: '#FFCCCC' }}>🔴 Rojo</option>
        <option value="#FFD9B3" style={{ backgroundColor: '#FFD9B3' }}>🟠 Naranja</option>
        <option value="#FFFFCC" style={{ backgroundColor: '#FFFFCC' }}>🟡 Amarillo</option>
        <option value="#CCFFCC" style={{ backgroundColor: '#CCFFCC' }}>🟢 Verde</option>
        <option value="#E6D3FF" style={{ backgroundColor: '#E6D3FF' }}>🟣 NP</option>
        <option value="#F0F0F0" style={{ backgroundColor: '#F0F0F0' }}>⚪ Sin ponderado</option>
      </select>

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

      {/* Filtro de Beca */}
      <div className="relative">
        <input
          type="text"
          value={scholarshipSearch}
          onChange={(e) => {
            setScholarshipSearch(e.target.value);
            setShowScholarshipOptions(true);
          }}
          onFocus={() => setShowScholarshipOptions(true)}
          onBlur={handleClickOutside}
          placeholder="Buscar beca..."
          className="border rounded-lg p-2 text-gray-700"
        />
        {showScholarshipOptions && filteredScholarships.length > 0 && (
          <div className="absolute z-30 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto text-gray-700">
            <div
              className="p-2 hover:bg-gray-100 cursor-pointer text-gray-500"
              onClick={() => {
                setSelectedScholarship("");
                setScholarshipSearch("");
                setShowScholarshipOptions(false);
              }}
            >
              Mostrar todos
            </div>
            {filteredScholarships.map((scholarship, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedScholarship(scholarship);
                  setScholarshipSearch(scholarship);
                  setShowScholarshipOptions(false);
                }}
              >
                {scholarship}
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

      {/* Filtro Equipo Representativo */}
      <div className="relative">
        <input
          type="text"
          value={teamSearch}
          onChange={(e) => {
            setTeamSearch(e.target.value);
            setShowTeamOptions(true);
          }}
          onFocus={() => setShowTeamOptions(true)}
          onBlur={handleClickOutside}
          placeholder="Buscar equipo..."
          className="border rounded-lg p-2 text-gray-700"
        />
        {showTeamOptions && filteredTeams.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto text-gray-700">
            <div
              className="p-2 hover:bg-gray-100 cursor-pointer text-gray-500"
              onClick={() => {
                setSelectedTeam("");
                setTeamSearch("");
                setShowTeamOptions(false);
              }}
            >
              Mostrar todos
            </div>
            {filteredTeams.map((team, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedTeam(team);
                  setTeamSearch(team);
                  setShowTeamOptions(false);
                }}
              >
                {team}
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

      <div className="flex items-center gap-2">
        <button
          onClick={toggleSortDirection}
          className="p-2 border rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
        >
          {isAscending ? "Ascendente" : "Descendente"}
        </button>
        <span className="px-3 py-2 border rounded-lg bg-white text-sm font-medium text-gray-700">
          Alumno{visibleCount !== 1 ? "s" : ""}: {visibleCount}
        </span>
      </div>
    </div>
  );
}