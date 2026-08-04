import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DAY_LABELS = { L: 'Lun', Ma: 'Mar', Mi: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };
const TIME_SLOTS = Array.from({ length: 27 }, (_, i) => 420 + i * 30);

function formatTimeLabel(t) {
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function timeToMinutes(t) {
  if (!t) return 0;
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0);
}

function getHorario(seccion, dia) {
  if (seccion.horarios && seccion.horarios[dia]) return seccion.horarios[dia];
  return seccion.horario;
}

const DAY_ORDER = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];

function formatHorarios(m) {
  return [...m.dias].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)).map(d => {
    const h = getHorario(m, d);
    return `${DAY_LABELS[d] || d} ${h.start}-${h.end}`;
  }).join(', ');
}

function getActiveDays(plan) {
  const active = new Set();
  plan.materias.forEach(m => m.dias.forEach(d => active.add(d)));
  return ['L', 'Ma', 'Mi', 'J', 'V'].filter(d => active.has(d));
}

function buildDayCells(plan, dayKey) {
  const subjects = plan.materias.filter(m => m.dias.includes(dayKey));
  const cells = Array.from({ length: TIME_SLOTS.length }, () => ({ text: '', color: 'empty', span: 0 }));
  subjects.forEach(m => {
    const startMin = timeToMinutes(getHorario(m, dayKey).start);
    const endMin = timeToMinutes(getHorario(m, dayKey).end);
    const s = Math.max(0, Math.floor((startMin - 420) / 30));
    const e = Math.min(TIME_SLOTS.length, Math.ceil((endMin - 420) / 30));
    if (e <= s) return;
    const color = m.modalidad === 'flex' ? 'flex' : 'regular';
    for (let i = s; i < e; i++) cells[i].color = color;
    cells[s].text = `${m.materia}\nG${m.grupo} ${m.clave}`;
    cells[s].span = e - s;
  });
  return cells;
}

function buildCalendarTable(plan) {
  const activeDays = getActiveDays(plan);
  const dayHeaders = activeDays.map(d => DAY_LABELS[d]);
  const dayCells = {};
  activeDays.forEach(d => dayCells[d] = buildDayCells(plan, d));
  const calendarData = [];
  const calendarColors = [];
  const calendarSpans = [];
  TIME_SLOTS.forEach((t, ti) => {
    const row = [t % 60 === 0 ? formatTimeLabel(t) : ''];
    const colors = [null];
    const spans = [0];
    activeDays.forEach(dayKey => {
      const cell = dayCells[dayKey][ti];
      row.push(cell.text);
      colors.push(cell.color);
      spans.push(cell.span);
    });
    calendarData.push(row);
    calendarColors.push(colors);
    calendarSpans.push(spans);
  });
  return { dayHeaders, calendarData, calendarColors, calendarSpans };
}

function buildCalendarTableOptions(plan, startY) {
  const { dayHeaders, calendarData, calendarColors, calendarSpans } = buildCalendarTable(plan);
  return {
    startY,
    head: [['Hora', ...dayHeaders]],
    body: calendarData,
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 1,
      overflow: 'linebreak',
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold', fillColor: [241, 245, 249] },
    },
    didParseCell: function(data) {
      if (data.section !== 'body' || data.column.index === 0) return;
      const rowColors = calendarColors[data.row.index];
      const rowSpans = calendarSpans[data.row.index];
      if (!rowColors) return;
      const kind = rowColors[data.column.index];
      if (kind === 'flex') {
        data.cell.styles.fillColor = [255, 243, 205];
      } else if (kind === 'regular') {
        data.cell.styles.fillColor = [220, 252, 231];
      } else {
        data.cell.styles.fillColor = [235, 238, 242];
      }
      if (rowSpans && rowSpans[data.column.index] > 1) {
        data.cell.rowSpan = rowSpans[data.column.index];
      }
    },
    didDrawCell: function(data) {
      if (data.section !== 'body' || data.column.index !== 0) return;
      if (data.cell.raw !== '') return;
      const { x, y, width, height } = data.cell;
      const midX = x + width / 2;
      const midY = y + height / 2;
      data.doc.setDrawColor(160, 170, 180);
      data.doc.setLineWidth(0.2);
      data.doc.line(midX - 3, midY, midX + 3, midY);
    },
  };
}

export function exportPlanToPDF(plan, studentName) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Título
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Horario de Clases', 148.5, 15, { align: 'center' });

  // Información del estudiante
  if (studentName) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Alumno: ${studentName}`, 15, 25);
  }

  // Información del plan
  doc.setFontSize(10);
  const isSobrecarga = plan.totalHoras > 29;
  doc.text(`Total de materias: ${plan.materias.length}`, 15, 32);
  doc.text(`Total de horas: ${plan.totalHoras}${isSobrecarga ? ' (SOBRECARGA)' : ''}`, 80, 32);
  
  if (isSobrecarga) {
    doc.setTextColor(200, 100, 0);
    doc.text('⚠ Requiere aprobación especial', 150, 32);
    doc.setTextColor(0, 0, 0);
  }

  // Tabla de calendario
  autoTable(doc, buildCalendarTableOptions(plan, 40));

  // Lista de materias en página aparte
  doc.addPage();

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Detalle de Materias', 15, 20);

  const materiasData = plan.materias.map(m => [
    m.clave,
    m.materia,
    m.grupo,
    formatHorarios(m),
    `${m.hrs}h`,
    m.modalidad.charAt(0).toUpperCase() + m.modalidad.slice(1),
  ]);

  autoTable(doc, {
    startY: 26,
    head: [['Clave', 'Materia', 'Grupo', 'Horario', 'Hrs', 'Modalidad']],
    body: materiasData,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 70 },
      2: { cellWidth: 20 },
      3: { cellWidth: 60 },
      4: { cellWidth: 15 },
      5: { cellWidth: 25 },
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Página ${i} de ${pageCount} - Generado: ${new Date().toLocaleDateString('es-MX')}`,
      148.5,
      205,
      { align: 'center' }
    );
  }

  const filename = `horario_${(studentName || 'alumno').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
}

export function exportAllPlansToPDF(plans, studentName) {
  if (!plans.length) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  plans.forEach((plan, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Título
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`Plan ${index + 1} de ${plans.length}`, 148.5, 15, { align: 'center' });

    // Información del estudiante
    if (studentName) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Alumno: ${studentName}`, 15, 25);
    }

    // Información del plan
    doc.setFontSize(10);
    const isSobrecarga = plan.totalHoras > 29;
    doc.text(`Total de materias: ${plan.materias.length}`, 15, 32);
    doc.text(`Total de horas: ${plan.totalHoras}${isSobrecarga ? ' (SOBRECARGA)' : ''}`, 80, 32);
    
    if (isSobrecarga) {
      doc.setTextColor(200, 100, 0);
      doc.text('⚠ Requiere aprobación especial', 150, 32);
      doc.setTextColor(0, 0, 0);
    }

    // Tabla de calendario
    autoTable(doc, buildCalendarTableOptions(plan, 40));

    // Lista de materias en página aparte
    doc.addPage();

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Detalle de Materias - Plan ${index + 1}`, 15, 20);

    const materiasData = plan.materias.map(m => [
      m.clave,
      m.materia,
      m.grupo,
      formatHorarios(m),
      `${m.hrs}h`,
      m.modalidad.charAt(0).toUpperCase() + m.modalidad.slice(1),
    ]);

    autoTable(doc, {
      startY: 26,
      head: [['Clave', 'Materia', 'Grupo', 'Horario', 'Hrs', 'Modalidad']],
      body: materiasData,
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 20 },
        3: { cellWidth: 60 },
        4: { cellWidth: 15 },
        5: { cellWidth: 25 },
      },
    });
  });

  // Footer en todas las páginas
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Página ${i} de ${pageCount} - Generado: ${new Date().toLocaleDateString('es-MX')}`,
      148.5,
      205,
      { align: 'center' }
    );
  }

  const filename = `horarios_${(studentName || 'alumno').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
}
