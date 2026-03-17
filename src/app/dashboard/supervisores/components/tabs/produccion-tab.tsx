import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Plus, Package } from 'lucide-react';
import { ProductList } from '@/components/supervisores/product-list';
import { AddEditProductModal } from '@/components/supervisores/add-product-modal';
import { SupervisorHandlers } from '../../hooks/use-supervisor-data';
import { ProductCategory, productionRecordsService, type ProductionRecord } from '@/lib/supervisores-data';
import type { AddItemFormValues } from '@/components/supervisores/add-product-modal';
import { ProductSearch } from '@/components/supervisores/product-search';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { AreasEquiposService } from '@/lib/areas-equipos-config';

interface ProduccionTabProps {
  categories: ProductCategory[];
  handlers: SupervisorHandlers;
  isJefe: boolean;
  onRefresh: () => void;
}

export function ProduccionTab({
  categories,
  handlers,
  isJefe,
  onRefresh
}: ProduccionTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AddItemFormValues | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [highlightTarget, setHighlightTarget] = useState<{ categoryId: string; productId: string } | null>(null);

  const [dailyRecords, setDailyRecords] = useState<ProductionRecord[]>([]);
  const [isLoadingDailyRecords, setIsLoadingDailyRecords] = useState(false);
  const [isDailyHistoryOpen, setIsDailyHistoryOpen] = useState(false);
  const [equiposNombres, setEquiposNombres] = useState<Record<string, string>>({});

  const todayISO = useMemo(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDaily = async () => {
      setIsLoadingDailyRecords(true);
      try {
        const records = await productionRecordsService.getByCreatedDate(todayISO);
        if (cancelled) return;
        setDailyRecords(Array.isArray(records) ? records : []);
      } catch (error) {
        if (cancelled) return;
        console.error('Error cargando registros del día:', error);
        setDailyRecords([]);
      } finally {
        if (!cancelled) setIsLoadingDailyRecords(false);
      }
    };

    loadDaily();

    return () => {
      cancelled = true;
    };
  }, [todayISO]);

  useEffect(() => {
    let cancelled = false;

    const cargarNombresEquipos = async () => {
      try {
        const ids = Array.from(
          new Set(
            (dailyRecords || [])
              .map((r: any) => String((r as any)?.equipo ?? '').trim())
              .filter(Boolean)
          )
        );

        if (ids.length === 0) return;

        const faltantes = ids.filter((id) => !equiposNombres[id]);
        if (faltantes.length === 0) return;

        const nextMap: Record<string, string> = { ...equiposNombres };

        await Promise.allSettled(
          faltantes.map(async (id) => {
            try {
              const equipo = await AreasEquiposService.getEquipoPorId(id);
              if (equipo?.nombre) {
                nextMap[id] = equipo.nombre;
              }
            } catch {
              // no-op: dejamos fallback al ID
            }
          })
        );

        if (!cancelled) setEquiposNombres(nextMap);
      } catch (e) {
        console.error('Error cargando nombres de equipos (export):', e);
      }
    };

    cargarNombresEquipos();

    return () => {
      cancelled = true;
    };
    // Intencional: dependemos de dailyRecords y equiposNombres para completar el map incremental.
  }, [dailyRecords, equiposNombres]);

  const productoNombrePorId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cat of categories || []) {
      for (const p of cat.products || []) {
        map[String(p.id)] = String((p as any).name ?? (p as any).nombre ?? p.id);
      }
    }
    return map;
  }, [categories]);

  const getProductoNombre = (r: any) => {
    const fromRecord = String(r?.producto_nombre ?? r?.productoNombre ?? '').trim();
    if (fromRecord) return fromRecord;

    const raw = String(r?.producto ?? r?.producto_id ?? r?.product_id ?? '').trim();
    if (!raw) return '';
    return productoNombrePorId[raw] ?? raw;
  };

  const getEquipoNombre = (r: any) => {
    const raw = String(r?.equipo ?? '').trim();
    if (!raw) return '';
    return equiposNombres[raw] ?? raw;
  };

  const getVacioObservaciones = (r: any) => {
    const pruebasVacio = String(r?.pruebasVacio ?? r?.pruebas_vacio ?? '').toLowerCase();
    const noCumple = pruebasVacio.includes('no') || pruebasVacio.includes('no conforme') || pruebasVacio.includes('incumple');
    if (!noCumple) return '';

    const novedades = String(r?.novedadesProceso ?? r?.novedades_proceso ?? '').trim();
    const corr = String(r?.observacionesAccionesCorrectivas ?? r?.observaciones_acciones_correctivas ?? '').trim();
    return [novedades, corr].filter(Boolean).join('\n');
  };

  const exportDailyToExcel = () => {
    const data = (dailyRecords || []).map((r: any) => {
      const productoNombre = getProductoNombre(r);
      const equipoNombre = getEquipoNombre(r);

      return {
        ...r,
        // Mantener IDs originales para auditoría
        producto_id: String(r?.producto ?? r?.producto_id ?? '').trim() || undefined,
        equipo_id: String(r?.equipo ?? r?.equipo_id ?? '').trim() || undefined,

        // Reemplazar las columnas principales por nombres legibles
        producto: productoNombre || String(r?.producto ?? '').trim(),
        equipo: equipoNombre || String(r?.equipo ?? '').trim(),

        // Campo derivado específico solicitado
        observaciones_proceso_vacio: getVacioObservaciones(r),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registros');
    XLSX.writeFile(wb, `RE-CAL-084_registros_${todayISO}.xlsx`);
  };

  const formatHora = (value: any) => {
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const statusBadge = (status: any) => {
    const v = String(status || '').toLowerCase();
    if (v === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDIENTE</Badge>;
    }
    if (v === 'completed') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">COMPLETADO</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">SIN ESTADO</Badge>;
  };

  const filteredCategories = useMemo(() => {
    const term = globalSearchTerm.trim().toLowerCase();
    if (!term) return categories;

    return categories
      .map((category) => {
        const filteredProducts = category.products.filter((product) =>
          product.name.toLowerCase().includes(term) || product.id.toLowerCase().includes(term)
        );
        return { ...category, products: filteredProducts };
      })
      .filter((category) => category.products.length > 0);
  }, [categories, globalSearchTerm]);

  const handleCreateProduct = () => {
    setEditingItem({ type: 'produccion', id: '', name: '', categoryId: undefined } as any);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: any, categoryId: string) => {
    setEditingItem({
      type: 'produccion',
      id: product.id,
      name: product.name,
      categoryId: product.category_id ?? categoryId,
      oldCategoryId: categoryId,
      pesosConfig: product.pesos_config ?? product.pesosConfig,
      temperaturasConfig: product.temperaturas_config ?? product.temperaturasConfig,
      calidadRangosConfig: product.calidad_rangos_config ?? product.calidadRangosConfig,
    } as any);
    setIsModalOpen(true);
  };

  const handleCreateCategory = () => {
    setEditingItem({ type: 'category', id: '', name: '' } as any);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingItem({ type: 'category', id: category.id, name: category.name } as any);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (category: ProductCategory) => {
    await handlers.handleDeleteCategory(category.id);
    await Promise.resolve(onRefresh());
  };

  const handleSave = async (values: AddItemFormValues, initialData: AddItemFormValues | null) => {
    if (values.type === 'category') {
      if (initialData?.id) {
        await handlers.handleEditCategory({
          id: initialData.id,
          name: values.name as string,
          type: 'produccion',
          products: [],
        });
      } else {
        await handlers.handleCreateCategory({
          id: values.id as string,
          name: values.name as string,
          type: 'produccion',
          products: [],
        });
      }
      await Promise.resolve(onRefresh());
      return;
    }

    if (values.type === 'produccion' || values.type === 'product') {
      const targetProductId = (initialData?.id ?? values.id) as string;
      const targetCategoryId = (values.categoryId ?? initialData?.categoryId) as string;

      if (initialData?.id) {
        await handlers.handleEditProduct({
          id: initialData.id,
          name: values.name as string,
          category_id: values.categoryId as string,
          oldCategoryId: (initialData as any)?.oldCategoryId ?? (initialData as any)?.categoryId,
          pesos_config: (values as any).pesosConfig ?? null,
          temperaturas_config: (values as any).temperaturasConfig ?? null,
          calidad_rangos_config: (values as any).calidadRangosConfig ?? null,
        } as any);
      } else {
        await handlers.handleCreateProduct({
          id: values.id as string,
          name: values.name as string,
          category_id: values.categoryId as string,
          pesos_config: (values as any).pesosConfig ?? null,
          temperaturas_config: (values as any).temperaturasConfig ?? null,
          calidad_rangos_config: (values as any).calidadRangosConfig ?? null,
        } as any);
      }
      await Promise.resolve(onRefresh());

      if (targetProductId && targetCategoryId) {
        setHighlightTarget({
          categoryId: targetCategoryId,
          productId: targetProductId,
        });

        const uniqueId = `${targetCategoryId}_${targetProductId}`;
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set('tab', 'produccion');
        nextParams.set('highlight', uniqueId);
        router.replace(`/dashboard/supervisores?${nextParams.toString()}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <Package className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Gestión de Producción
          </h2>
        </div>

        {isJefe && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={handleCreateCategory}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
            <Button
              onClick={handleCreateProduct}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base sm:text-lg">Historial de registros del día</CardTitle>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">{todayISO}</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDailyHistoryOpen((v) => !v)}
            >
              {isDailyHistoryOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Mostrar
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoadingDailyRecords || dailyRecords.length === 0}
              onClick={exportDailyToExcel}
            >
              Exportar registros del día
            </Button>
          </div>
        </CardHeader>
        {isDailyHistoryOpen && (
          <CardContent>
            {isLoadingDailyRecords ? (
              <div className="text-sm text-muted-foreground">Cargando registros del día...</div>
            ) : dailyRecords.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay registros creados hoy.</div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-medium text-muted-foreground">
                  <div>Producto</div>
                  <div>Hora</div>
                  <div>Área / Proceso</div>
                  <div>Estado</div>
                  <div>Responsable</div>
                </div>
                {dailyRecords.map((r: any) => (
                  <div
                    key={String(r.id)}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-2 rounded-md border p-2 text-sm"
                  >
                    <div className="font-medium break-words">{getProductoNombre(r) || '—'}</div>
                    <div>{formatHora(r.created_at)}</div>
                    <div className="break-words">{r.area || '—'}</div>
                    <div>{statusBadge(r.status)}</div>
                    <div className="break-words">{r.responsable_produccion || r.created_by || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Categories and Products */}
      <ProductSearch
        categories={categories}
        onProductSelect={(product, categoryId) => {
          setGlobalSearchTerm(product.name);
          setHighlightTarget({ categoryId, productId: product.id });
        }}
        placeholder="Buscar producto por nombre o código..."
        value={globalSearchTerm}
        onValueChange={setGlobalSearchTerm}
      />

      <div className="grid gap-6">
        {filteredCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 break-words">{category.name}</span>
                {isJefe && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                   
                   
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductList
                categories={[category]}
                type="produccion"
                readOnly={!isJefe}
                showSearch={false}
                highlightTarget={highlightTarget}
                onEditCategory={isJefe ? handleEditCategory : undefined}
                onDeleteCategory={isJefe ? handleDeleteCategory : undefined}
                onEditProduct={handleEditProduct}
                onDeleteProduct={
                  isJefe
                    ? (product) => handlers.handleDeleteProduct(product.id)
                    : undefined
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <AddEditProductModal
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setEditingItem(null);
          }}
          onSave={handleSave}
          categories={categories}
          initialData={editingItem}
        />
      )}
    </div>
  );
}
