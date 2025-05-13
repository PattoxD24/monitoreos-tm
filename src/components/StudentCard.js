// components/StudentCard.js
import { useEffect, useState } from "react";

const getBecaIcon = (tipoBeca) => {
  if (!tipoBeca) return null;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
    <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 0 1 .672 0 41.059 41.059 0 0 1 8.198 5.424.75.75 0 0 1-.254 1.285 31.372 31.372 0 0 0-7.86 3.83.75.75 0 0 1-.84 0 31.508 31.508 0 0 0-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 0 1 3.305-2.033.75.75 0 0 0-.714-1.319 37 37 0 0 0-3.446 2.12A2.216 2.216 0 0 0 6 9.393v.38a31.293 31.293 0 0 0-4.28-1.746.75.75 0 0 1-.254-1.285 41.059 41.059 0 0 1 8.198-5.424ZM6 11.459a29.848 29.848 0 0 0-2.455-1.158 41.029 41.029 0 0 0-.39 3.114.75.75 0 0 0 .419.74c.528.256 1.046.53 1.554.82-.21.324-.455.63-.739.914a.75.75 0 1 0 1.06 1.06c.37-.369.69-.77.96-1.193a26.61 26.61 0 0 1 3.095 2.348.75.75 0 0 0 .992 0 26.547 26.547 0 0 1 5.93-3.95.75.75 0 0 0 .42-.739 41.053 41.053 0 0 0-.39-3.114 29.925 29.925 0 0 0-5.199 2.801 2.25 2.25 0 0 1-2.514 0c-.41-.275-.826-.541-1.25-.797a6.985 6.985 0 0 1-1.084 3.45 26.503 26.503 0 0 0-1.281-.78A5.487 5.487 0 0 0 6 12v-.54Z" clipRule="evenodd" />
  </svg>
  
  );
};

const getEquipoIcon = (equipo) => {
  if (!equipo) return null;
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M15.929 19.487c0 .035.264.2.592.364 1.578.835 2.55 1.742 2.914 2.75.164.435.171.592.028.92-.178.436-.207.429.95.393 1.043-.035 1.657-.15 1.657-.314 0-.078-.857-.885-1.171-1.093a1.431 1.431 0 0 1-.186-.15 7.636 7.636 0 0 0-.321-.257 11.96 11.96 0 0 1-.372-.278 6.126 6.126 0 0 0-.25-.193l-.45-.35a4.642 4.642 0 0 0-.535-.357c-.328-.178-.528-.307-.571-.357-.05-.057-1.036-.593-1.5-.814-.214-.1-.45-.214-.514-.25-.157-.086-.271-.093-.271-.014zm-5.75-1.536a4.78 4.78 0 0 0-.056.415c-.043.5-.379 1.164-.764 1.52-.465.436-.75.572-.993.48a3.353 3.353 0 0 0-.628-.115c-.357-.043-.486-.022-.657.078-.186.108-.222.179-.222.4 0 .315-.007.307.257.165a1.02 1.02 0 0 1 .3-.108c.15 0 .093.143-.093.229-.207.093-.264.271-.278.828-.007.422.121.586.236.286.035-.093.17-.221.3-.293A1.42 1.42 0 0 0 8 21.43c.186-.314.286-.364.286-.15 0 .457.236.479.436.036.121-.243.186-.307.271-.271.236.1.515.114.615.028.1-.086.092-.114-.043-.257-.086-.093-.15-.179-.129-.193.157-.114.5-.193.85-.193.628 0 .714-.107.714-.914 0-.82-.214-1.406-.564-1.556-.179-.072-.236-.079-.257-.008zM22.535 1.062a1.22 1.22 0 0 0-.193.315c-.414.885-1.785 1.72-3.949 2.392-.193.064-.535.164-.75.236-.214.064-.635.2-.928.285-3.635 1.107-4.27 1.678-5.57 4.963-.586 1.472-.893 1.964-1.5 2.364-.507.343-.92.457-2.07.6-1.829.221-2.536.436-3.107.943-.35.3-.464.614-.464 1.242 0 .286-.029.536-.057.557-.036.022-.1.214-.15.436-.072.3-.072.45-.007.643.1.292.378.535.628.535.178 0 .186-.05.05-.371-.029-.079.014-.179.136-.307.157-.157.235-.179.72-.179.558 0 .744-.057 1.008-.3.15-.135.157-.135.357.086.421.464 1.52 1.121 2.892 1.735.65.293 1.057.643 1.364 1.186.207.357.236.457.236.97 0 .836-.3 1.408-.886 1.68-.1.05-.243.113-.307.15-.071.035-.336.063-.593.063H8.93l-.15.336a8.087 8.087 0 0 1-.25.528c-.078.158-.078.208 0 .322.093.121.122.107.464-.243.358-.364.579-.471.579-.271 0 .057-.129.2-.279.321-.35.278-.4.478-.235.95.135.385.314.5.357.235.014-.078.121-.235.235-.35.115-.107.208-.242.208-.292 0-.05.05-.129.107-.179.157-.128.221.1.121.457-.064.243-.057.314.036.414.071.079.093.186.064.307-.029.129-.014.179.05.179.1 0 .336-.221.336-.314 0-.029.064-.15.15-.264.15-.215.157-.258.021-1.014-.021-.143-.014-.265.014-.265.15 0 .664.329.693.443.05.186.264.079.264-.136a.802.802 0 0 0-.428-.678c-.236-.1-.279-.257-.086-.314.45-.143.871-.4 1.25-.779.457-.442.535-.535.828-.964.407-.592.786-.857 1.221-.857.6 0 2.485.843 3.942 1.764.679.429 2.007 1.357 2.228 1.557.043.043.286.221.543.407.257.179.7.521.986.764.285.236.542.436.57.436.236 0 .315-.614.108-.8a5.417 5.417 0 0 0-.557-.343c-.521-.293-1.528-.971-1.964-1.335-.985-.807-2.242-2.385-3.078-3.864a9.517 9.517 0 0 1-.278-.485c-.6-1.05-1.743-2.385-2.05-2.385-.121 0-.121-.008.072-.929.057-.293.142-.792.185-1.107.129-.87.314-1.863.45-2.356.386-1.45 1.207-2.457 2.7-3.3 2.092-1.192 2.927-1.928 3.527-3.12.322-.636.386-.793.579-1.507.1-.364.221-1.25.171-1.25a.391.391 0 0 0-.1.057zM3.496.484C1.839 2.198 1.003 3.926 1.003 5.647c0 .393.029.729.072.75.043.021.071.114.071.2 0 .2.172.693.4 1.157.3.621.736 1.057 1.921 1.914.929.67 1.443 1.428 1.614 2.385l.093.514.257-.107c.65-.279 1.15-.379 2.642-.536.957-.1 1.328-.243 1.771-.678.629-.629.329-1.036-1.635-2.2-2.114-1.257-2.87-1.842-3.692-2.863-.657-.822-.993-1.5-1.157-2.343-.157-.785.057-2.028.536-3.142.135-.328.25-.614.25-.642 0-.15-.236.007-.65.428z" clipRule="evenodd"/>
    </svg>
  );
};

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
  const [isBecaFront, setIsBecaFront] = useState(true);

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
      className='relative flex flex-col justify-between cursor-pointer p-4 border rounded-lg shadow hover:shadow-lg transition bg-white dark:bg-gray-700 dark:border-gray-600'
      style={{ backgroundColor: student.backgroundColor }}
    >
      {/* Badges Container */}
      <div className="absolute -top-3 left-4 flex">
        {student.beca && student.equipoRepresentativo && (
          <div className="relative h-6">
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setIsBecaFront(!isBecaFront);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsBecaFront(!isBecaFront);
                }
              }}
              className="focus:outline-none"
            >
              <div
                className={`absolute transition-all duration-300 ease-in-out ${
                  isBecaFront
                    ? "z-20 translate-y-0 translate-x-0"
                    : "z-10 -translate-y-1 -translate-x-1"
                }`}
              >
                <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-400 shadow-sm">
                  {getBecaIcon(student.beca)}
                  <span>{student.beca}</span>
                </div>
              </div>
              <div
                className={`absolute transition-all duration-300 ease-in-out ${
                  !isBecaFront
                    ? "z-20 translate-y-0 translate-x-0"
                    : "z-10 -translate-y-1 -translate-x-1"
                }`}
              >
                <div className="flex items-center space-x-1 bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-400 shadow-sm">
                  {getEquipoIcon(student.equipoRepresentativo)}
                  <span>{student.equipoRepresentativo}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Mostrar badges individuales si solo existe uno */}
        {student.beca && !student.equipoRepresentativo && (
          <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-400 shadow-sm">
            {getBecaIcon(student.beca)}
            <span>{student.beca}</span>
          </div>
        )}
        {!student.beca && student.equipoRepresentativo && (
          <div className="flex items-center space-x-1 bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-400 shadow-sm">
            {getEquipoIcon(student.equipoRepresentativo)}
            <span>{student.equipoRepresentativo}</span>
          </div>
        )}
      </div>

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
              <span className='absolute -bottom-2 right-0 bg-white text-xs rounded-full w-5 h-5 flex items-center justify-center border border-gray-300 dark:border-gray-600'>
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
              <span className='absolute -bottom-2 right-0 bg-white text-xs rounded-full w-5 h-5 flex items-center justify-center border border-gray-300 dark:border-gray-600'>
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
              <span className='absolute -bottom-2 right-0 bg-white dark:bg-gray-800 text-xs rounded-full w-5 h-5 flex items-center justify-center border border-gray-300 dark:border-gray-600'>
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
