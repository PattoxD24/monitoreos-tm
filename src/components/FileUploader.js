// components/FileUploader.js

export default function FileUploader({ onFile1Change, onFile2Change, onProcessFiles }) {
  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={onFile1Change}
      />
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={onFile2Change}
      />
      <button
        onClick={onProcessFiles}
        className="rounded-full border border-solid border-transparent transition-colors bg-foreground text-background text-sm h-10 px-4"
      >
        Procesar Archivos
      </button>
    </div>
  );
}