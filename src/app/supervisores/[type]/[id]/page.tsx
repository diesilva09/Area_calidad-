'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getProductCategories, type ProductCategory } from '@/lib/supervisores-data';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  AddProductionRecordModal,
  productionFormSchema,
} from '@/components/supervisores/add-production-record-modal';
import type { Product } from '@/lib/supervisores-data';
import {
  AddEmbalajeRecordModal,
  embalajeFormSchema,
} from '@/components/supervisores/add-embalaje-record-modal';
import {
  AddLimpiezaRecordModal,
  limpiezaFormSchema,
} from '@/components/supervisores/add-limpieza-record-modal';
import type { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';

// Dummy data for records
const DUMMY_RECORDS = [
  {
    id: 1,
    product_id: '1',
    type: 'produccion',
    date: '2024-07-25',
    lot: 'LOTE-P-001',
    details: 'Registro de producción para Cerezas',
  },
  {
    id: 2,
    product_id: '1',
    type: 'produccion',
    date: '2024-07-26',
    lot: 'LOTE-P-002',
    details: 'Otro registro de producción para Cerezas',
  },
  {
    id: 3,
    product_id: '1',
    type: 'embalaje',
    date: '2024-07-25',
    lot: 'LOTE-E-001',
    details: 'Registro de embalaje para Cerezas',
  },
  {
    id: 4,
    product_id: '2',
    type: 'produccion',
    date: '2024-07-26',
    lot: 'LOTE-P-003',
    details: 'Registro de producción para Brevas',
  },
];

export default function ProductDetailsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const type = params.type as 'produccion' | 'embalaje';
  const id = params.id as string;
  const { saveScrollPosition } = useScrollRestoration();

  const [loteSearch, setLoteSearch] = useState('');
  const [fechaSearch, setFechaSearch] = useState('');
  const [isProduccionModalOpen, setIsProduccionModalOpen] = useState(false);
  const [isEmbalajeModalOpen, setIsEmbalajeModalOpen] = useState(false);
  const [isLimpiezaModalOpen, setIsLimpiezaModalOpen] = useState(false);
  const [prefilledEmbalajeData, setPrefilledEmbalajeData] = useState<
    Partial<{ fecha: string; mesCorte: string; lote: string }>
  >({});
  const [prefilledLimpiezaData, setPrefilledLimpiezaData] = useState<
    Partial<{ fecha: string; mesCorte: string; lote: string; producto: string; linea: string }>
  >({});
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const loadedCategories = await getProductCategories();
        setCategories(loadedCategories);
        
        // Find the product in all categories
        const foundProduct = loadedCategories
          .flatMap(cat => cat.products)
          .find(p => p.id === id);
        
        setProduct(foundProduct || null);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, [id]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (user.role !== 'jefe' && user.role !== 'operario' && user.role !== 'supervisor' && user.role !== 'tecnico') {
    return (
      <div className="flex h-full items-center justify-center py-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-destructive">
              Acceso Denegado
            </CardTitle>
            <CardDescription>
              No tienes los permisos necesarios para acceder a esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product || (type !== 'produccion' && type !== 'embalaje')) {
    notFound();
  }

  const handleProductionSubmit = (
    values: z.infer<typeof productionFormSchema>
  ) => {
    console.log('Production record saved:', values);
    // TODO: Persist the record
    setPrefilledEmbalajeData({
      fecha: values.fechaProduccion,
      mesCorte: values.mesCorte,
      lote: values.lote,
    });
    setPrefilledLimpiezaData({
      fecha: values.fechaProduccion,
      mesCorte: values.mesCorte,
      lote: values.lote,
      producto: values.producto,
      linea: values.equipo,
    });
    setIsProduccionModalOpen(false);
    setIsEmbalajeModalOpen(true);
  };

  const handleEmbalajeSubmit = (
    values: z.infer<typeof embalajeFormSchema>
  ) => {
    console.log('Packaging record saved:', values);
    // TODO: Persist the record
    setIsEmbalajeModalOpen(false);
    setPrefilledEmbalajeData({}); // Clear prefilled data
    setIsLimpiezaModalOpen(true);
  };

  const handleLimpiezaSubmit = (
    values: z.infer<typeof limpiezaFormSchema>
  ) => {
    console.log('Cleaning record saved:', values);
    // TODO: Persist the record
    setIsLimpiezaModalOpen(false);
  };

  const typeDisplay = type === 'produccion' ? 'Producción' : 'Embalaje';

  const records = DUMMY_RECORDS.filter(
    (record) =>
      record.product_id === id &&
      record.type === type &&
      record.lot.toLowerCase().includes(loteSearch.toLowerCase()) &&
      record.date.includes(fechaSearch)
  );

  return (
    <div className="py-6">
      <div className="mb-4">
        <Link 
          href={user.role === 'jefe' ? '/supervisores' : (user.role === 'operario' || user.role === 'supervisor') ? '/supervisores' : '/tecnico'}
          onClick={(e) => {
            console.log('🔙 Guardando producto para destacar:', id);
            saveScrollPosition(id);
          }}
        >
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="font-headline text-3xl">
                {product.name} - Registros de {typeDisplay}
              </CardTitle>
              <CardDescription>
                Aquí se muestran todos los registros de{' '}
                {typeDisplay.toLowerCase()} para {product.name}.
              </CardDescription>
            </div>
            {user.role === 'jefe' && type === 'produccion' && (
              <Button onClick={() => setIsProduccionModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir nuevo registro
              </Button>
            )}
            {user.role === 'jefe' && type === 'embalaje' && (
              <Button onClick={() => setIsEmbalajeModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir nuevo registro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div className="relative w-full sm:w-1/2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por lote..."
                value={loteSearch}
                onChange={(e) => setLoteSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="relative w-full sm:w-1/2">
              <Input
                type="text"
                placeholder="Buscar por fecha (YYYY-MM-DD)..."
                value={fechaSearch}
                onChange={(e) => setFechaSearch(e.target.value)}
              />
            </div>
          </div>

          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.lot}</TableCell>
                    <TableCell>{record.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No se encontraron registros con los filtros aplicados.
            </p>
          )}
        </CardContent>
      </Card>
      {product && (
        <AddProductionRecordModal
          isOpen={isProduccionModalOpen}
          onOpenChange={setIsProduccionModalOpen}
          productName={product.name}
          productId={product.id}
          onSuccessfulSubmit={handleProductionSubmit}
        />
      )}
      {product && (
        <AddEmbalajeRecordModal
          isOpen={isEmbalajeModalOpen}
          onOpenChange={(isOpen) => {
            setIsEmbalajeModalOpen(isOpen);
            if (!isOpen) {
              setPrefilledEmbalajeData({});
            }
          }}
          productName={product.name}
          prefilledData={prefilledEmbalajeData}
          onSuccessfulSubmit={handleEmbalajeSubmit}
        />
      )}
      <AddLimpiezaRecordModal
        isOpen={isLimpiezaModalOpen}
        onOpenChange={(isOpen) => {
          setIsLimpiezaModalOpen(isOpen);
          if (!isOpen) {
            setPrefilledLimpiezaData({});
          }
        }}
        prefilledData={prefilledLimpiezaData}
        onSuccessfulSubmit={handleLimpiezaSubmit}
      />
    </div>
  );
}
