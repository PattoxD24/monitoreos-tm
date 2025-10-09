"use client";
import React, { useMemo, useState, useEffect } from 'react';
import useStudentData from '@/hooks/useStudentData';

// Helper para obtener un campo usando alias
const getField = (row, candidates = []) => {
  for (const key of candidates) {
    if (row && row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return '';
};

// Días (incluimos variantes completas provenientes de la hoja "Horario")
const DAY_KEYS = [
  { label: 'Dom',   keys: ['Dom','D','Domingo'] },
  { label: 'Lun',   keys: ['Lun','Lu','Lunes'] },
  { label: 'Mar',   keys: ['Mar','Ma','Martes'] },
  { label: 'Mier',  keys: ['Mier','Mi','Mie','Miércoles','Miercoles'] },
  { label: 'Jue',   keys: ['Jue','Ju','Jueves'] },
  { label: 'Vier',  keys: ['Vier','Vi','Vie','Viernes'] },
  { label: 'Sáb',   keys: ['Sáb','Sab','Sa','Sáb.','Sabado','Sábado'] }
];

const hasClassValue = (value) => {
  if (!value) return false;
  const v = value.toString().trim().toLowerCase();
  return v !== '' && !['no','0','false','-'].includes(v);
};

const subjectColor = (name) => {
  if (!name) return '#64748b';
  let hash = 0; for (let i=0;i<name.length;i++) hash = name.charCodeAt(i) + ((hash<<5)-hash);
  const h = hash % 360;
  return `hsl(${h},70%,55%)`;
};

// Normalizador para comparar (ignora mayúsculas, espacios múltiples y acentos)
const normalize = (str='') => str
  .toString()
  .trim()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu,'')
  .replace(/\s+/g,' ')
  .toLowerCase();

export default function WeeklySchedule({ embedded = false }) {
  const defaultColumns = {};
  const { filteredData, studentData, scheduleRows } = useStudentData(defaultColumns);
  // Modo de filtro: 'profesor' o 'alumno'
  const [filterMode, setFilterMode] = useState('alumno');
  // Selección por profesor (nombre exacto)
  const [selectedProfessor, setSelectedProfessor] = useState('');
  // Selección por alumno
  const [selectedStudentMatricula, setSelectedStudentMatricula] = useState('');
  const [selectedStudentSubject, setSelectedStudentSubject] = useState('ALL'); // ALL o clave materia||profesor
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('calendar');
  // UI estados para buscador de profesor estilo principal
  const [professorSearch, setProfessorSearch] = useState('');
  const [showProfessorOptions, setShowProfessorOptions] = useState(false);
  // UI estados para buscador de alumno
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentOptions, setShowStudentOptions] = useState(false);

  // Parse hora
  const parseTime = (raw) => {
    if (!raw) return null;
    let s = raw.toString().trim().replace(/\./g, ':');
    if (s === '') return null;
    if (/^\d{3,4}$/.test(s)) { if (s.length===3) s='0'+s; s = s.slice(0,2)+':'+s.slice(2);} 
    const m = s.match(/^(\d{1,2}):(\d{2})$/); if (!m) return null;
    const h = +m[1], min = +m[2];
    if (h>23 || min>59) return null;
    return h + min/60;
  };

  // Materias únicas (primera fila como base, pero guardo todas en rawRows)
  // Construir scheduleData desde la hoja Horario (base) relacionando con monitoreo vía (# Grupo, Nombre de la materia, Nombre del profesor)
  const scheduleData = useMemo(()=>{
    if(!scheduleRows || scheduleRows.length===0) return [];
    // Mapa (materiaNorm|profesorNorm|grupoNorm) -> Set(matriculas)
    const assignmentMap = new Map();
    Object.entries(filteredData||{}).forEach(([matricula, rows]) => {
      rows.forEach(r => {
        const materia = normalize(getField(r,['Nombre de la materia','Materia','Nombre Materia','Asignatura']));
        if(!materia) return;
        const profesor = normalize(getField(r,['Nombre del profesor','Profesor','Docente','Maestro']));
        const grupo = normalize((r['# Grupo']||'').toString());
        const key = `${materia}|${profesor}|${grupo}`;
        if(!assignmentMap.has(key)) assignmentMap.set(key,new Set());
        assignmentMap.get(key).add(matricula);
      });
    });

    const map = new Map();
    scheduleRows.forEach(row => {
      if(!row) return;
      const grupo = (row['Número grupo'] || row['Numero grupo'] || row['Número grupo'] || row['Núm grupo'] || row['Num grupo'] || row['# Grupo'] || '').toString().trim();
      const materiaLarga = (row['Nombre largo materia'] || row['Nombre de la materia'] || row['Nombre materia'] || '').toString().trim();
      const profesorCompleto = (row['Nombre completo profesor'] || row['Nombre del profesor'] || row['Profesor'] || '').toString().trim();
      const horaInicio = row['Hora inicio clase'] || row['Hora inicio'] || row['Hora inicio Clase'];
      const horaFin = row['Hora fin clase'] || row['Hora fin'] || row['Hora fin Clase'];
      const edificioVal = (row['Edificio'] || row['Edif'] || row['Edif.'] || row['Building'] || '').toString().trim();
      const salonVal = (row['Salón'] || row['Salon'] || row['Aula'] || row['Sala'] || row['Room'] || '').toString().trim();
      if(!materiaLarga || !horaInicio || !horaFin) return;

      const key = `${materiaLarga}||${profesorCompleto}||${grupo}`;
      if(!map.has(key)){
        const days = DAY_KEYS.reduce((acc,d)=>{
          let rawDayVal = '';
          for(const k of d.keys){
            if(row[k] !== undefined && row[k] !== '') { rawDayVal = row[k]; break; }
          }
          acc[d.label] = hasClassValue(rawDayVal) ? 'Si' : '';
          return acc;
        },{});
        const lookupKey = `${normalize(materiaLarga)}|${normalize(profesorCompleto)}|${normalize(grupo)}`;
        const matriculas = assignmentMap.get(lookupKey) ? Array.from(assignmentMap.get(lookupKey)) : [];
        map.set(key, {
          materiaKey:key,
            materia:materiaLarga,
            profesor:profesorCompleto,
            grupo,
            inicio:horaInicio,
            fin:horaFin,
            edificio:edificioVal,
            salon:salonVal,
            days,
            rawRows:[row],
            matriculas
        });
      } else {
        const curr = map.get(key);
        curr.rawRows.push(row);
        // Si faltan, toma el primer valor no vacío que aparezca en filas subsecuentes
        if ((!curr.edificio || curr.edificio.trim()==='') && edificioVal) curr.edificio = edificioVal;
        if ((!curr.salon || curr.salon.trim()==='') && salonVal) curr.salon = salonVal;
      }
    });

    return Array.from(map.values()).sort((a,b)=> a.materia.localeCompare(b.materia) || a.profesor.localeCompare(b.profesor));
  },[scheduleRows, filteredData]);

  // Datos de materias sólo del alumno seleccionado
  // Materias del alumno (filtrando scheduleData por presencia de la matrícula en la asignación derivada)
  const studentScheduleData = useMemo(()=>{
    if(!selectedStudentMatricula) return [];
    return scheduleData.filter(s => (s.matriculas||[]).includes(selectedStudentMatricula));
  },[scheduleData, selectedStudentMatricula]);

  const calendarEvents = useMemo(() => {
    const events = [];
    scheduleData.forEach(subject => {
      subject.rawRows.forEach(row => {
        const inicio = row['Hora inicio clase'] || row['Hora inicio'] || row['Hora inicio Clase'] || subject.inicio;
        const fin = row['Hora fin clase'] || row['Hora fin'] || row['Hora fin Clase'] || subject.fin;
        const start = parseTime(inicio);
        const end = parseTime(fin);
        if(start===null || end===null || end<=start) return;
        DAY_KEYS.forEach(day => {
          // buscar valor de día en cualquiera de las variantes
            let rawDayVal = '';
            for(const k of day.keys){
              if(row[k] !== undefined && row[k] !== '') { rawDayVal = row[k]; break; }
            }
            if(hasClassValue(rawDayVal)){
              const rowEdificio = (row['Edificio'] || row['Edif'] || row['Edif.'] || row['Building'] || '').toString().trim() || subject.edificio || '';
              const rowSalon = (row['Salón'] || row['Salon'] || row['Aula'] || row['Sala'] || row['Room'] || '').toString().trim() || subject.salon || '';
              events.push({
                day: day.label,
                start,
                end,
                materia: subject.materia,
                materiaKey: subject.materiaKey,
                profesor: subject.profesor,
                grupo: subject.grupo,
                color: subjectColor(subject.materia),
                edificio: rowEdificio,
                salon: rowSalon,
                matriculas: subject.matriculas || []
              });
            }
        });
      });
    });
    return events;
  },[scheduleData]);

  const { minHour, maxHour } = useMemo(() => {
    if (calendarEvents.length === 0) return { minHour: 7, maxHour: 20 };
    let minH = Math.min(...calendarEvents.map(e => Math.floor(e.start)));
    let maxH = Math.max(...calendarEvents.map(e => Math.ceil(e.end)));
    // margen visual superior/inferior
    minH = Math.max(0, Math.min(minH, 7));
    maxH = Math.min(23, Math.max(maxH, 18));
    if (maxH - minH < 6) maxH = Math.min(23, minH + 6);
    return { minHour: minH, maxHour: maxH };
  }, [calendarEvents]);

  const eventsByDay = useMemo(() => {
    const map = {};
    DAY_KEYS.forEach(d => { map[d.label] = []; });
    calendarEvents.forEach(ev => map[ev.day].push(ev));
    Object.values(map).forEach(dayEvents => {
      dayEvents.sort((a,b) => a.start - b.start || b.end - a.end);
      // Fuerza ancho completo: ignoramos columnas
      dayEvents.forEach(ev => { ev._col = 0; ev._colCount = 1; });
    });
    return map;
  }, [calendarEvents]);

  const HOUR_HEIGHT = 60; // px por hora (1 minuto = 1px)
  const hourSlots = useMemo(() => {
    const arr = [];
    for (let h = minHour; h <= maxHour; h++) arr.push(h);
    return arr;
  }, [minHour, maxHour]);
  const totalHeightPx = (maxHour - minHour) * HOUR_HEIGHT;

  const formatTime = (dec) => {
    const h = Math.floor(dec);
    const m = Math.round((dec - h) * 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  // Mapa Profesor -> Set(Materias) para desplegar y buscar por materia
  const professorSubjects = useMemo(()=>{
    const map = new Map();
    scheduleData.forEach(s => {
      const prof = (s.profesor || '').trim();
      const mat = (s.materia || '').trim();
      if(!prof) return;
      if(!map.has(prof)) map.set(prof, new Set());
      if(mat) map.get(prof).add(mat);
    });
    return map;
  },[scheduleData]);

  // Lista única de profesores (ordenada) basada en el mapa anterior
  const professors = useMemo(()=>{
    return Array.from(professorSubjects.keys()).sort((a,b)=>a.localeCompare(b));
  },[professorSubjects]);

  // Manejo de cambios de modo y selección inicial
  useEffect(()=>{
    if(filterMode==='profesor'){
      setSelectedStudentMatricula('');
      setSelectedStudentSubject('ALL');
      if(professors.length>0){
        setSelectedProfessor(prev => {
          if(prev && professors.includes(prev)) return prev;
          return professors[0];
        });
      }
    } else { // alumno
      setSelectedProfessor('');
    }
  },[filterMode, scheduleData, professors]);

  // Auto seleccionar primer alumno si ninguno
  useEffect(()=>{
    if(filterMode==='alumno' && !selectedStudentMatricula && studentData.length>0){
      setSelectedStudentMatricula(studentData[0].matricula);
    }
  },[filterMode, studentData, selectedStudentMatricula]);

  // Reset materias alumno al cambiar de alumno
  useEffect(()=>{
    if(filterMode==='alumno') setSelectedStudentSubject('ALL');
  },[selectedStudentMatricula, filterMode]);

  const filteredSchedule = useMemo(()=>{
    if(filterMode==='profesor'){
      return scheduleData.filter(item => {
        const matchProfessor = !selectedProfessor || item.profesor === selectedProfessor; // si está vacío muestra todos
        const matchSearch = !search || item.materia.toLowerCase().includes(search.toLowerCase()) || (item.profesor || '').toLowerCase().includes(search.toLowerCase());
        return matchProfessor && matchSearch;
      });
    } else { // alumno
      return studentScheduleData.filter(item => {
        const matchSubj = selectedStudentSubject==='ALL' || item.materiaKey === selectedStudentSubject;
        const matchSearch = !search || item.materia.toLowerCase().includes(search.toLowerCase()) || (item.profesor || '').toLowerCase().includes(search.toLowerCase());
        return matchSubj && matchSearch;
      });
    }
  },[filterMode, scheduleData, studentScheduleData, selectedProfessor, selectedStudentSubject, search]);

  const filteredEventsByDay = useMemo(() => {
    if (viewMode !== 'calendar') return eventsByDay;
    const clone = {}; DAY_KEYS.forEach(d => { clone[d.label] = []; });
    DAY_KEYS.forEach(d => {
      clone[d.label] = eventsByDay[d.label].filter(ev => {
          if(filterMode==='profesor'){
            const profMatch = !selectedProfessor || ev.profesor === selectedProfessor; // vacío = todos
            const searchMatch = !search || ev.materia.toLowerCase().includes(search.toLowerCase()) || (ev.profesor||'').toLowerCase().includes(search.toLowerCase());
            return profMatch && searchMatch;
          } else { // alumno
            if(!selectedStudentMatricula) return false;
            const belongs = ev.matriculas && ev.matriculas.includes(selectedStudentMatricula);
            if(!belongs) return false;
            const subjMatch = selectedStudentSubject==='ALL' || ev.materiaKey === selectedStudentSubject;
            const searchMatch = !search || ev.materia.toLowerCase().includes(search.toLowerCase()) || (ev.profesor||'').toLowerCase().includes(search.toLowerCase());
            return subjMatch && searchMatch;
          }
      });
    });
    return clone;
  }, [eventsByDay, selectedProfessor, search, viewMode, filterMode, selectedStudentMatricula, selectedStudentSubject]);

  return (
    <div className={`w-full ${embedded ? '' : 'p-4'}`}>
      {!embedded && <h1 className="text-2xl font-bold mb-4 dark:text-white">Horario Semanal</h1>}
      <div className="flex flex-col lg:flex-row gap-4 mb-4 items-end">
        {/* Selector modo filtro */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium dark:text-gray-200">Filtrar por:</span>
          <div className="inline-flex rounded overflow-hidden border dark:border-gray-700">
            <button onClick={()=>setFilterMode('alumno')} className={`px-3 py-2 text-sm ${filterMode==='alumno' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>Alumno</button>
            <button onClick={()=>setFilterMode('profesor')} className={`px-3 py-2 text-sm ${filterMode==='profesor' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>Profesor</button>
          </div>
        </div>

        {filterMode==='profesor' && (
          <div className="flex-1 min-w-[240px] relative">
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Profesor</label>
            {professors.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 border rounded px-3 py-2">No hay profesores</div>
            ) : (
              <div className="relative" onBlur={()=> setTimeout(()=>setShowProfessorOptions(false),180)} >
                <input
                  type="text"
                  value={professorSearch}
                  onChange={e=>{
                    setProfessorSearch(e.target.value);
                    setShowProfessorOptions(true);
                  }}
                  onFocus={()=> setShowProfessorOptions(true)}
                  placeholder="Buscar profesor o materia..."
                  className="w-full border rounded-lg p-2 pr-8 text-sm text-gray-700 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Botón limpiar y icono lupa */}
                {professorSearch && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Limpiar búsqueda"
                    title="Limpiar"
                    onMouseDown={(e)=> e.preventDefault()}
                    onClick={() => { setProfessorSearch(''); setShowProfessorOptions(true); }}
                  >
                    ✕
                  </button>
                )}
                <span className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
                {showProfessorOptions && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-auto text-sm">
                    <div
                      className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onMouseDown={e=>e.preventDefault()}
                      onClick={()=>{
                        setSelectedProfessor('');
                        setProfessorSearch('');
                        setShowProfessorOptions(false);
                      }}
                    >
                      Mostrar todos
                    </div>
                    {professors
                      .filter(p => {
                        const term = professorSearch.toLowerCase();
                        if(!term) return true;
                        if(p.toLowerCase().includes(term)) return true;
                        const subs = professorSubjects.get(p) || new Set();
                        for(const m of subs){ if(m.toLowerCase().includes(term)) return true; }
                        return false;
                      })
                      .map(p => {
                        const subs = Array.from(professorSubjects.get(p) || []);
                        const maxShow = 3;
                        const shown = subs.slice(0, maxShow);
                        const more = subs.length - shown.length;
                        return (
                          <div
                            key={p}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedProfessor===p ? 'bg-blue-50 dark:bg-blue-600/30' : ''}`}
                            onMouseDown={e=>e.preventDefault()}
                            onClick={()=>{
                              setSelectedProfessor(p);
                              setProfessorSearch(p);
                              setShowProfessorOptions(false);
                            }}
                          >
                            <div className="font-medium">{p}</div>
                            {shown.length>0 && (
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {shown.join(' · ')}{more>0 ? ` +${more}` : ''}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {professors.filter(p => {
                      const term = professorSearch.toLowerCase();
                      if(!term) return true;
                      if(p.toLowerCase().includes(term)) return true;
                      const subs = professorSubjects.get(p) || new Set();
                      for(const m of subs){ if(m.toLowerCase().includes(term)) return true; }
                      return false;
                    }).length===0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">Sin coincidencias</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {filterMode==='alumno' && (
          <>
            <div className="flex-1 min-w-[240px] relative">
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Alumno</label>
              {studentData.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 border rounded px-3 py-2">No hay alumnos</div>
              ) : (
                <div className="relative" onBlur={()=> setTimeout(()=>setShowStudentOptions(false),180)}>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={e=>{
                      setStudentSearch(e.target.value);
                      setShowStudentOptions(true);
                    }}
                    onFocus={()=> setShowStudentOptions(true)}
                    placeholder="Buscar alumno..."
                    className="w-full border rounded-lg p-2 pr-8 text-sm text-gray-700 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Botón limpiar y icono lupa */}
                  {studentSearch && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="Limpiar búsqueda"
                      title="Limpiar"
                      onMouseDown={(e)=> e.preventDefault()}
                      onClick={() => { setStudentSearch(''); setShowStudentOptions(true); }}
                    >
                      ✕
                    </button>
                  )}
                  <span className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
                  {showStudentOptions && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-auto text-sm">
                      {studentData
                        .filter(s => {
                          const term = studentSearch.toLowerCase();
                          if(!term) return true;
                          return s.fullName.toLowerCase().includes(term) || s.matricula.toLowerCase().includes(term);
                        })
                        .map(s => (
                          <div
                            key={s.matricula}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedStudentMatricula===s.matricula ? 'bg-blue-50 dark:bg-blue-600/30' : ''}`}
                            onMouseDown={e=>e.preventDefault()}
                            onClick={()=>{
                              setSelectedStudentMatricula(s.matricula);
                              setStudentSearch(s.fullName);
                              setShowStudentOptions(false);
                            }}
                          >
                            <div className="font-medium">{s.fullName}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{s.matricula}</div>
                          </div>
                        ))}
                      {studentData.filter(s => {
                        const term = studentSearch.toLowerCase();
                        if(!term) return true;
                        return s.fullName.toLowerCase().includes(term) || s.matricula.toLowerCase().includes(term);
                      }).length===0 && (
                        <div className="px-3 py-2 text-xs text-gray-400">Sin coincidencias</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Materia del alumno</label>
              <select value={selectedStudentSubject} onChange={e=>setSelectedStudentSubject(e.target.value)} className="w-full border rounded px-2 py-2 dark:bg-gray-800 dark:text-gray-100">
                <option value="ALL">Todas las materias</option>
                {studentScheduleData.map(s => (
                  <option key={s.materiaKey} value={s.materiaKey}>{s.materia}{s.profesor && ` ( ${s.profesor} )`}</option>
                ))}
              </select>
            </div> */}
          </>
        )}

        {/* <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Buscar</label>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={filterMode==='profesor'?"Materia o palabra clave":"Materia del alumno"} className="w-full border rounded px-2 py-2 dark:bg-gray-800 dark:text-gray-100" />
        </div> */}

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium dark:text-gray-200">Vista:</label>
          <div className="inline-flex rounded overflow-hidden border dark:border-gray-700">
            <button onClick={()=>setViewMode('calendar')} className={`px-3 py-2 text-sm ${viewMode==='calendar' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>Calendario</button>
            <button onClick={()=>setViewMode('table')} className={`px-3 py-2 text-sm ${viewMode==='table' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>Tabla</button>
          </div>
        </div>
      </div>

      {viewMode === 'table' && (
        <>
          <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr className="text-left">
                  <th className="px-3 py-2">Materia</th>
                  <th className="px-3 py-2">Profesor</th>
                  <th className="px-3 py-2">Edificio</th>
                  <th className="px-3 py-2">Salón</th>
                  <th className="px-3 py-2">Inicio</th>
                  <th className="px-3 py-2">Fin</th>
                  {DAY_KEYS.map(day => <th key={day.label} className="px-3 py-2 text-center">{day.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.length === 0 && (
                  <tr><td colSpan={6 + DAY_KEYS.length} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">No hay datos de horario disponibles.</td></tr>
                )}
                {filteredSchedule.map(item => (
                  <tr key={item.materiaKey} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 py-2 font-medium dark:text-gray-100">{item.materia} {item.profesor && <span className="text-xs text-gray-500 dark:text-gray-400">({item.profesor})</span>}</td>
                    <td className="px-3 py-2 dark:text-gray-200">{item.profesor}</td>
                    <td className="px-3 py-2 dark:text-gray-200">{item.edificio}</td>
                    <td className="px-3 py-2 dark:text-gray-200">{item.salon}</td>
                    <td className="px-3 py-2 dark:text-gray-200">{item.inicio}</td>
                    <td className="px-3 py-2 dark:text-gray-200">{item.fin}</td>
                    {DAY_KEYS.map(day => (
                      <td key={day.label} className="px-3 py-2 text-center">{item.days[day.label] && <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded">Si</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3 dark:text-gray-400">Tabla: primera aparición por materia. Usa la vista calendario para múltiples variantes.</p>
        </>
      )}

      {viewMode === 'calendar' && (
        <div className="w-full overflow-x-auto">
          <div className="relative" style={{ height: totalHeightPx + 40 }}>
            {/* Encabezado días (flex para igualar exactamente columnas con el área de eventos) */}
            <div className="absolute top-0 left-60 right-0 h-8 flex z-10">
              {DAY_KEYS.map(d => (
                <div key={d.label} className="flex-1 text-center text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center border-l first:border-l-0 border-gray-300 dark:border-gray-700">
                  {d.label}
                </div>
              ))}
            </div>
            {/* Columna horas */}
            <div className="absolute top-8 left-0 w-60 pr-2" style={{ height: totalHeightPx }}>
              {/* Una sola iteración para las etiquetas de hora y media hora */}
              {hourSlots.map(h => {
                const topBase = (h - minHour) * HOUR_HEIGHT; // inicio del bloque de la hora
                return (
                  <div key={h} className="absolute left-0 w-full" style={{ top: topBase }}>
                    <div
                      className="text-[11px] font-medium text-gray-600 dark:text-gray-400 -translate-y-2 relative"
                    >
                      {String(h).padStart(2,'0')}:00
                    </div>
                    <div
                      className="absolute text-[9px] text-gray-400"
                      style={{ top: (HOUR_HEIGHT / 2) - 6 }}
                    >
                      {String(h).padStart(2,'0')}:30
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Área eventos: mismo flex que encabezado para mantener alineación exacta */}
            <div className="absolute top-8 left-60 right-0 overflow-hidden" style={{ height: totalHeightPx }}>
              {/* Fondo (líneas horizontales) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1px, transparent 1px, transparent ${HOUR_HEIGHT}px),
                                    repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent ${HOUR_HEIGHT/2}px)`
                }}
              />
              {/* Contenedor por día */}
              <div className="flex h-full relative">
                {DAY_KEYS.map((day, dayIdx) => (
                  <div key={day.label} className="relative flex-1 border-l first:border-l-0 border-gray-300 dark:border-gray-700">
                    {filteredEventsByDay[day.label].map(ev => {
                      const startPx = (ev.start - minHour) * 60;
                      const heightPx = (ev.end - ev.start) * 60;
                      const tooltip = `${ev.materia}\nProfesor: ${ev.profesor || 'N/D'}\nHorario: ${formatTime(ev.start)} - ${formatTime(ev.end)}\n${ev.edificio || ''} ${ev.salon || ''}`;
                      return (
                        <div
                          key={`${ev.materiaKey || ev.materia}-${ev.day}-${ev.start}-${ev.end}-${ev.profesor || ''}`}
                          title={tooltip}
                          className="absolute box-border rounded-sm text-[10px] font-semibold flex items-center justify-center text-white shadow-sm"
                          style={{
                            top: startPx,
                            height: heightPx,
                            left: 0,
                            width: '100%',
                            background: ev.color,
                            opacity: 0.93,
                            border: '1px solid rgba(0,0,0,0.25)'
                          }}
                        >
                          <span className="px-1 truncate w-full text-center" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{ev.materia}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 dark:text-gray-400">Calendario: una sola capa de fondo y capa única de eventos, sin columnas repetidas.</p>
        </div>
      )}
    </div>
  );

}
