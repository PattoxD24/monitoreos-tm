// Convierte "7:00" → 420, "09:30" → 570
function timeToMinutes(t) {
  if (!t) return 0;
  const parts = t.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function overlaps(a, b) {
  const aStart = timeToMinutes(a.start);
  const aEnd = timeToMinutes(a.end);
  const bStart = timeToMinutes(b.start);
  const bEnd = timeToMinutes(b.end);
  return aStart < bEnd && bStart < aEnd;
}

function getHorario(seccion, dia) {
  if (seccion.horarios && seccion.horarios[dia]) return seccion.horarios[dia];
  return seccion.horario;
}

function hasTimeConflict(seccion, usedSlots) {
  for (const dia of seccion.dias) {
    const h = getHorario(seccion, dia);
    for (const slot of usedSlots) {
      if (slot.dia === dia && overlaps(h, slot)) return true;
    }
  }
  return false;
}

function sumHours(plan) {
  return plan.reduce((acc, m) => acc + m.hrs, 0);
}

function isFlexAndExceedsLimit(seccion, plan) {
  if (seccion.modalidad !== 'flex') return false;
  const flexCount = plan.filter(m => m.modalidad === 'flex').length;
  return flexCount >= 2;
}

function scorePlan(plan) {
  let score = 0;
  score += plan.length * 10;
  const uniqueGroups = new Set(plan.map(m => m.grupo)).size;
  score -= uniqueGroups * 2;
  score += plan.filter(m => m.disponibilidad > 5).length * 3;
  score -= sumHours(plan) > 25 ? (sumHours(plan) - 25) : 0;
  return score;
}

function getWarnings(plan, allSecciones) {
  const warnings = [];
  for (const materia of plan) {
    if (materia.disponibilidad <= 0) {
      const otherGroups = allSecciones
        .filter(s => s.clave === materia.clave && s.grupo !== materia.grupo && s.disponibilidad > 0)
        .map(s => s.grupo);
      if (otherGroups.length > 0) {
        warnings.push(`${materia.materia}: grupo ${materia.grupo} sin cupo, pero hay cupo en grupo(s) ${otherGroups.join(', ')}`);
      } else {
        warnings.push(`${materia.materia} sin disponibilidad en ningún grupo (cupo agotado en grupos ${allSecciones.filter(s => s.clave === materia.clave).map(s => s.grupo).join(', ')})`);
      }
    }
  }
  return warnings;
}

export function generateSchedulePlans(availableSubjects, oferta, options = {}) {
  const maxPlans = options.maxPlans || 5;
  const maxMaterias = options.maxMaterias || 7;
  const maxHoras = options.maxHoras || 29;
  const preferredGrupo = options.preferredGrupo;

  if (!availableSubjects.length || !oferta.length) return [];

  // Construir mapa: curriculumCode → availableSubject
  const availMap = {};
  availableSubjects.forEach(s => { availMap[s.code] = s; });

  // Armar índice de búsqueda: curriculumCode y fallback por nombre
  const searchIndex = {};
  availableSubjects.forEach(s => {
    searchIndex[s.code] = s;
  });

  const byMateria = {};
  oferta.forEach(seccion => {
    // Determinar curriculumCode del offering item
    let curCode = seccion.curriculumCode;
    if (!curCode || !searchIndex[curCode]) {
      // Fallback: buscar por nombre entre availableSubjects
      const lowerMateria = seccion.materia.replace(/\s*\(.*?\)\s*/g, '').toLowerCase();
      const found = availableSubjects.find(s => {
        const es = s.name.es.toLowerCase();
        const check = (name) => {
          const idx = lowerMateria.indexOf(name);
          if (idx === -1) return false;
          const nextChar = lowerMateria[idx + name.length];
          if (nextChar && /[a-záéíóú]/i.test(nextChar)) return false;
          return true;
        };
        return check(es);
      });
      if (found) curCode = found.code;
    }

    if (!curCode || !searchIndex[curCode]) return;
    if (searchIndex[curCode].done) return;

    if (!byMateria[curCode]) byMateria[curCode] = [];
    byMateria[curCode].push(seccion);
  });

  const materiaKeys = Object.keys(byMateria);
  if (materiaKeys.length === 0) return [];

  // Materias que tienen secciones del grupo preferido (para la fase prioritaria)
  const hasPreferredByCode = {};
  if (preferredGrupo) {
    materiaKeys.forEach(code => {
      hasPreferredByCode[code] = byMateria[code].some(s => s.grupo === preferredGrupo);
    });
  }

  const plans = [];
  const seen = new Set();

  function planSignature(materias) {
    return materias.map(m => `${m.clave}|${m.grupo}`).sort().join(';');
  }

  function pushPlan(currentPlan, hours) {
    const sig = planSignature(currentPlan);
    if (seen.has(sig)) return;
    seen.add(sig);
    plans.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      materias: currentPlan.map(m => ({ ...m })),
      totalHoras: hours,
      warnings: getWarnings(currentPlan, oferta),
      score: scorePlan(currentPlan),
      usesPreferred: preferredGrupo ? currentPlan.some(m => m.grupo === preferredGrupo) : false,
    });
  }

  function backtrack(currentPlan, remainingCodes, usedSlots, preferredOnly) {
    if (plans.length >= maxPlans) return;

    const hours = sumHours(currentPlan);

    if (currentPlan.length >= 2) {
      pushPlan(currentPlan, hours);
    }

    if (currentPlan.length >= maxMaterias || hours >= maxHoras) return;

    for (let i = 0; i < remainingCodes.length; i++) {
      const code = remainingCodes[i];
      let secciones = byMateria[code];

      // Fase prioritaria: si la materia tiene el grupo preferido, solo probar ese grupo
      if (preferredOnly && preferredGrupo && hasPreferredByCode[code]) {
        secciones = secciones.filter(s => s.grupo === preferredGrupo);
      } else if (preferredGrupo) {
        // En fase normal, explorar primero las secciones del grupo preferido
        secciones = secciones.slice().sort((a, b) => {
          const aPref = a.grupo === preferredGrupo ? 1 : 0;
          const bPref = b.grupo === preferredGrupo ? 1 : 0;
          return bPref - aPref;
        });
      }

      const newRemaining = [...remainingCodes];
      newRemaining.splice(i, 1);

      for (const seccion of secciones) {
        if (isFlexAndExceedsLimit(seccion, currentPlan)) continue;
        if (hasTimeConflict(seccion, usedSlots)) continue;

        const newSlots = [];
        for (const dia of seccion.dias) {
          const h = getHorario(seccion, dia);
          newSlots.push({ dia, start: h.start, end: h.end });
        }

        currentPlan.push(seccion);
        backtrack(currentPlan, newRemaining, [...usedSlots, ...newSlots], preferredOnly);
        currentPlan.pop();

        if (plans.length >= maxPlans) return;
      }
    }
  }

  // Fase 1: planes que priorizan el grupo seleccionado
  if (preferredGrupo) {
    backtrack([], materiaKeys, [], true);
  }
  // Fase 2: completar con planes normales
  if (plans.length < maxPlans) {
    backtrack([], materiaKeys, [], false);
  }

  return plans
    .sort((a, b) => {
      if (preferredGrupo && a.usesPreferred !== b.usesPreferred) {
        return (b.usesPreferred ? 1 : 0) - (a.usesPreferred ? 1 : 0);
      }
      return b.score - a.score || b.materias.length - a.materias.length;
    })
    .slice(0, maxPlans);
}
