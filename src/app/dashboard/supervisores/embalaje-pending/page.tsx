'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Calendar, Package, Search, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { getProductCategories, type Product, type ProductCategory } from '@/lib/supervisores-data';
import { embalajeRecordsService, type EmbalajeRecord } from '@/lib/embalaje-records-service';
import { scrollToSelectorWithRetry } from '@/hooks/useScrollRestoration';

export default function EmbalajePendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<EmbalajeRecord[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);

  useEffect(() => {
    const recordIdToHighlight = searchParams?.get('highlightRecord');
    if (!recordIdToHighlight) return;

    setHighlightedRecordId(recordIdToHighlight);

    const cancel = scrollToSelectorWithRetry({
      selector: `[data-record-id="${recordIdToHighlight}"]`,
      offsetTop: 96,
      onFound: () => {
        setTimeout(() => setHighlightedRecordId(null), 3000);
      },
    });

    return () => cancel();
  }, [searchParams]);

  useEffect(() => {
    const loadPendingRecords = async () => {
      try {
        console.log('🔍 Cargando registros pendientes de embalaje...');
        
        // Obtener registros pendientes
        const response = await fetch('/api/embalaje-records/pending');
        if (!response.ok) throw new Error('Error al obtener registros pendientes');
        
        const pendingRecords = await response.json();
        setRecords(pendingRecords);

        // Cargar categorías para mostrar nombres de productos
        const loadedCategories = await getProductCategories();
        setCategories(loadedCategories);
        
        console.log(`✅ Registros pendientes cargados: ${pendingRecords.length}`);
      } catch (error) {
        console.error('Error al cargar registros pendientes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPendingRecords();
  }, []);

  const getProductName = (productId: string): string => {
    const raw = String(productId);
    for (const category of categories) {
      const product = category.products.find(p => String(p.id) === raw || p.id === raw || p.name === raw);
      if (product) {
        return product.name;
      }
    }
    return raw;
  };

  const filteredRecords = records.filter(record =>
    record.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getProductName(record.producto).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPending = (record: EmbalajeRecord): boolean => {
    if (record.status === 'pending') return true;
    return (
      record.presentacion === 'Pendiente' ||
      record.nivel_inspeccion === 'Pendiente' ||
      record.etiqueta === 'Pendiente' ||
      record.marcacion === 'Pendiente' ||
      record.presentacion_no_conforme === 'Pendiente' ||
      record.cajas === 'Pendiente' ||
      record.responsable_identificador_cajas === 'Pendiente' ||
      record.responsable_embalaje === 'Pendiente' ||
      record.responsable_calidad === 'Pendiente'
    );
  };

  const getPendingFields = (record: EmbalajeRecord): string[] => {
    const pendingFields = [];
    if (record.presentacion === 'Pendiente') pendingFields.push('Presentación');
    if (record.nivel_inspeccion === 'Pendiente') pendingFields.push('Inspección');
    if (record.etiqueta === 'Pendiente') pendingFields.push('Etiqueta');
    if (record.marcacion === 'Pendiente') pendingFields.push('Marcación');
    if (record.presentacion_no_conforme === 'Pendiente') pendingFields.push('Presentación');
    if (record.cajas === 'Pendiente') pendingFields.push('Cajas');
    if (record.responsable_identificador_cajas === 'Pendiente') pendingFields.push('Resp. Identificador');
    if (record.responsable_embalaje === 'Pendiente') pendingFields.push('Resp. Embalaje');
    if (record.responsable_calidad === 'Pendiente') pendingFields.push('Resp. Calidad');
    return pendingFields;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-yellow-200 border-t-yellow-600 animate-spin" />
          <p className="text-sm text-gray-600">Cargando registros pendientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* TARJETA DE ALERTA - REGISTROS PENDIENTES */}
      {filteredRecords.length > 0 && (
        <Card className="mb-4 sm:mb-6 border-2 border-yellow-400 bg-yellow-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400 rounded-full">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-900" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-yellow-900">
                    ⚠️ Tienes {filteredRecords.length} registro{filteredRecords.length !== 1 ? 's' : ''} pendiente{filteredRecords.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-sm sm:text-base text-yellow-800 mt-1">
                    Hay registros de embalaje que necesitan ser completados
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="border-yellow-400 text-yellow-800 hover:bg-yellow-100 w-full sm:w-auto"
              >
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 sm:mb-6">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/dashboard/supervisores?tab=embalaje">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Supervisores
          </Link>
        </Button>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-600"> REGISTROS PENDIENTES</h1>
            <p className="text-gray-600 mt-2 text-base sm:text-lg">
              
            </p>
            <p className="text-yellow-600 font-semibold text-sm sm:text-base">
              Total pendientes: {filteredRecords.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por lote o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {filteredRecords.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRecords.map((record) => (
            <Link
              key={record.id} 
              href={`/dashboard/supervisores/embalaje-record/${record.id}?returnTo=${encodeURIComponent(`/dashboard/supervisores/embalaje-pending?highlightRecord=${record.id}`)}`}
              className="block transition-transform hover:scale-[1.02]"
            >
              <Card
                className={
                  `bg-white border-yellow-200 hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col overflow-hidden ` +
                  `${highlightedRecordId === record.id ? 'ring-4 ring-blue-400 ring-opacity-60 bg-blue-50 shadow-lg scale-105 z-10' : ''}`
                }
                data-record-id={record.id}
              >
                <CardHeader className="pb-2 bg-yellow-50 p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs sm:text-sm">
                      PENDIENTE
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 truncate">
                        Lote: {record.lote}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{new Date(record.fecha).toLocaleDateString('es-ES')}</span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-2 px-3 sm:px-4 pb-4">
                  <div className="mb-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Producto:</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{getProductName(record.producto)}</p>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Campos pendientes:</p>
                    <div className="flex flex-wrap gap-1">
                      {getPendingFields(record).map((field, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-2 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="truncate">Creado: {new Date(record.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8 sm:py-12">
          <CardContent className="px-4">
            <Package className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2"> No hay registros pendientes</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              No hay registros de embalaje pendientes en este momento.
            </p>
            <p className="text-green-600 font-semibold text-sm sm:text-base mb-4">
              ¡Todos los registros están completos!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
