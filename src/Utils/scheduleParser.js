import * as XLSX from 'xlsx';
import { SUBJECTS } from './Subjects';

const DIAS_MAP = {
  'lunes': 'L', 'martes': 'Ma', 'miércoles': 'Mi', 'miercoles': 'Mi',
  'jueves': 'J', 'viernes': 'V', 'sábado': 'S', 'sabado': 'S',
  'domingo': 'D',
};

function getField(row, ...names) {
  for (const name of names) {
    const v = row[name];
    if (v !== undefined && v !== null && v !== '') return v;
    // case-insensitive
    for (const [k, val] of Object.entries(row)) {
      if (k.toLowerCase() === name.toLowerCase()) return val;
    }
  }
  return '';
}

function matchSubjectByCodeOrName(clave, nombreMateria) {
  if (clave) {
    const byCode = SUBJECTS.subjects.find(s => {
      const allCodes = s.codes || [s.code];
      return allCodes.includes(clave) || s.curriculumCode === clave;
    });
    if (byCode) return byCode;
  }
  if (nombreMateria) {
    const lower = nombreMateria.replace(/\s*\(.*?\)\s*/g, '').toLowerCase();
    const byName = SUBJECTS.subjects.find(s => {
      const es = s.name.es.toLowerCase();
      const en = s.name.en?.toLowerCase() || '';
      const check = (name) => {
        const idx = lower.indexOf(name);
        if (idx === -1) return false;
        const nextChar = lower[idx + name.length];
        if (nextChar && /[a-záéíóú]/i.test(nextChar)) return false;
        return true;
      };
      const checkReverse = (short, long) => {
        const idx = long.indexOf(short);
        if (idx === -1) return false;
        const nextChar = long[idx + short.length];
        if (nextChar && /[a-záéíóú]/i.test(nextChar)) return false;
        return true;
      };
      return check(es) || checkReverse(lower, es) || (en && (check(en) || checkReverse(lower, en)));
    });
    if (byName) return byName;
  }
  return null;
}

export function parseOfertaExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
        const parsed = rows.map(parseGroupRow).filter(Boolean);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsBinaryString(file);
  });
}

function parseGroupRow(row) {
  const clave = String(getField(row,
    'Clave materia', 'Clave', 'clave', 'CLAVE', 'Código materia', 'codigo materia'
  )).trim();

  const materia = String(getField(row,
    'Nombre largo materia', 'Nombre materia', 'Materia',
    'materia', 'MATERIA', 'nombre materia'
  )).trim();

  const grupo = String(getField(row,
    'Número grupo', 'Numero grupo', 'Grupo', 'grupo', 'GRUPO'
  )).trim();

  if (!clave || !materia || !grupo) return null;

  // Buscar materia en el curriculum para obtener semestre y horas
  const curSubject = matchSubjectByCodeOrName(clave, materia);

  // Semestre: primero del curriculum, luego de la fila
  let sem = curSubject ? curSubject.semester : 0;
  const semRaw = getField(row, 'Sem', 'sem', 'Semestre', 'semestre');
  if (semRaw) {
    const parsedSem = parseInt(semRaw, 10);
    if (!isNaN(parsedSem) && parsedSem > 0) sem = parsedSem;
  }

  // Horas: primero del curriculum, luego calculadas de horario, luego de la fila
  let hrs = curSubject ? curSubject.hours : 0;
  const hrsRaw = getField(row, 'Hrs', 'hrs', 'Horas', 'horas');
  if (hrsRaw) {
    const parsedHrs = parseInt(hrsRaw, 10);
    if (!isNaN(parsedHrs) && parsedHrs > 0) hrs = parsedHrs;
  }

  const horaInicio = String(getField(row, 'Hora inicio clase', 'hora inicio clase', 'Hora inicio', 'hora inicio')).trim();
  const horaFin = String(getField(row, 'Hora fin clase', 'hora fin clase', 'Hora fin', 'hora fin')).trim();
  if (!horaInicio || !horaFin) return null;

  const dispRaw = getField(row,
    'Número plazas disponibles', 'Numero plazas disponibles',
    'Plazas disponibles', 'Disponibilidad', 'disponibilidad',
    'disponibles', 'Cupo disponible'
  );
  const disponibilidad = parseInt(dispRaw, 10) || 0;

  const cupoRaw = getField(row,
    'Capacidad grupo', 'Capacidad', 'Cupo', 'cupo', 'CUPO'
  );
  const cupo = parseInt(cupoRaw, 10) || 0;

  const profesor = String(getField(row,
    'Nombre completo profesor', 'Profesor', 'profesor', 'PROFESOR',
    'Nombre profesor', 'nombre profesor'
  )).trim();

  // Días de la semana (buscar columnas con nombres de días)
  const dias = [];
  for (const [key, value] of Object.entries(row)) {
    const keyLower = key.toLowerCase().trim();
    const mapped = DIAS_MAP[keyLower];
    if (mapped && String(value).trim().toUpperCase() === 'SI') {
      dias.push(mapped);
    }
  }

  if (dias.length === 0) return null;

  // Si no tenemos horas calculadas, calcular de horario
  if (hrs === 0 || hrsRaw) {
    // calculate from schedule
    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFin.split(':').map(Number);
    if (!isNaN(h1) && !isNaN(m1) && !isNaN(h2) && !isNaN(m2)) {
      const durationMin = (h2 * 60 + m2) - (h1 * 60 + m1);
      const durationHrs = durationMin / 60;
      hrs = Math.round(dias.length * durationHrs);
    }
  }

  // Modalidad: flex si el grupo empieza con "F"
  const modalidad = grupo.startsWith('F') ? 'flex' : 'regular';

  return {
    clave,
    materia,
    sem,
    hrs: Math.max(hrs, 1),
    grupo,
    dias,
    horario: { start: horaInicio, end: horaFin },
    modalidad,
    disponibilidad,
    cupo,
    profesor,
    curriculumCode: curSubject ? curSubject.code : null,
  };
}
