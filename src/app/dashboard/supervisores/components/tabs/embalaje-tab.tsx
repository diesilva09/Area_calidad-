import { useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { ProductList } from '@/components/supervisores/product-list';
import { AddEditProductModal } from '@/components/supervisores/add-product-modal';
import { EmbalajeIndicadorGlobal } from '@/components/supervisores/embalaje-indicador-global';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SupervisorHandlers } from '../../hooks/use-supervisor-data';
import { ProductCategory } from '@/lib/supervisores-data';
import { EmbalajeRecord } from '@/lib/embalaje-records-service';
import type { AddItemFormValues } from '@/components/supervisores/add-product-modal';
import Link from 'next/link';
import { ProductSearch } from '@/components/supervisores/product-search';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { LoteGlobalSearch } from '@/components/supervisores/lote-global-search';

interface EmbalajeTabProps {
  records: EmbalajeRecord[];
  categories: ProductCategory[];
  handlers: SupervisorHandlers;
  isJefe: boolean;
  onRefresh: () => void;
}

export function EmbalajeTab({
  records,
  categories,
  handlers,
  isJefe,
  onRefresh
}: EmbalajeTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIndicadorOpen, setIsIndicadorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AddItemFormValues | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [highlightTarget, setHighlightTarget] = useState<{ categoryId: string; productId: string } | null>(null);
  const [isDailyHistoryOpen, setIsDailyHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'day' | 'month'>('day');

  const dailyHistoryAnchorRef = useRef<HTMLDivElement | null>(null);

  const todayISO = useMemo(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const currentMonthISO = useMemo(() => todayISO.slice(0, 7), [todayISO]);

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

  const pendingRecords = useMemo(() => records.filter((record) => {
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
  }), [records]);

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

  const formatHora = (value: any) => {
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const toColombiaDate = (value: any): string => {
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    } catch {
      return '';
    }
  };

  const isLegacyPending = (record: EmbalajeRecord) => {
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

  const statusBadge = (record: EmbalajeRecord) => {
    const status = String((record as any)?.status ?? '').toLowerCase();
    const pending = status === 'pending' || isLegacyPending(record);
    if (pending) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDIENTE</Badge>;
    }
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">COMPLETADO</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">COMPLETADO</Badge>;
  };

  const dailyRecords = useMemo(() => {
    const all = Array.isArray(records) ? records : [];
    return all
      .filter((r: any) => {
        const fecha = (r as any)?.fecha ?? (r as any)?.Fecha;
        return toColombiaDate(fecha) === todayISO;
      })
      .sort((a: any, b: any) => String((b as any)?.created_at ?? '').localeCompare(String((a as any)?.created_at ?? '')));
  }, [records, todayISO]);

  const monthlyRecords = useMemo(() => {
    const all = Array.isArray(records) ? records : [];
    return all
      .filter((r: any) => {
        const fecha = (r as any)?.fecha ?? (r as any)?.Fecha;
        const iso = toColombiaDate(fecha);
        if (!iso) return false;
        return iso.slice(0, 7) === currentMonthISO;
      })
      .sort((a: any, b: any) => String((b as any)?.created_at ?? '').localeCompare(String((a as any)?.created_at ?? '')));
  }, [records, currentMonthISO]);

  const displayedHistoryRecords = historyFilter === 'day' ? dailyRecords : monthlyRecords;

  const exportDailyToExcel = () => {
    const data = (dailyRecords || []).map((r: any) => {
      const productoNombre = getProductoNombre(r);

      return {
        ...r,
        // Mantener ID original para auditoría
        producto_id: String(r?.producto ?? r?.producto_id ?? '').trim() || undefined,

        // Columna legible
        producto: productoNombre || String(r?.producto ?? '').trim(),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registros');
    XLSX.writeFile(wb, `RE-CAL-093_registros_${todayISO}.xlsx`);
  };

  const handleCreateProduct = () => {
    setEditingItem({ type: 'embalaje', id: '', name: '', categoryId: undefined } as any);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: any, categoryId: string) => {
    setEditingItem({
      type: 'embalaje',
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
          type: 'embalaje',
          products: [],
        });
      } else {
        await handlers.handleCreateCategory({
          id: values.id as string,
          name: values.name as string,
          type: 'embalaje',
          products: [],
        });
      }
      await Promise.resolve(onRefresh());
      return;
    }

    if (values.type === 'embalaje' || values.type === 'product') {
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
        nextParams.set('tab', 'embalaje');
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
          <Package className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Gestión de Embalaje
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setIsIndicadorOpen(true)}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            Indicador
          </Button>

          {isJefe && (
            <>
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
            </>
          )}
        </div>
      </div>

      {pendingRecords.length > 0 && (
        <Card className="border-2 border-yellow-400 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-yellow-900" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-yellow-900">
                    Tienes {pendingRecords.length} registro{pendingRecords.length !== 1 ? 's' : ''} pendiente{pendingRecords.length !== 1 ? 's' : ''} de embalaje
                  </div>
                  <div className="text-sm text-yellow-800">
                    Completa los campos pendientes para cerrar esos registros.
                  </div>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="border-yellow-400 text-yellow-800 hover:bg-yellow-100 w-full sm:w-auto"
              >
                <Link href="/dashboard/supervisores/embalaje-pending">
                  Ver pendientes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base sm:text-lg">
            {historyFilter === 'day' ? `Historial del día (${todayISO})` : `Historial del mes (${currentMonthISO})`}
          </CardTitle>
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="flex rounded-md border overflow-hidden shrink-0">
              <button
                onClick={() => setHistoryFilter('day')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  historyFilter === 'day' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setHistoryFilter('month')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  historyFilter === 'month' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Este mes
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const el = dailyHistoryAnchorRef.current;
                const beforeTop = el ? el.getBoundingClientRect().top : null;

                setIsDailyHistoryOpen((v) => !v);

                if (typeof window !== 'undefined') {
                  requestAnimationFrame(() => {
                    const afterTop = el ? el.getBoundingClientRect().top : null;
                    if (beforeTop == null || afterTop == null) return;
                    const delta = afterTop - beforeTop;
                    if (delta !== 0) window.scrollBy({ top: delta });
                  });
                }
              }}
              className="w-full sm:w-auto"
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
              disabled={displayedHistoryRecords.length === 0}
              onClick={exportDailyToExcel}
              className="w-full sm:w-auto"
            >
              Exportar
            </Button>
          </div>
        </CardHeader>
        {isDailyHistoryOpen && (
          <CardContent>
            {displayedHistoryRecords.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {historyFilter === 'day' ? 'No hay registros creados hoy.' : 'No hay registros este mes.'}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden md:grid md:grid-cols-6 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <div>Producto</div>
                  <div>Hora</div>
                  <div>Lote</div>
                  <div>Estado</div>
                  <div>Responsable</div>
                  <div></div>
                </div>
                {displayedHistoryRecords.map((r: any) => (
                  <div
                    key={`${String(r?.id ?? '')}-${String(r?.created_at ?? '')}`}
                    className="rounded-md border p-3 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <div className="space-y-1.5 md:space-y-0 md:grid md:grid-cols-6 md:gap-2 md:items-center">
                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Producto</div>
                        <div className="font-medium break-words text-right md:text-left">
                          {getProductoNombre(r) || '—'}
                        </div>
                      </div>

                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Hora</div>
                        <div className="text-right md:text-left">{formatHora(r?.created_at) || '—'}</div>
                      </div>

                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Lote</div>
                        <div className="break-words text-right md:text-left">
                          {String(r?.lote ?? '').trim() || '—'}
                        </div>
                      </div>

                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Estado</div>
                        <div className="flex justify-end md:justify-start">{statusBadge(r as EmbalajeRecord)}</div>
                      </div>

                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Responsable</div>
                        <div className="break-words text-right md:text-left">
                          {String(r?.responsable_embalaje ?? r?.created_by ?? r?.createdBy ?? '').trim() || '—'}
                        </div>
                      </div>

                      <div className="flex justify-end md:justify-start">
                        <Link
                          href={`/dashboard/supervisores/embalaje-record/${r?.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Ver <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Categories and Products */}
      <LoteGlobalSearch
        kind="embalaje"
        items={(records || [])
          .map((r: any) => {
            const status = String((r as any)?.status ?? '').toLowerCase();
            const pending = status === 'pending' || isLegacyPending(r as EmbalajeRecord);

            return {
              id: String(r?.id ?? ''),
              kind: 'embalaje' as const,
              lote: String(r?.lote ?? '').trim(),
              status: pending ? 'pending' : 'completed',
              responsable:
                String(
                  (r as any)?.responsable_embalaje ?? (r as any)?.created_by ?? (r as any)?.createdBy ?? ''
                ).trim() || undefined,
            };
          })
          .filter((x) => Boolean(x.id) && Boolean(x.lote))}
        placeholder="Buscar lote (RE CAL 093)..."
        className="w-full"
      />

      <div ref={dailyHistoryAnchorRef} />

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
        {categories.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No se encontraron categorías/productos para Embalaje.
            </CardContent>
          </Card>
        )}
        {filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 break-words">{category.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductList
                  categories={[category]}
                  type="embalaje"
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
      <Dialog open={isIndicadorOpen} onOpenChange={setIsIndicadorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Indicador Global de Incumplimiento de Embalaje</DialogTitle>
          <EmbalajeIndicadorGlobal records={records} />
        </DialogContent>
      </Dialog>

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
