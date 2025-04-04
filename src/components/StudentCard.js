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
  const [materiasConFaltas, setMateriasConFaltas] = useState([]);

  useEffect(() => {
    if (onDelete !== null) {
      calculatePonderadoAverage();
      calculateFaltasPercentage();
      calculateCounts();
      calculateMateriasConFaltas();
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

  const calculateMateriasConFaltas = () => {
    const materiasConMasFaltas = studentData
      .filter(row => {
        const faltasAlumno = parseFloat(row["Faltas del alumno"]) || 0;
        const limiteFaltas = parseFloat(row["Límite de faltas"]) || 0;
        
        // Calcular porcentaje de faltas para esta materia
        const porcentaje = limiteFaltas > 0 ? (faltasAlumno / limiteFaltas) * 100 : 0;
        return porcentaje >= 50;
      })
      .map(row => {
        const faltasAlumno = parseFloat(row["Faltas del alumno"]) || 0;
        const limiteFaltas = parseFloat(row["Límite de faltas"]) || 1;
        const porcentaje = (faltasAlumno / limiteFaltas) * 100;
        
        return {
          nombre: row.Materia || "Materia sin nombre",
          porcentaje: porcentaje,
          color: getFaltasBarColor(porcentaje)
        };
      });
    
    setMateriasConFaltas(materiasConMasFaltas);
  };

  const getFaltasBarColor = (porcentaje) => {
    if (porcentaje > 100) return "bg-black";
    if (porcentaje >= 75) return "bg-red-500";
    if (porcentaje >= 60) return "bg-orange-500";
    return "bg-yellow-500";
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

          {materiasConFaltas.length > 0 && (
            <div className="mt-5 w-full">
              <div className="flex w-full h-2 gap-0.5">
                {materiasConFaltas.map((materia, index) => (
                  <div
                    key={index}
                    // className={`h-full rounded-md ${materia.color}`}
                    className={`h-full rounded-md ${materia.color}`}
                    style={{ width: `${100 / materiasConFaltas.length}%` }}
                    title={`${materia.nombre} - ${materia.porcentaje.toFixed(0)}% faltas`}
                  ></div>
                ))}
              </div>
            </div>
          )}

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
