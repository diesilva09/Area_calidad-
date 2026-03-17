'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Calendar, Package, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { getProductCategories, type Product, type ProductCategory } from '@/lib/supervisores-data';
import { embalajeRecordsService, type EmbalajeRecord } from '@/lib/embalaje-records-service';
import { AddEmbalajeRecordModal } from '@/components/supervisores/add-embalaje-record-modal';
import { EmbalajeAnalysis } from '@/components/supervisores/embalaje-analysis';
import { scrollToSelectorWithRetry } from '@/hooks/useScrollRestoration';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

export default function EmbalajeRecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [records, setRecords] = useState<EmbalajeRecord[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
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
    console.log('🔍 DEBUG: EmbalajeRecordsPage montado');
    console.log('🔍 DEBUG: Estado de isModalOpen:', isModalOpen);
  }, [isModalOpen]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 DEBUG: Cargando datos...');
        // Cargar todos los registros de embalaje
        const allRecords = await embalajeRecordsService.getAll();
        setRecords(allRecords);

        // Cargar categorías para mostrar nombres de productos
        const loadedCategories = await getProductCategories();
        setCategories(loadedCategories);
        
        console.log('🔍 DEBUG: Datos cargados. Registros:', allRecords.length);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
        console.log('🔍 DEBUG: Loading false');
      }
    };

    loadData();
  }, []);

  const getProductName = (productId: string): string => {
    console.log('🔍 DEBUG: Buscando nombre para productId:', productId);
    console.log('🔍 DEBUG: Categorías disponibles:', categories);
    
    for (const category of categories) {
      const product = category.products.find(p => p.id === productId || p.name === productId);
      if (product) {
        console.log('✅ DEBUG: Producto encontrado:', product.name, 'para productId:', productId);
        return product.name;
      }
    }
    
    console.log('⚠️ DEBUG: Producto no encontrado para productId:', productId);
    return productId; // Devolver el ID como fallback para que se vea algo
  };

  const filteredRecords = records.filter(record =>
    record.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.observaciones_generales || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    getProductName(record.producto).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPending = (record: EmbalajeRecord): boolean => {
    return record.presentacion === 'Pendiente' ||
      record.nivel_inspeccion === 'Pendiente' ||
      record.etiqueta === 'Pendiente' ||
      record.marcacion === 'Pendiente' ||
      record.presentacion_no_conforme === 'Pendiente' ||
      record.cajas === 'Pendiente' ||
      record.responsable_identificador_cajas === 'Pendiente' ||
      record.responsable_embalaje === 'Pendiente' ||
      record.responsable_calidad === 'Pendiente';
  };

  const handleRecordAdded = async (newRecord: any) => {
    try {
      console.log('🚀 handleRecordAdded (general): Guardando registro en base de datos...');
      console.log('📝 Datos a guardar:', newRecord);
      
      // Guardar en la base de datos usando el servicio
      const savedRecord = await embalajeRecordsService.create(newRecord);
      console.log('✅ Registro guardado exitosamente:', savedRecord);
      
      // Actualizar el estado local con el registro guardado
      setRecords(prev => [savedRecord, ...prev]);
      setIsModalOpen(false);
      
      // Mostrar mensaje de éxito
      toast({
        title: 'Registro guardado',
        description: 'Registro de embalaje guardado exitosamente en la base de datos',
      });
      
    } catch (error) {
      console.error('❌ Error al guardar registro de embalaje:', error);
      toast({
        title: 'Error al guardar',
        description: 'Por favor, intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded">
            <h1 className="text-xl font-bold text-green-800"> CARGANDO REGISTROS DE EMBALAJE</h1>
          </div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* INDICADOR OBVIO DE PÁGINA DE EMBALAJE */}
      <div className="mb-6 p-4 bg-green-100 border-2 border-green-500 rounded">
        <h1 className="text-2xl font-bold text-green-800">TODOS LOS REGISTROS DE EMBALAJE</h1>
        <p className="text-green-700">Lista completa de registros de embalaje de todos los productos</p>
      </div>

      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/dashboard/supervisores?tab=embalaje">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Supervisores
          </Link>
        </Button>
      </div>

       <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-green-600 break-words">📦 REGISTROS DE EMBALAJE 📦</h1>
            <p className="text-gray-600 mt-2 text-base sm:text-lg">
              Todos los registros de embalaje del sistema
            </p>
            <p className="text-green-600 font-semibold">
              
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setIsAnalysisOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              📊 Análisis
            </Button>
            {(() => {
              console.log('🔍 DEBUG: Renderizando botón...');
              return null;
            })()}
            <button 
              onClick={() => {
                console.log('🔍 DEBUG: Botón clickeado!');
                setIsModalOpen(true);
              }} 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center w-full sm:w-auto"
              style={{ backgroundColor: '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Registro de EMBALAJE
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por lote, producto u observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredRecords.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecords.map((record) => (
            <Link
              key={record.id} 
              href={`/dashboard/supervisores/embalaje-record/${record.id}?returnTo=${encodeURIComponent(`/dashboard/supervisores/embalaje-records?highlightRecord=${record.id}`)}`}
              className="block transition-transform hover:scale-[1.02]"
            >
              <Card
                className={
                  `bg-white border-gray-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer ` +
                  `${isPending(record) ? 'border-yellow-400 bg-yellow-50 hover:border-yellow-500' : ''} ` +
                  `${highlightedRecordId === record.id ? 'ring-4 ring-blue-400 ring-opacity-60 bg-blue-50 shadow-lg scale-105 z-10' : ''}`
                }
                data-record-id={record.id}
              >
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-lg break-words">Lote: {record.lote}</CardTitle>
                      <CardDescription>
                        Producto: {getProductName(record.producto)}
                      </CardDescription>
                      <CardDescription>
                        Fecha: {new Date(record.fecha).toLocaleDateString('es-ES')}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{record.tamano_lote} unidades</Badge>
                      <Badge variant="secondary">{record.presentacion}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">Inspección:</span>
                      <p className="text-gray-600">{record.nivel_inspeccion}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Cajas:</span>
                      <p className="text-gray-600">{record.cajas_revisadas}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Unidades:</span>
                      <p className="text-gray-600">{record.total_unidades_revisadas}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Incumplimiento:</span>
                      <p className="text-gray-600">{record.porcentaje_incumplimiento}</p>
                    </div>
                  </div>
                  {record.observaciones_generales && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="font-medium text-gray-900 text-sm">Observaciones:</span>
                      <p className="text-gray-600 text-sm mt-1 break-words">{record.observaciones_generales}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-xs text-gray-500 min-w-0 truncate">
                      Responsable: {record.responsable_calidad}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(record.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2"> No hay registros de EMBALAJE</h3>
            <p className="text-gray-600 mb-4">
              No se encontraron registros de embalaje en el sistema.
            </p>
            <p className="text-green-600 font-semibold mb-4">
              ESTE ES EL ESTADO VACÍO GENERAL DE EMBALAJE
            </p>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center w-full sm:w-auto"
              style={{ backgroundColor: '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Registro de EMBALAJE
            </button>
          </CardContent>
        </Card>
      )}

      <AddEmbalajeRecordModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        productName=""
        productId=""
        onSuccessfulSubmit={handleRecordAdded}
      />

      {/* Modal para análisis de embalaje */}
      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <EmbalajeAnalysis
            records={records}
            onClose={() => setIsAnalysisOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
