import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Plus, Package, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ProductList } from '@/components/supervisores/product-list';
import { AddEditProductModal } from '@/components/supervisores/add-product-modal';
import { SupervisorHandlers } from '../../hooks/use-supervisor-data';
import { ProductCategory, productionRecordsService, type ProductionRecord } from '@/lib/supervisores-data';
import type { AddItemFormValues } from '@/components/supervisores/add-product-modal';
import { ProductSearch } from '@/components/supervisores/product-search';
import * as XLSX from 'xlsx';
import { AreasEquiposService } from '@/lib/areas-equipos-config';
import { LoteGlobalSearch } from '@/components/supervisores/lote-global-search';

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


  const [isDailyHistoryOpen, setIsDailyHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'day' | 'month'>('day');
  const [equiposNombres, setEquiposNombres] = useState<Record<string, string>>({});

  const dailyHistoryAnchorRef = useRef<HTMLDivElement | null>(null);

  const [allRecords, setAllRecords] = useState<ProductionRecord[]>([]);
  const [isLoadingAllRecords, setIsLoadingAllRecords] = useState(false);
  const [pendingAlerts, setPendingAlerts] = useState<Array<{
    id: string;
    lote: string;
    producto: string;
    created_at: string;
    last_opened_at: string | null;
    diffDays: number;
    stage: '8d' | '23d';
  }>>([]);

  const todayISO = useMemo(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const currentMonthISO = useMemo(() => todayISO.slice(0, 7), [todayISO]);

  const toColombiaDate = (value: any): string => {
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    } catch {
      return '';
    }
  };

  const dailyRecords = useMemo(() => {
    return allRecords
      .filter((r: any) => {
        const fechaProduccion = (r as any)?.fechaproduccion ?? (r as any)?.fechaProduccion;
        return toColombiaDate(fechaProduccion) === todayISO;
      })
      .sort((a: any, b: any) => String(b?.created_at ?? '').localeCompare(String(a?.created_at ?? '')));
  }, [allRecords, todayISO]);

  const displayedHistoryRecords = useMemo(() => {
    if (historyFilter === 'day') return dailyRecords;
    return (allRecords as any[])
      .filter((r) => {
        const fechaProduccion = (r as any)?.fechaproduccion ?? (r as any)?.fechaProduccion;
        const iso = toColombiaDate(fechaProduccion);
        if (!iso) return false;
        return iso.slice(0, 7) === currentMonthISO;
      })
      .sort((a, b) => String(b?.created_at ?? '').localeCompare(String(a?.created_at ?? '')));
  }, [historyFilter, dailyRecords, allRecords, currentMonthISO]);


  useEffect(() => {
    fetch('/api/production-records/check-pending').catch(() => {});

    const loadPendingAlerts = async () => {
      try {
        const res = await fetch('/api/production-records');
        if (!res.ok) return;
        const records: any[] = await res.json();
        const now = Date.now();
        const alerts: typeof pendingAlerts = [];
        for (const r of records) {
          if (String(r?.status ?? '').toLowerCase() !== 'pending') continue;
          const ref = r.last_opened_at ? new Date(r.last_opened_at) : new Date(r.created_at);
          const diffDays = Math.floor((now - ref.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 23) {
            alerts.push({ id: r.id, lote: r.lote, producto: r.producto, created_at: r.created_at, last_opened_at: r.last_opened_at ?? null, diffDays, stage: '23d' });
          } else if (diffDays >= 8) {
            alerts.push({ id: r.id, lote: r.lote, producto: r.producto, created_at: r.created_at, last_opened_at: r.last_opened_at ?? null, diffDays, stage: '8d' });
          }
        }
        alerts.sort((a, b) => b.diffDays - a.diffDays);
        setPendingAlerts(alerts);
      } catch {
        // no-op
      }
    };

    loadPendingAlerts();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setIsLoadingAllRecords(true);
      try {
        const records = await productionRecordsService.getAll();
        if (cancelled) return;
        setAllRecords(Array.isArray(records) ? records : []);
      } catch (error) {
        if (cancelled) return;
        console.error('Error cargando registros (búsqueda de lotes):', error);
        setAllRecords([]);
      } finally {
        if (!cancelled) setIsLoadingAllRecords(false);
      }
    };

    loadAll();

    return () => {
      cancelled = true;
    };
  }, []);

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

        const resolved: Record<string, string> = {};

        await Promise.allSettled(
          ids.map(async (id) => {
            try {
              const equipo = await AreasEquiposService.getEquipoPorId(id);
              if (equipo?.nombre) {
                resolved[id] = equipo.nombre;
              }
            } catch {
              // no-op: dejamos fallback al ID
            }
          })
        );

        if (!cancelled && Object.keys(resolved).length > 0) {
          setEquiposNombres((prev) => ({ ...prev, ...resolved }));
        }
      } catch (e) {
        console.error('Error cargando nombres de equipos (export):', e);
      }
    };

    cargarNombresEquipos();

    return () => {
      cancelled = true;
    };
  }, [dailyRecords]);

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
      {/* Panel de alertas de registros pendientes */}
      {pendingAlerts.length > 0 && (
        <Card className="border-2 border-orange-400 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-400 rounded-full shrink-0">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-orange-900">
                  ⚠️ {pendingAlerts.length} registro{pendingAlerts.length !== 1 ? 's' : ''} RE-CAL-084 pendiente{pendingAlerts.length !== 1 ? 's' : ''} sin completar
                </h2>
                <p className="text-xs text-orange-700">Registros que llevan 8 o más días sin ser completados</p>
              </div>
            </div>
            <div className="space-y-2">
              {pendingAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 bg-white ${
                    alert.stage === '23d' ? 'border-red-300' : 'border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className={`h-4 w-4 shrink-0 ${alert.stage === '23d' ? 'text-red-500' : 'text-orange-500'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">Lote: {alert.lote}</p>
                      <p className="text-xs text-gray-500 truncate">{productoNombrePorId[alert.producto] ?? alert.producto}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={`text-xs ${
                        alert.stage === '23d'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {alert.diffDays} días
                    </Badge>
                    <Link
                      href={`/dashboard/supervisores/production-record/${alert.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Ver <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <div className="flex items-center">
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Ocultar
                </div>
              ) : (
                <div className="flex items-center">
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Mostrar
                </div>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoadingAllRecords || displayedHistoryRecords.length === 0}
              onClick={exportDailyToExcel}
              className="w-full sm:w-auto"
            >
              Exportar
            </Button>
          </div>
        </CardHeader>
        {isDailyHistoryOpen && (
          <CardContent>
            {isLoadingAllRecords ? (
              <div className="text-sm text-muted-foreground">Cargando registros...</div>
            ) : displayedHistoryRecords.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {historyFilter === 'day' ? 'No hay registros creados hoy.' : 'No hay registros este mes.'}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="hidden md:grid md:grid-cols-7 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <div>Producto</div>
                  <div>Hora</div>
                  <div>Lote</div>
                  <div>Área / Proceso</div>
                  <div>Estado</div>
                  <div>Responsable</div>
                  <div></div>
                </div>
                {displayedHistoryRecords.map((r: any) => (
                  <div
                    key={`${String(r?.id ?? '')}-${String(r?.created_at ?? '')}`}
                    className="rounded-md border p-3 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <div className="space-y-1.5 md:space-y-0 md:grid md:grid-cols-7 md:gap-2 md:items-center">
                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Producto</div>
                        <div className="font-medium break-words text-right md:text-left">
                          {getProductoNombre(r) || '—'}
                        </div>
                      </div>

                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Hora</div>
                        <div className="text-right md:text-left">{formatHora(r.created_at) || '—'}</div>
                      </div>

                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Lote</div>
                        <div className="break-words text-right md:text-left">
                          {String(r?.lote ?? '').trim() || '—'}
                        </div>
                      </div>

                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Área / Proceso</div>
                        <div className="break-words text-right md:text-left">{r?.area || '—'}</div>
                      </div>

                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Estado</div>
                        <div className="flex justify-end md:justify-start">{statusBadge(r?.status)}</div>
                      </div>

                      <div className="flex justify-between gap-3 md:block">
                        <div className="text-xs text-muted-foreground md:hidden">Responsable</div>
                        <div className="break-words text-right md:text-left">
                          {r?.responsable_produccion || r?.created_by || '—'}
                        </div>
                      </div>

                      <div className="flex justify-end md:justify-start">
                        <Link
                          href={`/dashboard/supervisores/production-record/${r?.id}`}
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

      <div ref={dailyHistoryAnchorRef} />

      {/* Categories and roducts */}
      <LoteGlobalSearch
        kind="produccion"
        items={(allRecords || []).map((r: any) => ({
          id: String(r?.id ?? ''),
          kind: 'produccion' as const,
          lote: String(r?.lote ?? '').trim(),
          status: (r as any)?.status,
          responsable: String((r as any)?.responsable_produccion ?? (r as any)?.created_by ?? '').trim() || undefined,
          productKey: String(r?.category_id ?? r?.categoria_id ?? '').trim() && String(r?.producto ?? r?.producto_id ?? r?.product_id ?? '').trim()
            ? `${String(r?.category_id ?? r?.categoria_id ?? '').trim()}_${String(r?.producto ?? r?.producto_id ?? r?.product_id ?? '').trim()}`
            : undefined,
        })).filter((x) => Boolean(x.id) && Boolean(x.lote))}
        placeholder="Buscar lote (RE CAL 084)..."
        className="w-full"
      />

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
