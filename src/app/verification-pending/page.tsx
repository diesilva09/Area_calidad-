'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function VerificationPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setTimeLeft(60);
        toast({
          title: 'Correo reenviado',
          description: 'Correo de verificación reenviado. Revisa tu bandeja de entrada.',
        });
      } else {
        toast({
          title: 'Error al reenviar',
          description: String(data?.error || 'Error al reenviar correo'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error al reenviar correo:', error);
      toast({
        title: 'Error de conexión',
        description: 'Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center mb-8">
          <Link href="/login">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Login
            </Button>
          </Link>
          
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Mail className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📧 Verificación de Correo Requerida
          </h1>
          <p className="text-gray-600 mb-6">
            Revisa tu bandeja de entrada y haz clic en "Verificar Cuenta" del correo que te enviamos.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📬 Revisa tu Correo</CardTitle>
            <CardDescription>
              Te hemos enviado un correo de verificación a:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">{email}</span>
              </div>
            </div>

            <Alert className="bg-yellow-50 border-yellow-200">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Instrucciones:</strong>
                <ol className="list-decimal list-inside space-y-2 mt-2 text-sm">
                  <li>Abre tu cliente de correo (Gmail, Outlook, etc.)</li>
                  <li>Busca un correo de "Sistema de Calidad"</li>
                  <li>Haz clic en el botón <strong>"🚀 Verificar Cuenta"</strong></li>
                  <li>Si no encuentras el correo, revisa tu carpeta de spam</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                onClick={handleResendEmail} 
                disabled={isResending || timeLeft > 0}
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Enviando...' : timeLeft > 0 ? `Reenviar (${formatTime(timeLeft)})` : 'Reenviar Correo'}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>¿No recibiste el correo?</p>
              <p>Verifica que el correo esté escrito correctamente.</p>
              <p>Espera {timeLeft > 0 ? formatTime(timeLeft) : 'unos segundos'} antes de reenviar.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
