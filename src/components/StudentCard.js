// components/StudentCard.js
import { useEffect, useState } from "react";

export default function StudentCard({
  student,
  studentsData,
  onClick,
  onDelete,
}) {
  const [ponderadoAverage, setPonderadoAverage] = useState(0);
  const [faltasPercentage, setFaltasPercentage] = useState(0);
  const [neCount, setNeCount] = useState(0);
  const [scCount, setScCount] = useState(0);
  const [daCount, setDaCount] = useState(0);
  const [sdCount, setSdCount] = useState(0);
  const [todasLasMaterias, setTodasLasMaterias] = useState([]);

  useEffect(() => {
    if (onDelete !== null) {
      calculatePonderadoAverage();
      calculateFaltasPercentage();
      calculateCounts();
      calculateTodasLasMaterias();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentsData]);

  const studentData = studentsData[student.matricula] || [];

  const calculatePonderadoAverage = () => {
    const ponderadoValues = studentData
      .map((row) => parseFloat(row.Ponderado))
      .filter((value) => !isNaN(value));

    const average =
      ponderadoValues.length > 0
        ? ponderadoValues.reduce((sum, value) => sum + value, 0) /
          ponderadoValues.length
        : 0;

    setPonderadoAverage(average.toFixed(2));
  };

  const calculateFaltasPercentage = () => {
    const faltasInfo = studentData.map((row) => ({
      faltasAlumno: parseFloat(row["Faltas del alumno"]),
      limiteFaltas: parseFloat(row["Límite de faltas"]),
    }));

    const totalFaltas = faltasInfo.reduce(
      (sum, { faltasAlumno }) => sum + (faltasAlumno || 0),
      0
    );
    const totalLimiteFaltas = faltasInfo.reduce(
      (sum, { limiteFaltas }) => sum + (limiteFaltas || 0),
      0
    );

    const percentage =
      totalLimiteFaltas > 0 ? (totalFaltas / totalLimiteFaltas) * 100 : 0;
    setFaltasPercentage(percentage.toFixed(2));
  };

  const calculateCounts = () => {
    let ne = 0,
      sc = 0,
      da = 0,
      sd = 0;

    studentData.forEach((row) => {
      Object.keys(row).forEach((column) => {
        if (/^A\d+$/.test(column)) {
          if (row[column] === "NE") ne++;
          if (row[column] === "SC") sc++;
          if (row[column] === "DA") da++;
        }
      });

      if (row.Ponderado === "SD") {
        sd++;
      }
    });

    setNeCount(ne);
    setScCount(sc);
    setDaCount(da);
    setSdCount(sd);
  };

  const calculateTodasLasMaterias = () => {
    // Verificar cómo son los datos de las materias
    // Asumiendo que cada fila puede representar una materia
    const todasMaterias = studentData
      .filter(row => {
        // Asegurar que la fila sea un objeto válido
        return row && typeof row === 'object' && Object.keys(row).length > 0;
      })
      .map((row, index) => {
        // Intentar encontrar el nombre de la materia o usar un índice
        let nombreMateria = 
          row.Materia || 
          row.materia || 
          row.NombreMateria || 
          row.nombreMateria || 
          row.nombre_materia ||
          row['Nombre de la materia'] ||
          row.Asignatura;
          
        // Si no hay nombre específico, intentar usar un identificador único
        if (!nombreMateria) {
          // Buscar cualquier campo que pueda identificar la materia
          const posiblesIdentificadores = Object.keys(row).filter(key => 
            typeof row[key] === 'string' && 
            !key.includes("Faltas") && 
            !key.includes("Límite") &&
            !key.includes("Ponderado")
          );
          
          if (posiblesIdentificadores.length > 0) {
            nombreMateria = row[posiblesIdentificadores[0]];
          } else {
            nombreMateria = `Materia ${index + 1}`;
          }
        }
        
        // Buscar datos de faltas en diferentes formas posibles
        let faltasAlumno = 0;
        if (row["Faltas del alumno"] !== undefined) {
          faltasAlumno = parseFloat(row["Faltas del alumno"]) || 0;
        } else if (row.faltas !== undefined) {
          faltasAlumno = parseFloat(row.faltas) || 0;
        } else {
          // Buscar cualquier campo que contenga "falta" o "asistencia"
          const campoFaltas = Object.keys(row).find(key => 
            key.toLowerCase().includes("falta") || 
            key.toLowerCase().includes("asistencia")
          );
          if (campoFaltas) {
            faltasAlumno = parseFloat(row[campoFaltas]) || 0;
          }
        }
        
        // Buscar límite de faltas
        let limiteFaltas = 1; // Valor mínimo para evitar división por cero
        if (row["Límite de faltas"] !== undefined) {
          limiteFaltas = parseFloat(row["Límite de faltas"]) || 1;
        } else if (row.limite !== undefined) {
          limiteFaltas = parseFloat(row.limite) || 1;
        } else {
          // Buscar cualquier campo que contenga "limite" o "máximo"
          const campoLimite = Object.keys(row).find(key => 
            key.toLowerCase().includes("limite") || 
            key.toLowerCase().includes("máximo") ||
            key.toLowerCase().includes("maximo")
          );
          if (campoLimite) {
            limiteFaltas = parseFloat(row[campoLimite]) || 1;
          }
        }
        
        const porcentaje = (faltasAlumno / limiteFaltas) * 100;
        
        return {
          nombre: nombreMateria,
          porcentaje: porcentaje,
          color: getFaltasBarColor(porcentaje)
        };
      });
    
    setTodasLasMaterias(todasMaterias);
  };

  const getFaltasBarColor = (porcentaje) => {
    if (porcentaje > 100) return "bg-black h-3";
    if (porcentaje == 100) return "bg-blue-300 h-3 border border-black"
    if (porcentaje >= 75) return "bg-red-700";
    if (porcentaje >= 60) return "bg-orange-500";
    if (porcentaje >= 50) return "bg-yellow-500";
    return "bg-green-700"; // Menor al 50% en verde
  };

  const getCircleBackgroundColor = (count, color) =>
    count > 0 ? color : "bg-gray-300 hidden";

  return (
    <div
      onClick={() => onClick(student)}
      className='relative flex flex-col justify-between cursor-pointer p-4 border rounded-lg shadow hover:shadow-lg transition'
      style={{ backgroundColor: student.backgroundColor }}
    >
      <h2 className='text-lg font-bold text-gray-600'>{student.matricula}</h2>
      <p className='text-sm font-semibold text-blue-600'>
        {student.preferredName}
      </p>
      <p className='text-sm text-gray-700'>{student.fullName}</p>

      {onDelete && (
        <>
          <p className='text-sm text-gray-700 mt-2'>
            <strong>Promedio:</strong> {ponderadoAverage}
          </p>
          <p className='text-sm text-gray-700'>
            <strong>Faltas %:</strong> {faltasPercentage}%
          </p>
          <p className='text-xs text-gray-500'>Cantidad de materias: {todasLasMaterias.length}</p>
        </>
      )}
      {onDelete && (
        <>
          <div className='flex justify-center space-x-2 mt-4'>
            <div
              className={`relative w-10 h-10 rounded-full ${getCircleBackgroundColor(
                neCount,
                "bg-red-300"
              )} flex items-center justify-center text-gray-700 font-bold`}
            >
              NE
              <span className='absolute -bottom-2 right-0 bg-white text-xs rounded-full w-5 h-5 flex items-center justify-center border border-gray-300'>
                {neCount}
              </span>
            </div>
            <div
              className={`relative w-10 h-10 rounded-full ${getCircleBackgroundColor(
                scCount,
                "bg-yellow-300"
              )} flex items-center justify-center text-gray-700 font-bold`}
            >
              SC
              <span className='absolute -bottom-2 right-0 bg-white text-xs rounded-full w-5 h-5 flex items-center justify-center border border-gray-300'>
                {scCount}
              </span>
            </div>
            <div
              className={`relative w-10 h-10 rounded-full ${getCircleBackgroundColor(
                daCount,
                "bg-green-300"
              )} flex items-center justify-center text-gray-700 font-bold`}
            >
              DA
              <span className='absolute -bottom-2 right-0 bg-white text-xs rounded-full w-5 h-5 flex items-center justify-center border border-gray-300'>
                {daCount}
              </span>
            </div>
            <div
              className={`relative w-10 h-10 rounded-full ${getCircleBackgroundColor(
                sdCount,
                "bg-blue-300"
              )} flex items-center justify-center text-gray-700 font-bold`}
            >
              SD
              <span className='absolute -bottom-2 right-0 bg-white text-xs rounded-full w-5 h-5 flex items-center justify-center border border-gray-300'>
                {sdCount}
              </span>
            </div>
          </div>

          <div className="mt-5 w-full">
            {todasLasMaterias.length > 0 ? (
              <div className="flex w-full h-2 gap-0.5 items-center">
                {todasLasMaterias.map((materia, index) => (
                  <div
                    key={index}
                    className={`h-full rounded-md ${materia.color}`}
                    style={{ width: `${100 / todasLasMaterias.length}%` }}
                    title={`${materia.nombre} - ${materia.porcentaje.toFixed(0)}% faltas`}
                  ></div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center">No hay datos de materias</div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(student.matricula);
            }}
            className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition'
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}
