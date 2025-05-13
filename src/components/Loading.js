export default function Loading({ isLoading }) {
  return (
    <> 
    {isLoading && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50">
        <div className="flex flex-col items-center">
            <div className="loader border-t-4 border-blue-500 dark:border-blue-400 rounded-full w-12 h-12 animate-spin mb-4"></div>
          <p className="text-white text-lg">Generando archivo ZIP...</p>
        </div>
      </div>
    )} 
    </>
  )
};