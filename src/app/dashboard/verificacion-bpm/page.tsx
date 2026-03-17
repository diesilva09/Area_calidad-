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
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
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

type BpmReqValue = 'cumple' | 'no_cumple';
type TurnoValue = 'D' | 'N';

const bpmSchema = z.object({
  fecha: z.string().min(1, 'Campo requerido'),
  cedula: z.string().min(1, 'Campo requerido'),
  nombre: z.string().min(1, 'Campo requerido'),
  area: z.string().min(1, 'Campo requerido'),

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

const areas = [
  'Conservas',
  'Salsas',
  'Embalaje',
  'Bodega MP',
  'Producción',
  'Calidad',
  'Otro',
] as const;

const responsables = ['Lesley', 'Deisy', 'Sebastian', 'Yolman'] as const;

const reqs: Array<{ key: keyof Pick<BpmFormValues,
  | 'req_uniforme'
  | 'req_unas'
  | 'req_sin_joyas'
  | 'req_sin_cabellos'
  | 'req_barba'
  | 'req_manos'
  | 'req_guantes'
  | 'req_petos_botas'
  | 'req_epp'
  | 'req_no_accesorios'>; label: string; desc?: string }>
  = [
    { key: 'req_uniforme', label: 'Uniforme', desc: '(Limpio, completo y del color correspondiente)' },
    { key: 'req_unas', label: 'Uñas', desc: '(Limpias, cortas y sin esmalte)' },
    { key: 'req_sin_joyas', label: 'Ausencia de joyas, maquillaje o perfumes' },
    { key: 'req_sin_cabellos', label: 'Ausencia de cabellos adheridos al uniforme' },
    { key: 'req_barba', label: 'Barba', desc: '(Afeitada o protegida completamente por el tapabocas)' },
    { key: 'req_manos', label: 'Manos', desc: '(Limpias y sin heridas abiertas)' },
    { key: 'req_guantes', label: 'Guantes', desc: '(Limpios, de uso personal y sin rupturas)' },
    { key: 'req_petos_botas', label: 'Petos y botas', desc: '(Limpios y de uso personal)' },
    { key: 'req_epp', label: 'EPP', desc: '(Uso obligatorio)' },
    { key: 'req_no_accesorios', label: 'No uso de audífonos, celulares u otros accesorios' },
  ];

function todayISODate() {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function badgeReq(v: BpmReqValue) {
  return v === 'cumple' ? (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✔</Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">X</Badge>
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
  const [detailRecord, setDetailRecord] = useState<BpmRecord | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchNombre, setSearchNombre] = useState('');
  const [turnoFilter, setTurnoFilter] = useState<'all' | TurnoValue>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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

  const form = useForm<BpmFormValues>({
    resolver: zodResolver(bpmSchema),
    defaultValues: {
      fecha: todayISODate(),
      cedula: '',
      nombre: '',
      area: '',
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
    },
  });

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await bpmVerificationsService.getAll();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los registros BPM',
        variant: 'destructive',
      });
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
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
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
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
    if (!ctx) return;
    if (!signatureDrawingRef.current) return;

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
      fecha: todayISODate(),
      cedula: '',
      nombre: '',
      area: '',
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
    });
  };

  const openCreateModal = () => {
    resetToCreate();
    clearSignature();
    setIsFormOpen(true);
  };

  const openEditModal = (r: BpmRecord) => {
    startEdit(r);
    setIsFormOpen(true);
  };

  const openDetailModal = (r: BpmRecord) => {
    setSelectedRecord(r);
    setIsDetailOpen(true);
  };

  const onSubmit = async (values: BpmFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await bpmVerificationsService.update(editingId, values);
        toast({ title: 'Actualizado', description: 'Registro BPM actualizado' });
      } else {
        await bpmVerificationsService.create({
          ...values,
          created_by: user?.name || user?.email || undefined,
        });
        toast({ title: 'Guardado', description: 'Registro BPM guardado' });
      }
      await loadRecords();
      resetToCreate();
      setIsFormOpen(false);
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo guardar el registro BPM',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (r: BpmRecord) => {
    setEditingId(r.id);
    form.reset({
      fecha: String(r.fecha ?? '').slice(0, 10),
      cedula: (r as any).cedula ?? '',
      nombre: r.nombre ?? '',
      area: r.area ?? '',
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
      responsable: r.responsable ?? '',
    });
  };

  const onDelete = async (id: number) => {
    if (!confirm('¿Eliminar este registro BPM?')) return;
    try {
      await bpmVerificationsService.delete(id);
      toast({ title: 'Eliminado', description: 'Registro BPM eliminado' });
      await loadRecords();
      if (editingId === id) resetToCreate();
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
        setIsDetailOpen(false);
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo eliminar el registro',
        variant: 'destructive',
      });
    }
  };

  const filteredRecords = useMemo(() => {
    const search = searchNombre.trim().toLowerCase();

    return (records || []).filter((r) => {
      const nombreMatch =
        search === '' || String(r.nombre ?? '').toLowerCase().includes(search);
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
      setIndicatorTotals({
        total: Number(dailyResp?.total_registros ?? 0),
        cumplen: Number(dailyResp?.registros_cumplen ?? 0),
      });

      const historyResp = await bpmIndicatorsService.getMonthlyHistory();
      setIndicatorMonthlyHistory(Array.isArray(historyResp?.items) ? historyResp.items : []);
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Error',
        description: e?.message || 'No se pudieron cargar los indicadores BPM',
        variant: 'destructive',
      });
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

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const v = i + 1;
      return { value: v, label: String(v).padStart(2, '0') };
    });
  }, []);

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  }, []);

  const renderDetailValue = (label: string, value: React.ReactNode) => {
    return (
      <div className="rounded-md border p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm break-words">{value}</div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-2xl leading-tight break-words">
            VERIFICACIÓN DE BPM EN MANIPULADORES DE ALIMENTOS
          </CardTitle>
          <div className="text-xs sm:text-sm text-muted-foreground space-y-1 break-words">
            <div><strong>Código:</strong> RE-CAL-013</div>
            <div><strong>Versión:</strong> 12</div>
            <div><strong>Fecha de aprobación:</strong> 01 de abril de 2025</div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className="text-sm sm:text-base break-words">Historial de verificaciones</CardTitle>
          <div className="w-full sm:w-auto">
            <div className="text-xs sm:text-sm text-muted-foreground sm:text-right">
              Total: {stats.total} | Con incumplimientos: {stats.conIncumplimientos}
            </div>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Input
                value={searchNombre}
                onChange={(e) => setSearchNombre(e.target.value)}
                placeholder="Buscar por nombre (operario)"
                className="w-full sm:w-[260px]"
              />
              <Select
                value={turnoFilter}
                onValueChange={(v) => setTurnoFilter(v as 'all' | TurnoValue)}
              >
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="Filtrar turno" />
                </SelectTrigger>
                <SelectContent className="z-[210]">
                  <SelectItem value="all">Todos los turnos</SelectItem>
                  <SelectItem value="D">Día</SelectItem>
                  <SelectItem value="N">Noche</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={exportToExcel}
                disabled={filteredRecords.length === 0}
                className="w-full sm:w-auto"
              >
                Exportar a Excel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsIndicatorOpen(true)}
                className="w-full sm:w-auto"
              >
                Indicador
              </Button>
              {isJefe && (
                <Button type="button" onClick={openCreateModal} className="w-full sm:w-auto">
                  Nuevo registro
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay registros.</div>
          ) : (
            <div className="space-y-2">
              <div className="hidden lg:grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground">
                <div>Fecha</div>
                <div>Nombre</div>
                <div>Área</div>
                <div>Turno</div>
                <div>Incumple</div>
                <div>Acciones</div>
              </div>
              {filteredRecords.map((r) => {
                const incumpleCount = reqs.filter(
                  (q) => String((r as any)[q.key]).toLowerCase() === 'no_cumple'
                ).length;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => openDetailModal(r)}
                    className="w-full text-left rounded-md border p-2 sm:p-3 text-sm hover:bg-muted/50"
                  >
                    {/* Mobile card */}
                    <div className="space-y-2 lg:hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium break-words">{r.nombre}</div>
                          <div className="text-xs text-muted-foreground">
                            {String(r.fecha ?? '').slice(0, 10)}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {incumpleCount === 0 ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">0</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{incumpleCount}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md bg-muted/50 p-2">
                          <div className="text-muted-foreground">Área</div>
                          <div className="font-medium break-words">{r.area || '—'}</div>
                        </div>
                        <div className="rounded-md bg-muted/50 p-2">
                          <div className="text-muted-foreground">Turno</div>
                          <div className="font-medium">{r.turno || '—'}</div>
                        </div>
                      </div>

                      {isJefe && (
                        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => openEditModal(r)}>
                            Editar
                          </Button>
                          <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => onDelete(r.id)}>
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Desktop table row */}
                    <div className="hidden lg:grid grid-cols-6 gap-2">
                      <div>{String(r.fecha ?? '').slice(0, 10)}</div>
                      <div className="break-words font-medium">{r.nombre}</div>
                      <div className="break-words">{r.area}</div>
                      <div>{r.turno}</div>
                      <div>
                        {incumpleCount === 0 ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">0</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{incumpleCount}</Badge>
                        )}
                      </div>
                      {isJefe && (
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(r)}>
                            Editar
                          </Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(r.id)}>
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-none sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar registro BPM' : 'Nuevo registro BPM'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FECHA</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cedula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CÉDULA</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NOMBRE</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ÁREA</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {areas.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold">Requisitos BPM (✔ / X)</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {reqs.map((req) => (
                    <FormField
                      key={req.key}
                      control={form.control}
                      name={req.key}
                      render={({ field }) => (
                        <FormItem className="rounded-md border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <FormLabel className="font-medium">{req.label}</FormLabel>
                              {req.desc ? (
                                <div className="text-xs text-muted-foreground">{req.desc}</div>
                              ) : null}
                            </div>
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="flex items-center gap-4"
                              >
                                <label className="flex items-center gap-2">
                                  <RadioGroupItem value="cumple" />
                                  <span className="text-sm">✔</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <RadioGroupItem value="no_cumple" />
                                  <span className="text-sm">X</span>
                                </label>
                              </RadioGroup>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="turno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno de trabajo</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex items-center gap-6"
                        >
                          <label className="flex items-center gap-2">
                            <RadioGroupItem value="D" />
                            <span className="text-sm">DÍA (D)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <RadioGroupItem value="N" />
                            <span className="text-sm">NOCHE (N)</span>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RESPONSABLE</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {responsables.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OBSERVACIONES</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="correccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CORRECCIÓN</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="firma_empleado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FIRMA DEL EMPLEADO</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="w-full rounded-md border bg-white">
                          <canvas
                            ref={signatureCanvasRef}
                            className="h-40 w-full touch-none"
                            onPointerDown={(e) => {
                              (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
                              beginSignature(e.clientX, e.clientY);
                            }}
                            onPointerMove={(e) => {
                              moveSignature(e.clientX, e.clientY);
                            }}
                            onPointerUp={() => {
                              endSignature();
                            }}
                            onPointerCancel={() => {
                              endSignature();
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                            Limpiar firma
                          </Button>
                          <Input type="hidden" {...field} />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={resetToCreate} disabled={isSubmitting}>
                  Limpiar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {editingId ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-none sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Detalle de verificación BPM</DialogTitle>
          </DialogHeader>
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {renderDetailValue('Fecha', String(selectedRecord.fecha ?? '').slice(0, 10) || '—')}
                {renderDetailValue('Cédula', String((selectedRecord as any).cedula ?? '').trim() || '—')}
                {renderDetailValue('Nombre', selectedRecord.nombre || '—')}
                {renderDetailValue('Área', selectedRecord.area || '—')}
                {renderDetailValue('Turno', selectedRecord.turno || '—')}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">Requisitos BPM</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {reqs.map((req) => (
                    <div key={req.key} className="flex items-center justify-between rounded-md border p-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium break-words">{req.label}</div>
                        {req.desc ? <div className="text-xs text-muted-foreground">{req.desc}</div> : null}
                      </div>
                      <div className="shrink-0">
                        {badgeReq(String((selectedRecord as any)?.[req.key]).toLowerCase() === 'no_cumple' ? 'no_cumple' : 'cumple')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderDetailValue('Observaciones', selectedRecord.observaciones || '—')}
                {renderDetailValue('Corrección', selectedRecord.correccion || '—')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {renderDetailValue('Responsable', selectedRecord.responsable || '—')}
                {renderDetailValue('Creado por', selectedRecord.created_by || '—')}
                {renderDetailValue('Creado', selectedRecord.created_at ? String(selectedRecord.created_at) : '—')}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">Firma del empleado</div>
                {selectedRecord.firma_empleado && String(selectedRecord.firma_empleado).startsWith('data:image') ? (
                  <div className="rounded-md border bg-white p-3">
                    <img
                      src={String(selectedRecord.firma_empleado)}
                      alt="Firma"
                      className="max-h-40 w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No hay firma.</div>
                )}
              </div>

              {isJefe && (
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => openEditModal(selectedRecord)}>
                    Editar
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => onDelete(selectedRecord.id)}>
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Seleccione un registro.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isIndicatorOpen} onOpenChange={setIsIndicatorOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-none sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Indicador de cumplimiento BPM</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Mes</div>
                  <Select value={String(indicatorMes)} onValueChange={(v) => setIndicatorMes(Number(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent className="z-[210]">
                      {monthOptions.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Año</div>
                  <Select value={String(indicatorAnio)} onValueChange={(v) => setIndicatorAnio(Number(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent className="z-[210]">
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <div className="text-xs text-muted-foreground">Meta</div>
                  <Input value={`${indicatorMeta}%`} readOnly className="w-full" />
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="text-xs text-muted-foreground">Promedio mensual</div>
                <div className={`text-2xl font-semibold ${indicatorStatusClass}`}>{indicatorMonthlyAvg.toFixed(2)}%</div>
                <div className={`text-sm ${indicatorStatusClass}`}>{indicatorStatusLabel}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {renderDetailValue('Total registros evaluados (mes)', <span className="font-medium">{indicatorTotals.total}</span>)}
              {renderDetailValue('Registros que cumplen (mes)', <span className="font-medium">{indicatorTotals.cumplen}</span>)}
              {renderDetailValue(
                'Brecha vs meta',
                <span className="font-medium">{(indicatorMonthlyAvg - indicatorMeta).toFixed(2)}%</span>
              )}
            </div>

            {isLoadingIndicator ? (
              <div className="text-sm text-muted-foreground">Cargando indicador...</div>
            ) : indicatorDaily.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay datos para el mes seleccionado.</div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border p-3">
                  <div className="text-sm font-medium mb-3">Evolución diaria (%)</div>
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={indicatorDaily} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" tickFormatter={(v) => String(v).slice(8, 10)} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)}%`} />
                        <Legend />
                        <ReferenceLine y={indicatorMeta} stroke="#111827" strokeDasharray="6 3" name="Meta" />
                        <Line
                          type="monotone"
                          dataKey="porcentaje_cumplimiento"
                          name="Cumplimiento"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <div className="text-sm font-medium mb-3">Comparación por día (cumple / total)</div>
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={indicatorDaily} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" tickFormatter={(v) => String(v).slice(8, 10)} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_registros" name="Total" fill="#94a3b8" />
                        <Bar dataKey="registros_cumplen" name="Cumplen" fill="#16a34a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-md border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-medium">Histórico mensual</div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => bpmIndicatorsService.upsertMonthly(indicatorAnio, indicatorMes).then(() => loadIndicators(indicatorAnio, indicatorMes))}
                  disabled={isLoadingIndicator}
                  className="w-full sm:w-auto"
                >
                  Guardar consolidado del mes
                </Button>
              </div>

              {indicatorMonthlyHistory.length === 0 ? (
                <div className="mt-2 text-sm text-muted-foreground">No hay histórico guardado.</div>
              ) : (
                <div className="mt-3">
                  <div className="space-y-2 sm:hidden">
                    {indicatorMonthlyHistory.slice(0, 12).map((it) => (
                      <div key={it.id} className="rounded-md border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium">
                            {it.anio}-{String(it.mes).padStart(2, '0')}
                          </div>
                          <div className={Number(it.porcentaje_cumplimiento) >= indicatorMeta ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                            {Number(it.porcentaje_cumplimiento).toFixed(2)}%
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md bg-muted/50 p-2">
                            <div className="text-muted-foreground">Total</div>
                            <div className="font-medium">{it.total_registros}</div>
                          </div>
                          <div className="rounded-md bg-muted/50 p-2">
                            <div className="text-muted-foreground">Cumplen</div>
                            <div className="font-medium">{it.registros_cumplen}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Calculado: {String(it.fecha_calculo ?? '').slice(0, 10)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block overflow-x-auto">
                    <div className="min-w-[720px] grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground">
                      <div>Año</div>
                      <div>Mes</div>
                      <div>Total</div>
                      <div>Cumplen</div>
                      <div>% Cumplimiento</div>
                      <div>Fecha cálculo</div>
                    </div>
                    <div className="mt-2 space-y-2">
                      {indicatorMonthlyHistory.slice(0, 12).map((it) => (
                        <div key={it.id} className="min-w-[720px] grid grid-cols-6 gap-2 text-sm rounded-md border p-2">
                          <div>{it.anio}</div>
                          <div>{String(it.mes).padStart(2, '0')}</div>
                          <div>{it.total_registros}</div>
                          <div>{it.registros_cumplen}</div>
                          <div className={Number(it.porcentaje_cumplimiento) >= indicatorMeta ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                            {Number(it.porcentaje_cumplimiento).toFixed(2)}%
                          </div>
                          <div className="text-muted-foreground">{String(it.fecha_calculo ?? '').slice(0, 10)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
