"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { SUBJECTS } from '@/Utils/Subjects';
import { parseOfertaExcel } from '@/Utils/scheduleParser';
import { generateSchedulePlans } from '@/Utils/scheduleSolver';
import { exportPlanToPDF, exportAllPlansToPDF } from '@/Utils/scheduleExport';
import SchedulePlanCard from '@/components/SchedulePlanCard';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import ScheduleEditor from '@/components/ScheduleEditor';

export default function ProyeccionesPage() {
  const [parsedData, setParsedData] = useState([]);
  // estado para datos de alumno y calificaciones finales
  const [studentInfo, setStudentInfo] = useState({ name: '', matricula: '' });
  const [gradesData, setGradesData] = useState([]);
  const [period, setPeriod] = useState(() => {
    const month = new Date().getMonth() + 1;
    return month <= 5 ? 'enero-mayo' : 'agosto-diciembre';
  });
  const [targetSemester, setTargetSemester] = useState(6);
  const firstLoadDone = useRef(false);

  // función para actualizar estado manualmente
  const handleStatusChange = (index, newStatus) => {
    console.log('handleStatusChange index, newStatus:', index, newStatus);
    setParsedData(prev => {
      // actualizar solo el elemento modificado
      const updated = prev.map((item, i) => i === index
        ? { ...item, status: newStatus, numericGrade: newStatus === 'passed' ? (item.numericGrade ?? 0) : null }
        : item
      );
      console.log('updated after change:', updated);
      // si se marca no pasado, bloquear seriadas
      if (newStatus !== 'passed') {
        const changed = updated[index];
        console.log('changed item:', changed);
        // buscar sujeto en Subjects
        const changedSubj = findSubject(changed);
        console.log('matched changedSubj:', changedSubj);
        if (changedSubj) {
          // construir lista de bloqueadas recursivas
          const blocked = new Set([changedSubj.curriculumCode || changedSubj.code]);
          let addedFlag = true;
          while (addedFlag) {
            addedFlag = false;
            SUBJECTS.subjects.forEach(s => {
              if (!blocked.has(s.curriculumCode || s.code) && s.prerequisites.some(pr => blocked.has(pr))) {
                blocked.add(s.curriculumCode || s.code);
                addedFlag = true;
              }
            });
          }
          console.log('blocked codes:', Array.from(blocked));
          // aplicar bloqueo
          return updated.map(item => {
            const subj = findSubject(item) || {};
            if (subj && blocked.has(subj.curriculumCode || subj.code) && subj.code !== changedSubj.code) {
              return { ...item, status: 'not_started', numericGrade: null };
            }
            return item;
          });
        }
      }
      return updated;
    });
  };

  // procesa archivo de kardex y materias cursadas
  const handleKardexFileChange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      // extraer matrícula y nombre de la hoja kardex
      const infoSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('Kardex')) || wb.SheetNames[0];
      const infoSheet = wb.Sheets[infoSheetName];
      const matricula = infoSheet['B1']?.v || '';
      const nombre = infoSheet['B3']?.v || '';
      setStudentInfo({ name: nombre, matricula });
      console.log(`Matrícula: ${matricula}, Nombre: ${nombre}`);
      setParsedData([]);
      
      // leer materias cursadas en la hoja correspondiente
      const matSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('materias cursadas'));
      if (!matSheetName) {
        alert("No se encontró la pestaña 'Materias cursadas'");
        return;
      }
      const matSheet = wb.Sheets[matSheetName];
      const rows = XLSX.utils.sheet_to_json(matSheet, { defval: '' });
      const validRows = rows.filter(r => r['Nombre materia']);
      const data = validRows.map(row => {
        const raw = row['Calificación'];
        const rawStr = (raw ?? '').toString().trim();
        let status = (!rawStr || rawStr === '-') ? 'not_started'
          : (rawStr === 'CU')    ? 'in_progress'
          : (!isNaN(rawStr))      ? 'passed'
          : 'unknown';
        const claveMateria = (row['Clave materia oficial'] || '').toString().trim();
        const claveBanner = (row['Clave materia banner'] || '').toString().trim();
        const claves = [];
        if (claveMateria) claves.push(claveMateria);
        if (claveBanner && claveBanner !== claveMateria) claves.push(claveBanner);
        return {
          name: row['Nombre materia']?.trim(),
          claves,
          grade: raw,
          status,
          numericGrade: !isNaN(raw) ? Number(raw) : null
        };
      });
      // si ya tenemos monitoreo, actualizar materias in_progress
      const updated = data.map(item => {
        if (item.status === 'in_progress') {
          const match = gradesData.find(r => r['Nombre de la materia'] === item.name);
          if (match) {
            const rawF = match['Calificación final actual'];
            const num = Number(rawF);
            return { ...item, grade: rawF, numericGrade: isNaN(num) ? null : num, status: !isNaN(num) ? 'passed' : item.status };
          }
        }
        return item;
      });
      setParsedData(updated);
    };
    reader.readAsBinaryString(file);
  };

  // procesa archivo de calificaciones finales y actualiza materias en progreso
  const handleGradesFileChange = e => {
    if (!studentInfo.matricula) return;
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const sheetName = wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
      const filtered = rows.filter(r => r['Matrícula']?.toString() === studentInfo.matricula.toString());
      setGradesData(filtered);
      // actualizar parsedData para materias en progreso
      setParsedData(prev => prev.map(item => {
        if (item.status === 'in_progress') {
          const match = filtered.find(r => r['Nombre de la materia'] === item.name);
          if (match) {
            const raw = match['Calificación final actual'];
            const num = Number(raw);
            return { ...item, grade: raw, numericGrade: isNaN(num)?null:num, status: !isNaN(num)?'passed':item.status };
          }
        }
        return item;
      }));
    };
    reader.readAsBinaryString(file);
  };

  // procesa archivo de oferta de grupos
  const handleOfertaFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = await parseOfertaExcel(file);
      setOferta(parsed);
      setOfertaFileName(file.name);
      setPlans([]);
      setSelectedPlan(null);
    } catch (err) {
      alert('Error al leer el archivo de oferta: ' + err.message);
    }
  };

  // Función auxiliar para determinar el siguiente código secuencial de idiomas
  const getNextLanguageCode = (passedClaves, prefix, allOfertaClaves) => {
    // Extraer números de claves acreditadas con el prefijo
    const passedNums = [...passedClaves]
      .filter(c => c.startsWith(prefix))
      .map(c => parseInt(c.replace(prefix, ''), 10))
      .filter(n => !isNaN(n));
    
    if (passedNums.length === 0) {
      return null; // Alumno nuevo, permitir todas
    }
    
    const maxPassed = Math.max(...passedNums);
    
    // Encontrar siguiente disponible en oferta
    const availableNums = [...allOfertaClaves]
      .filter(c => c.startsWith(prefix))
      .map(c => parseInt(c.replace(prefix, ''), 10))
      .filter(n => !isNaN(n) && n > maxPassed)
      .sort((a, b) => a - b);
    
    return availableNums.length > 0 ? `${prefix}${String(availableNums[0]).padStart(4, '0')}` : null;
  };

  const handleGeneratePlans = () => {
    if (!availableSubjects.length) {
      alert('No hay materias disponibles para planear con el semestre objetivo ' + targetSemester + '.\n\nPosibles causas:\n• Ya aprobaste todas las materias hasta el semestre ' + targetSemester + ' — prueba con un semestre más alto.\n• No se pudo hacer match de tus materias contra el plan de estudios (revisa que los nombres coincidan).\n• Aún no cargas el Kardex.');
      return;
    }
    if (!oferta.length) {
      alert('Carga primero el archivo de oferta de grupos.');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      // Recopilar todas las claves de materias ya acreditadas
      const allPassedClaves = new Set();
      parsedData.forEach(item => {
        if (item.status !== 'passed') return;
        (item.claves || []).forEach(c => {
          if (c) allPassedClaves.add(c);
        });
      });
      
      // Extraer claves de oferta únicas
      const allOfertaClaves = new Set(oferta.map(s => s.clave));
      
      // Detectar si el alumno tiene algún idioma acreditado
      const hasAnyLanguage = [...allPassedClaves].some(c => 
        c.startsWith('BSOP') || c.startsWith('BSHI')
      );
      
      // Filtrar idiomas BSOP y BSHI secuencialmente
      const bsopNext = getNextLanguageCode(allPassedClaves, 'BSOP', allOfertaClaves);
      const bshiNext = getNextLanguageCode(allPassedClaves, 'BSHI', allOfertaClaves);
      
      let ofertaToUse = oferta.filter(s => {
        // Remover si la clave ya está acreditada
        if (allPassedClaves.has(s.clave)) return false;
        
        // Filtrado secuencial para BSOP
        if (s.clave.startsWith('BSOP')) {
          if (hasAnyLanguage) {
            // Alumno con idioma iniciado: solo permitir si es el siguiente de SU idioma
            return bsopNext && s.clave === bsopNext;
          }
          // Alumno sin idiomas: permitir todos
          return true;
        }
        
        // Filtrado secuencial para BSHI
        if (s.clave.startsWith('BSHI')) {
          if (hasAnyLanguage) {
            // Alumno con idioma iniciado: solo permitir si es el siguiente de SU idioma
            return bshiNext && s.clave === bshiNext;
          }
          // Alumno sin idiomas: permitir todos
          return true;
        }
        
        return true;
      });
      
      // Ordenar por número de clave para priorizar menores
      ofertaToUse.sort((a, b) => {
        const na = parseInt(a.clave.replace(/\D/g, ''), 10) || 0;
        const nb = parseInt(b.clave.replace(/\D/g, ''), 10) || 0;
        return na - nb;
      });
      
      // Reasignar curriculumCode de idiomas para que usen su clave como identificador único
      // Esto evita que sean filtrados por doneCodes en el editor
      ofertaToUse = ofertaToUse.map(s => {
        if (s.clave.startsWith('BSOP') || s.clave.startsWith('BSHI')) {
          return { ...s, curriculumCode: s.clave };
        }
        return s;
      });
      
      // Guardar oferta filtrada para usar en el editor
      setFilteredOferta(ofertaToUse);
      
      const result = generateSchedulePlans(availableSubjects, ofertaToUse, {
        maxPlans: 10,
        preferredGrupo: preferredGrupo || undefined,
      });
      if (result.length === 0) {
        alert('No se encontraron combinaciones de horarios sin conflicto con ' + availableSubjects.length + ' materias disponibles.\n\nPuede deberse a horarios superpuestos o disponibilidad insuficiente en la oferta. Intenta con un semestre objetivo más alto o verifica la oferta de grupos.');
      }
      setPlans(result);
      // if (result.length > 0) setSelectedPlan(result[0]);
      setIsGenerating(false);
    }, 50);
  };

  // orden para status de calificaciones
  const statusOrder = { in_progress: 0, not_started: 1, passed: 2, unknown: 3 };
  const findSubject = (item) => {
    // 1. Match por nombre base (sin paréntesis) — el kardex es la fuente de verdad
    const baseName = item.name.replace(/\s*\(.*?\)\s*/g, '').toLowerCase();
    const byName = SUBJECTS.subjects
      .slice()
      .sort((a, b) => b.name.es.length - a.name.es.length)
      .find(s => {
        const es = s.name.es.toLowerCase();
        const en = s.name.en?.toLowerCase() || '';
        const check = (name) => {
          const idx = baseName.indexOf(name);
          if (idx === -1) return false;
          const nextChar = baseName[idx + name.length];
          if (nextChar && /[a-záéíóú]/i.test(nextChar)) return false;
          return true;
        };
        return check(es) || (en && check(en));
      });
    if (byName) return byName;
    // 2. Fallback por códigos del kardex
    const claves = item.claves || [];
    if (claves.length > 0) {
      const byCode = SUBJECTS.subjects.find(s => {
        const allCodes = s.codes || [s.code];
        return claves.some(c => allCodes.includes(c) || s.curriculumCode === c);
      });
      if (byCode) return byCode;
    }
    return null;
  };

  const passedCodes = useMemo(() => (
    parsedData
      .filter(item => item.status === 'passed')
      .map(item => {
        const subj = findSubject(item);
        return subj?.curriculumCode || subj?.code;
      })
      .filter(Boolean)
  ), [parsedData]);

  const enrollmentList = useMemo(() => {
    // Build map of curriculum code → Kardex codes y nombres
    const codeMap = {};
    const nameMap = {};
    parsedData.forEach(item => {
      const subj = findSubject(item);
      if (subj) {
        const key = subj.curriculumCode || subj.code;
        if (!codeMap[key]) codeMap[key] = [];
        (item.claves || []).forEach(c => {
          if (!codeMap[key].includes(c)) codeMap[key].push(c);
        });
        nameMap[key] = item.name.replace(/\s*\(.*?\)\s*/g, '').trim();
      }
    });
    return SUBJECTS.subjects
      .slice()
      .sort((a, b) => a.semester - b.semester)
      .map(s => {
        const key = s.curriculumCode || s.code;
        const done = passedCodes.includes(key);
        const canTake = s.prerequisites.every(pr => passedCodes.includes(pr));
        const isProgress = !done && parsedData.some(item => {
          if (item.status !== 'in_progress') return false;
          const baseName = item.name.replace(/\s*\(.*?\)\s*/g, '').toLowerCase();
          const es = s.name.es.toLowerCase();
          const en = s.name.en?.toLowerCase() || '';
          const check = (name) => {
            const idx = baseName.indexOf(name);
            if (idx === -1) return false;
            const nextChar = baseName[idx + name.length];
            if (nextChar && /[a-záéíóú]/i.test(nextChar)) return false;
            return true;
          };
          if (check(es) || (en && check(en))) return true;
          const claves = item.claves || [];
          if (claves.length > 0) {
            const allCodes = s.codes || [s.code];
            if (claves.some(c => allCodes.includes(c) || s.curriculumCode === c)) return true;
          }
          return false;
        });
        return { ...s, done, canTake, isProgress, kardexCodes: codeMap[key] || [], kardexName: nameMap[key] };
      });
  }, [parsedData, passedCodes]);

  const doneCodesSet = useMemo(() => {
    const set = new Set();
    enrollmentList.forEach(s => {
      if (s.done) {
        set.add(s.code);
        if (s.curriculumCode) set.add(s.curriculumCode);
      }
    });
    return set;
  }, [enrollmentList]);

  const allowedSemesters = useMemo(() => (
    period === 'enero-mayo' ? [2, 4, 6] : [1, 3, 5]
  ), [period]);

  const baseTypeMap = useMemo(() => (
    enrollmentList.reduce((m, s) => {
      m[s.code] = s.done ? '' : (allowedSemesters.includes(s.semester) ? 'regular' : 'flex');
      return m;
    }, {})
  ), [enrollmentList, allowedSemesters]);

  const [manualTypeMap, setManualTypeMap] = useState({});

  const [oferta, setOferta] = useState([]);
  const [ofertaFileName, setOfertaFileName] = useState('');
  const [filteredOferta, setFilteredOferta] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferredGrupo, setPreferredGrupo] = useState('');
  const [creatingNewPlan, setCreatingNewPlan] = useState(false);

  const handleCreatePlanFromScratch = () => {
    setSelectedPlan(null);
    setCreatingNewPlan(true);
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setCreatingNewPlan(false);
  };

  const uniqueGrupos = useMemo(() => {
    const available = enrollmentList.filter(s => s.canTake && !s.done && !s.isProgress && s.semester <= targetSemester);
    const belongsToAvailable = (sec) => {
      return available.some(a => {
        const aCodes = new Set(a.codes || [a.code]);
        // Coincidencia por código (curriculumCode de la sección o su clave)
        if (sec.curriculumCode &&
          (sec.curriculumCode === a.code || sec.curriculumCode === a.curriculumCode || aCodes.has(sec.curriculumCode))) {
          return true;
        }
        if (sec.clave &&
          (sec.clave === a.code || sec.clave === a.curriculumCode || aCodes.has(sec.clave))) {
          return true;
        }
        // Coincidencia por nombre (en ambas direcciones)
        const lowerMateria = sec.materia.replace(/\s*\(.*?\)\s*/g, '').toLowerCase();
        const es = a.name.es.toLowerCase();
        const checkContains = (longText, shortName) => {
          const idx = longText.indexOf(shortName);
          if (idx === -1) return false;
          const nextChar = longText[idx + shortName.length];
          if (nextChar && /[a-záéíóú]/i.test(nextChar)) return false;
          return true;
        };
        if (checkContains(lowerMateria, es)) return true;
        if (checkContains(es, lowerMateria)) return true;
        return false;
      });
    };
    return [...new Set(
      oferta.filter(belongsToAvailable).map(s => s.grupo).filter(Boolean)
    )].sort();
  }, [oferta, enrollmentList, targetSemester]);

  useEffect(() => {
    if (parsedData.length === 0) {
      setManualTypeMap({});
    }
  }, [parsedData.length]);

  const flatList = useMemo(() => enrollmentList.slice().sort((a, b) => a.semester - b.semester), [enrollmentList]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const semGrid = useMemo(() => (
    [1,2,3,4,5,6].map(sem => enrollmentList.filter(s => s.semester === sem))
  ), [enrollmentList]);

  // manejar flechas y teclas V, F, R
  useEffect(() => {
    const handler = e => {
      // ignorar si el foco está en un input
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      // horizontal
      if (['ArrowUp','ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        setSelectedIndex(idx => (idx + dir + flatList.length) % flatList.length);
      }
      // vertical
      if (['ArrowRight','ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        const current = flatList[selectedIndex];
        if (!current) return;
        const sem = current.semester;
        const row = semGrid[sem-1].findIndex(s => s.code === current.code);
        const nextSem = e.key === "ArrowLeft" ? sem - 1 : sem + 1;
        if (nextSem >= 1 && nextSem <= 6) {
          const targetArr = semGrid[nextSem-1];
          let target = targetArr[row] || targetArr[targetArr.length - 1];
          const newIdx = flatList.findIndex(s => s.code === target.code);
          if (newIdx >= 0) setSelectedIndex(newIdx);
        }
      }
      if (['f','F','r','R','v','V'].includes(e.key)) {
        e.preventDefault();
        const subj = flatList[selectedIndex];
        // no cambiar tipo de materias aprobadas
        if (!subj || subj.done) return;
        const code = subj.code;
        let newType = '';
        if (e.key.toLowerCase() === 'f') newType = 'flex';
        if (e.key.toLowerCase() === 'r') newType = 'regular';
        if (e.key.toLowerCase() === 'v') newType = 'verano';
        setManualTypeMap(prev => ({ ...prev, [code]: newType }));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flatList, selectedIndex, semGrid]);

  // orden de disponibilidad: Disponible, Bloqueada, Aprobada
  const availOrder = (s) => s.canTake && !s.done ? 0 : (!s.canTake && !s.done ? 1 : 2);

  const statusMap = useMemo(() => (
    parsedData.reduce((acc, item) => {
      const subj = findSubject(item);
      if (subj) acc[subj.code] = item.status;
      return acc;
    }, {})
  ), [parsedData]);

  // auto-detect targetSemester: first semester with pending subjects
  useEffect(() => {
    if (!firstLoadDone.current && enrollmentList.length > 0) {
      firstLoadDone.current = true;
      for (let sem = 1; sem <= 6; sem++) {
        const undone = enrollmentList.filter(s => s.semester === sem && !s.done);
        if (undone.length > 0) {
          setTargetSemester(sem);
          break;
        }
      }
    }
  }, [enrollmentList]);

  const availableSubjects = useMemo(
    () => enrollmentList.filter(s => s.canTake && !s.done && !s.isProgress && s.semester <= targetSemester),
    [enrollmentList, targetSemester]
  );

  const statusTotals = useMemo(() => (
    parsedData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, { passed: 0, in_progress: 0, not_started: 0 })
  ), [parsedData]);

  const summaryCards = useMemo(() => ([
    {
      label: 'Aprobadas',
      value: statusTotals.passed,
      accent: 'from-emerald-500/25 via-emerald-400/20 to-emerald-300/10 border-emerald-400/30'
    },
    {
      label: 'En curso',
      value: statusTotals.in_progress,
      accent: 'from-sky-500/25 via-blue-500/10 to-slate-800 border-sky-400/30'
    },
    {
      label: 'Pendientes',
      value: statusTotals.not_started,
      accent: 'from-amber-500/25 via-orange-500/10 to-slate-900 border-amber-400/30'
    }
  ]), [statusTotals]);

  const periodOptions = [
    { value: 'enero-mayo', label: 'Enero – Mayo', hint: 'Semestres pares (2,4,6)' },
    { value: 'agosto-diciembre', label: 'Agosto – Diciembre', hint: 'Semestres nones (1,3,5)' }
  ];
  const semesterOptions = [1,2,3,4,5,6];
  const statusBadges = {
    passed: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
    in_progress: 'bg-blue-500/15 text-blue-200 border border-blue-500/30',
    not_started: 'bg-slate-500/10 text-slate-200 border border-slate-500/30'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:px-10">
        <section className="rounded-[32px] border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/40 p-8 shadow-[0px_40px_120px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Planeación inteligente</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Proyecciones curriculares</h1>
              <p className="mt-4 max-w-2xl text-slate-300">
                Conecta el Kardex, descubre tus materias bloqueadas y organiza la carga ideal entre regular, flex y verano utilizando atajos de teclado.
              </p>
            </div>
            <div className="grid w-full gap-4 sm:grid-cols-3">
              {summaryCards.map(card => (
                <div
                  key={card.label}
                  className={`rounded-2xl border bg-gradient-to-br px-4 py-5 text-center ${card.accent}`}
                >
                  <p className="text-sm text-slate-200">{card.label}</p>
                  <p className="text-3xl font-semibold text-white">{card.value || 0}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Periodo de proyección</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Elige el semestre que quieres planear</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Cambia entre Enero–Mayo y Agosto–Diciembre para que las materias sugeridas se clasifiquen como regular o flex correctamente. Marca Verano desde la malla usando la tecla <span className="font-semibold text-white">V</span>.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
              {periodOptions.map(option => {
                const isActive = period === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPeriod(option.value)}
                    className={`flex-1 rounded-2xl border px-5 py-4 text-left transition ${isActive ? 'border-white/70 bg-white/10 shadow-lg shadow-emerald-500/10' : 'border-white/10 bg-transparent hover:border-white/40 hover:bg-white/5'}`}
                  >
                    <p className="flex items-center gap-2 text-base font-semibold text-white">
                      <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                      {option.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">{option.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Semestre objetivo</p>
            <p className="mt-2 text-base text-slate-300">Mostrar materias disponibles hasta el semestre seleccionado.<br className="hidden sm:block" /> Actualmente planeando para <span className="font-semibold text-white">Semestre {targetSemester}</span>.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {semesterOptions.map(num => {
                const isActive = targetSemester === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetSemester(num)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${isActive ? 'border-white/70 bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 text-white shadow-lg shadow-emerald-500/15' : 'border-white/10 bg-white/0 text-slate-200 hover:border-white/40 hover:bg-white/5'}`}
                  >
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Semestre</p>
                    <p className="text-2xl font-semibold text-white">{num}</p>
                    <p className="text-xs text-slate-400">Incluye materias de semestres ≤ {num}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Paso 1</p>
                <h2 className="text-2xl font-semibold text-white">Sube tu Kardex</h2>
              </div>
            </div>
            <label
              htmlFor="kardexFile"
              className="mt-5 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-900/40 px-6 text-center text-slate-300 transition hover:border-white/50 hover:bg-slate-900/60"
            >
              <span className="text-base font-medium">Arrastra el archivo o haz clic</span>
              <span className="mt-2 text-sm text-slate-400">Formatos admitidos: .xlsx, .xls</span>
              <input
                id="kardexFile"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleKardexFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Paso 2</p>
                <h2 className="text-2xl font-semibold text-white">Sincroniza Monitoreo</h2>
                <p className="mt-2 text-sm text-slate-300">Actualiza materias en curso al cargar el archivo de calificaciones finales.</p>
              </div>
              <label
                htmlFor="gradesFile"
                className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center text-slate-300 transition ${studentInfo.matricula ? 'border-white/20 bg-slate-900/40 hover:border-white/50 hover:bg-slate-900/60' : 'border-white/5 bg-slate-900/20 cursor-not-allowed text-slate-500'}`}
              >
                <span className="text-base font-medium">Subir Monitoreo</span>
                <span className="mt-2 text-sm">Necesitas cargar primero el Kardex</span>
                <input
                  id="gradesFile"
                  type="file"
                  accept=".xlsx, .xls"
                  disabled={!studentInfo.matricula}
                  onChange={handleGradesFileChange}
                  className="hidden"
                />
              </label>

              {studentInfo.name ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Alumno</p>
                  <p className="text-lg font-semibold text-white">{studentInfo.name}</p>
                  <p className="text-sm text-slate-300">Matrícula: {studentInfo.matricula}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-4 text-sm text-slate-400">
                  Carga tu Kardex para detectar automáticamente nombre y matrícula.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tabla de materias cursadas */}
        {parsedData.length < 0 && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Materias cursadas</p>
              <span className="text-xs text-slate-500">{parsedData.length} registros</span>
            </div>
            <div className="mt-4 max-h-80 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-[0.1em] text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Códigos (Kardex)</th>
                    <th className="px-3 py-2">Nombre materia</th>
                    <th className="px-3 py-2">Calif</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Match Subjects.js</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((item, i) => {
                    const subj = findSubject(item);
                    return (
                      <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02]">
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-300">
                          {(item.claves || []).join(', ') || <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-200">{item.name.replace(/\s*\(.*?\)\s*/g, '').trim()}</td>
                        <td className="px-3 py-2 text-slate-300">{item.grade || '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            item.status === 'passed' ? 'bg-emerald-500/15 text-emerald-200' :
                            item.status === 'in_progress' ? 'bg-blue-500/15 text-blue-200' :
                            item.status === 'not_started' ? 'bg-slate-500/10 text-slate-300' :
                            'bg-red-500/15 text-red-200'
                          }`}>{item.status}</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-300">
                          {subj ? <span className="text-emerald-300">{subj.curriculumCode || subj.code}</span> : <span className="text-rose-400">Sin match</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Paso 3: Oferta de grupos */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Paso 3</p>
              <h2 className="text-2xl font-semibold text-white">Oferta de grupos</h2>
              <p className="mt-2 text-sm text-slate-300">
                Sube el archivo con la oferta de grupos (horarios, disponibilidad) para generar planes de inscripción.
              </p>
            </div>
            {parsedData.length > 0 && oferta.length > 0 && (
              <div className="flex flex-col items-stretch gap-3 md:items-center md:flex-row">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Grupo prioridad ({uniqueGrupos.length} grupos)</span>
                  <select
                    value={preferredGrupo}
                    onChange={e => setPreferredGrupo(e.target.value)}
                    className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400/40"
                  >
                    <option value="">Sin prioridad</option>
                    {uniqueGrupos.map(g => (
                      <option key={g} value={g}>Grupo {g}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePlans}
                  disabled={isGenerating}
                  className="shrink-0 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 px-6 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
                >
                  {isGenerating ? 'Generando...' : 'Generar planes'}
                </button>
                <button
                  type="button"
                  onClick={handleCreatePlanFromScratch}
                  className="shrink-0 rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
                >
                  Crear plan desde cero
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <label
              htmlFor="ofertaFile"
              className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center text-slate-300 transition ${
                oferta.length > 0
                  ? 'border-emerald-400/30 bg-emerald-500/5 hover:border-emerald-400/50'
                  : 'border-white/20 bg-slate-900/40 hover:border-white/50 hover:bg-slate-900/60'
              }`}
            >
              {oferta.length > 0 ? (
                <div className="text-center">
                  <span className="text-base font-medium text-emerald-300">✓ {ofertaFileName}</span>
                  <span className="mt-1 block text-sm text-slate-400">{oferta.length} grupos cargados</span>
                  <span className="mt-2 block text-xs text-slate-500">Toca para cambiar archivo</span>
                </div>
              ) : (
                <>
                  <span className="text-base font-medium">Subir oferta de grupos</span>
                  <span className="mt-2 text-sm text-slate-400">Formatos admitidos: .xlsx, .xls</span>
                </>
              )}
              <input
                id="ofertaFile"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleOfertaFileChange}
                className="hidden"
              />
            </label>

            {oferta.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Resumen de oferta</p>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">Materias distintas:</span>
                    <span className="ml-2 font-semibold text-white">{new Set(oferta.map(g => g.clave)).size}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Grupos totales:</span>
                    <span className="ml-2 font-semibold text-white">{oferta.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Regular:</span>
                    <span className="ml-2 font-semibold text-emerald-300">{oferta.filter(g => g.modalidad === 'regular').length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Flex:</span>
                    <span className="ml-2 font-semibold text-amber-300">{oferta.filter(g => g.modalidad === 'flex').length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Planes generados */}
        {plans.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Planes sugeridos</p>
                <h3 className="text-2xl font-semibold text-white">
                  {plans.length} opción{plans.length !== 1 ? 'es' : ''} de horario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => exportAllPlansToPDF(plans, studentInfo.name)}
                className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
              >
                Exportar todos
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {plans.map((plan, idx) => (
                <SchedulePlanCard
                  key={plan.id}
                  plan={plan}
                  rank={idx + 1}
                  onView={() => setSelectedPlan(plan)}
                  onEdit={() => { setSelectedPlan(plan); setIsEditing(true); }}
                  onExport={() => exportPlanToPDF(plan, studentInfo.name)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Modal: calendario */}
        {selectedPlan && !isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto" onClick={() => setSelectedPlan(null)}>
            <div className="w-full max-w-7xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Calendario - Plan {plans.findIndex(p => p.id === selectedPlan.id) + 1}</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(true); }}
                    className="rounded-xl border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 transition"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => exportPlanToPDF(selectedPlan, studentInfo.name)}
                    className="rounded-xl border border-emerald-400/30 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10 transition"
                  >
                    Exportar
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="rounded-xl border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
              <ScheduleCalendar plan={selectedPlan} />
            </div>
          </div>
        )}

        {/* Modal: editor */}
        {isEditing && (selectedPlan || creatingNewPlan) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeEditor}>
            <div className="w-full max-w-7xl max-h-[90vh] rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-4">{creatingNewPlan ? 'Crear Plan desde Cero' : 'Editar Plan'}</h3>
              <ScheduleEditor
                plan={selectedPlan}
                oferta={filteredOferta.length > 0 ? filteredOferta : oferta}
                doneCodes={doneCodesSet}
                onSave={(edited) => {
                  if (creatingNewPlan) {
                    setPlans(prev => [...prev, edited]);
                    setCreatingNewPlan(false);
                  } else {
                    setPlans(prev => prev.map(p => p.id === selectedPlan.id ? edited : p));
                    setSelectedPlan(edited);
                  }
                  setIsEditing(false);
                }}
                onCancel={closeEditor}
              />
            </div>
          </div>
        )}

        {parsedData.length > 0 && (
          <section className="mt-12 space-y-8">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Materias cursadas</p>
                  <h3 className="text-2xl font-semibold text-white">Estado actual</h3>
                </div>
                <p className="text-sm text-slate-400">Usa las flechas y letras <span className="font-semibold text-white">R</span>, <span className="font-semibold text-white">F</span>, <span className="font-semibold text-white">V</span> para etiquetar.</p>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-slate-200">
                    <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Nombre materia</th>
                        <th className="px-4 py-3">Calificación</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Calificación numérica</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData
                        .map((item, originalIndex) => ({ item, originalIndex }))
                        .sort((a, b) => statusOrder[a.item.status] - statusOrder[b.item.status])
                        .map(({ item, originalIndex }) => (
                          <tr key={originalIndex} className="border-b border-white/5 last:border-transparent hover:bg-white/5">
                            <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                            <td className="px-4 py-3">{item.grade}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadges[item.status] || ''}`}>
                                  {item.status.replace('_', ' ')}
                                </span>
                                <select
                                  className="rounded-full border border-white/10 bg-transparent px-3 py-1 text-xs capitalize text-white focus:border-white/40"
                                  value={item.status}
                                  onChange={e => handleStatusChange(originalIndex, e.target.value)}
                                >
                                  <option className="text-black" value="not_started">Not started</option>
                                  <option className="text-black" value="in_progress">In progress</option>
                                  <option className="text-black" value="passed">Passed</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-4 py-3">{item.numericGrade ?? '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {availableSubjects.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Disponibilidad inmediata</p>
                    <h3 className="text-2xl font-semibold text-white">Materias recomendadas ({availableSubjects.length})</h3>
                  </div>
                  <p className="text-sm text-slate-400">Planeando carga hasta semestre {targetSemester}. Regular sugerida para {period === 'enero-mayo' ? 'semestres pares (2,4,6)' : 'semestres nones (1,3,5)'}.</p>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {availableSubjects.map(s => (
                    <div
                      key={s.code}
                      className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-lg"
                    >
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Sem {s.semester}</p>
                      <h4 className="mt-2 text-lg font-semibold text-white">{s.kardexName || s.name.es}</h4>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">{s.kardexCodes?.length > 0 ? s.kardexCodes.join(', ') : s.code}</span>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300">{allowedSemesters.includes(s.semester) ? 'Regular' : 'Flex'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {parsedData.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Mapa completo</p>
                <h3 className="text-3xl font-semibold text-white">Malla curricular interactiva</h3>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="rounded-full border border-white/20 px-3 py-1 text-slate-300">R = Regular</span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-slate-300">F = Flex</span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-slate-300">V = Verano</span>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1,2,3,4,5,6].map(sem => (
                <div key={sem} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">Semestre {sem}</h4>
                    <span className="text-xs uppercase tracking-[0.25em] text-slate-500">{semGrid[sem-1]?.length || 0} materias</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {enrollmentList.filter(s => s.semester === sem).map(s => {
                      const idx = flatList.findIndex(f => f.code === s.code);
                      const isSelected = idx === selectedIndex;
                      const type = manualTypeMap[s.code] ?? baseTypeMap[s.code];
                      const status = statusMap[s.code];
                      const cardPalette = s.isProgress
                        ? 'from-blue-500/20 via-blue-500/5 to-slate-900'
                        : s.done
                        ? 'from-emerald-500/25 via-emerald-500/10 to-slate-900'
                        : s.canTake
                        ? 'from-amber-500/25 via-amber-500/10 to-slate-900'
                        : 'from-rose-500/25 via-rose-500/10 to-slate-900';
                      return (
                        <button
                          key={s.code}
                          type="button"
                          onClick={() => setSelectedIndex(idx)}
                          className={`rounded-2xl border border-white/10 bg-gradient-to-br p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-white/40 ${cardPalette} ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-base font-semibold text-white">{s.kardexName || s.name.es}</p>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadges[status] || 'bg-white/10 text-white'}`}>
                              {status ? status.replace('_', ' ') : (s.done ? 'passed' : s.canTake ? 'available' : 'blocked')}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-200">
                            {s.kardexCodes.length > 0 ? s.kardexCodes.join(', ') : s.code}
                            {' · '}{type || 'Sin tipo'}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">Horas: {s.hours} • Créditos: {s.credits}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
