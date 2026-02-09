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
