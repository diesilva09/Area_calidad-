'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Package, User, CheckCircle, AlertCircle, Search, Edit, FileText, ClipboardList, BarChart3, Users, Tag, Boxes, Scale, ShieldCheck, FileDown, History } from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { useEffect, useRef, useState, use } from 'react';
import { embalajeRecordsService, type EmbalajeRecord } from '@/lib/embalaje-records-service';
import { AddEmbalajeRecordModal } from '@/components/supervisores/add-embalaje-record-modal';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { getProductCategories } from '@/lib/supervisores-data';
import { ProductoPesosService } from '@/lib/producto-pesos-service';
import { AuditedField } from '@/components/audited-field';
import { FieldHistoryPanel } from '@/components/field-history-panel';

export default function EmbalajeRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<EmbalajeRecord | null>(null);
  const [productMeta, setProductMeta] = useState<{ productId: string; productName: string; categoryId?: string } | null>(null);
  const [presentacionMostrada, setPresentacionMostrada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const { saveScrollPosition } = useScrollRestoration();
  const autoOpenedRef = useRef(false);

  const exportToExcel = () => {
    if (!record) return;
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(record as any)) {
      data[key] = value;
    }
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro');
    XLSX.writeFile(wb, `RE-CAL-093_lote-`+String((record as any)?.lote ?? 'sin-lote').replace(/[^a-zA-Z0-9_-]/g, '_')+`.xlsx`);
  };

  const hasText = (value: unknown): boolean => {
    const v = String(value ?? '').trim();
    return v.length > 0 && v !== '—' && v.toLowerCase() !== 'pendiente';
  };

  const toNumber = (value: unknown): number => {
    const n = Number.parseFloat(String(value ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const isNonConform = (percentage: unknown): boolean => {
    return toNumber(percentage) > 0;
  };

  const formatFechaSinDesfase = (raw: unknown): string => {
    if (!raw) return '';
    if (typeof raw === 'string') {
      const dateOnly = raw.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        const [y, m, d] = dateOnly.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('es-ES');
      }
      const parsed = new Date(raw);
      return isNaN(parsed.getTime()) ? String(raw) : parsed.toLocaleDateString('es-ES');
    }
    if (raw instanceof Date) return raw.toLocaleDateString('es-ES');
    return String(raw);
  };

  const returnTo = searchParams?.get('returnTo') || '/dashboard/supervisores?tab=embalaje';

  const resolvedParams = use(params);

  const loadRecord = async () => {
    try {
      const records = await embalajeRecordsService.getAll();
      const foundRecord = records.find(r => r.id === resolvedParams.id);

      if (!foundRecord) {
        setError('Registro no encontrado');
      } else {
        setRecord(foundRecord);

        try {
          const categories = await getProductCategories();
          const productoRaw = String(foundRecord.producto);

          const match = categories
            .flatMap((cat) => cat.products.map((p) => ({ cat, p })))
            .find(({ p }) => String(p.id) === productoRaw || p.name === productoRaw);

          if (match) {
            setProductMeta({
              productId: match.p.id,
              productName: match.p.name,
              categoryId: match.cat.id,
            });
          } else {
            setProductMeta({ productId: productoRaw, productName: productoRaw });
          }
        } catch (metaError) {
          const productoRaw = String(foundRecord.producto);
          setProductMeta({ productId: productoRaw, productName: productoRaw });
        }
      }
    } catch (error) {
      setError('Error al cargar el registro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'jefe' && user.role !== 'operario' && user.role !== 'tecnico')) {
      router.push('/dashboard');
      return;
    }
    loadRecord();
  }, [user, router, resolvedParams.id]);

  useEffect(() => {
    loadRecord();
  }, [resolvedParams.id]);

  useEffect(() => {
    const cargarPresentacion = async () => {
      if (!record) return;
      const presentacionActual = String(record.presentacion || '').trim();
      if (presentacionActual && presentacionActual !== 'Pendiente') {
        setPresentacionMostrada(presentacionActual);
        return;
      }
      if (!productMeta?.productId) {
        setPresentacionMostrada(presentacionActual || null);
        return;
      }
      try {
        const pesosConfig = await ProductoPesosService.buscarPesoExhaustivo(productMeta.productId, productMeta.categoryId);
        if (pesosConfig?.peso_neto_declarado) {
          setPresentacionMostrada(String(pesosConfig.peso_neto_declarado));
        } else {
          setPresentacionMostrada(presentacionActual || null);
        }
      } catch {
        setPresentacionMostrada(presentacionActual || null);
      }
    };
    cargarPresentacion();
  }, [record, productMeta]);

  const isRecordPending = (record: EmbalajeRecord): boolean => {
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

  useEffect(() => {
    if (!record) return;
    const shouldComplete = searchParams?.get('complete') === '1';
    if (!shouldComplete) return;
    if (!isRecordPending(record)) return;

    // Evitar reabrir si hay re-renders
    if (autoOpenedRef.current) return;
    autoOpenedRef.current = true;

    setIsEditModalOpen(true);
  }, [record, searchParams]);

  const handleSuccessfulEdit = async () => {
    try {
      if (!record) return;
      const categories = await getProductCategories();
      const match = categories
        .flatMap((cat) => cat.products.map((p) => ({ cat, p })))
        .find(({ p }) => p.id === record.producto || p.name === record.producto);
      const productKey = match ? `${match.cat.id}_${match.p.id}` : record.producto;
      router.push(
        `/dashboard/supervisores/product/${encodeURIComponent(productKey)}/embalaje?highlightRecord=${encodeURIComponent(record.id)}`
      );
    } catch (e) {
      console.error('❌ Error redirigiendo al listado del producto:', e);
      if (record) {
        router.push(
          `/dashboard/supervisores/product/${encodeURIComponent(record.producto)}/embalaje?highlightRecord=${encodeURIComponent(record.id)}`
        );
      }
    }
  };

  if (!user) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-zinc-200" />
            <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin" />
          </div>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500">
            Cargando registro
          </p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="bg-white border border-zinc-200 rounded-2xl p-10 max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Error</h2>
          <p className="text-sm text-zinc-500 mb-6">{error || 'Registro no encontrado'}</p>
          <Button asChild className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-xl">
            <Link href={returnTo}>Volver</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">

      {/* ── Top nav ── */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 min-h-14 flex items-center justify-between gap-4 flex-wrap">
          <Button
            variant="ghost"
            asChild
            onClick={() => saveScrollPosition(record?.id)}
            className="text-zinc-500 hover:text-zinc-900 hover:bg-slate-100 rounded-lg h-8 px-3 text-sm gap-1.5"
          >
            <Link href={returnTo}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver
            </Link>
          </Button>

          <div className="flex items-center justify-end gap-2 flex-wrap">
            <Button onClick={() => setIsHistoryPanelOpen(true)} variant="outline" size="sm" className="text-xs rounded-xl h-8 px-4 gap-1.5 border-gray-300">
              <History className="h-3.5 w-3.5" />
              Historial
            </Button>
            <Button onClick={exportToExcel} variant="outline" size="sm" className="text-xs rounded-xl h-8 px-4 gap-1.5 border-gray-300">
              <FileDown className="h-3.5 w-3.5" />
              Exportar Excel
            </Button>
            {isRecordPending(record) && (
              <Badge className="bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full hidden sm:flex">
                Pendiente
              </Badge>
            )}
            {isRecordPending(record) && (
              <Button
                onClick={() => setIsEditModalOpen(true)}
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs rounded-xl h-8 px-4 gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                Completar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* ── Hero ── */}
        <div className="rounded-2xl bg-white border border-zinc-200 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-2 flex items-center gap-1.5">
                <Package className="h-3 w-3" /> Registro de Embalaje
              </p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
                {productMeta?.productName || String(record.producto)}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Lote <span className="text-zinc-400 font-mono">{record.lote}</span>
                &nbsp;·&nbsp;
                <span className="text-zinc-400">{formatFechaSinDesfase(record.fecha)}</span>
              </p>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">% Faltantes</p>
                <p className="text-3xl font-black tabular-nums text-zinc-900">{record.porcentaje_faltantes}<span className="text-base text-zinc-500">%</span></p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">% Incumplimiento</p>
                <p className="text-3xl font-black tabular-nums text-zinc-900">{record.porcentaje_incumplimiento}<span className="text-base text-zinc-500">%</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Información General ── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" /> Información General
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Fecha', value: formatFechaSinDesfase(record.fecha) },
              { label: 'Mes de Corte', value: record.mescorte },
              { label: 'Tamaño Lote', value: record.tamano_lote },
              { label: 'Nivel Inspección', value: record.nivel_inspeccion },
              { label: 'Presentación', value: presentacionMostrada || record.presentacion },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-colors">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
                <p className="text-base font-bold text-zinc-900">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Resultados Inspección ── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> Resultados de Inspección
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Cajas Revisadas',        value: record.cajas_revisadas,                hi: false },
              { label: 'Unidades Revisadas',     value: record.total_unidades_revisadas,       hi: false },
              { label: 'Revisadas (Real)',        value: record.total_unidades_revisadas_real,  hi: false },
              { label: 'Unidades Faltantes',     value: record.unidades_faltantes,             hi: true  },
              { label: 'No Conformes',           value: record.unidades_no_conformes,          hi: true  },
            ].map(({ label, value, hi }) => (
              <div key={label} className={`bg-white border rounded-xl p-4 hover:border-zinc-300 transition-colors ${hi ? 'border-red-500/20' : 'border-zinc-200'}`}>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
                <p className={`text-2xl font-black tabular-nums ${hi ? 'text-red-600' : 'text-zinc-900'}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className={`bg-white border rounded-xl p-5 ${hasText(record.observaciones_generales) ? 'border-amber-400/40 bg-amber-50/40' : 'border-zinc-200'}`}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" /> Observaciones Generales
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {record.observaciones_generales || <span className="italic text-zinc-400">Sin observaciones</span>}
            </p>
          </div>
        </section>

        {/* ── Verificación de Atributos ── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-3.5 w-3.5" /> Verificación de Atributos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Etiqueta */}
            {(() => {
              const nonConform = isNonConform(record.porcentaje_etiqueta_no_conforme);
              const withObs = hasText(record.observaciones_etiqueta);
              return (
                <div className={`bg-white border rounded-xl overflow-hidden ${nonConform ? 'border-red-500/30 bg-red-50/30' : withObs ? 'border-amber-400/40 bg-amber-50/40' : 'border-cyan-500/20'}`}>
                  <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-bold text-cyan-400">Etiqueta</span>
                    {nonConform && (
                      <Badge className="ml-auto bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
                        No conforme
                      </Badge>
                    )}
                    {!nonConform && withObs && (
                      <Badge className="ml-auto bg-amber-400/10 text-amber-700 border border-amber-400/20 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
                        Observación
                      </Badge>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Estado</p>
                        <p className="text-sm font-semibold text-zinc-900">{record.etiqueta}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">% No Conf.</p>
                        <p className={`text-2xl font-black tabular-nums ${nonConform ? 'text-red-600' : 'text-zinc-900'}`}>{record.porcentaje_etiqueta_no_conforme}<span className="text-sm text-zinc-500">%</span></p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500">{record.observaciones_etiqueta || '—'}</p>
                  </div>
                </div>
              );
            })()}

            {/* Marcación */}
            {(() => {
              const nonConform = isNonConform(record.porcentaje_marcacion_no_conforme);
              const withObs = hasText(record.observaciones_marcacion);
              return (
                <div className={`bg-white border rounded-xl overflow-hidden ${nonConform ? 'border-red-500/30 bg-red-50/30' : withObs ? 'border-amber-400/40 bg-amber-50/40' : 'border-emerald-500/20'}`}>
                  <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Marcación</span>
                    {nonConform && (
                      <Badge className="ml-auto bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
                        No conforme
                      </Badge>
                    )}
                    {!nonConform && withObs && (
                      <Badge className="ml-auto bg-amber-400/10 text-amber-700 border border-amber-400/20 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
                        Observación
                      </Badge>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Estado</p>
                        <p className="text-sm font-semibold text-zinc-900">{record.marcacion}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">% No Conf.</p>
                        <p className={`text-2xl font-black tabular-nums ${nonConform ? 'text-red-600' : 'text-zinc-900'}`}>{record.porcentaje_marcacion_no_conforme}<span className="text-sm text-zinc-500">%</span></p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500">{record.observaciones_marcacion || '—'}</p>
                  </div>
                </div>
              );
            })()}

            {/* Presentación */}
            {(() => {
              const nonConform = isNonConform(record.porcentaje_presentacion_no_conforme);
              const withObs = hasText(record.observaciones_presentacion);
              return (
                <div className={`bg-white border rounded-xl overflow-hidden ${nonConform ? 'border-red-500/30 bg-red-50/30' : withObs ? 'border-amber-400/40 bg-amber-50/40' : 'border-violet-500/20'}`}>
                  <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
                    <Package className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-bold text-violet-400">Presentación</span>
                    {nonConform && (
                      <Badge className="ml-auto bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
                        No conforme
                      </Badge>
                    )}
                    {!nonConform && withObs && (
                      <Badge className="ml-auto bg-amber-400/10 text-amber-700 border border-amber-400/20 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
                        Observación
                      </Badge>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Estado</p>
                        <p className="text-sm font-semibold text-zinc-900">{record.presentacion_no_conforme}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">% No Conf.</p>
                        <p className={`text-2xl font-black tabular-nums ${nonConform ? 'text-red-600' : 'text-zinc-900'}`}>{record.porcentaje_presentacion_no_conforme}<span className="text-sm text-zinc-500">%</span></p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500">{record.observaciones_presentacion || '—'}</p>
                  </div>
                </div>
              );
            })()}

            {/* Cajas */}
            {(() => {
              const nonConform = isNonConform(record.porcentaje_cajas_no_conformes);
              const withObs = hasText(record.observaciones_cajas);
              return (
                <div className={`bg-white border rounded-xl overflow-hidden ${nonConform ? 'border-red-500/30 bg-red-50/30' : withObs ? 'border-amber-400/40 bg-amber-50/40' : 'border-amber-500/20'}`}>
                  <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">Cajas</span>
                    {nonConform && (
                      <Badge className="ml-auto bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
                        No conforme
                      </Badge>
                    )}
                    {!nonConform && withObs && (
                      <Badge className="ml-auto bg-amber-400/10 text-amber-700 border border-amber-400/20 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
                        Observación
                      </Badge>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Estado</p>
                        <p className="text-sm font-semibold text-zinc-900">{record.cajas}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">% No Conf.</p>
                        <p className={`text-2xl font-black tabular-nums ${nonConform ? 'text-red-600' : 'text-zinc-900'}`}>{record.porcentaje_cajas_no_conformes}<span className="text-sm text-zinc-500">%</span></p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500">{record.observaciones_cajas || '—'}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* ── Responsables ── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-3 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" /> Responsables
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Identificador Cajas', value: record.responsable_identificador_cajas },
              { label: 'Responsable Embalaje', value: record.responsable_embalaje },
              { label: 'Responsable Calidad', value: record.responsable_calidad },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-zinc-500" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
                  <p className="text-sm font-semibold text-zinc-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Acciones Correctivas + Faltantes ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5" /> Acciones Correctivas
            </h2>
            <div className={`bg-white border rounded-xl p-5 ${hasText(record.correccion) ? 'border-amber-400/40 bg-amber-50/40' : 'border-zinc-200'}`}>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {record.correccion || <span className="italic text-zinc-400">Sin acciones correctivas</span>}
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5" /> Obs. Unidades Faltantes
            </h2>
            <div className={`bg-white border rounded-xl p-5 ${hasText(record.observaciones_faltantes) ? 'border-amber-400/40 bg-amber-50/40' : 'border-zinc-200'}`}>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {record.observaciones_faltantes || <span className="italic text-zinc-400">Sin observaciones sobre unidades faltantes</span>}
              </p>
            </div>
          </section>
        </div>

      </div>

      {/* Modal de edición — lógica sin cambios */}
      {record && (
        <AddEmbalajeRecordModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          productName={productMeta?.productName || record.producto}
          productId={productMeta?.productId || record.producto}
          categoryId={productMeta?.categoryId}
          editMode={true}
          recordToEdit={record}
          onSuccessfulEdit={handleSuccessfulEdit}
        />
      )}
      
      {/* Panel de Historial de Cambios */}
      <FieldHistoryPanel
        isOpen={isHistoryPanelOpen}
        onClose={() => setIsHistoryPanelOpen(false)}
        tableName="embalaje_records"
        recordId={record.id}
        recordTitle={`Lote ${record.lote}`}
      />
    </div>
  );
}