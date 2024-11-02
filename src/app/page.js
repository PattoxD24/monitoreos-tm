"use client";

import Image from "next/image";
import { useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import html2canvas from "html2canvas";
import FileUploader from "../components/FileUploader";
import StudentCard from "../components/StudentCard";
import StudentModal from "../components/StudentModal";
import ColumnSelector from "../components/ColumnSelector";
import SearchBar from "../components/SearchBar";

export default function Home() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [studentData, setStudentData] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [filteredData, setFilteredData] = useState({});
  const [columns, setColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("original");
  const [isAscending, setIsAscending] = useState(true);

  const defaultVisibleColumns = {
    Matrícula: true,
    "Nombre del alumno": true,
    "Nombre de la materia": true,
    "# Grupo": true,
    "Límite de faltas": true,
    "Faltas del alumno": true,
    "Límite de NE": true,
    "NE alumno": true,
    Ponderado: true,
  };

  const handleFile1Change = (e) => {
    setFile1(e.target.files[0]);
  };

  const handleFile2Change = (e) => {
    setFile2(e.target.files[0]);
  };


  const handleProcessFiles = async () => {
    if (!file1 || !file2) {
      alert("Por favor, sube ambos archivos.");
      return;
    }

    try {
      const [data1, data2] = await Promise.all([readExcel(file1), readExcel(file2)]);
      const matriculas = new Set(data1.map((row) => row.MATRICULA));
      const filtered = data2.filter((row) => matriculas.has(row.Matrícula));

      // Extraer datos de los alumnos y generar nombre preferido en mayúsculas
      const studentData = data1.map((row) => {
        const names = row.ALUMNOS.split(" ");
        const preferredNameIndex = parseInt(row.favName, 10) - 1;
        const preferredName = names[preferredNameIndex]?.toUpperCase() || names[0].toUpperCase();

        return {
          matricula: row.MATRICULA,
          fullName: row.ALUMNOS,
          preferredName,
        };
      });

      // Agrupar por matrícula para el modal de detalles
      const groupedData = filtered.reduce((acc, row) => {
        const matricula = row.Matrícula;
        if (!acc[matricula]) acc[matricula] = [];
        acc[matricula].push(row);
        return acc;
      }, {});

      // Obtener columnas excluyendo las "A" y aplicar visibilidad predeterminada
      const uniqueColumns = Object.keys(filtered[0] || {}).filter(
        (col) => !/^A\d+$/.test(col)
      );
      const initialVisibleColumns = uniqueColumns.reduce((acc, col) => {
        acc[col] = defaultVisibleColumns[col] || false;
        return acc;
      }, {});

      setStudentData(studentData);
      setColumns(uniqueColumns);
      setVisibleColumns(initialVisibleColumns);
      setFilteredData(groupedData);
    } catch (error) {
      console.error("Error al procesar archivos:", error);
    }
  };

  const readExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
  };

  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const getFilledAColumns = (rows) => {
    const maxColumns = 50;
    const alphanumericPattern = /^[a-zA-Z0-9]+$/;

    return Array.from({ length: maxColumns }, (_, i) => `A${i + 1}`).filter((col) =>
      rows.some((row) => alphanumericPattern.test(row[col] || ""))
    );
  };

  const reorderColumns = (columnsToDisplay, aColumns) => {
    const indexOfPonderado = columnsToDisplay.indexOf("Ponderado");
    if (indexOfPonderado === -1) return [...columnsToDisplay, ...aColumns];

    return [
      ...columnsToDisplay.slice(0, indexOfPonderado),
      ...aColumns,
      ...columnsToDisplay.slice(indexOfPonderado),
    ];
  };

  const openModal = (student) => {
    setSelectedStudent(student);
  };

  const closeModal = () => {
    setSelectedStudent(null);
  };

  // Calcular número de "NE" y mínimo "Ponderado" por estudiante
  const calculateSortingCriteria = (student) => {
    const studentMatricula = student.matricula;
    const studentSubjects = filteredData[studentMatricula] || [];
  
    let neCount = 0;
    let minPonderado = Infinity;
  
    studentSubjects.forEach((subject) => {
      const lastAColumn = Object.keys(subject)
        .filter((col) => /^A\d+$/.test(col) && subject[col])
        .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
        .pop();
  
      if (lastAColumn && subject[lastAColumn] === "NE") {
        neCount += 1;
      }
  
      if (subject.Ponderado && !isNaN(subject.Ponderado)) {
        minPonderado = Math.min(minPonderado, parseInt(subject.Ponderado));
      }
    });
  
    // Determinar el color de fondo según el valor de `minPonderado`
    let backgroundColor = "";
    if (minPonderado < 70) {
      backgroundColor = "#FFCCCC"; // Rojo suave
    } else if (minPonderado >= 70 && minPonderado <= 75) {
      backgroundColor = "#FFD9B3"; // Naranja suave
    } else if (minPonderado >= 76 && minPonderado <= 84) {
      backgroundColor = "#FFFFCC"; // Amarillo suave
    } else {
      backgroundColor = "#CCFFCC"; // Verde suave
    }
  
    return { neCount, minPonderado, backgroundColor };
  };

  const sortStudents = (students) => {
    return [...students].sort((a, b) => {
      let comparison = 0;
      if (sortOrder === "matricula") {
        comparison = a.matricula.localeCompare(b.matricula);
      } else if (sortOrder === "nombre") {
        comparison = a.preferredName.localeCompare(b.preferredName);
      } else if (sortOrder === "original") {
        comparison = (a.neCount !== b.neCount ) ? b.neCount - a.neCount : a.minPonderado - b.minPonderado;
      }
      return isAscending ? comparison : -comparison;
    });
  };
  
  // Ordenar los estudiantes
  const sortedStudents = sortStudents([...studentData].map((student) => {
    const criteria = calculateSortingCriteria(student);
    return { ...student, ...criteria };
  }));

  // Filtrar los estudiantes según el término de búsqueda
  const filteredStudents = sortedStudents.filter((student) => {
    const search = searchTerm.toLowerCase();
    return (
      student.matricula.toLowerCase().includes(search) ||
      student.preferredName.toLowerCase().includes(search) ||
      student.fullName.toLowerCase().includes(search)
    );
  });

  const handleSortChange = (e) => setSortOrder(e.target.value);
  const toggleSortDirection = () => setIsAscending(!isAscending);

  const handleDeleteStudent = (matricula) => {
    setStudentData((prevData) => {
      const updatedData = prevData.filter((student) => student.matricula !== matricula);
      const archivedStudent = prevData.find((student) => student.matricula === matricula);
      setArchivedStudents((prevArchived) => {
        if (!prevArchived.some((student) => student.matricula === matricula)) {
          return [...prevArchived, archivedStudent]; 
        }
        return prevArchived;
      });
      return updatedData;
    });
  };

  const restoreStudent = (matricula) => {
    setArchivedStudents((prevArchived) => {
      const updatedArchived = prevArchived.filter((student) => student.matricula !== matricula);
      const restoredStudent = prevArchived.find((student) => student.matricula === matricula);
      setStudentData((prevData) => {
        if (!prevData.some((student) => student.matricula === matricula)) {
          return [...prevData, restoredStudent];
        }
        return prevData;
      })
      return updatedArchived;
    });
  };

  const downloadZipWithImages = async () => {
    setIsLoading(true);
    const zip = new JSZip();

    for (const student of studentData) {
      const tableData = filteredData[student.matricula];
      if (tableData) {
        const filledAColumns = getFilledAColumns(tableData);
        // Crear una tabla oculta para capturar la imagen
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

        // Capturar la tabla como imagen
        const canvas = await html2canvas(tableDiv);
        const imgData = canvas.toDataURL("image/png");

        // Añadir la imagen al archivo zip
        const imgName = `${student.matricula}.png`;
        zip.file(imgName, imgData.split(",")[1], { base64: true });

        // Eliminar la tabla oculta del DOM
        document.body.removeChild(tableDiv);
      }
    }

    // Generar y descargar el archivo zip
    zip.generateAsync({ type: "blob" }).then((content) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "tablas_estudiantes.zip";
      link.click();
      setIsLoading(false);
    });
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full">
        <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={180} height={38} priority />

        <h1 className="text-2xl font-bold">Cargar Archivos de Matrícula</h1>

        {/* Cargar Archivos */}
        <FileUploader onFile1Change={handleFile1Change} onFile2Change={handleFile2Change} onProcessFiles={handleProcessFiles} />


        {Object.keys(filteredData).length > 0 && (
          <div>
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="rounded-full bg-blue-500 text-white px-4 py-2 mt-4"
            >
              Columnas
            </button>
            <button
            onClick={downloadZipWithImages}
            className="rounded-full bg-green-500 text-white px-4 py-2 mt-4"
          >
            Descargar Imágenes como ZIP
          </button>

            {/* Selector de Columnas */}
            {showColumnSelector && (
              <ColumnSelector columns={columns} visibleColumns={visibleColumns} toggleColumnVisibility={toggleColumnVisibility} />
            )}
            <div className="mt-4">
              {/* Barra de búsqueda */}
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

              {/* Selector de orden */}
              <select
                value={sortOrder}
                onChange={handleSortChange}
                className="border rounded-lg p-2 text-gray-700"
              >
                <option value="original">Orden original (NE/Ponderación)</option>
                <option value="matricula">Matrícula</option>
                <option value="nombre">Nombre</option>
              </select>

              {/* Botón para alternar entre ascendente y descendente */}
              <button
                onClick={toggleSortDirection}
                className="p-2 border rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                {isAscending ? "Ascendente" : "Descendente"}
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="flex flex-col items-center">
              <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin mb-4"></div>
              <p className="text-white text-lg">Generando archivo ZIP...</p>
            </div>
          </div>
        )} 

        {/* Tarjetas de Estudiantes */}
        <div className="grid grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] gap-4 mt-8 w-full">
          {filteredStudents.map((student) => (
            <StudentCard key={student.matricula} student={student} onClick={openModal} onDelete={handleDeleteStudent}/>
          ))}
        </div>

        {/* Sección de Archivados */}
        {archivedStudents.length > 0 && (
          <div className="mt-10 w-full">
            <h2 className="text-xl font-bold mb-4">Archivados</h2>
            <div className="grid grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] gap-4">
              {archivedStudents.map((student) => (
                <StudentCard
                  key={student.matricula}
                  student={student}
                  onClick={() => restoreStudent(student.matricula)} 
                  onDelete={"none"} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Modal de Detalles */}
        {selectedStudent && (
          <StudentModal
            student={selectedStudent}
            filteredData={filteredData}
            columns={columns}
            visibleColumns={visibleColumns}
            closeModal={closeModal}
            reorderColumns={reorderColumns}
            getFilledAColumns={getFilledAColumns}
          />
        )}
      </main>
    </div>
  );
}