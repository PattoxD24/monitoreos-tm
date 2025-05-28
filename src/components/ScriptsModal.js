"use client";
import { useState, useEffect, useRef } from "react";

export default function ScriptsModal({ visible, onClose, scripts, setScripts }) {
  const [newScriptName, setNewScriptName] = useState("");
  const [newScriptContent, setNewScriptContent] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const textAreaRef = useRef(null);

  const variableList = [
    { label: "Alumno", variable: "{{alumno}}" },
    { label: "Matricula", variable: "{{matricula}}" },
    { label: "NE", variable: "{{ne}}" },
    { label: "NP", variable: "{{np}}" },
    { label: "Ponderacion", variable: "{{ponderacion}}" },
    { label: "SC", variable: "{{sc}}" },
    { label: "Faltas", variable: "{{faltas}}" },
    { label: "Primer Parcial", variable: "{{primerParcial}}" },
    { label: "Segundo Parcial", variable: "{{segundoParcial}}" },
    { label: "Muy Bien", variable: "{{muyBien}}" },
  ]

  // Load scripts from localStorage when component mounts
  useEffect(() => {
    const savedScripts = localStorage.getItem('monitoreo-scripts');
    if (savedScripts) {
      try {
        const parsedScripts = JSON.parse(savedScripts);
        setScripts(parsedScripts);
      } catch (error) {
        console.error('Error parsing scripts from localStorage:', error);
      }
    }
  }, [setScripts]);

  // Save scripts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('monitoreo-scripts', JSON.stringify(scripts));
  }, [scripts]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleAddOrEditScript = () => {
    if (newScriptName && newScriptContent) {
      if (editingIndex !== null) {
        // Editing existing script
        const updatedScripts = scripts.map((script, index) =>
          index === editingIndex ? { name: newScriptName, content: newScriptContent } : script
        );
        setScripts(updatedScripts);
        setEditingIndex(null); // Reset editing mode
      } else {
        // Adding new script
        setScripts([...scripts, { name: newScriptName, content: newScriptContent }]);
      }
      setNewScriptName("");
      setNewScriptContent("");
    }
  };

  const handleRemoveScript = (index) => {
    setScripts(scripts.filter((_, i) => i !== index));
  };

  const handleEditScript = (index) => {
    setEditingIndex(index);
    setNewScriptName(scripts[index].name);
    setNewScriptContent(scripts[index].content);
  };

  const handleClickOutside = (e) => {
    if (e.target.id === "modal-background") onClose();
  };

  const insertVariable = (variable) => {
    const textArea = textAreaRef.current;
    if (textArea) {
      const { selectionStart, selectionEnd, value } = textArea;
      const newValue = value.slice(0, selectionStart) + variable + value.slice(selectionEnd);
      setNewScriptContent(newValue);
      textArea.setSelectionRange(selectionStart + variable.length, selectionStart + variable.length);
      textArea.focus();
    }
  }
  
  if (!visible) return null;

  return (
    <div id="modal-background" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClickOutside}>
      <div className="bg-white p-6 rounded-lg shadow-lg w-4/5">
        <h2 className="text-xl text-gray-800 font-semibold mb-4">Scripts</h2>
        {/* Variable insertion buttons */}
        <div className="flex gap-2 mb-4">
          {variableList.map(({ label, variable }) => (
            <button
              key={variable}
              onClick={() => insertVariable(variable)}
              className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Nombre del Script"
            value={newScriptName}
            onChange={(e) => setNewScriptName(e.target.value)}
            className="border p-2 rounded w-full mb-2 text-gray-600"
          />
          <textarea
            ref={textAreaRef}
            placeholder="Contenido del Script"
            value={newScriptContent}
            onChange={(e) => setNewScriptContent(e.target.value)}
            className="border p-2 rounded w-full mb-2 text-gray-600"
          />
          <button onClick={handleAddOrEditScript} className="bg-blue-500 text-white px-4 py-2 rounded">Agregar Script</button>
        </div>
        <ul className="overflow-y-auto max-h-48">
          {scripts.map((script, index) => (
            <li key={index} className="border-b py-2 flex justify-between items-center text-gray-500">
              <div>
                <p className="font-bold">{script.name}</p>
                <p>{script.content}</p>
              </div>
              <button onClick={() => handleEditScript(index)} className="text-blue-500">Editar</button>
              <button onClick={() => handleRemoveScript(index)} className="text-red-500">Eliminar</button>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="mt-4 bg-gray-300 px-4 py-2 rounded">Cerrar</button>
      </div>
    </div>
  );
}