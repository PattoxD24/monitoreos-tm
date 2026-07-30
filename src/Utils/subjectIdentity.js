import { SUBJECTS } from './Subjects';

// Subject identity helpers (prefer "Clave de materia" over subject name)

const toTrimmedString = (value) => {
  if (value === undefined || value === null) return '';
  const str = typeof value === 'string' ? value : String(value);
  return str.trim();
};

const getFieldInsensitive = (row, candidateKeysLower = []) => {
  if (!row || typeof row !== 'object') return '';
  const keyMap = Object.keys(row).reduce((acc, key) => {
    acc[key.toLowerCase()] = key;
    return acc;
  }, {});

  for (const candLower of candidateKeysLower) {
    const realKey = keyMap[candLower];
    if (!realKey) continue;
    const value = toTrimmedString(row[realKey]);
    if (value !== '') return value;
  }

  return '';
};

export const getSubjectKeyFromRow = (row) => {
  // Prefer: "Clave de materia" (monitoreos file)
  return getFieldInsensitive(row, [
    'clave de materia',
    'clave materia',
    'clave de la materia',
    'cve materia',
    'cve de materia',
    'codigo de materia',
    'código de materia',
    'codigo materia',
    'código materia',
  ]);
};

export const getSubjectNameFromRow = (row) => {
  return getFieldInsensitive(row, [
    'nombre de la materia',
    'nombre materia',
    'materia',
    'asignatura',
  ]);
};

export const getPonderationsForRow = (row, ponderationData) => {
  if (!ponderationData || typeof ponderationData !== 'object') return {};

  const subjectKey = getSubjectKeyFromRow(row);
  if (subjectKey && ponderationData[subjectKey]) return ponderationData[subjectKey];

  const subjectName = getSubjectNameFromRow(row);
  if (subjectName && ponderationData[subjectName]) return ponderationData[subjectName];

  // Try trimmed variants just in case
  if (subjectKey) {
    const t = toTrimmedString(subjectKey);
    if (t && ponderationData[t]) return ponderationData[t];
  }
  if (subjectName) {
    const t = toTrimmedString(subjectName);
    if (t && ponderationData[t]) return ponderationData[t];
  }

  return {};
};

export const getPlanDeEstudiosFromRow = (row) => {
  return getFieldInsensitive(row, [
    'clave plan de estudios',
    'plan de estudios',
    'clave del plan de estudios',
    'cve plan',
    'plan',
  ]);
};

export const getSubjectSemester = (subjectName) => {
  if (!subjectName) return null;
  const lower = subjectName.replace(/\s*\(.*?\)\s*/g, '').toLowerCase();
  const matched = SUBJECTS.subjects.find((s) => {
    const es = s.name.es.toLowerCase();
    const en = s.name.en?.toLowerCase() || '';
    const check = (name) => {
      const idx = lower.indexOf(name);
      if (idx === -1) return false;
      const nextChar = lower[idx + name.length];
      if (nextChar && /[a-záéíóú]/i.test(nextChar)) return false;
      return true;
    };
    return check(es) || (en && check(en));
  });
  return matched ? matched.semester : null;
};

export const getSubjectSemesterFromRow = (row) => {
  // 1. Intentar por clave de materia
  const clave = getSubjectKeyFromRow(row);
  if (clave) {
    const byCode = SUBJECTS.subjects.find(s => {
      const allCodes = s.codes || [s.code];
      return allCodes.includes(clave) || s.curriculumCode === clave;
    });
    if (byCode) return byCode.semester;
  }
  // 2. Fallback por nombre
  const name = getSubjectNameFromRow(row);
  return name ? getSubjectSemester(name) : null;
};

export const inferStudentSemester = (studentSubjects) => {
  if (!studentSubjects || studentSubjects.length === 0) return null;

  // Agrupar por clave/nombre para contar cada materia una sola vez (ignorando repeticiones)
  const seen = new Set();
  const semesterCount = {};
  const semesters = new Set();

  studentSubjects.forEach((subject) => {
    const clave = getSubjectKeyFromRow(subject);
    const name = getSubjectNameFromRow(subject);
    const key = clave || name;
    if (!key || seen.has(key)) return;
    seen.add(key);

    const semester = getSubjectSemesterFromRow(subject);
    if (semester) {
      semesters.add(semester);
      semesterCount[semester] = (semesterCount[semester] || 0) + 1;
    }
  });

  if (semesters.size === 0) return null;

  let modeSemester = 0;
  let maxCount = 0;
  let maxSemester = 0;

  for (const [sem, count] of Object.entries(semesterCount)) {
    const semNum = parseInt(sem);
    if (count > maxCount) {
      maxCount = count;
      modeSemester = semNum;
    }
    if (semNum > maxSemester) maxSemester = semNum;
  }

  // Si el semestre más alto tiene solo 1 materia y hay otro con más, usar el de mayoría
  const currentSemester = (maxSemester > modeSemester && semesterCount[maxSemester] <= 1 && maxCount >= 2)
    ? modeSemester
    : maxSemester;

  return {
    maxSemester: currentSemester,
    semesters: Array.from(semesters).sort((a, b) => a - b),
    semesterCount,
  };
};
