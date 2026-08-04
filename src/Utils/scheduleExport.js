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

function formatHorarios(m) {
  return m.dias.map(d => {
    const h = getHorario(m, d);
    return `${DAY_LABELS[d] || d} ${h.start}-${h.end}`;
  }).join(', ');
}

function getActiveDays(plan) {
  const active = new Set();
  plan.materias.forEach(m => m.dias.forEach(d => active.add(d)));
  return ['L', 'Ma', 'Mi', 'J', 'V'].filter(d => active.has(d));
}

function buildCalendarTable(plan) {
  const activeDays = getActiveDays(plan);
  const dayHeaders = activeDays.map(d => DAY_LABELS[d]);
  const calendarData = [];
  const calendarColors = [];
  TIME_SLOTS.forEach(t => {
    const row = [formatTimeLabel(t)];
    const colors = [null];
    activeDays.forEach(dayKey => {
      const matching = plan.materias.filter(m =>
        m.dias.includes(dayKey) &&
        timeToMinutes(getHorario(m, dayKey).start) <= t &&
        timeToMinutes(getHorario(m, dayKey).end) > t
      );
      if (matching.length > 0) {
        const materia = matching[0];
        row.push(`${materia.materia}\nG${materia.grupo} ${materia.clave}`);
        colors.push(materia.modalidad === 'flex' ? 'flex' : 'regular');
      } else {
        row.push('');
        colors.push('empty');
      }
    });
    calendarData.push(row);
    calendarColors.push(colors);
  });
  return { dayHeaders, calendarData, calendarColors };
}

function buildCalendarTableOptions(plan, startY) {
  const { dayHeaders, calendarData, calendarColors } = buildCalendarTable(plan);
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
      if (!rowColors) return;
      const kind = rowColors[data.column.index];
      if (kind === 'flex') {
        data.cell.styles.fillColor = [255, 243, 205];
      } else if (kind === 'regular') {
        data.cell.styles.fillColor = [220, 252, 231];
      } else {
        data.cell.styles.fillColor = [235, 238, 242];
      }
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

  // Lista de materias
  const yAfterCalendar = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Detalle de Materias', 15, yAfterCalendar);

  const materiasData = plan.materias.map(m => [
    m.clave,
    m.materia,
    m.grupo,
    formatHorarios(m),
    `${m.hrs}h`,
    m.modalidad.charAt(0).toUpperCase() + m.modalidad.slice(1),
  ]);

  autoTable(doc, {
    startY: yAfterCalendar + 5,
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

    // Lista de materias
    const yAfterCalendar = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Detalle de Materias', 15, yAfterCalendar);

    const materiasData = plan.materias.map(m => [
      m.clave,
      m.materia,
      m.grupo,
      formatHorarios(m),
      `${m.hrs}h`,
      m.modalidad.charAt(0).toUpperCase() + m.modalidad.slice(1),
    ]);

    autoTable(doc, {
      startY: yAfterCalendar + 5,
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
