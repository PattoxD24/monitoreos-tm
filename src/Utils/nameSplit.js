// Name splitting helpers.
// The Base file stores the full name as a single string in the form:
//   NOMBRE(S) APELLIDO PATERNO APELLIDO MATERNO
// (given names first, then surnames), with 2 to 6 words total.
// When the Base export includes separate columns, `override` wins over the heuristic.
// The Monitoreo file carries the same name in the opposite order (surnames first);
// passing it allows cross-aligning both sources to reduce heuristic ambiguity.

const PARTICLES = new Set([
  'DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'DA', 'DAS', 'DI', 'MAC', 'MC',
]);

const toCleanString = (value) => {
  if (value === undefined || value === null) return '';
  const str = typeof value === 'string' ? value : String(value);
  return str.replace(/\s+/g, ' ').trim();
};

// Title-case each word; keep particles lowercase when they appear mid-phrase.
const titleCase = (phrase) => {
  const words = toCleanString(phrase).split(' ');
  return words.map((word, index) => {
    const upper = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    if (index > 0 && PARTICLES.has(word.toUpperCase())) return word.toLowerCase();
    return upper;
  }).join(' ');
};

// Build one surname "phrase" starting at `start`.
// Consumes a leading run of particles followed by a noun (e.g. "DE LA VEGA"),
// and at most one continuation group of particles + noun (e.g. "CABEZA DE VACA",
// "MOYA DE LA TORRE"). Returns { text, next } where `next` is the index after
// the phrase.
const buildSurnamePhrase = (words, start) => {
  const phrase = [];
  let i = start;

  // Leading segment: optional particles then a noun.
  while (i < words.length && PARTICLES.has(words[i])) {
    phrase.push(words[i]);
    i += 1;
  }
  if (i < words.length) {
    phrase.push(words[i]);
    i += 1;
  }

  // One continuation group: particles then a noun ("DE VACA", "DE LA TORRE").
  let sawParticle = false;
  while (i < words.length && PARTICLES.has(words[i])) {
    sawParticle = true;
    phrase.push(words[i]);
    i += 1;
  }
  if (sawParticle && i < words.length) {
    phrase.push(words[i]);
    i += 1;
  }

  return { text: phrase.join(' '), next: i };
};

// build a surname phrase reading from the END of the words array (given-first order):
// consumes optional trailing particles + noun, then continues over particles + noun.
const buildSurnamePhraseFromEnd = (words, end) => {
  const phrase = [];
  let i = end - 1;

  while (i >= 0 && PARTICLES.has(words[i])) {
    phrase.unshift(words[i]);
    i -= 1;
  }
  if (i >= 0) {
    phrase.unshift(words[i]);
    i -= 1;
  }

  let sawParticle = false;
  while (i >= 0 && PARTICLES.has(words[i])) {
    sawParticle = true;
    phrase.unshift(words[i]);
    i -= 1;
  }
  if (sawParticle && i >= 0) {
    phrase.unshift(words[i]);
    i -= 1;
  }

  return { text: phrase.join(' '), next: i + 1 };
};

/**
 * Align the Base name (given names first) with the Monitoreo name (surnames
 * first) using the fact that both files store the same words in opposite block
 * order: base = NOMBRE(S) + APELLIDOS, monitoreo = APELLIDOS + NOMBRE(S).
 *
 * Tries every candidate surname-count `s`; returns the first coherent alignment
 * where the monitoreo's first `s` words equal the base's last `s` words AND the
 * monitoreo's remaining words equal the base's leading words. Prefers the split
 * that matches the active mode.
 *
 * @param {string[]} baseWords - tokens from the Base name (given names first).
 * @param {string[]} monoWords - tokens from the Monitoreo name (surnames first).
 * @param {'2surnames'|'1surname'} mode - prefer `s` aligned with this mode.
 * @returns {{nombreWords: string[], surnameWords: string[]}|null}
 */
export const alignBaseAndMonitoreo = (baseWords, monoWords, mode) => {
  if (baseWords.length !== monoWords.length || baseWords.length < 2) return null;
  const n = baseWords.length;
  const matches = [];

  for (let s = 1; s < n; s += 1) {
    const monoSurname = monoWords.slice(0, s).join(' ');
    const baseSurname = baseWords.slice(n - s).join(' ');
    const monoName = monoWords.slice(s).join(' ');
    const baseName = baseWords.slice(0, n - s).join(' ');
    if (monoSurname === baseSurname && monoName === baseName) {
      matches.push(s);
    }
  }

  if (matches.length === 0) return null;

  // Prefer the split the active mode asks for; "2surnames" usually means s=2
  // (or s with one trailing surname if only one exists). Fall back to the
  // smallest match count.
  const preferred = mode === '1surname' ? 1 : 2;
  const s = matches.includes(preferred) ? preferred : matches.sort((a, b) => a - b)[0];

  return {
    nombreWords: baseWords.slice(0, n - s),
    surnameWords: baseWords.slice(n - s),
  };
};

// Given-first split: trace surnames from the end of the name.
const splitGivenFirst = (words, mode) => {
  if (words.length === 0) {
    return { apellidoPaterno: '', apellidoMaterno: '', nombre: '' };
  }
  if (words.length === 1) {
    return { apellidoPaterno: words[0], apellidoMaterno: '', nombre: '' };
  }
  if (words.length === 2) {
    // Two words: NOMBRE + APELLIDO (no maternal surname present).
    return { apellidoPaterno: words[1], apellidoMaterno: '', nombre: words[0] };
  }

  const materno = buildSurnamePhraseFromEnd(words, words.length);

  if (mode === '1surname') {
    return {
      apellidoPaterno: materno.text,
      apellidoMaterno: '',
      nombre: words.slice(0, materno.next).join(' '),
    };
  }

  if (materno.next <= 1) {
    return {
      apellidoPaterno: words[0],
      apellidoMaterno: '',
      nombre: words.slice(1).join(' '),
    };
  }

  const paterno = buildSurnamePhraseFromEnd(words, materno.next);
  return {
    apellidoPaterno: paterno.text,
    apellidoMaterno: materno.text,
    nombre: words.slice(0, paterno.next).join(' '),
  };
};

/**
 * Split a student's full name into paternal/maternal surname and given name(s).
 *
 * @param {string|null|undefined} fullName - raw name string (given names first).
 * @param {'2surnames'|'1surname'} [mode] - how surnames are distributed.
 * @param {{apellidoPaterno?: string, apellidoMaterno?: string, nombre?: string}|null} [override]
 *   When the Base export provides separate name columns, use them verbatim.
 * @param {string|null|undefined} [monitoreoName] - the same full name as stored
 *   in the Monitoreo file (surnames first), used to cross-align and reduce ambiguity.
 * @returns {{apellidoPaterno: string, apellidoMaterno: string, nombre: string}}
 */
export const splitFullName = (fullName, mode = '2surnames', override = null, monitoreoName = null) => {
  if (override && (
    (override.apellidoPaterno && override.apellidoPaterno.trim() !== '') ||
    (override.nombre && override.nombre.trim() !== '')
  )) {
    return {
      apellidoPaterno: toCleanString(override.apellidoPaterno || ''),
      apellidoMaterno: toCleanString(override.apellidoMaterno || ''),
      nombre: toCleanString(override.nombre || ''),
    };
  }

  const words = toCleanString(fullName).toUpperCase().split(' ').filter(Boolean);

  if (words.length === 0) {
    return { apellidoPaterno: '', apellidoMaterno: '', nombre: '' };
  }

  // Cross-validate with the Monitoreo name when both sources are available and
  // share the same word count.
  const monoWords = toCleanString(monitoreoName).toUpperCase().split(' ').filter(Boolean);
  if (monoWords.length === words.length && monoWords.length >= 2) {
    const aligned = alignBaseAndMonitoreo(words, monoWords, mode);
    if (aligned) {
      // surnameWords is in "APELLIDO PATERNO APELLIDO MATERNO" order.
      const surnameWords = aligned.surnameWords;
      if (mode === '1surname') {
        return {
          apellidoPaterno: surnameWords.join(' '),
          apellidoMaterno: '',
          nombre: aligned.nombreWords.join(' '),
        };
      }
      if (surnameWords.length === 1) {
        return {
          apellidoPaterno: surnameWords[0],
          apellidoMaterno: '',
          nombre: aligned.nombreWords.join(' '),
        };
      }
      const paterno = buildSurnamePhrase(surnameWords, 0);
      if (paterno.next >= surnameWords.length) {
        return {
          apellidoPaterno: paterno.text,
          apellidoMaterno: '',
          nombre: aligned.nombreWords.join(' '),
        };
      }
      const materno = buildSurnamePhrase(surnameWords, paterno.next);
      // Any extra surname words (rare 3+ surname compounds) fold into the
      // maternal surname instead of being silently dropped.
      const maternoRest = surnameWords.slice(materno.next).join(' ');
      return {
        apellidoPaterno: paterno.text,
        apellidoMaterno: [materno.text, maternoRest].filter(Boolean).join(' '),
        nombre: aligned.nombreWords.join(' '),
      };
    }
  }

  return splitGivenFirst(words, mode);
};

const NAME_FIELD_CANDIDATES = {
  apellidoPaterno: ['apellido paterno', 'apellidopaterno', 'paterno', 'apellido paterno (s)'],
  apellidoMaterno: ['apellido materno', 'apellidomaterno', 'materno', 'apellido materno (s)'],
  nombre: ['nombre(s)', 'nombres', 'nombre', 'primer nombre'],
};

/**
 * Detect whether the Base export already provides separate name columns.
 * @param {Record<string, unknown>} row - a sample row from the Base sheet.
 * @returns {{apellidoPaterno: string, apellidoMaterno: string, nombre: string}|null}
 *   The extracted name fields if the columns exist, otherwise null.
 */
export const detectNameColumns = (row) => {
  if (!row || typeof row !== 'object') return null;
  const keyMap = Object.keys(row).reduce((acc, key) => {
    acc[key.toLowerCase().trim()] = key;
    return acc;
  }, {});

  const get = (candidates) => {
    for (const cand of candidates) {
      const realKey = keyMap[cand];
      if (!realKey) continue;
      const value = toCleanString(row[realKey]);
      if (value !== '') return value;
    }
    return '';
  };

  const apellidoPaterno = get(NAME_FIELD_CANDIDATES.apellidoPaterno);
  const apellidoMaterno = get(NAME_FIELD_CANDIDATES.apellidoMaterno);
  const nombre = get(NAME_FIELD_CANDIDATES.nombre);

  if (apellidoPaterno !== '' || nombre !== '') {
    return { apellidoPaterno, apellidoMaterno, nombre };
  }
  return null;
};