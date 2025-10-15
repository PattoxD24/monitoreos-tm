// Utilities to calculate automatic prediction max grade and status per subject

// Extract the last completed activity key (e.g., 'A12') based on non-empty values in the row
export function getLastActivity(row) {
  if (!row) return null;
  const activityKeys = Object.keys(row)
    .filter((k) => /^A\d+$/.test(k))
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

  let last = null;
  for (const key of activityKeys) {
    const raw = row[key];
    const value = typeof raw === 'string' ? raw.replace(/\s/g, '') : raw;
    if (value !== undefined && value !== null && value !== '') {
      last = key;
    }
  }
  return last;
}

// Calculate the maximum possible final grade for a subject row, given its ponderation map
// row: monitoring data for one subject of a student (includes A1..An and "Ponderado")
// ponderations: object like { A1: '10a', A2: '5e', ... }
export function calculateMaxPredictionForRow(row, ponderations) {
  if (!row || !ponderations || Object.keys(ponderations).length === 0) {
    // Fallback to current ponderado if no ponderations
    const p = parseFloat(row?.Ponderado);
    return Number.isFinite(p) ? Math.round(p) : 0;
  }

  const lastActivity = getLastActivity(row);
  const lastNum = lastActivity ? parseInt(lastActivity.slice(1)) : 0;

  // Build ordered list of activities existing in ponderations
  const acts = Object.keys(ponderations)
    .filter((k) => /^A\d+$/.test(k))
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

  let completedSum = 0;
  let maxFutureSum = 0;

  for (const act of acts) {
    const weight = parseFloat(ponderations[act]) || 0;
    const num = parseInt(act.slice(1));
    const raw = row[act];
    const str = typeof raw === 'string' ? raw.replace(/\s/g, '') : raw;

    if (num <= lastNum) {
      // Treat numeric grades; non-numeric entries (NE, SD, NP, SC, DA) count as 0 earned
      const grade = Math.round(parseFloat(str)) || 0;
      completedSum += (grade * weight) / 100;
    } else {
      // Future activities: assume 100 for max prediction
      maxFutureSum += (100 * weight) / 100;
    }
  }

  return Math.round(completedSum + maxFutureSum);
}

// Detect special flags in a subject row
export function detectFlags(row) {
  const values = Object.values(row || {}).map((v) => (typeof v === 'string' ? v.replace(/\s/g, '') : v));
  const hasNP = values.includes('NP') || row?.Ponderado === 'NP';
  const hasSD = values.includes('SD');
  const hasDA = values.includes('DA');
  return { hasNP, hasSD, hasDA };
}

// Compute status for a subject using prediction and business rules
// Returns { statusText, reason, maxPrediction }
export function computeSubjectStatus(row, ponderations) {
  const nombreMateria = row?.['Nombre de la materia'];

  const ponderadoNumerico = parseFloat(row?.Ponderado) || 0;
  const faltasAlumno = parseFloat(row?.['Faltas del alumno']) || 0;
  const limiteFaltas = parseFloat(row?.['Límite de faltas']) || 1;
  const porcentajeFaltas = (faltasAlumno / limiteFaltas) * 100;
  const neAlumno = parseFloat(row?.['NE alumno']) || 0;
  const limiteNE = parseFloat(row?.['Límite de NE']) || 1;
  const porcentajeNE = (neAlumno / limiteNE) * 100;

  const { hasNP, hasSD, hasDA } = detectFlags(row);

  if (hasNP) {
    return { statusText: 'NP', reason: 'Tiene NP en alguna actividad', maxPrediction: 0 };
  }

  if (porcentajeFaltas > 100 || porcentajeNE > 100) {
    return { statusText: 'Recursar', reason: 'Excedió límites de faltas o NE', maxPrediction: 0 };
  }

  const maxPrediction = calculateMaxPredictionForRow(row, ponderations);

  // If even with perfect future scores cannot reach 70, will recursar
  if (maxPrediction < 70) {
    return { statusText: 'Recursar', reason: 'Predicción máxima < 70', maxPrediction };
  }

  // Window for extraordinario: between 50 and 69.9, only if has derecho (no SD, no DA)
  if (maxPrediction >= 50 && maxPrediction < 70) {
    if (hasSD || hasDA || ponderadoNumerico < 50) {
      return { statusText: 'Recursar', reason: 'Sin derecho a extraordinario', maxPrediction };
    }
    return { statusText: 'Extraordinario', reason: 'Predicción máxima permite extraordinario', maxPrediction };
  }

  // Otherwise, not recursar; mark peligro if indicators are high
  if (porcentajeFaltas >= 80 || porcentajeNE >= 80 || ponderadoNumerico < 70) {
    return { statusText: 'Peligro', reason: 'Indicadores altos (faltas/NE/ponderado)', maxPrediction };
  }

  return { statusText: 'OK', reason: 'Sin riesgo', maxPrediction };
}
