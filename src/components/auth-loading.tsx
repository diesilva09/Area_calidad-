'use client';

import { Loader2 } from 'lucide-react';

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Verificando sesión...</p>
        <p className="text-gray-400 text-sm mt-2">Por favor espera un momento</p>
      </div>
    </div>
  );
}
