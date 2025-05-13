"use client";

export default function StatusFilter({ statusFilter, setStatusFilter }) {
  return (
    <div className="flex flex-wrap gap-4">
      <button 
        className={`px-4 py-2 rounded-md transition-colors ${
          statusFilter === 'todos' ? 'bg-blue-600 text-white' : 
          'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'
        }`}
        onClick={() => setStatusFilter('todos')}
      >
        Todos
      </button>
      <button 
        className={`px-4 py-2 rounded-md transition-colors border ${
          statusFilter === 'recursar' ? 'bg-red-100 border-red-500 text-red-700' : 
          'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'
        }`}
        onClick={() => setStatusFilter('recursar')}
      >
        Recursar
      </button>
      <button 
        className={`px-4 py-2 rounded-md transition-colors border ${
          statusFilter === 'extraordinario' ? 'bg-orange-100 border-orange-500 text-orange-700' : 
          'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'
        }`}
        onClick={() => setStatusFilter('extraordinario')}
      >
        Extraordinario
      </button>
      <button 
        className={`px-4 py-2 rounded-md transition-colors border ${
          statusFilter === 'peligro' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 
          'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'
        }`}
        onClick={() => setStatusFilter('peligro')}
      >
        Peligro
      </button>
    </div>
  );
}
