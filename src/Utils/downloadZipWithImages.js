import JSZip from "jszip";
import html2canvas from "html2canvas";

export default async function downloadZipWithImages(studentData, filteredData, getFilledAColumns, reorderColumns, visibleColumns, setIsLoading) {

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
      document.body.appendChild(tableDiv);
      
      const table = document.createElement("table");
      table.className = "table-fixed border-collapse border border-gray-300";
      const thead = document.createElement("thead");
      const tbody = document.createElement("tbody");

      // Generar el encabezado de la tabla
      const headerRow = document.createElement("tr");
      reorderColumns(Object.keys(visibleColumns).filter((col) => visibleColumns[col]),filledAColumns).forEach((col) => {
        const th = document.createElement("th");
        th.style.border = "1px solid #ccc";
        th.style.padding = "8px";
        th.style.fontSize = "12px";
        th.style.color = "#333";
        th.innerText = col;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Generar las filas de datos
      tableData.forEach((row) => {
        const dataRow = document.createElement("tr");
        reorderColumns(Object.keys(visibleColumns).filter((col)=>visibleColumns[col]),filledAColumns).forEach((col) => {
          const td = document.createElement("td");
          td.style.border = "1px solid #ccc";
          td.style.padding = "8px";
          td.style.fontSize = "12px";
          td.style.color = "#333";
          td.innerText = row[col] || "";
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