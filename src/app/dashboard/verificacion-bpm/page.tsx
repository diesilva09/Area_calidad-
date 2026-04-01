'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { bpmIndicatorsService, bpmVerificationsService } from '@/lib/supervisores-data';
import { useAuth } from '@/contexts/auth-context';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircle2, XCircle, FileSpreadsheet, BarChart2, Plus, Search, SlidersHorizontal } from 'lucide-react';

type BpmReqValue = 'cumple' | 'no_cumple';
type TurnoValue = 'D' | 'N';

const bpmSchema = z.object({
  fecha: z.string().min(1, 'Campo requerido'),
  cedula: z.string().min(1, 'Campo requerido'),
  nombre: z.string().min(1, 'Campo requerido'),
  area: z.string().min(1, 'Campo requerido'),
  areaOtro: z.string().optional(),
  req_uniforme: z.enum(['cumple', 'no_cumple']),
  req_unas: z.enum(['cumple', 'no_cumple']),
  req_sin_joyas: z.enum(['cumple', 'no_cumple']),
  req_sin_cabellos: z.enum(['cumple', 'no_cumple']),
  req_barba: z.enum(['cumple', 'no_cumple']),
  req_manos: z.enum(['cumple', 'no_cumple']),
  req_guantes: z.enum(['cumple', 'no_cumple']),
  req_petos_botas: z.enum(['cumple', 'no_cumple']),
  req_epp: z.enum(['cumple', 'no_cumple']),
  req_no_accesorios: z.enum(['cumple', 'no_cumple']),
  turno: z.enum(['D', 'N']),
  observaciones: z.string().optional(),
  correccion: z.string().optional(),
  firma_empleado: z.string().optional(),
  responsable: z.string().min(1, 'Campo requerido'),
  responsableOtro: z.string().optional(),
});

type BpmFormValues = z.infer<typeof bpmSchema>;

type BpmRecord = BpmFormValues & {
  id: number;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type DailyIndicatorItem = {
  fecha: string;
  total_registros: number;
  registros_cumplen: number;
  porcentaje_cumplimiento: number;
};

type MonthlyIndicatorItem = {
  id: number;
  mes: number;
  anio: number;
  total_registros: number;
  registros_cumplen: number;
  porcentaje_cumplimiento: number;
  fecha_calculo: string;
};

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  created_at?: string | null;
};

const areas = ['Conservas', 'Salsas', 'Embalaje', 'Bodega MP', 'Producción', 'Calidad', 'Otro'] as const;
const responsables = ['Lesley', 'Deisy', 'Sebastian', 'Yolman', 'Otro'] as const;

const reqs: Array<{
  key: keyof Pick<BpmFormValues,
    | 'req_uniforme' | 'req_unas' | 'req_sin_joyas' | 'req_sin_cabellos'
    | 'req_barba' | 'req_manos' | 'req_guantes' | 'req_petos_botas'
    | 'req_epp' | 'req_no_accesorios'>;
  label: string;
  desc?: string;
}> = [
  { key: 'req_uniforme', label: 'Uniforme', desc: 'Limpio, completo y del color correspondiente' },
  { key: 'req_unas', label: 'Uñas', desc: 'Limpias, cortas y sin esmalte' },
  { key: 'req_sin_joyas', label: 'Ausencia de joyas, maquillaje o perfumes' },
  { key: 'req_sin_cabellos', label: 'Ausencia de cabellos adheridos al uniforme' },
  { key: 'req_barba', label: 'Barba', desc: 'Afeitada o protegida completamente por el tapabocas' },
  { key: 'req_manos', label: 'Manos', desc: 'Limpias y sin heridas abiertas' },
  { key: 'req_guantes', label: 'Guantes', desc: 'Limpios, de uso personal y sin rupturas' },
  { key: 'req_petos_botas', label: 'Petos y botas', desc: 'Limpios y de uso personal' },
  { key: 'req_epp', label: 'EPP', desc: 'Uso obligatorio' },
  { key: 'req_no_accesorios', label: 'No uso de audífonos, celulares u otros accesorios' },
];

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function badgeReq(v: BpmReqValue) {
  return v === 'cumple' ? (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✔</Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">X</Badge>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function InfoPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-gray-50 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-gray-800 break-words">{value}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

export default function VerificacionBpmPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isJefe = user?.role === 'jefe';

  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const signatureDrawingRef = useRef(false);
  const signatureLastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [records, setRecords] = useState<BpmRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchNombre, setSearchNombre] = useState('');
  const [turnoFilter, setTurnoFilter] = useState<'all' | TurnoValue>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<BpmRecord | null>(null);

  const [isIndicatorOpen, setIsIndicatorOpen] = useState(false);
  const [indicatorMes, setIndicatorMes] = useState<number>(() => new Date().getMonth() + 1);
  const [indicatorAnio, setIndicatorAnio] = useState<number>(() => new Date().getFullYear());
  const [indicatorMeta, setIndicatorMeta] = useState<number>(95);
  const [indicatorDaily, setIndicatorDaily] = useState<DailyIndicatorItem[]>([]);
  const [indicatorMonthlyAvg, setIndicatorMonthlyAvg] = useState<number>(0);
  const [indicatorTotals, setIndicatorTotals] = useState<{ total: number; cumplen: number }>({ total: 0, cumplen: 0 });
  const [indicatorMonthlyHistory, setIndicatorMonthlyHistory] = useState<MonthlyIndicatorItem[]>([]);
  const [isLoadingIndicator, setIsLoadingIndicator] = useState(false);

  const [bpmNotifications, setBpmNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const form = useForm<BpmFormValues>({
    resolver: zodResolver(bpmSchema),
    defaultValues: {
      fecha: todayISODate(),
      cedula: '',
      nombre: '',
      area: '',
      areaOtro: '',
      req_uniforme: 'cumple',
      req_unas: 'cumple',
      req_sin_joyas: 'cumple',
      req_sin_cabellos: 'cumple',
      req_barba: 'cumple',
      req_manos: 'cumple',
      req_guantes: 'cumple',
      req_petos_botas: 'cumple',
      req_epp: 'cumple',
      req_no_accesorios: 'cumple',
      turno: 'D',
      observaciones: '',
      correccion: '',
      firma_empleado: '',
      responsable: '',
      responsableOtro: '',
    },
  });

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await bpmVerificationsService.getAll();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudieron cargar los registros BPM', variant: 'destructive' });
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteId == null) return;
    const id = deleteId;
    setDeleteId(null);
    await onDelete(id);
  };

  useEffect(() => { loadRecords(); }, []);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      setIsLoadingNotifications(true);
      try {
        const res = await fetch('/api/notifications?limit=50');
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const items = Array.isArray(data?.items) ? (data.items as NotificationItem[]) : [];
        const onlyBpm = items.filter((n) => String(n?.type ?? '').toLowerCase() === 'bpm_3_noncompliance');
        if (!cancelled) setBpmNotifications(onlyBpm);
      } catch (e) {
        console.error('Error cargando notificaciones BPM:', e);
        if (!cancelled) setBpmNotifications([]);
      } finally {
        if (!cancelled) setIsLoadingNotifications(false);
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isFormOpen) return;
    const raf = window.requestAnimationFrame(() => {
      setupSignatureCanvas();
      loadSignatureFromDataUrl(String(form.getValues('firma_empleado') || '')).catch(() => {});
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isFormOpen]);

  const firmaEmpleadoWatch = form.watch('firma_empleado');

  const setupSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#111827';
    signatureCtxRef.current = ctx;
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = signatureCtxRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    signatureLastPointRef.current = null;
    signatureDrawingRef.current = false;
    form.setValue('firma_empleado', '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  };

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const beginSignature = (clientX: number, clientY: number) => {
    const ctx = signatureCtxRef.current;
    if (!ctx) return;
    signatureDrawingRef.current = true;
    const p = getCanvasPoint(clientX, clientY);
    signatureLastPointRef.current = p;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const moveSignature = (clientX: number, clientY: number) => {
    const ctx = signatureCtxRef.current;
    if (!ctx || !signatureDrawingRef.current) return;
    const p = getCanvasPoint(clientX, clientY);
    const last = signatureLastPointRef.current;
    if (!last) {
      signatureLastPointRef.current = p;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      return;
    }
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    signatureLastPointRef.current = p;
  };

  const endSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    signatureDrawingRef.current = false;
    signatureLastPointRef.current = null;
    const dataUrl = canvas.toDataURL('image/png');
    form.setValue('firma_empleado', dataUrl, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  };

  const loadSignatureFromDataUrl = async (dataUrl: string) => {
    const canvas = signatureCanvasRef.current;
    const ctx = signatureCtxRef.current;
    if (!canvas || !ctx) return;
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      return;
    }
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.drawImage(img, 0, 0, rect.width, rect.height);
  };

  useEffect(() => {
    setupSignatureCanvas();
    const handleResize = () => {
      setupSignatureCanvas();
      loadSignatureFromDataUrl(String(form.getValues('firma_empleado') || '')).catch(() => {});
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setupSignatureCanvas();
    loadSignatureFromDataUrl(String(firmaEmpleadoWatch || '')).catch(() => {});
  }, [firmaEmpleadoWatch]);

  const resetToCreate = () => {
    setEditingId(null);
    form.reset({
      ...form.getValues(),
      fecha: todayISODate(), cedula: '', nombre: '', area: '',
      areaOtro: '',
      req_uniforme: 'cumple', req_unas: 'cumple', req_sin_joyas: 'cumple',
      req_sin_cabellos: 'cumple', req_barba: 'cumple', req_manos: 'cumple',
      req_guantes: 'cumple', req_petos_botas: 'cumple', req_epp: 'cumple',
      req_no_accesorios: 'cumple', turno: 'D', observaciones: '',
      correccion: '', firma_empleado: '', responsable: '',
      responsableOtro: '',
    });
  };

  const openCreateModal = () => { resetToCreate(); clearSignature(); setIsFormOpen(true); };
  const openEditModal = (r: BpmRecord) => { startEdit(r); setIsFormOpen(true); };
  const openDetailModal = (r: BpmRecord) => { setSelectedRecord(r); setIsDetailOpen(true); };

  const onSubmit = async (values: BpmFormValues) => {
    setIsSubmitting(true);
    try {
      const rawArea = String(values.area ?? '').trim();
      const rawAreaOtro = String(values.areaOtro ?? '').trim();
      const areaFinal = rawArea === 'Otro' ? rawAreaOtro : rawArea;

      const rawResponsable = String(values.responsable ?? '').trim();
      const rawResponsableOtro = String(values.responsableOtro ?? '').trim();
      const responsableFinal = rawResponsable === 'Otro' ? rawResponsableOtro : rawResponsable;

      const payload = {
        ...values,
        area: areaFinal,
        responsable: responsableFinal,
      };

      if (editingId) {
        await bpmVerificationsService.update(editingId, payload);
        toast({ title: 'Actualizado', description: 'Registro BPM actualizado' });
      } else {
        await bpmVerificationsService.create({ ...payload, created_by: user?.name || user?.email || undefined });
        toast({ title: 'Guardado', description: 'Registro BPM guardado' });
      }
      await loadRecords();
      resetToCreate();
      setIsFormOpen(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e?.message || 'No se pudo guardar el registro BPM', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (r: BpmRecord) => {
    setEditingId(r.id);

    const rawAreaFromDb = String((r as any)?.area ?? '').trim();
    const areaExiste = areas.includes(rawAreaFromDb as any);
    const areaValue = areaExiste ? rawAreaFromDb : 'Otro';
    const areaOtroValue = areaExiste ? '' : rawAreaFromDb;

    const rawResponsableFromDb = String((r as any)?.responsable ?? '').trim();
    const responsableExiste = responsables.includes(rawResponsableFromDb as any);
    const responsableValue = responsableExiste ? rawResponsableFromDb : 'Otro';
    const responsableOtroValue = responsableExiste ? '' : rawResponsableFromDb;

    form.reset({
      fecha: String(r.fecha ?? '').slice(0, 10),
      cedula: (r as any).cedula ?? '',
      nombre: r.nombre ?? '',
      area: areaValue,
      areaOtro: areaOtroValue,
      req_uniforme: (r.req_uniforme as BpmReqValue) ?? 'cumple',
      req_unas: (r.req_unas as BpmReqValue) ?? 'cumple',
      req_sin_joyas: (r.req_sin_joyas as BpmReqValue) ?? 'cumple',
      req_sin_cabellos: (r.req_sin_cabellos as BpmReqValue) ?? 'cumple',
      req_barba: (r.req_barba as BpmReqValue) ?? 'cumple',
      req_manos: (r.req_manos as BpmReqValue) ?? 'cumple',
      req_guantes: (r.req_guantes as BpmReqValue) ?? 'cumple',
      req_petos_botas: (r.req_petos_botas as BpmReqValue) ?? 'cumple',
      req_epp: (r.req_epp as BpmReqValue) ?? 'cumple',
      req_no_accesorios: (r.req_no_accesorios as BpmReqValue) ?? 'cumple',
      turno: (r.turno as TurnoValue) ?? 'D',
      observaciones: r.observaciones ?? '',
      correccion: r.correccion ?? '',
      firma_empleado: r.firma_empleado ?? '',
      responsable: responsableValue,
      responsableOtro: responsableOtroValue,
    });
  };

  const onDelete = async (id: number) => {
    try {
      await bpmVerificationsService.delete(id);
      toast({ title: 'Eliminado', description: 'Registro BPM eliminado' });
      await loadRecords();
      if (editingId === id) resetToCreate();
      if (selectedRecord?.id === id) { setSelectedRecord(null); setIsDetailOpen(false); }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e?.message || 'No se pudo eliminar el registro', variant: 'destructive' });
    }
  };

  const filteredRecords = useMemo(() => {
    const search = searchNombre.trim().toLowerCase();
    return (records || []).filter((r) => {
      const nombreMatch = search === '' || String(r.nombre ?? '').toLowerCase().includes(search);
      const turnoMatch = turnoFilter === 'all' || r.turno === turnoFilter;
      return nombreMatch && turnoMatch;
    });
  }, [records, searchNombre, turnoFilter]);

  const exportToExcel = () => {
    const data = (filteredRecords || []).map((r: any) => ({ ...r }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RE-CAL-013');
    XLSX.writeFile(wb, `RE-CAL-013_BPM_${todayISODate()}.xlsx`);
  };

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const conIncumplimientos = filteredRecords.filter((r) =>
      reqs.some((q) => String((r as any)[q.key]).toLowerCase() === 'no_cumple')
    ).length;
    return { total, conIncumplimientos };
  }, [filteredRecords]);

  const indicatorStatus = useMemo(() => {
    if (indicatorMonthlyAvg >= indicatorMeta) return 'ok';
    if (indicatorMonthlyAvg >= indicatorMeta - 5) return 'near';
    return 'bad';
  }, [indicatorMonthlyAvg, indicatorMeta]);

  const indicatorStatusLabel = useMemo(() => {
    if (indicatorStatus === 'ok') return 'Cumple meta';
    if (indicatorStatus === 'near') return 'Cercano a meta';
    return 'No cumple';
  }, [indicatorStatus]);

  const indicatorStatusClass = useMemo(() => {
    if (indicatorStatus === 'ok') return 'text-green-700';
    if (indicatorStatus === 'near') return 'text-amber-700';
    return 'text-red-700';
  }, [indicatorStatus]);

  const loadIndicators = async (anio: number, mes: number) => {
    setIsLoadingIndicator(true);
    try {
      const dailyResp = await bpmIndicatorsService.getDaily(anio, mes);
      setIndicatorMeta(Number(dailyResp?.meta ?? 95));
      setIndicatorDaily(Array.isArray(dailyResp?.items) ? dailyResp.items : []);
      setIndicatorMonthlyAvg(Number(dailyResp?.promedio_mensual ?? 0));
      setIndicatorTotals({ total: Number(dailyResp?.total_registros ?? 0), cumplen: Number(dailyResp?.registros_cumplen ?? 0) });
      const historyResp = await bpmIndicatorsService.getMonthlyHistory();
      setIndicatorMonthlyHistory(Array.isArray(historyResp?.items) ? historyResp.items : []);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e?.message || 'No se pudieron cargar los indicadores BPM', variant: 'destructive' });
      setIndicatorDaily([]);
      setIndicatorMonthlyHistory([]);
      setIndicatorMonthlyAvg(0);
      setIndicatorTotals({ total: 0, cumplen: 0 });
    } finally {
      setIsLoadingIndicator(false);
    }
  };

  useEffect(() => {
    if (!isIndicatorOpen) return;
    loadIndicators(indicatorAnio, indicatorMes);
  }, [isIndicatorOpen, indicatorAnio, indicatorMes]);

  const monthOptions = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, '0') }))
  , []);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-3 sm:px-6 lg:px-8 pb-8">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <Card className="border-b-2 border-b-gray-200">
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  RE-CAL-013 · v12
                </span>
                <span className="text-[10px] text-gray-400">Aprobado: 01 abr 2025</span>
              </div>
              <h1 className="mt-1.5 text-base sm:text-lg font-bold text-gray-900 leading-tight">
                Verificación de BPM en Manipuladores de Alimentos
              </h1>
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5">
                <span className="text-xs text-gray-500">Total</span>
                <span className="text-sm font-bold text-gray-800">{stats.total}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs text-red-600 font-medium">{stats.conIncumplimientos} incumple</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between gap-3 sm:flex-row">
          <CardTitle className="text-base sm:text-lg">Alertas BPM</CardTitle>
          <div className="text-sm text-muted-foreground">
            {isLoadingNotifications
              ? 'Cargando…'
              : `${bpmNotifications.length} alerta${bpmNotifications.length !== 1 ? 's' : ''}`}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingNotifications ? (
            <div className="text-sm text-muted-foreground">Cargando alertas…</div>
          ) : bpmNotifications.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay alertas recientes.</div>
          ) : (
            <div className="space-y-3">
              {bpmNotifications.slice(0, 5).map((n) => (
                <div key={String(n.id)} className="rounded-md border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-medium break-words">{n.title}</div>
                      <div className="text-sm text-muted-foreground break-words">{n.message}</div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 justify-end">
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">ALERTA</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            value={searchNombre}
            onChange={(e) => setSearchNombre(e.target.value)}
            placeholder="Buscar por nombre del operario…"
            className="pl-8 h-9 text-sm"
          />
        </div>

        {/* Turno filter */}
        <div className="w-full sm:w-40 shrink-0">
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <select
              value={turnoFilter}
              onChange={(e) => setTurnoFilter(e.target.value as 'all' | TurnoValue)}
              className="h-9 w-full appearance-none rounded-md border border-input bg-background pl-8 pr-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">Todos los turnos</option>
              <option value="D">Día</option>
              <option value="N">Noche</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={filteredRecords.length === 0}
            className="h-9 flex-1 sm:flex-none"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsIndicatorOpen(true)}
            className="h-9 flex-1 sm:flex-none"
          >
            <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
            <span>Indicador</span>
          </Button>
          {isJefe && (
            <Button type="button" size="sm" onClick={openCreateModal} className="h-9 flex-1 sm:flex-none">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Nuevo</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Records List ────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              Cargando registros…
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <CheckCircle2 className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">Sin registros</p>
              <p className="text-xs text-gray-400 mt-1">
                {records.length === 0 ? 'No hay verificaciones guardadas aún.' : 'Ningún registro coincide con los filtros.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile layout */}
              <div className="lg:hidden divide-y">
                {filteredRecords.map((r) => {
                  const incumpleCount = reqs.filter(
                    (q) => String((r as any)[q.key]).toLowerCase() === 'no_cumple'
                  ).length;
                  const hasIncumple = incumpleCount > 0;

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => openDetailModal(r)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-gray-900 break-words">{r.nombre}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{String(r.fecha ?? '').slice(0, 10)}</div>
                          </div>
                          <Badge
                            className={`shrink-0 text-xs ${
                              hasIncumple
                                ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                : 'bg-green-100 text-green-800 hover:bg-green-100'
                            }`}
                          >
                            {hasIncumple ? `${incumpleCount} incumple` : '✔ OK'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium">{r.area || '—'}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium">
                            {r.turno === 'D' ? 'Día' : r.turno === 'N' ? 'Noche' : r.turno || '—'}
                          </span>
                        </div>
                        {isJefe && (
                          <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                            <Button type="button" variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEditModal(r)}>
                              Editar
                            </Button>
                            <Button type="button" variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={() => setDeleteId(r.id)}>
                              Eliminar
                            </Button>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[140px]" />
                    <col />
                    <col className="w-[200px]" />
                    <col className="w-[90px]" />
                    <col className="w-[90px]" />
                    {isJefe && <col className="w-[170px]" />}
                  </colgroup>
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th scope="col" className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Fecha</th>
                      <th scope="col" className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Nombre</th>
                      <th scope="col" className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">Área</th>
                      <th scope="col" className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Turno</th>
                      <th scope="col" className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Incumple</th>
                      {isJefe && (
                        <th scope="col" className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRecords.map((r) => {
                      const incumpleCount = reqs.filter(
                        (q) => String((r as any)[q.key]).toLowerCase() === 'no_cumple'
                      ).length;
                      const hasIncumple = incumpleCount > 0;

                      return (
                        <tr
                          key={r.id}
                          onClick={() => openDetailModal(r)}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-600 align-middle">{String(r.fecha ?? '').slice(0, 10)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 break-words align-middle">{r.nombre}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 break-words align-middle">{r.area || '—'}</td>
                          <td className="px-4 py-3 text-center align-middle">
                            <span className="inline-flex items-center justify-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">
                              {r.turno === 'D' ? 'Día' : r.turno === 'N' ? 'Noche' : r.turno || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center align-middle">
                            <Badge
                              className={`text-xs ${
                                hasIncumple
                                  ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                  : 'bg-green-100 text-green-800 hover:bg-green-100'
                              }`}
                            >
                              {incumpleCount}
                            </Badge>
                          </td>
                          {isJefe && (
                            <td className="px-4 py-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center justify-center gap-2">
                                <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => openEditModal(r)}>
                                  Editar
                                </Button>
                                <Button type="button" variant="destructive" size="sm" className="h-7 text-xs px-2" onClick={() => setDeleteId(r.id)}>
                                  Eliminar
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer count */}
              <div className="border-t px-4 py-2 bg-gray-50 rounded-b-lg">
                <p className="text-xs text-gray-400">
                  {filteredRecords.length} {filteredRecords.length === 1 ? 'registro' : 'registros'}
                  {(searchNombre || turnoFilter !== 'all') && ' · filtrado'}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Form Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-none sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingId ? 'Editar registro BPM' : 'Nuevo registro BPM'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* ─ Datos básicos ─ */}
              <div>
                <SectionLabel>Datos del operario</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <FormField control={form.control} name="fecha" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Fecha</FormLabel>
                      <FormControl><Input type="date" {...field} className="h-9" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cedula" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Cédula</FormLabel>
                      <FormControl><Input inputMode="numeric" {...field} className="h-9" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nombre" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nombre</FormLabel>
                      <FormControl><Input {...field} className="h-9" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="area" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Área</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (v !== 'Otro') {
                            form.setValue('areaOtro', '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Seleccione…" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {String(form.watch('area') || '').trim() === 'Otro' && (
                    <FormField control={form.control} name="areaOtro" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-xs">Especificar área</FormLabel>
                        <FormControl><Input {...field} className="h-9" placeholder="Escriba el área…" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>
              </div>

              {/* ─ Requisitos BPM ─ */}
              <div>
                <SectionLabel>Requisitos BPM</SectionLabel>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {reqs.map((req) => (
                    <FormField key={req.key} control={form.control} name={req.key} render={({ field }) => (
                      <FormItem className="rounded-lg border bg-gray-50/60 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <FormLabel className="text-sm font-medium leading-snug">{req.label}</FormLabel>
                            {req.desc && <p className="text-[11px] text-gray-400 mt-0.5">{req.desc}</p>}
                          </div>
                          <FormControl>
                            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex items-center gap-3 shrink-0">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <RadioGroupItem value="cumple" />
                                <span className="text-sm font-medium text-green-700">✔</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <RadioGroupItem value="no_cumple" />
                                <span className="text-sm font-medium text-red-600">✕</span>
                              </label>
                            </RadioGroup>
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                </div>
              </div>

              {/* ─ Turno y Responsable ─ */}
              <div>
                <SectionLabel>Turno y responsable</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="turno" render={({ field }) => (
                    <FormItem className="rounded-lg border px-3 py-2.5">
                      <FormLabel className="text-xs">Turno de trabajo</FormLabel>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="flex items-center gap-5 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="D" />
                            <span className="text-sm">☀ Día (D)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="N" />
                            <span className="text-sm">🌙 Noche (N)</span>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="responsable" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Responsable</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (v !== 'Otro') {
                            form.setValue('responsableOtro', '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Seleccione…" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {responsables.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {String(form.watch('responsable') || '').trim() === 'Otro' && (
                    <FormField control={form.control} name="responsableOtro" render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Especificar responsable</FormLabel>
                        <FormControl><Input {...field} className="h-9" placeholder="Escriba el nombre…" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>
              </div>

              {/* ─ Observaciones y Corrección ─ */}
              <div>
                <SectionLabel>Observaciones y corrección</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="observaciones" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Observaciones</FormLabel>
                      <FormControl><Textarea rows={3} {...field} className="resize-none text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="correccion" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Corrección</FormLabel>
                      <FormControl><Textarea rows={3} {...field} className="resize-none text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* ─ Firma ─ */}
              <div>
                <SectionLabel>Firma del empleado</SectionLabel>
                <FormField control={form.control} name="firma_empleado" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="w-full rounded-lg border-2 border-dashed border-gray-200 bg-white overflow-hidden">
                          <div className="px-3 pt-2 pb-1 text-[10px] text-gray-400 select-none">Firme con el dedo o mouse</div>
                          <canvas
                            ref={signatureCanvasRef}
                            className="h-36 w-full touch-none block"
                            onPointerDown={(e) => { (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId); beginSignature(e.clientX, e.clientY); }}
                            onPointerMove={(e) => moveSignature(e.clientX, e.clientY)}
                            onPointerUp={() => endSignature()}
                            onPointerCancel={() => endSignature()}
                          />
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={clearSignature} className="h-8 text-xs">
                          Limpiar firma
                        </Button>
                        <Input type="hidden" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ─ Actions ─ */}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-2 border-t">
                <Button type="button" variant="outline" onClick={resetToCreate} disabled={isSubmitting} className="sm:w-auto">
                  Limpiar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="sm:w-auto">
                  {isSubmitting ? 'Guardando…' : editingId ? 'Actualizar' : 'Guardar registro'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Detail Modal ────────────────────────────────────────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-none sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Detalle — Verificación BPM</DialogTitle>
          </DialogHeader>

          {selectedRecord ? (
            <div className="space-y-5">
              {/* Datos */}
              <div>
                <SectionLabel>Datos del operario</SectionLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  <InfoPill label="Fecha" value={String(selectedRecord.fecha ?? '').slice(0, 10) || '—'} />
                  <InfoPill label="Cédula" value={String((selectedRecord as any).cedula ?? '').trim() || '—'} />
                  <InfoPill label="Nombre" value={selectedRecord.nombre || '—'} />
                  <InfoPill label="Área" value={(selectedRecord as any).area || '—'} />
                  <InfoPill label="Turno" value={selectedRecord.turno === 'D' ? 'Día' : selectedRecord.turno === 'N' ? 'Noche' : selectedRecord.turno || '—'} />
                </div>
              </div>

              {/* Requisitos */}
              <div>
                <SectionLabel>Requisitos BPM</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reqs.map((req) => {
                    const val = String((selectedRecord as any)?.[req.key]).toLowerCase() === 'no_cumple' ? 'no_cumple' : 'cumple';
                    return (
                      <div key={req.key} className={`flex items-start justify-between rounded-lg border px-3 py-2.5 gap-3 ${val === 'no_cumple' ? 'bg-red-50 border-red-100' : 'bg-gray-50'}`}>
                        <div className="min-w-0">
                          <div className="text-sm font-medium break-words">{req.label}</div>
                          {req.desc && <div className="text-[11px] text-gray-400 mt-0.5">{req.desc}</div>}
                        </div>
                        <div className="shrink-0">{badgeReq(val)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <SectionLabel>Observaciones y corrección</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <InfoPill label="Observaciones" value={selectedRecord.observaciones || '—'} />
                  <InfoPill label="Corrección" value={selectedRecord.correccion || '—'} />
                </div>
              </div>

              {/* Meta */}
              <div>
                <SectionLabel>Trazabilidad</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <InfoPill label="Responsable" value={selectedRecord.responsable || '—'} />
                  <InfoPill label="Creado" value={selectedRecord.created_at ? String(selectedRecord.created_at).slice(0, 10) : '—'} />
                </div>
              </div>

              {/* Firma */}
              <div>
                <SectionLabel>Firma del empleado</SectionLabel>
                {selectedRecord.firma_empleado && String(selectedRecord.firma_empleado).startsWith('data:image') ? (
                  <div className="rounded-lg border bg-white p-3 max-w-sm">
                    <img src={String(selectedRecord.firma_empleado)} alt="Firma" className="max-h-36 w-full object-contain" />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin firma registrada.</p>
                )}
              </div>

              {isJefe && (
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => openEditModal(selectedRecord)}>
                    Editar
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => setDeleteId(selectedRecord.id)}>
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Seleccione un 
            
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ───────────────────────────────────────────────────── */}
      <AlertDialog open={deleteId != null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>¿Eliminar este registro BPM? Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Indicator Modal ─────────────────────────────────────────────────── */}
      <Dialog open={isIndicatorOpen} onOpenChange={setIsIndicatorOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-none sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Indicador de cumplimiento BPM</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Controls + KPI */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="space-y-1 w-24">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Mes</p>
                  <Select value={String(indicatorMes)} onValueChange={(v) => setIndicatorMes(Number(v))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[210]">
                      {monthOptions.map((m) => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 w-24">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Año</p>
                  <Select value={String(indicatorAnio)} onValueChange={(v) => setIndicatorAnio(Number(v))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[210]">
                      {yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 w-24">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Meta</p>
                  <Input value={`${indicatorMeta}%`} readOnly className="h-9 bg-gray-50" />
                </div>
              </div>

              {/* KPI */}
              <div className={`flex flex-col items-start sm:items-end rounded-lg border px-4 py-3 ${
                indicatorStatus === 'ok' ? 'border-green-200 bg-green-50' :
                indicatorStatus === 'near' ? 'border-amber-200 bg-amber-50' :
                'border-red-200 bg-red-50'
              }`}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Promedio mensual</p>
                <p className={`text-3xl font-bold leading-none mt-1 ${indicatorStatusClass}`}>{indicatorMonthlyAvg.toFixed(2)}%</p>
                <p className={`text-xs mt-1 font-medium ${indicatorStatusClass}`}>{indicatorStatusLabel}</p>
              </div>
            </div>

            {/* Summary pills */}
            <div className="grid grid-cols-3 gap-2">
              <InfoPill label="Total evaluados" value={<span className="font-bold">{indicatorTotals.total}</span>} />
              <InfoPill label="Cumplen" value={<span className="font-bold text-green-700">{indicatorTotals.cumplen}</span>} />
              <InfoPill label="Brecha vs meta" value={
                <span className={`font-bold ${(indicatorMonthlyAvg - indicatorMeta) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {(indicatorMonthlyAvg - indicatorMeta).toFixed(2)}%
                </span>
              } />
            </div>

            {isLoadingIndicator ? (
              <div className="py-10 text-center text-sm text-gray-400">Cargando indicador…</div>
            ) : indicatorDaily.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Sin datos para el período seleccionado.</div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Evolución diaria (%)</p>
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={indicatorDaily} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="fecha" tickFormatter={(v) => String(v).slice(8, 10)} tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)}%`} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <ReferenceLine y={indicatorMeta} stroke="#111827" strokeDasharray="6 3" name="Meta" />
                        <Line type="monotone" dataKey="porcentaje_cumplimiento" name="Cumplimiento" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Comparación por día (cumple / total)</p>
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={indicatorDaily} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="fecha" tickFormatter={(v) => String(v).slice(8, 10)} tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="total_registros" name="Total" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="registros_cumplen" name="Cumplen" fill="#16a34a" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly History */}
            <div className="rounded-lg border">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Histórico mensual</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs w-full sm:w-auto"
                  onClick={() => bpmIndicatorsService.upsertMonthly(indicatorAnio, indicatorMes).then(() => loadIndicators(indicatorAnio, indicatorMes))}
                  disabled={isLoadingIndicator}
                >
                  Guardar consolidado del mes
                </Button>
              </div>

              {indicatorMonthlyHistory.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">Sin histórico guardado.</p>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="divide-y sm:hidden">
                    {indicatorMonthlyHistory.slice(0, 12).map((it) => {
                      const pct = Number(it.porcentaje_cumplimiento);
                      const ok = pct >= indicatorMeta;
                      return (
                        <div key={it.id} className="px-4 py-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">{it.anio}-{String(it.mes).padStart(2, '0')}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{it.total_registros} total · {it.registros_cumplen} cumplen</div>
                          </div>
                          <span className={`text-base font-bold ${ok ? 'text-green-700' : 'text-red-600'}`}>
                            {pct.toFixed(2)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <div className="min-w-[600px]">
                      <div className="grid grid-cols-6 gap-3 px-4 py-2 bg-gray-50 border-b">
                        {['Año', 'Mes', 'Total', 'Cumplen', '% Cumplimiento', 'Calculado'].map((h) => (
                          <div key={h} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</div>
                        ))}
                      </div>
                      <div className="divide-y">
                        {indicatorMonthlyHistory.slice(0, 12).map((it) => {
                          const pct = Number(it.porcentaje_cumplimiento);
                          const ok = pct >= indicatorMeta;
                          return (
                            <div key={it.id} className="grid grid-cols-6 gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                              <div className="text-gray-700">{it.anio}</div>
                              <div className="text-gray-700">{String(it.mes).padStart(2, '0')}</div>
                              <div className="text-gray-700">{it.total_registros}</div>
                              <div className="text-gray-700">{it.registros_cumplen}</div>
                              <div className={`font-semibold ${ok ? 'text-green-700' : 'text-red-600'}`}>{pct.toFixed(2)}%</div>
                              <div className="text-gray-400">{String(it.fecha_calculo ?? '').slice(0, 10)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}