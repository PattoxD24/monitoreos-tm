"use client";
import { useState, useEffect } from "react";

export default function ScriptsModal({ visible, onClose, scripts, setScripts }) {
  const [newScriptName, setNewScriptName] = useState("");
  const [newScriptContent, setNewScriptContent] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

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

  if (!visible) return null;

  const handleClickOutside = (e) => {
    if (e.target.id === "modal-background") onClose();
  };

  return (
    <div id="modal-background" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClickOutside}>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-xl text-gray-800 font-semibold mb-4">Scripts</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Nombre del Script"
            value={newScriptName}
            onChange={(e) => setNewScriptName(e.target.value)}
            className="border p-2 rounded w-full mb-2 text-gray-600"
          />
          <textarea
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