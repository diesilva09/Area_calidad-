'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Calendar, Package, Search, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Product, ProductCategory } from '@/lib/supervisores-data';
import { UniversalSearch } from '@/components/supervisores/universal-search';
import { AreasEquiposService } from '@/lib/areas-equipos-config';
import { useAuth } from '@/contexts/auth-context';
import { useScrollRestoration, scrollToSelectorWithRetry } from '@/hooks/useScrollRestoration';

const AddProductionRecordModal = dynamic(
  () => import('@/components/supervisores/add-production-record-modal').then(m => m.AddProductionRecordModal),
  { ssr: false }
);

const ProductionAnalysis = dynamic(
  () => import('@/components/supervisores/production-analysis').then(m => m.ProductionAnalysis),
  { ssr: false }
);

// Tipo para los registros de producción (coincidente con la base de datos)
interface ProductionRecord {
  id: string;
  fechaproduccion: string;
  fechavencimiento: string;
  mescorte: string;
  producto: string;
  lote: string;
  tamano_lote: string;
  letratamano_muestra: string;
  area: string;
  equipo: string;
  liberacion_inicial: string;
  verificacion_aleatoria: string;
  observaciones?: string;
  tempam1: string;
  tempam2: string;
  temppm1: string;
  temppm2: string;
  analisis_sensorial: string;
  prueba_hermeticidad: string;
  inspeccion_micropesaje_mezcla: string;
  inspeccion_micropesaje_resultado: string;
  total_unidades_revisar_drenado: string;
  peso_drenado_declarado: string;
  rango_peso_drenado_min: string;
  rango_peso_drenado_max: string;
  pesos_drenados: string;
  promedio_peso_drenado: string;
  encima_peso_drenado: string;
  debajo_peso_drenado: string;
  und_incumplen_rango_drenado: string;
  porcentaje_incumplen_rango_drenado: string;
  total_unidades_revisar_neto: string;
  peso_neto_declarado: string;
  pesos_netos: string;
  promedio_peso_neto: string;
  encima_peso_neto: string;
  debajo_peso_neto: string;
  und_incumplen_rango_neto: string;
  porcentaje_incumplen_rango_neto: string;
  pruebas_vacio: string;
  novedades_proceso?: string;
  observaciones_acciones_correctivas?: string;
  supervisor_calidad: string;
  fechaanalisispt: string;
  no_mezcla_pt: string;
  vacio_pt: string;
  peso_neto_real_pt: string;
  peso_drenado_real_pt: string;
  brix_pt: string;
  ph_pt: string;
  acidez_pt: string;
  ppm_so2_pt: string;
  consistencia_pt: string;
  sensorial_pt: string;
  tapado_cierre_pt: string;
  etiqueta_pt: string;
  presentacion_final_pt: string;
  ubicacion_muestra_pt: string;
  estado_pt: string;
  observaciones_pt?: string;
  responsable_analisis_pt: string;
  status?: 'pending' | 'completed';
  created_at: string;
  created_by?: string;
}

export default function ProductProductionRecordsPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { saveScrollPosition } = useScrollRestoration();

  const formatDate = (raw: unknown) => {
    const s = String(raw ?? '').trim();
    if (!s) return '';
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('es-ES');
  };
  
  console.log('📊 Parámetros recibidos:', { id, params });

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);
  const [equiposNombres, setEquiposNombres] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

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

    return () => cancel();
  }, [searchParams]);

  const cargarNombresEquipos = useCallback(async (recordsToProcess: ProductionRecord[]) => {
    console.log('🔍 Cargando nombres de equipos para', recordsToProcess.length, 'registros');
    console.log('📋 Registros a procesar:', recordsToProcess.map(r => ({ id: r.id, equipo: r.equipo })));
    const nombresMap: Record<string, string> = {};

    // Mapeo directo como fallback
    const equipoMapeoDirecto: Record<string, string> = {
      'ENV-001': 'Envasadora 1',
      'ENV-002': 'Envasadora 2',
      'ENV-003': 'Envasadora 3',
      'LAV-001': 'Lavadora 1',
      'LAV-002': 'Lavadora 2',
      'COC-001': 'Cocina 1',
      'COC-002': 'Cocina 2',
      'LLN-001': 'Llenadora 1',
      'LLN-002': 'Llenadora 2',
      'ETQ-001': 'Etiquetadora 1',
      'ETQ-002': 'Etiquetadora 2',
      'EMP-001': 'Empacadora 1',
      'EMP-002': 'Empacadora 2',
      'PES-001': 'Pesadora 1',
      'PES-002': 'Pesadora 2'
    };

    for (const record of recordsToProcess) {
      if (record.equipo && !nombresMap[record.equipo]) {
        try {
          console.log(`🔍 Buscando equipo con ID: ${record.equipo}`);

          // Primero intentar con el servicio
          const equipo = await AreasEquiposService.getEquipoPorId(record.equipo);
          console.log(`📦 Respuesta del servicio:`, equipo);

          if (equipo && equipo.nombre) {
            nombresMap[record.equipo] = equipo.nombre;
            console.log(`✅ Equipo encontrado vía servicio: ${record.equipo} -> ${equipo.nombre}`);
          } else {
            // Fallback al mapeo directo
            const nombreDirecto = equipoMapeoDirecto[record.equipo];
            if (nombreDirecto) {
              nombresMap[record.equipo] = nombreDirecto;
              console.log(`🔄 Equipo encontrado vía mapeo directo: ${record.equipo} -> ${nombreDirecto}`);
            } else {
              nombresMap[record.equipo] = `Equipo ${record.equipo}`;
              console.log(`⚠️ Equipo no encontrado, usando fallback: ${record.equipo} -> Equipo ${record.equipo}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error al obtener nombre del equipo ${record.equipo}:`, error);
          // Fallback al mapeo directo
          const nombreDirecto = equipoMapeoDirecto[record.equipo];
          if (nombreDirecto) {
            nombresMap[record.equipo] = nombreDirecto;
            console.log(`🔄 Equipo encontrado vía mapeo directo (error): ${record.equipo} -> ${nombreDirecto}`);
          } else {
            nombresMap[record.equipo] = `Equipo ${record.equipo}`;
            console.log(`⚠️ Equipo no encontrado, usando fallback (error): ${record.equipo} -> Equipo ${record.equipo}`);
          }
        }
      }
    }

    console.log('📊 Mapa final de nombres de equipos:', nombresMap);
    setEquiposNombres(nombresMap);
  }, []);

  const reloadRecords = useCallback(async (foundProduct: Product) => {
    if (!foundProduct) return;
    console.log('🔄 Recargando registros de producción desde API...');
    const { productionRecordsService } = await import('@/lib/supervisores-data');
    const recordsData = await productionRecordsService.getByProductId(foundProduct.id);
    const productRecords = recordsData.filter((record: ProductionRecord) => {
      const matchesById = record.producto === foundProduct.id;
      const matchesByName = record.producto === foundProduct.name;
      return matchesById || matchesByName;
    });
    setRecords(productRecords);
    await cargarNombresEquipos(productRecords);
  }, [cargarNombresEquipos]);

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login-simple');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Verificando sesión...</p>
      </div>
    );
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const productId = params.id as string;
        
        // Cargar todas las categorías para encontrar el producto
        const { getProductCategories } = await import('@/lib/supervisores-data');
        const categories = await getProductCategories();
        
        // Buscar el producto en todas las categorías
        let foundProduct: Product | null = null;
        let foundCategory: ProductCategory | null = null;
        
        // Si el ID contiene guión bajo, es un ID compuesto (nuevo formato)
        if (productId.includes('_')) {
          const [categoryId, productCode] = productId.split('_', 2);
          const targetCategory = categories.find(cat => cat.id === categoryId);
          if (targetCategory) {
            foundProduct = targetCategory.products.find((p: Product) => p.id === productCode) || null;
            foundCategory = targetCategory;
          }
        } else {
          // Búsqueda tradicional (compatibilidad hacia atrás)
          for (const cat of categories) {
            const productInCategory = cat.products.find((p: Product) => p.id === productId);
            if (productInCategory) {
              foundProduct = productInCategory;
              foundCategory = cat;
              break;
            }
          }
        }
        
        if (foundProduct && foundCategory) {
          setProduct(foundProduct);
          setCategory(foundCategory);

          await reloadRecords(foundProduct);
        } else {
          console.error('Producto no encontrado');
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id, reloadRecords]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Filtrar por status
      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'pending' && record.status === 'pending') ||
        (statusFilter === 'completed' && record.status === 'completed');
      
      // Filtrar por término de búsqueda
      const searchMatch = searchTerm === '' ||
        record.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.observaciones || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.tamano_lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.liberacion_inicial.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && searchMatch;
    });
  }, [records, statusFilter, searchTerm]);

  const handleRecordAdded = async (savedRecord: any) => {
    // Si newRecord está vacío, es solo para limpiar el estado
    if (!savedRecord || Object.keys(savedRecord).length === 0) {
      setEditingRecord(null);
      return;
    }

    console.log('🔄 handleRecordAdd llamado con:', savedRecord);
    console.log('🔄 Status del registro guardado:', savedRecord?.status);

    try {
      if (product) {
        await reloadRecords(product);
      }
    } catch (error) {
      console.error('Error recargando registros después de guardar:', error);
    }
    
    // Si era un registro pendiente que se completó, mostrar mensaje especial
    if (editingRecord && editingRecord.status === 'pending' && savedRecord?.status === 'completed') {
      console.log('✅ Registro pendiente completado exitosamente');
      toast({
        title: '✅ Registro Pendiente Completado',
        description: `El registro ha sido marcado como completado y ya no aparecerá en pendientes.`,
      });
    }
    
    setIsModalOpen(false);
    setEditingRecord(null); // Limpiar el registro en edición
    
    // Notificar a otras páginas que se crearon/actualizaron registros (removido para evitar bucles)
    console.log('🔄 Actualización completada, sin notificación localStorage');
  };

  // Manejar completado de registro pendiente
  const handleCompletePendingRecord = async (record: ProductionRecord) => {
    console.log('🔄 Completando registro pendiente:', record);
    
    try {
      // Cargar el registro completo desde la base de datos usando el ID
      console.log('📂 Cargando registro completo desde la base de datos, ID:', record.id);
      const { productionRecordsService } = await import('@/lib/supervisores-data');
      const completeRecord = await productionRecordsService.getById(record.id);
      
      if (completeRecord) {
        console.log('✅ Registro completo cargado desde la base de datos:', completeRecord);
        
        // Abrir el modal de producción con los datos completos del registro pendiente
        setIsModalOpen(true);
        setEditingRecord(completeRecord); // Cargar el registro COMPLETO para editar/completar
        
        toast({
          title: "Registro Pendiente Cargado",
          description: `Se han cargado todos los datos del registro pendiente con lote ${completeRecord.lote}`,
          variant: "default",
        });
      } else {
        console.error('❌ No se encontró el registro en la base de datos');
        toast({
          title: "Error",
          description: "No se pudo cargar el registro desde la base de datos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error al cargar registro pendiente desde la base de datos:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el registro pendiente. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Manejar edición de registro
  const handleEditRecord = async (record: ProductionRecord) => {
    console.log('✏️ Editando registro:', record);

    if (record.status === 'completed') {
      toast({
        title: 'Edición no permitida',
        description: 'Este registro ya está completado y no se puede editar.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Cargar el registro completo desde la base de datos usando el ID
      console.log('📂 Cargando registro completo para editar, ID:', record.id);
      const { productionRecordsService } = await import('@/lib/supervisores-data');
      const completeRecord = await productionRecordsService.getById(record.id);
      
      if (completeRecord) {
        console.log('✅ Registro completo cargado para editar:', completeRecord);
        
        // Abrir el modal de producción con los datos completos del registro para editar
        setIsModalOpen(true);
        setEditingRecord(completeRecord); // Cargar el registro COMPLETO para editar
        
        toast({
          title: "Registro Cargado para Edición",
          description: `Se han cargado todos los datos del registro con lote ${completeRecord.lote}`,
          variant: "default",
        });
      } else {
        console.error('❌ No se encontró el registro en la base de datos');
        toast({
          title: "Error",
          description: "No se pudo cargar el registro desde la base de datos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error al cargar registro para editar:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el registro para editar. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Manejar selección de registro desde el buscador
  const handleRecordSelect = (record: ProductionRecord, index: number) => {
    // Resaltar el registro
    setHighlightedRecordId(record.id);
    
    // Hacer scroll al registro
    setTimeout(() => {
      const recordElement = document.querySelector(`[data-record-id="${record.id}"]`);
      if (recordElement) {
        recordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remover el resaltado después de 3 segundos
        setTimeout(() => {
          setHighlightedRecordId(null);
        }, 3000);
      }
    }, 100);
  };

  if (loading) {
    console.log('⏳ Página en estado de carga - Mostrando spinner');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Cargando registros...</p>
        </div>
      </div>
    );
  }

  if (!product || !category) {
    console.log('❌ Producto o categoría no encontrados:', { product, category });
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Producto no encontrado</CardTitle>
            <CardDescription>
              El producto con ID <strong>"{params.id}"</strong> no existe o ha sido eliminado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/supervisores?tab=produccion">Volver a Supervisores</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('✅ Página renderizada correctamente:', { 
    productName: product.name, 
    categoryName: category.name, 
    recordsCount: records.length 
  });

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link 
            href={`/dashboard/supervisores?tab=produccion&highlight=${encodeURIComponent(`${category.id}_${product.id}`)}`}
            onClick={(e) => {
              if (category && product) {
                const productIdStr = Array.isArray(id) ? id[0] : id;
                const uniqueId = `${category.id}_${product.id}`;
                console.log('🔙 Guardando producto para destacar:', uniqueId);
                saveScrollPosition(uniqueId);
              }
            }}
            className="inline-block"
          >
            <Button 
              variant="ghost" 
              className="mb-3 sm:mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Supervisores
            </Button>
          </Link>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Registros de Producción
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs sm:text-sm">{product.name}</Badge>
                  <Badge variant="outline" className="text-xs sm:text-sm">{category.name}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <span>
                    Total: <span className="font-semibold">{records.length}</span>
                  </span>
                  <span className="text-yellow-600">
                    Pendientes: <span className="font-semibold">
                      {records.filter(r => r.status === 'pending').length}
                    </span>
                  </span>
                  <span className="text-green-600">
                    Completados: <span className="font-semibold">
                      {records.filter(r => r.status === 'completed').length}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'completed') => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
                <span className="hidden sm:inline">Análisis</span>
                <span className="sm:hidden">Análisis</span>
              </Button>
              <Button 
                onClick={() => {
                  console.log('🖱️ Botón "Agregar Registro" clickeado');
                  console.log('📊 Estado actual:', { isModalOpen, productName: product.name });
                  setIsModalOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                style={{ backgroundColor: '#e25259', color: 'white' }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Agregar Registro</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
            <UniversalSearch
              data={records}
              searchFields={['lote', 'observaciones', 'equipo', 'area', 'tamano_lote', 'liberacion_inicial']}
              onRecordSelect={handleRecordSelect}
              placeholder="Buscar por lote, equipo, área..."
              displayField="lote"
              secondaryField="equipo"
              className="flex-1 w-full"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredRecords.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm 
                    ? 'No se encontraron registros' 
                    : statusFilter === 'pending' 
                      ? 'No hay registros pendientes'
                      : statusFilter === 'completed'
                        ? 'No hay registros completados'
                        : 'No hay registros aún'
                  }
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : statusFilter === 'pending'
                      ? 'Todos los registros están completados o no hay registros'
                      : statusFilter === 'completed'
                        ? 'No hay registros completados para este producto'
                        : 'Agrega tu primer registro de producción para este producto'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Primer Registro
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="transition-transform hover:scale-[1.02]">
                <Card
                  className={
                    `bg-white border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer ` +
                    `${record.status === 'pending' ? 'border-yellow-400 bg-yellow-50 hover:border-yellow-500 ' : ''}` +
                    `${highlightedRecordId === record.id ? 'ring-4 ring-blue-400 ring-opacity-60 bg-blue-50 shadow-lg scale-105 z-10' : ''}`
                  }
                  data-record-id={record.id}
                >
                  {highlightedRecordId === record.id && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 z-20 animate-bounce">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className={`text-lg ${highlightedRecordId === record.id ? 'text-blue-700 font-bold' : ''}`}>
                          Lote: {record.lote}
                        </CardTitle>
                        <CardDescription>
                          Fecha de producción: {formatDate(record.fechaproduccion)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{record.tamano_lote} unidades</Badge>
                        <Badge variant="secondary">{record.area}</Badge>
                        <Badge
                          variant={record.status === 'pending' ? 'secondary' : 'default'}
                          className={
                            record.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300'
                              : 'bg-green-100 text-green-800 hover:bg-green-100 border-green-300'
                          }
                        >
                          {record.status === 'pending' ? 'PENDIENTE' : 'COMPLETADO'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">Vencimiento:</span>
                        <p className="text-gray-600">{formatDate(record.fechavencimiento)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Equipo:</span>
                        <p className="text-gray-600">
                          {(() => {
                            const equipoId = record.equipo;
                            const equipoNombre = equiposNombres[equipoId];
                            const valorMostrado = equipoNombre || (equipoId ? `Equipo ${equipoId}` : 'No especificado');
                            console.log(`🔍 Mostrando equipo - ID: ${equipoId}, Nombre: ${equipoNombre}, Valor: ${valorMostrado}`);
                            return valorMostrado;
                          })()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Temperatura:</span>
                        <p className="text-gray-600">{record.tempam1} - {record.temppm2}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      {record.status === 'pending' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompletePendingRecord(record)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          Completar Registro
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-green-600 hover:text-green-800 hover:bg-green-50"
                          >
                            <Link
                              href={`/dashboard/supervisores/production-record/${record.id}?returnTo=${encodeURIComponent(`/dashboard/supervisores/product/${params.id}/records?highlightRecord=${record.id}`)}`}
                            >
                              Ver Detalles
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>

        {isModalOpen && (
          <AddProductionRecordModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            productName={product.name}
            productId={product.id}
            onSuccessfulSubmit={handleRecordAdded}
            editingRecord={editingRecord}
          />
        )}
        
        {isAnalysisOpen && (
          <ProductionAnalysis
            isOpen={isAnalysisOpen}
            onOpenChange={setIsAnalysisOpen}
            productId={product.id}
          />
        )}
      </div>
    </div>
  );
}
