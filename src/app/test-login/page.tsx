'use client';

import { useState } from 'react';
import { useEffect } from 'react';

export default function TestLoginPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Probando login...');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'jefe@calidad.com', 
          password: 'jefe123' 
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      console.log('🔍 Status:', response.status);
      console.log('📋 Data:', data);
      
      if (response.ok) {
        setResult(`✅ Login exitoso: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Error: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setResult(`❌ Error de conexión: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Test Login API</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-4">
            Esta página prueba directamente la API de login
          </p>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Probando...' : 'Probar Login'}
          </button>
          
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Resultado:</h3>
            <pre className="text-xs whitespace-pre-wrap break-all">
              {result}
            </pre>
          </div>
        </div>
        
        <div className="text-center">
          <a href="/" className="text-blue-600 hover:underline">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
