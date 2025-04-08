// components/FileUploader.js
export default function FileUploader({ onFile1Change, onFile2Change, onProcessFiles }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={onFile1Change}
          placeholder="Base"
          id="file1"
          className="hidden"
        />
        <label
          htmlFor="file1"
          className="rounded-full border border-solid border-transparent transition-colors bg-foreground text-background text-sm h-10 px-4 flex items-center justify-center cursor-pointer hover:opacity-90"
        >
          Selecciona archivo Base
        </label>
        {document.getElementById('file1')?.files[0] && (
          <p className="text-sm text-foreground/80 pl-2">
            Archivo seleccionado: <span className="font-medium">{document.getElementById('file1').files[0].name}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={onFile2Change}
          placeholder="Monitoreos"
          id="file2"
          className="hidden"
        />
        <label
          htmlFor="file2"
          className="rounded-full border border-solid border-transparent transition-colors bg-foreground text-background text-sm h-10 px-4 flex items-center justify-center cursor-pointer hover:opacity-90"
        >
          Selecciona archivo Monitoreos
        </label>
        {document.getElementById('file2')?.files[0] && (
          <p className="text-sm text-foreground/80 pl-2">
            Archivo seleccionado: <span className="font-medium">{document.getElementById('file2').files[0].name}</span>
          </p>
        )}
      </div>

      <button
        onClick={onProcessFiles}
        className="rounded-full border border-solid border-transparent transition-colors bg-foreground text-background text-sm h-10 px-4 hover:opacity-90"
      >
        Procesar Archivos
      </button>
    </div>
  );
}