'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { getProductCategories } from '@/lib/supervisores-data';
import { useEffect, useState } from 'react';
import type { ProductCategory } from '@/lib/supervisores-data';

export default function EmbalajePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'jefe' && user.role !== 'operario' && user.role !== 'supervisor' && user.role !== 'tecnico')) {
      router.push('/dashboard');
      return;
    }

    const loadCategories = async () => {
      try {
        const data = await getProductCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [user, router]);

  if (!user) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Button variant="ghost" asChild className="mb-2 sm:mb-4 text-xs sm:text-sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">Volver</span>
            </Link>
          </Button>
          <div className="flex flex-col gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Módulo de Embalaje</h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base">
              Gestiona los productos y procesos de embalaje
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="bg-white border-gray-200">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Package className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  <span className="truncate">{category.name}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {category.products.length} producto{category.products.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-1 sm:space-y-2">
                  {category.products.slice(0, 3).map((product) => (
                    <div key={product.id} className="text-xs sm:text-sm text-gray-600 truncate">
                      • {product.name}
                    </div>
                  ))}
                  {category.products.length > 3 && (
                    <div className="text-xs sm:text-sm text-gray-400">
                      ... y {category.products.length - 3} más
                    </div>
                  )}
                </div>
                <Button className="w-full mt-3 sm:mt-4 text-xs sm:text-sm px-2 sm:px-4 py-2" variant="outline">
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
