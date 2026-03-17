'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Eye } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ProductionRecordsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la página de productos
    router.push('/dashboard/supervisores?tab=produccion');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard/supervisores?tab=produccion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Supervisores
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Package className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <CardTitle className="text-2xl">Registros de Producción</CardTitle>
          <CardDescription>
            Los registros de producción ahora se muestran dentro de cada producto
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Para ver los registros de producción de un producto específico:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg text-left">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Ve a la página principal de Supervisores</li>
              <li>Busca el producto que deseas revisar</li>
              <li>Haz clic en el botón "Ver Registros" del producto</li>
              <li>Verás todos los registros de producción de ese producto</li>
            </ol>
          </div>

          <Button asChild className="mt-6">
            <Link href="/dashboard/supervisores?tab=produccion">
              <Eye className="mr-2 h-4 w-4" />
              Ver Productos y Registros
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
