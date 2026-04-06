'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem, 
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Calendar, Package, Search, Filter, FileDown, User, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { getProductCategories, type Product, type ProductCategory } from '@/lib/supervisores-data';
import { embalajeRecordsService, type EmbalajeRecord } from '@/lib/embalaje-records-service';
import { AddEmbalajeRecordModal } from '@/components/supervisores/add-embalaje-record-modal';
import { UniversalSearch } from '@/components/supervisores/universal-search';
import { EmbalajeAnalysis } from '@/components/supervisores/embalaje-analysis';
import { BarChart3 } from 'lucide-react';
import { scrollToSelectorWithRetry } from '@/hooks/useScrollRestoration';
import { useToast } from '@/hooks/use-toast';
import { getUserDisplayName } from '@/lib/user-display-utils';

export default function ProductEmbalajeRecordsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [records, setRecords] = useState<EmbalajeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);
  
  // Ref para manejar timeouts
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const categories = await getProductCategories();
        
        let foundProduct: Product | null = null;
        let foundCategory: ProductCategory | null = null;
        
        // Búsqueda mejorada usando la misma lógica que la página de producción
        // Si el ID contiene guión bajo, es un ID compuesto (nuevo formato)
        if (productId.includes('_')) {
          const [categoryId, productCode] = productId.split('_', 2);
          
          const targetCategory = categories.find(cat => cat.id === categoryId);
          if (targetCategory) {
            foundProduct = targetCategory.products.find(p => p.id === productCode) || null;
            foundCategory = targetCategory;
          }
        } else {
          // Búsqueda tradicional por ID directo (formato antiguo)
          for (const cat of categories) {
            const prod = cat.products.find(p => p.id === productId);
            if (prod) {
              foundProduct = prod;
              foundCategory = cat;
              break;
            }
          }
        }
        
        if (foundProduct && foundCategory) {
          setProduct(foundProduct);
          setCategory(foundCategory);
          
          // Cargar registros de embalaje reales filtrados por producto
          const allRecords = await embalajeRecordsService.getAll();
          
          const productRecords = allRecords.filter((record: EmbalajeRecord) => {
            // Comprobar si el registro usa ID (nuevo) o nombre (antiguo)
            const matchesById = record.producto === foundProduct.id;
            const matchesByName = record.producto === foundProduct.name;
            
            return matchesById || matchesByName;
          });
          
          setRecords(productRecords);
        } else {
          // Si no se encuentra el producto, mostrar todos los registros existentes
          const allRecords = await embalajeRecordsService.getAll();
          setRecords(allRecords);

          toast({
            title: 'Producto no encontrado',
            description: `No se encontró el producto con ID "${productId}". Se muestran registros disponibles.`,
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de embalaje',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

  // Resaltar y hacer scroll a un registro cuando se regresa desde Detalles
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

    const exportRecord = (e: React.MouseEvent, record: any) => {
    e.preventDefault();
    e.stopPropagation();
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      data[key] = value;
    }
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro');
    XLSX.writeFile(wb, `RE-CAL-093_lote-`+String(record?.lote ?? 'sin-lote').replace(/[^a-zA-Z0-9_-]/g, '_')+`.xlsx`);
  };

  return () => cancel();
  }, [searchParams]);

  const isPending = (record: EmbalajeRecord): boolean => {
    if (record.status === 'pending') return true;
    const exportRecord = (e: React.MouseEvent, record: any) => {
    e.preventDefault();
    e.stopPropagation();
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      data[key] = value;
    }
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro');
    XLSX.writeFile(wb, `RE-CAL-093_lote-`+String(record?.lote ?? 'sin-lote').replace(/[^a-zA-Z0-9_-]/g, '_')+`.xlsx`);
  };

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

  const filteredRecords = records.filter(record => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && (record.status === 'pending' || isPending(record))) ||
      (statusFilter === 'completed' && record.status === 'completed' && !isPending(record));

    const matchesSearch =
     (record.lote || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.observaciones_generales || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.presentacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.nivel_inspeccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.responsable_embalaje.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  

  // Manejar selección de registro desde el buscador - Mejorado para evitar errores de DOM
  const handleRecordSelect = (record: EmbalajeRecord, index: number) => {
    // Resaltar el registro
    setHighlightedRecordId(record.id);
    
    // Hacer scroll al registro con manejo de errores mejorado
    const timeout = setTimeout(() => {
      try {
        const recordElement = document.querySelector(`[data-record-id="${record.id}"]`);
        if (recordElement && recordElement.scrollIntoView) {
          recordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Remover el resaltado después de 3 segundos
          const highlightTimeout = setTimeout(() => {
            setHighlightedRecordId(null);
          }, 3000);
          timeoutsRef.current.push(highlightTimeout);
        } else {
          setHighlightedRecordId(null);
        }
      } catch (error) {
        setHighlightedRecordId(null);
      }
    }, 100);
    
    timeoutsRef.current.push(timeout);
  };

  // Cleanup de timeouts cuando el componente se desmonte
  useEffect(() => {
    const exportRecord = (e: React.MouseEvent, record: any) => {
    e.preventDefault();
    e.stopPropagation();
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      data[key] = value;
    }
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro');
    XLSX.writeFile(wb, `RE-CAL-093_lote-`+String(record?.lote ?? 'sin-lote').replace(/[^a-zA-Z0-9_-]/g, '_')+`.xlsx`);
  };

  return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
    };
  }, []);

  const handleRecordAdded = async (newRecord: any) => {
    try {
      // Guardar en la base de datos usando el servicio
      const savedRecord = await embalajeRecordsService.create(newRecord);
      
      // Actualizar el estado local con el registro guardado
      setRecords(prev => [savedRecord, ...prev]);
      setIsModalOpen(false);
      
      // Mostrar mensaje de éxito
      toast({
        title: 'Guardado',
        description: 'Registro de embalaje guardado exitosamente',
      });
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar el registro. Por favor, intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    const exportRecord = (e: React.MouseEvent, record: any) => {
    e.preventDefault();
    e.stopPropagation();
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      data[key] = value;
    }
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro');
    XLSX.writeFile(wb, `RE-CAL-093_lote-`+String(record?.lote ?? 'sin-lote').replace(/[^a-zA-Z0-9_-]/g, '_')+`.xlsx`);
  };

  return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
          <p className="text-sm text-gray-600">Cargando página de embalaje...</p>
        </div>
      </div>
    );
  }

  if (!product || !category) {
    const exportRecord = (e: React.MouseEvent, record: any) => {
    e.preventDefault();
    e.stopPropagation();
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      data[key] = value;
    }
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro');
    XLSX.writeFile(wb, `RE-CAL-093_lote-`+String(record?.lote ?? 'sin-lote').replace(/[^a-zA-Z0-9_-]/g, '_')+`.xlsx`);
  };

  return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Producto no encontrado</CardTitle>
            <CardDescription>
              El producto con ID <strong>"{productId}"</strong> no existe o ha sido eliminado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-left bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">Información de depuración:</p>
              <p className="text-xs text-gray-600">
                Abre la consola del navegador (F12) para ver los IDs de productos disponibles.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard/supervisores?tab=embalaje">Volver a Supervisores</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exportRecord = (e: React.MouseEvent, record: any) => {
    e.preventDefault();
    e.stopPropagation();
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      data[key] = value;
    }
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro');
    XLSX.writeFile(wb, `RE-CAL-093_lote-`+String(record?.lote ?? 'sin-lote').replace(/[^a-zA-Z0-9_-]/g, '_')+`.xlsx`);
  };

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <Button variant="ghost" asChild className="mb-3 sm:mb-4">
          <Link href={`/dashboard/supervisores?tab=embalaje&highlight=${encodeURIComponent(`${category?.id || ''}_${product?.id || ''}`)}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Supervisores
          </Link>
        </Button>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-600">Registros de Embalaje</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {product.name}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'completed') => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los registros</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setIsAnalysisOpen(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Análisis
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto text-white"
              style={{ backgroundColor: '#2f6e29ff' }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Registro
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <UniversalSearch
          data={records}
          searchFields={['lote', 'observaciones_generales', 'presentacion', 'nivel_inspeccion', 'responsable_embalaje']}
          onRecordSelect={handleRecordSelect}
          placeholder="Buscar por lote, presentación, inspección..."
          displayField="lote"
          secondaryField="presentacion"
        />
      </div>

      {filteredRecords.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRecords.map((record) => (
            <Link
              key={record.id}
              href={`/dashboard/supervisores/embalaje-record/${record.id}?returnTo=${encodeURIComponent(`/dashboard/supervisores/product/${productId}/embalaje?highlightRecord=${record.id}`)}`}
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
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className={`text-lg sm:text-xl font-semibold text-gray-900 mb-1 truncate ${highlightedRecordId === record.id ? 'text-green-700' : ''}`}>
                        Lote: {record.lote}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{new Date(record.fecha).toLocaleDateString('es-ES')}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">{record.tamano_lote} u</Badge>
                      <Badge variant="secondary" className="text-xs">{record.presentacion}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-2 px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-gray-900 text-xs mb-1">Inspección:</span>
                      <p className="text-gray-600 font-semibold truncate">{record.nivel_inspeccion}</p>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-gray-900 text-xs mb-1">Cajas:</span>
                      <p className="text-gray-600 font-semibold truncate">{record.cajas_revisadas}</p>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-gray-900 text-xs mb-1">Unidades:</span>
                      <p className="text-gray-600 font-semibold truncate">{record.total_unidades_revisadas}</p>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-gray-900 text-xs mb-1">Incumplimiento:</span>
                      <p className="text-gray-600 font-semibold truncate">{record.porcentaje_incumplimiento}%</p>
                    </div>
                  </div>
                  {record.observaciones_generales && (
                    <div className="mt-auto pt-2 border-t border-gray-200">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900 text-xs">Observaciones:</span>
                        <p className="text-gray-600 text-xs leading-relaxed overflow-hidden" style={{ 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical' 
                        }}>
                          {record.observaciones_generales}
                        </p>
                      </div>
                    </div>
                  )}
                  {(record.created_by || record.updated_by) && (
                    <div className="mt-auto pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500 space-y-1">
                        {record.created_by && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Creado por: {getUserDisplayName(record.created_by)}</span>
                          </div>
                        )}
                        {record.updated_by && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Editado última vez por: {record.updated_by === '(Generado automáticamente)' ? '(Generado automáticamente)' : getUserDisplayName(record.updated_by)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mt-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-medium flex-shrink-0">Resp:</span>
                      <span className="truncate">{record.responsable_calidad}</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="truncate">{new Date(record.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={(e) => exportRecord(e, record)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <FileDown className="h-3 w-3 mr-1" />
                      Exportar
                    </Button>
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
              No se encontraron registros de embalaje para este producto.
            </p>
            <p className="text-green-600 font-semibold mb-4">
              ESTE ES EL ESTADO VACÍO DE EMBALAJE
            </p>
            <div className="flex justify-center gap-2">
              <Button 
                onClick={() => setIsAnalysisOpen(true)}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                disabled={records.length === 0}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Análisis
              </Button>
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Primer Registro de EMBALAJE
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <AddEmbalajeRecordModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        productName={product.name}
        productId={product.id}
        onSuccessfulSubmit={handleRecordAdded}
      />
      
      <div className="fixed inset-0 z-50 bg-black/80" style={{ display: isAnalysisOpen ? 'block' : 'none' }}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Análisis de Registros de Embalaje</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAnalysisOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
              <div className="p-6">
                <EmbalajeAnalysis 
                  records={records}
                  onClose={() => setIsAnalysisOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
