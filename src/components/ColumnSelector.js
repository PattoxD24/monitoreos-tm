// components/ColumnSelector.js

export default function ColumnSelector({ columns, visibleColumns, toggleColumnVisibility }) {
  return (
    <div className="mt-4 p-4 border rounded-md bg-gray-100">
      <h3 className="font-semibold text-black">Selecciona las columnas a mostrar:</h3>
      <div className="grid grid-rows-[repeat(11,minmax(0,1fr))] grid-flow-col gap-2 text-black mt-2 w-full">
        {columns.map((col) => (
          <label key={col} className="flex items-center">
            <input
              type="checkbox"
              checked={visibleColumns[col]}
              onChange={() => toggleColumnVisibility(col)}
            />
            <span className="ml-2">{col}</span>
          </label>
        ))}
      </div>
    </div>
  );
}