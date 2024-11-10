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

  useEffect(() => {
    if (onDelete !== null) {
      calculatePonderadoAverage();
      calculateFaltasPercentage();
      calculateCounts();
    }
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
