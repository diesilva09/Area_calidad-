export function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Cargando datos del módulo de supervisores...</p>
      </div>
    </div>
  );
}
