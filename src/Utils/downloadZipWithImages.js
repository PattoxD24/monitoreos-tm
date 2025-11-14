import JSZip from "jszip";
import html2canvas from "html2canvas";

export default async function downloadZipWithImages(
  studentData,
  filteredData,
  getFilledAColumns,
  reorderColumns,
  visibleColumns,
  setIsLoading
) {

  if(typeof document === "undefined") return;

  setIsLoading(true);

  const zip = new JSZip();
  for (const student of studentData) {
    const tableData = filteredData[student.matricula];
    if (tableData) {
      const filledAColumns = getFilledAColumns(tableData);
      const tableDiv = document.createElement("div");
      tableDiv.style.position = "absolute";
      tableDiv.style.top = "-9999px";
      tableDiv.style.left = "-9999px";
      tableDiv.style.background = "#ffffff";
      tableDiv.style.padding = "16px";
      tableDiv.style.fontFamily = "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
      document.body.appendChild(tableDiv);
      
      const table = document.createElement("table");
      // table.className = "table-fixed";
      // table.style.borderCollapse = "collapse";
      // table.style.border = "1px solid #d1d5db"; // gray-300
      // table.style.fontSize = "12px";
      // table.style.color = "#111827"; // gray-900 for better contrast
      // table.style.width = "100%";
      table.style.tableLayout = "fixed";
      const thead = document.createElement("thead");
      const tbody = document.createElement("tbody");

      // Helpers de formato
      const codeColors = {
        NE: "#FCA5A5", // red-300
        SC: "#FDE68A", // yellow-300
        DA: "#86EFAC", // green-300
        SD: "#93C5FD", // blue-300
      };

      const getPonderadoBg = (num) => {
        if (!Number.isFinite(num)) return null;
        if (num < 50) return "#FCA5A5"; // rojo claro
        if (num < 60) return "#FDBA74"; // orange-300
        if (num < 70) return "#FDE68A"; // amarillo
        return "#159E3D"; // verde
      };

      const styleHeaderCell = (thEl) => {
        thEl.style.border = "1px solid #d1d5db";
        thEl.style.padding = "8px";
        thEl.style.fontSize = "12px";
        thEl.style.fontWeight = "700";
        thEl.style.background = "#F3F4F6"; // gray-100
        thEl.style.color = "#374151"; // gray-700
        thEl.style.textAlign = "left";
        thEl.style.whiteSpace = "nowrap";
      };

      const styleBodyCell = (tdEl, value, colName) => {
        tdEl.style.border = "1px solid #e5e7eb"; // gray-200
        tdEl.style.padding = "8px";
        tdEl.style.fontSize = "12px";
        tdEl.style.color = "#111827"; // gray-900
        tdEl.style.overflow = "hidden";
        tdEl.style.textOverflow = "ellipsis";
        tdEl.style.whiteSpace = "nowrap";

        const raw = typeof value === "string" ? value.trim().toUpperCase() : value;

        // Colores por códigos especiales (NE, SC, DA, SD)
        if (typeof raw === "string" && codeColors[raw]) {
          tdEl.style.background = codeColors[raw];
        }

        // Semáforo para Ponderado (si es numérico)
        if (colName === "Ponderado") {
          const num = parseFloat(raw);
          const bg = getPonderadoBg(num);
          if (bg) tdEl.style.background = bg;
          tdEl.style.fontWeight = "600";
        }
      };

      // Generar el encabezado de la tabla
      const headerRow = document.createElement("tr");
      headerRow.style.background = "#F3F4F6";
      reorderColumns(
        Object.keys(visibleColumns).filter((col) => visibleColumns[col]),
        filledAColumns
      ).forEach((col) => {
        const th = document.createElement("th");
        styleHeaderCell(th);
        th.innerText = col;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Generar las filas de datos
      tableData.forEach((row, rowIndex) => {
        const dataRow = document.createElement("tr");
        // Zebra striping
        if (rowIndex % 2 === 1) {
          dataRow.style.background = "#FAFAFA";
        }
        reorderColumns(
          Object.keys(visibleColumns).filter((col)=>visibleColumns[col]),
          filledAColumns
        ).forEach((col) => {
          const td = document.createElement("td");
          const cellValue = row[col] ?? "";
          styleBodyCell(td, cellValue, col);
          td.innerText = cellValue;
          dataRow.appendChild(td);
        });
        tbody.appendChild(dataRow);
      });
      table.appendChild(tbody);
      tableDiv.appendChild(table);
      
      const canvas = await html2canvas(tableDiv);
      const imgData = canvas.toDataURL("image/png");
      zip.file(`${student.matricula}.png`, imgData.split(",")[1], { base64: true });
      document.body.removeChild(tableDiv);
    }
  }
  
  zip.generateAsync({ type: "blob" }).then((content) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "tablas_estudiantes.zip";
    link.click();
    setIsLoading(false);
  });
}