'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { verifyEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setResult({
        success: false,
        message: 'Token de verificación no proporcionado'
      });
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const verificationResult = await verifyEmail(token);
        setResult(verificationResult);
      } catch (error) {
        setResult({
          success: false,
          message: 'Error al verificar el correo electrónico'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, verifyEmail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verificando correo electrónico...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            result?.success ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {result?.success ? (
              <CheckCircle className="h-8 w-8 text-white" />
            ) : (
              <AlertCircle className="h-8 w-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {result?.success ? 'Correo Verificado' : 'Error de Verificación'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {result?.success ? '¡Verificación Exitosa!' : 'Verificación Fallida'}
            </CardTitle>
            <CardDescription className="text-center">
              {result?.success 
                ? 'Tu correo electrónico ha sido verificado correctamente'
                : 'No pudimos verificar tu correo electrónico'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className={`mb-6 ${
              result?.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              {result?.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={
                result?.success ? 'text-green-800' : 'text-red-800'
              }>
                {result?.message}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {result?.success ? (
                <Button 
                  onClick={() => router.push('/login')} 
                  className="w-full"
                >
                  Iniciar Sesión
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push('/login')} 
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Inicio de Sesión
                  </Button>
                  <Button 
                    onClick={() => router.push('/login')} 
                    className="w-full"
                  >
                    Reenviar Correo de Verificación
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
