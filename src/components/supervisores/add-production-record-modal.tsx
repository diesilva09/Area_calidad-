'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateInput } from '@/components/ui/date-input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import dynamic from 'next/dynamic';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { productionRecordsService } from '@/lib/supervisores-data';
import { productService } from '@/lib/supervisores-data';
import { limpiezaRegistrosService } from '@/lib/limpieza-registros-service';
import { embalajeRecordsService } from '@/lib/embalaje-records-service';
import { EnvasesService } from '@/lib/envases-config';
import { AreasEquiposService } from '@/lib/areas-equipos-config';
import { TemperaturaEnvasadoService } from '@/lib/temperatura-envasado-service';
import { ProductoPesosService } from "@/lib/producto-pesos-service";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getFechaActual, getMesActual } from '@/lib/date-utils';
import { ChevronDown, Loader2, Plus, X } from 'lucide-react'; // Añadido para spinner
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';

const ProductCharts = dynamic(
  () => import('./product-charts').then((m) => m.ProductCharts),
  { ssr: false }
);

export const productionFormSchema = z.object({
  fechaProduccion: z.string().min(1, 'Campo requerido'),
  fechaVencimiento: z.string().min(1, 'Campo requerido'),
  mesCorte: z.string().min(1, 'Campo requerido'),
  producto: z.string().min(1, 'Campo requerido'),
  envase: z.string().min(1, 'Campo requerido'),
  lote: z.string().min(1, 'Campo requerido'),
  tamanoLote: z.string().min(1, 'Campo requerido'),
  letraTamanoMuestra: z.string().min(1, 'Campo requerido'),
  area: z.string().min(1, 'Campo requerido'),
  equipo: z.string().min(1, 'Campo requerido'),
  liberacionInicial: z.string().min(1, 'Campo requerido'),
  liberacionInicialObs: z.string().optional(),
  verificacionAleatoria: z.string().min(1, 'Campo requerido'),
  verificacionAleatoriaObs: z.string().optional(),
  tempAM1: z.string().min(1, 'Campo requerido'),
  tempAM2: z.string().min(1, 'Campo requerido'),
  tempPM1: z.string().min(1, 'Campo requerido'),
  tempPM2: z.string().min(1, 'Campo requerido'),
  envaseTemperatura: z.string().min(1, 'Campo requerido'),
  analisisSensorial: z.string().min(1, 'Campo requerido'),
  analisisSensorialObs: z.string().optional(),
  analisisSensorialCorreccion: z.string().optional(),
  pruebaHermeticidad: z.string().min(1, 'Campo requerido'),
  pruebaHermeticidadObs: z.string().optional(),
  pruebaHermeticidadCorreccion: z.string().optional(),
  inspeccionMicropesajeMezcla: z.string().min(1, 'Campo requerido'),
  inspeccionMicropesajeMezclaObs: z.string().optional(),
  inspeccionMicropesajeMezclaCorreccion: z.string().optional(),
  inspeccionMicropesajeResultado: z.string().min(1, 'Campo requerido'),
  inspeccionMicropesajeResultadoObs: z.string().optional(),
  inspeccionMicropesajeResultadoCorreccion: z.string().optional(),
  tieneObservacionesAnalisisPruebas: z.string().optional(),
  observacionesAnalisisPruebasTexto: z.string().optional(),
  totalUnidadesRevisarDrenado: z.string().min(1, 'Campo requerido'),
  pesoDrenadoDeclarado: z.string().min(1, 'Campo requerido'),
  rangoPesoDrenadoMin: z.string().min(1, 'Campo requerido'),
  rangoPesoDrenadoMax: z.string().min(1, 'Campo requerido'),
  pesosDrenados: z.string().min(1, 'Campo requerido'),
  promedioPesoDrenado: z.string().min(1, 'Campo requerido'),
  encimaPesoDrenado: z.string().min(1, 'Campo requerido'),
  debajoPesoDrenado: z.string().min(1, 'Campo requerido'),
  undIncumplenRangoDrenado: z.string().min(1, 'Campo requerido'),
  porcentajeIncumplenRangoDrenado: z.string().min(1, 'Campo requerido'),
  tieneObservacionesPesoDrenado: z.string().optional(),
  observacionesPesoDrenadoTexto: z.string().optional(),
  totalUnidadesRevisarNeto: z.string().min(1, 'Campo requerido'),
  pesoNetoDeclarado: z.string().min(1, 'Campo requerido'),
  pesosNetos: z.string().min(1, 'Campo requerido'),
  promedioPesoNeto: z.string().min(1, 'Campo requerido'),
  encimaPesoNeto: z.string().min(1, 'Campo requerido'),
  debajoPesoNeto: z.string().min(1, 'Campo requerido'),
  undIncumplenRangoNeto: z.string().min(1, 'Campo requerido'),
  porcentajeIncumplenRangoNeto: z.string().min(1, 'Campo requerido'),
  tieneObservacionesPesoNeto: z.string().optional(),
  observacionesPesoNetoTexto: z.string().optional(),
  pruebasVacio: z.string().min(1, 'Campo requerido'),
  novedadesProceso: z.string().optional(),
  observacionesAccionesCorrectivas: z.string().optional(),
  novedadesProcesoTemperatura: z.string().optional(),
  observacionesAccionesCorrectivasTemperatura: z.string().optional(),
  supervisorCalidad: z.string().nullable().optional(),
  responsableProduccion: z.string().min(1, 'Campo requerido'), // Campo agregado
  hasAnalisisPT: z.boolean().optional(),
  fechaAnalisisPT: z.string().optional(),
  noMezclaPT: z.string().optional(),
  vacioPT: z.string().optional(),
  pesoNetoRealPT: z.string().optional(),
  pesoDrenadoRealPT: z.string().optional(),
  brixPT: z.string().optional(),
  phPT: z.string().optional(),
  acidezPT: z.string().optional(),
  ppmSo2PT: z.string().optional(),
  consistenciaPT: z.string().optional(),
  sensorialPT: z.string().optional(),
  tapadoCierrePT: z.string().optional(),
  etiquetaPT: z.string().optional(),
  presentacionFinalPT: z.string().optional(),
  ubicacionMuestraPT: z.string().optional(),
  estadoPT: z.string().optional(),
  observacionesPT: z.string().optional(),
  responsableAnalisisPT: z.string().optional(),
}).superRefine((values, ctx) => {
  // Cuando se completa un registro, valores placeholder como 'Pendiente' NO deben pasar validación.
  const requiredNonPlaceholderFields: Array<keyof typeof values> = [
    'fechaProduccion',
    'fechaVencimiento',
    'mesCorte',
    'producto',
    'envase',
    'lote',
    'tamanoLote',
    'letraTamanoMuestra',
    'area',
    'equipo',
    'liberacionInicial',
    'verificacionAleatoria',
    'tempAM1',
    'tempAM2',
    'tempPM1',
    'tempPM2',
    'envaseTemperatura',
    'analisisSensorial',
    'pruebaHermeticidad',
    'inspeccionMicropesajeMezcla',
    'inspeccionMicropesajeResultado',
    'totalUnidadesRevisarDrenado',
    'pesoDrenadoDeclarado',
    'rangoPesoDrenadoMin',
    'rangoPesoDrenadoMax',
    'pesosDrenados',
    'promedioPesoDrenado',
    'encimaPesoDrenado',
    'debajoPesoDrenado',
    'undIncumplenRangoDrenado',
    'porcentajeIncumplenRangoDrenado',
    'totalUnidadesRevisarNeto',
    'pesoNetoDeclarado',
    'pesosNetos',
    'promedioPesoNeto',
    'encimaPesoNeto',
    'debajoPesoNeto',
    'undIncumplenRangoNeto',
    'porcentajeIncumplenRangoNeto',
    'pruebasVacio',
    'responsableProduccion',
  ];

  const ptRequiredFields: Array<keyof typeof values> = [
    'fechaAnalisisPT',
    'noMezclaPT',
    'vacioPT',
    'pesoNetoRealPT',
    'pesoDrenadoRealPT',
    'brixPT',
    'phPT',
    'acidezPT',
    'ppmSo2PT',
    'consistenciaPT',
    'sensorialPT',
    'tapadoCierrePT',
    'etiquetaPT',
    'presentacionFinalPT',
    'ubicacionMuestraPT',
    'estadoPT',
    'responsableAnalisisPT',
  ];

  if (values.hasAnalisisPT) {
    requiredNonPlaceholderFields.push(...ptRequiredFields);
  }

  // Validación condicional: cuando PT está activado, estos campos deben tener valor
  if (values.hasAnalisisPT) {
    ptRequiredFields.forEach((field) => {
      const raw = (values as any)?.[field];
      const s = String(raw ?? '').trim();
      if (!s) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field as any],
          message: 'Campo requerido',
        });
      }
    });
  }

  requiredNonPlaceholderFields.forEach((field) => {
    const raw = (values as any)?.[field];
    const s = String(raw ?? '').trim().toLowerCase();
    if (s === 'pendiente') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field as any],
        message: 'Campo requerido',
      });
    }
  });
});

// Esquema relajado para modo pendiente - solo campos básicos requeridos
export const pendingProductionFormSchema = z.object({
  fechaProduccion: z.string().min(1, 'Campo requerido'),
  mesCorte: z.string().min(1, 'Campo requerido'),
  producto: z.string().min(1, 'Campo requerido'),
  envase: z.string().min(1, 'Campo requerido'),
  lote: z.string().min(1, 'Campo requerido'),
  tamanoLote: z.string().min(1, 'Campo requerido'),
  area: z.string().min(1, 'Campo requerido'),
  equipo: z.string().min(1, 'Campo requerido'),
  responsableProduccion: z.string().min(1, 'Campo requerido'),
  
  // Campos opcionales para modo pendiente
  fechaVencimiento: z.string().optional(),
  letraTamanoMuestra: z.string().optional(),
  liberacionInicial: z.string().optional(),
  liberacionInicialObs: z.string().optional(),
  verificacionAleatoria: z.string().optional(),
  verificacionAleatoriaObs: z.string().optional(),
  tempAM1: z.string().optional(),
  tempAM2: z.string().optional(),
  tempPM1: z.string().optional(),
  tempPM2: z.string().optional(),
  envaseTemperatura: z.string().optional(),
  analisisSensorial: z.string().optional(),
  analisisSensorialObs: z.string().optional(),
  analisisSensorialCorreccion: z.string().optional(),
  pruebaHermeticidad: z.string().optional(),
  pruebaHermeticidadObs: z.string().optional(),
  pruebaHermeticidadCorreccion: z.string().optional(),
  inspeccionMicropesajeMezcla: z.string().optional(),
  inspeccionMicropesajeMezclaObs: z.string().optional(),
  inspeccionMicropesajeMezclaCorreccion: z.string().optional(),
  inspeccionMicropesajeResultado: z.string().optional(),
  inspeccionMicropesajeResultadoObs: z.string().optional(),
  inspeccionMicropesajeResultadoCorreccion: z.string().optional(),
  tieneObservacionesAnalisisPruebas: z.string().optional(),
  observacionesAnalisisPruebasTexto: z.string().optional(),
  totalUnidadesRevisarDrenado: z.string().optional(),
  pesoDrenadoDeclarado: z.string().optional(),
  rangoPesoDrenadoMin: z.string().optional(),
  rangoPesoDrenadoMax: z.string().optional(),
  pesosDrenados: z.string().optional(),
  promedioPesoDrenado: z.string().optional(),
  encimaPesoDrenado: z.string().optional(),
  debajoPesoDrenado: z.string().optional(),
  undIncumplenRangoDrenado: z.string().optional(),
  porcentajeIncumplenRangoDrenado: z.string().optional(),
  tieneObservacionesPesoDrenado: z.string().optional(),
  observacionesPesoDrenadoTexto: z.string().optional(),
  totalUnidadesRevisarNeto: z.string().optional(),
  pesoNetoDeclarado: z.string().optional(),
  pesosNetos: z.string().optional(),
  promedioPesoNeto: z.string().optional(),
  encimaPesoNeto: z.string().optional(),
  debajoPesoNeto: z.string().optional(),
  undIncumplenRangoNeto: z.string().optional(),
  porcentajeIncumplenRangoNeto: z.string().optional(),
  tieneObservacionesPesoNeto: z.string().optional(),
  observacionesPesoNetoTexto: z.string().optional(),
  pruebasVacio: z.string().optional(),
  novedadesProceso: z.string().optional(),
  observacionesAccionesCorrectivas: z.string().optional(),
  novedadesProcesoTemperatura: z.string().optional(),
  observacionesAccionesCorrectivasTemperatura: z.string().optional(),
  supervisorCalidad: z.string().nullable().optional(),
  hasAnalisisPT: z.boolean().optional(),
  fechaAnalisisPT: z.string().optional(),
  noMezclaPT: z.string().optional(),
  vacioPT: z.string().optional(),
  pesoNetoRealPT: z.string().optional(),
  pesoDrenadoRealPT: z.string().optional(),
  brixPT: z.string().optional(),
  phPT: z.string().optional(),
  acidezPT: z.string().optional(),
  ppmSo2PT: z.string().optional(),
  consistenciaPT: z.string().optional(),
  sensorialPT: z.string().optional(),
  tapadoCierrePT: z.string().optional(),
  etiquetaPT: z.string().optional(),
  presentacionFinalPT: z.string().optional(),
  ubicacionMuestraPT: z.string().optional(),
  estadoPT: z.string().optional(),
  observacionesPT: z.string().optional(),
  responsableAnalisisPT: z.string().optional(),
});

type AddProductionRecordModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productName: string;
  productId: string;
  onSuccessfulSubmit?: (values: z.infer<typeof productionFormSchema>) => void;
  editingRecord?: any; // Registro pendiente para editar/completar
  onOpenEmbalajeModal?: (data: any) => void; // Función para abrir modal de embalaje con datos precargados
};

export function AddProductionRecordModal({
  isOpen,
  onOpenChange,
  productName,
  productId,
  onSuccessfulSubmit,
  editingRecord,
  onOpenEmbalajeModal,
}: AddProductionRecordModalProps) {
  const { user } = useAuth();
  const [debugMode, setDebugMode] = React.useState(false);
  const [loteValidation, setLoteValidation] = React.useState<{
    isValid: boolean;
    message: string;
    isChecking: boolean;
  }>({
    isValid: true,
    message: '',
    isChecking: false
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [envasesDisponibles, setEnvasesDisponibles] = React.useState<any[]>([]);
  const [isLoadingEnvases, setIsLoadingEnvases] = React.useState(false);
  const [areasDisponibles, setAreasDisponibles] = React.useState<any[]>([]);
  const [equiposDisponibles, setEquiposDisponibles] = React.useState<any[]>([]);
  const [isLoadingEquipos, setIsLoadingEquipos] = React.useState(false);
  const [pruebasVacioValues, setPruebasVacioValues] = React.useState(['', '', '', '', '']);
  const [pruebasVacioErrors, setPruebasVacioErrors] = React.useState<string[]>(['', '', '', '', '']);
  const [pesosDrenadosValues, setPesosDrenadosValues] = React.useState<string[]>([]);
  const [pesosNetosValues, setPesosNetosValues] = React.useState<string[]>([]);
  const [maxPruebaVacioConfig, setMaxPruebaVacioConfig] = React.useState<number | null>(null);
  const [temperaturaRango, setTemperaturaRango] = React.useState<{min: number, max: number} | null>(null);
  const [validacionTemperatura, setValidacionTemperatura] = React.useState<any>(null);
  const [erroresTemperatura, setErroresTemperatura] = React.useState<{
    tempAM1: string;
    tempAM2: string;
    tempPM1: string;
    tempPM2: string;
  }>({
    tempAM1: '',
    tempAM2: '',
    tempPM1: '',
    tempPM2: ''
  });
  const [samplingRuleValidation, setSamplingRuleValidation] = React.useState<{
    isValid: boolean;
    message: string;
    isChecking: boolean;
  }>({
    isValid: true,
    message: '',
    isChecking: false,
  });
  const [calidadRangoActual, setCalidadRangoActual] = React.useState<any>(null);

  const parseNumberValue = (raw: unknown) => {
    const s = String(raw ?? '').trim();
    if (!s) return null;
    const normalized = s.replace(',', '.');
    const n = Number(normalized);
    return Number.isNaN(n) ? null : n;
  };

  const getTemperatureInputClass = (fieldName: keyof typeof erroresTemperatura, rawValue: unknown) => {
    // Prioridad: si ya hay error calculado -> rojo
    if (erroresTemperatura[fieldName]) return 'border-red-500 focus:border-red-500';
    if (!temperaturaRango) return '';

    const v = parseNumberValue(rawValue);
    if (v === null) return '';

    const dentroRango = v >= temperaturaRango.min && v <= temperaturaRango.max;
    return dentroRango ? 'border-blue-500 focus:border-blue-500' : 'border-red-500 focus:border-red-500';
  };

  const getPtRangeInputClass = (
    fieldName: 'brixPT' | 'phPT' | 'acidezPT' | 'consistenciaPT' | 'ppmSo2PT',
    rawValue?: unknown
  ) => {
    const value = rawValue ?? form.getValues(fieldName);
    if (!calidadRangoActual) return '';
    const v = parseNumberValue(value);
    if (v === null) return '';

    const min = parseNumberValue((calidadRangoActual as any)?.[`${fieldName === 'ppmSo2PT' ? 'ppm_so2' : fieldName.replace('PT', '')}_min`]);
    const max = parseNumberValue((calidadRangoActual as any)?.[`${fieldName === 'ppmSo2PT' ? 'ppm_so2' : fieldName.replace('PT', '')}_max`]);
    if (min === null || max === null) return '';

    const dentro = v >= min && v <= max;
    return dentro ? 'border-green-500 focus:border-green-500' : 'border-red-500 focus:border-red-500';
  };

  const getVacioPTInputClass = (rawValue?: unknown) => {
    const value = String(rawValue ?? vacioPTWatch ?? '').trim();
    if (!value) return '';
    const num = Number(value.replace(',', '.'));
    if (!Number.isFinite(num)) return 'border-red-500 focus:border-red-500';
    const minVacio = getMaxPruebaVacio();
    if (minVacio === null) return '';
    return num >= minVacio ? 'border-green-500 focus:border-green-500' : 'border-red-500 focus:border-red-500';
  };

  // Debounce para temperaturas y cálculos
  const [debounceTimeout, setDebounceTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const calculoDrenadosTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const calculoNetosTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [toastTimeouts, setToastTimeouts] = React.useState<NodeJS.Timeout[]>([]);
  const [isProcessingEnvase, setIsProcessingEnvase] = React.useState(false);
  const isHydratingRef = React.useRef(false);
  const limpiezaCreationPromises = React.useRef<Map<string, Promise<any>>>(new Map());



  // Tabla de correspondencia Letra -> Nº Unidades a Revisar (misma que getMuestrasRequeridas)
  const tablaUnidadesPorLetra: { [key: string]: number } = {
    'A': 2,
    'B': 3,
    'C': 5,
    'D': 8,
    'E': 13,
    'F': 20,
    'G': 32,
    'H': 50,
    'J': 80,
    'K': 125,
    'L': 200
  };

  const obtenerCalidadRangoPorEnvase = (
    configs: Array<{ envase_tipo: string }> | undefined,
    envaseTipo: string
  ) => {
    if (!configs || configs.length === 0) return null;
    const direct = configs.find(c => String(c.envase_tipo).toLowerCase() === String(envaseTipo).toLowerCase());
    if (direct) return direct as any;
    const general = configs.find(c => String(c.envase_tipo).toLowerCase() === 'general');
    return (general as any) || null;
  };

  const validarYAutocompletarSamplingRule = async (equipoId: string, tamanoLoteStr: string) => {
    if (!equipoId || !tamanoLoteStr) {
      setSamplingRuleValidation({ isValid: true, message: '', isChecking: false });
      return;
    }

    const tamanoLote = parseInt(tamanoLoteStr);
    if (isNaN(tamanoLote) || tamanoLote <= 0) {
      setSamplingRuleValidation({
        isValid: false,
        message: 'Tamaño del lote inválido',
        isChecking: false,
      });
      return;
    }

    setSamplingRuleValidation({ isValid: true, message: 'Calculando nivel de inspección...', isChecking: true });
    try {
      const response = await fetch(`/api/equipos/${equipoId}/sampling-rule?tamanoLote=${tamanoLote}`);

      if (!response.ok) {
        if (response.status === 404) {
          setSamplingRuleValidation({
            isValid: false,
            message: 'No existe regla de muestreo para este equipo y tamaño de lote',
            isChecking: false,
          });
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Error consultando regla de muestreo');
      }

      const data = await response.json();
      const nivel = String(data?.nivel || '').toUpperCase();
      const unidades = parseInt(String(data?.unidades_revisar || ''));

      if (!nivel || isNaN(unidades) || unidades <= 0) {
        setSamplingRuleValidation({
          isValid: false,
          message: 'Regla de muestreo inválida',
          isChecking: false,
        });
        return;
      }

      form.setValue('letraTamanoMuestra', nivel);
      form.setValue('totalUnidadesRevisarDrenado', unidades.toString());
      form.setValue('totalUnidadesRevisarNeto', unidades.toString());

      setSamplingRuleValidation({
        isValid: true,
        message: `Nivel ${nivel} - ${unidades} unidades`,
        isChecking: false,
      });
    } catch (error: any) {
      setSamplingRuleValidation({
        isValid: false,
        message: error?.message || 'Error consultando regla de muestreo',
        isChecking: false,
      });
    }
  };
  const { toast } = useToast();
  
  // Formulario principal (validación completa)
  const form = useForm<z.infer<typeof productionFormSchema>>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: {
      fechaProduccion: getFechaActual(),
      fechaVencimiento: '',
      mesCorte: getMesActual(),
      producto: productId,
      envase: '',
      lote: '',
      tamanoLote: '',
      letraTamanoMuestra: '', // El usuario debe seleccionar
      area: '',
      equipo: '',
      liberacionInicial: '',
      liberacionInicialObs: '',
      verificacionAleatoria: '',
      verificacionAleatoriaObs: '',
      tempAM1: '',
      tempAM2: '',
      tempPM1: '',
      tempPM2: '',
      envaseTemperatura: '',
      analisisSensorial: '',
      analisisSensorialObs: '',
      analisisSensorialCorreccion: '',
      pruebaHermeticidad: '',
      pruebaHermeticidadObs: '',
      pruebaHermeticidadCorreccion: '',
      inspeccionMicropesajeMezcla: '',
      inspeccionMicropesajeMezclaObs: '',
      inspeccionMicropesajeMezclaCorreccion: '',
      inspeccionMicropesajeResultado: '',
      inspeccionMicropesajeResultadoObs: '',
      inspeccionMicropesajeResultadoCorreccion: '',
      tieneObservacionesAnalisisPruebas: 'No',
      observacionesAnalisisPruebasTexto: '',
      totalUnidadesRevisarDrenado: '',
      pesoDrenadoDeclarado: '',
      rangoPesoDrenadoMin: '',
      rangoPesoDrenadoMax: '',
      pesosDrenados: '',
      promedioPesoDrenado: '',
      encimaPesoDrenado: '',
      debajoPesoDrenado: '',
      undIncumplenRangoDrenado: '',
      porcentajeIncumplenRangoDrenado: '',
      tieneObservacionesPesoDrenado: 'No',
      observacionesPesoDrenadoTexto: '',
      totalUnidadesRevisarNeto: '',
      pesoNetoDeclarado: '',
      pesosNetos: '',
      promedioPesoNeto: '',
      encimaPesoNeto: '',
      debajoPesoNeto: '',
      undIncumplenRangoNeto: '',
      porcentajeIncumplenRangoNeto: '',
      tieneObservacionesPesoNeto: 'No',
      observacionesPesoNetoTexto: '',
      pruebasVacio: '',
      novedadesProceso: '',
      observacionesAccionesCorrectivas: '',
      novedadesProcesoTemperatura: '',
      observacionesAccionesCorrectivasTemperatura: '',
      supervisorCalidad: '',
      responsableProduccion: '',
      hasAnalisisPT: false,
      fechaAnalisisPT: '',
      noMezclaPT: '',
      vacioPT: '',
      pesoNetoRealPT: '',
      pesoDrenadoRealPT: '',
      brixPT: '',
      phPT: '',
      acidezPT: '',
      ppmSo2PT: '',
      consistenciaPT: '',
      sensorialPT: '',
      tapadoCierrePT: '',
      etiquetaPT: '',
      presentacionFinalPT: '',
      ubicacionMuestraPT: '',
      estadoPT: '',
      observacionesPT: '',
      responsableAnalisisPT: '',
    },
  });

  const envaseWatch = useWatch({ control: form.control, name: 'envase' });
  const analisisSensorialWatch = useWatch({ control: form.control, name: 'analisisSensorial' });
  const pruebaHermeticidadWatch = useWatch({ control: form.control, name: 'pruebaHermeticidad' });
  const inspeccionMicropesajeMezclaWatch = useWatch({ control: form.control, name: 'inspeccionMicropesajeMezcla' });
  const inspeccionMicropesajeResultadoWatch = useWatch({ control: form.control, name: 'inspeccionMicropesajeResultado' });
  const vacioPTWatch = useWatch({ control: form.control, name: 'vacioPT' });
  const brixPTWatch = useWatch({ control: form.control, name: 'brixPT' });
  const phPTWatch = useWatch({ control: form.control, name: 'phPT' });
  const tieneObservacionesAnalisisPruebasWatch = useWatch({ control: form.control, name: 'tieneObservacionesAnalisisPruebas' });
  const tieneObservacionesPesoDrenadoWatch = useWatch({ control: form.control, name: 'tieneObservacionesPesoDrenado' });
  const tieneObservacionesPesoNetoWatch = useWatch({ control: form.control, name: 'tieneObservacionesPesoNeto' });
  const acidezPTWatch = useWatch({ control: form.control, name: 'acidezPT' });
  const hasAnalisisPTWatch = useWatch({ control: form.control, name: 'hasAnalisisPT' });
  const consistenciaPTWatch = useWatch({ control: form.control, name: 'consistenciaPT' });
  const ppmSo2PTWatch = useWatch({ control: form.control, name: 'ppmSo2PT' });

  const [sensorialPTModo, setSensorialPTModo] = React.useState<'cumple' | 'no_cumple' | ''>('');
  const [sensorialPTObs, setSensorialPTObs] = React.useState('');
  const [sensorialPTCorr, setSensorialPTCorr] = React.useState('');
  const [presentacionFinalPTModo, setPresentacionFinalPTModo] = React.useState<'cumple' | 'no_cumple' | ''>('');
  const [presentacionFinalPTObs, setPresentacionFinalPTObs] = React.useState('');
  const [presentacionFinalPTCorr, setPresentacionFinalPTCorr] = React.useState('');

  const PT_ANALYSES_MARKER = '__PT_ANALYSES_JSON__';

  type ExtraPtAnalysis = {
    fechaAnalisisPT: string;
    noMezclaPT: string;
    vacioPT: string;
    pesoNetoRealPT: string;
    pesoDrenadoRealPT: string;
    brixPT: string;
    phPT: string;
    acidezPT: string;
    ppmSo2PT: string;
    consistenciaPT: string;
    tapadoCierrePT: string;
    etiquetaPT: string;
    ubicacionMuestraPT: string;
    estadoPT: string;
    responsableAnalisisPT: string;
    sensorialPT: string;
    presentacionFinalPT: string;
    observacionesPT: string;
  };

  const emptyExtraPtAnalysis = (): ExtraPtAnalysis => ({
    fechaAnalisisPT: '',
    noMezclaPT: '',
    vacioPT: '',
    pesoNetoRealPT: '',
    pesoDrenadoRealPT: '',
    brixPT: '',
    phPT: '',
    acidezPT: '',
    ppmSo2PT: '',
    consistenciaPT: '',
    tapadoCierrePT: '',
    etiquetaPT: '',
    ubicacionMuestraPT: '',
    estadoPT: '',
    responsableAnalisisPT: '',
    sensorialPT: '',
    presentacionFinalPT: '',
    observacionesPT: '',
  });

  const [extraPtAnalyses, setExtraPtAnalyses] = React.useState<ExtraPtAnalysis[]>([]);
  const [ptActiveTab, setPtActiveTab] = React.useState<string>('analysis-1');

  const splitPtObservaciones = (raw: unknown): { base: string; extras: ExtraPtAnalysis[] } => {
    const s = String(raw ?? '').trim();
    if (!s) return { base: '', extras: [] };
    const idx = s.indexOf(PT_ANALYSES_MARKER);
    if (idx === -1) return { base: s, extras: [] };

    const base = String(s.slice(0, idx)).trim();
    const after = String(s.slice(idx + PT_ANALYSES_MARKER.length)).trim();
    try {
      const parsed = JSON.parse(after);
      const extras = Array.isArray(parsed) ? (parsed as ExtraPtAnalysis[]) : [];
      return { base, extras };
    } catch {
      return { base: s, extras: [] };
    }
  };

  const mergePtObservaciones = (base: string, extras: ExtraPtAnalysis[]) => {
    const baseTrimmed = String(base ?? '').trim();
    if (!extras?.length) return baseTrimmed;
    return [baseTrimmed, PT_ANALYSES_MARKER, JSON.stringify(extras)].filter(Boolean).join('\n\n');
  };

  const [novedadesProcesoModo, setNovedadesProcesoModo] = React.useState<'si' | 'no' | ''>('');
  const [novedadesProcesoTexto, setNovedadesProcesoTexto] = React.useState('');
  const [novedadesProcesoCorrecciones, setNovedadesProcesoCorrecciones] = React.useState('');

  const [responsableCalidadSeleccionado, setResponsableCalidadSeleccionado] = React.useState('');
  const [otroResponsableCalidad, setOtroResponsableCalidad] = React.useState('');

  const [novedadesTemperaturaModo, setNovedadesTemperaturaModo] = React.useState<'si' | 'no' | ''>('');
  const [novedadesTemperaturaTexto, setNovedadesTemperaturaTexto] = React.useState('');
  const [novedadesTemperaturaCorrecciones, setNovedadesTemperaturaCorrecciones] = React.useState('');

  const [liberacionInicialNov, setLiberacionInicialNov] = React.useState('');
  const [liberacionInicialCorr, setLiberacionInicialCorr] = React.useState('');
  const [verificacionAleatoriaNov, setVerificacionAleatoriaNov] = React.useState('');
  const [verificacionAleatoriaCorr, setVerificacionAleatoriaCorr] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) return;

    if (isHydratingRef.current) return;

    const payload = [
      `Observaciones: ${String(liberacionInicialNov || '').trim()}`,
      `Corrección: ${String(liberacionInicialCorr || '').trim()}`,
    ].join('\n');

    if (form.getValues('liberacionInicial') === 'No conforme') {
      form.setValue('liberacionInicialObs', payload, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [isOpen, liberacionInicialNov, liberacionInicialCorr, form]);

  React.useEffect(() => {
    if (!isOpen) return;

    if (isHydratingRef.current) return;

    const payload = [
      `Observaciones: ${String(verificacionAleatoriaNov || '').trim()}`,
      `Corrección: ${String(verificacionAleatoriaCorr || '').trim()}`,
    ].join('\n');

    if (form.getValues('verificacionAleatoria') === 'No conforme') {
      form.setValue('verificacionAleatoriaObs', payload, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [isOpen, verificacionAleatoriaNov, verificacionAleatoriaCorr, form]);

  const rehydrateNovedadesCorreccionesUI = React.useCallback(
    (values?: Partial<Record<string, unknown>>) => {
      const get = (key: string) => {
        if (values && key in values) return (values as any)[key];
        return form.getValues(key as any);
      };

      const sensorialParsed = parseCumpleNoCumple(get('sensorialPT'));
      setSensorialPTModo(sensorialParsed.modo);
      setSensorialPTObs(sensorialParsed.obs);
      setSensorialPTCorr(sensorialParsed.corr);

      const presParsed = parseCumpleNoCumple(get('presentacionFinalPT'));
      setPresentacionFinalPTModo(presParsed.modo);
      setPresentacionFinalPTObs(presParsed.obs);
      setPresentacionFinalPTCorr(presParsed.corr);

      const parseNovedadesPorSeccion = (rawNov: unknown, rawCorr: unknown) => {
        const novedadesRaw = String(rawNov || '').trim();
        const correccionesRaw = String(rawCorr || '').trim();

        const getSection = (s: string, section: string) => {
          const re = new RegExp(
            `\\[${section}\\][\\s\\S]*?^Novedades\\s*:\\s*([\\s\\S]*?)(?=\\n+\\[|\\n+Correcciones\\s*:|$)`,
            'im'
          );
          const m = s.match(re);
          return (m?.[1] ?? '').trim();
        };

        const getSectionCorr = (s: string, section: string) => {
          const re = new RegExp(
            `\\[${section}\\][\\s\\S]*?^Correcciones\\s*:\\s*([\\s\\S]*?)(?=\\n+\\[|$)`,
            'im'
          );
          const m = s.match(re);
          return (m?.[1] ?? '').trim();
        };

        const hasStructured = /\[(Temperatura|Pruebas de Vac[ií]o)\]/i.test(novedadesRaw) || /\[(Temperatura|Pruebas de Vac[ií]o)\]/i.test(correccionesRaw);
        if (!hasStructured) {
          return {
            // Legacy: si viene sin secciones, lo asignamos a Temperatura por defecto
            // para evitar que se crucen los datos con Pruebas de Vacío.
            temperatura: { nov: novedadesRaw, corr: correccionesRaw },
            vacio: { nov: '', corr: '' },
          };
        }

        return {
          temperatura: {
            nov: getSection(novedadesRaw, 'Temperatura'),
            corr: getSectionCorr(correccionesRaw, 'Temperatura'),
          },
          vacio: {
            nov: getSection(novedadesRaw, 'Pruebas de Vacío') || getSection(novedadesRaw, 'Pruebas de Vacio'),
            corr: getSectionCorr(correccionesRaw, 'Pruebas de Vacío') || getSectionCorr(correccionesRaw, 'Pruebas de Vacio'),
          },
        };
      };

      const novedadesSeccion = parseNovedadesPorSeccion(get('novedadesProceso'), get('observacionesAccionesCorrectivas'));

      const hasVacio = Boolean(novedadesSeccion.vacio.nov) || Boolean(novedadesSeccion.vacio.corr);
      setNovedadesProcesoModo(hasVacio ? 'si' : 'no');
      setNovedadesProcesoTexto(novedadesSeccion.vacio.nov);
      setNovedadesProcesoCorrecciones(novedadesSeccion.vacio.corr);

      // Importante: el backend solo persiste `novedadesProceso`/`observacionesAccionesCorrectivas`.
      // En la UI trabajamos por secciones (Vacío y Temperatura) para evitar cruces.
      // Por eso, al hidratar, separamos el contenido y lo dejamos en los campos correctos del form.
      form.setValue('novedadesProceso', novedadesSeccion.vacio.nov, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      form.setValue('observacionesAccionesCorrectivas', novedadesSeccion.vacio.corr, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });

      const hasTemp = Boolean(novedadesSeccion.temperatura.nov) || Boolean(novedadesSeccion.temperatura.corr);
      setNovedadesTemperaturaModo(hasTemp ? 'si' : 'no');
      setNovedadesTemperaturaTexto(novedadesSeccion.temperatura.nov);
      setNovedadesTemperaturaCorrecciones(novedadesSeccion.temperatura.corr);

      form.setValue('novedadesProcesoTemperatura', novedadesSeccion.temperatura.nov, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      form.setValue('observacionesAccionesCorrectivasTemperatura', novedadesSeccion.temperatura.corr, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });

      const parseNovCorr = (raw: unknown) => {
        const s = String(raw || '').trim();
        if (!s) return { nov: '', corr: '' };

        const obsMatch = s.match(/Observaciones\s*:\s*([\s\S]*?)(?:\n+Correcci[oó]n\s*:|\n+Correcciones\s*:|$)/i);
        const corrMatchNew = s.match(/Correcci[oó]n\s*:\s*([\s\S]*)$/i);
        const corrMatchPlural = s.match(/Correcciones\s*:\s*([\s\S]*)$/i);

        const novMatch = s.match(/Novedades\s*:\s*([\s\S]*?)(?:\n+Correcciones\s*:|$)/i);
        const corrMatchOld = s.match(/Correcciones\s*:\s*([\s\S]*)$/i);

        const nov = (obsMatch?.[1] ?? novMatch?.[1] ?? '').trim();
        const corr = (corrMatchNew?.[1] ?? corrMatchPlural?.[1] ?? corrMatchOld?.[1] ?? '').trim();
        return { nov, corr };
      };

      const libParsed = parseNovCorr(get('liberacionInicialObs'));
      setLiberacionInicialNov(libParsed.nov);
      setLiberacionInicialCorr(libParsed.corr);

      const verParsed = parseNovCorr(get('verificacionAleatoriaObs'));
      setVerificacionAleatoriaNov(verParsed.nov);
      setVerificacionAleatoriaCorr(verParsed.corr);
    },
    [
      form,
      setSensorialPTModo,
      setSensorialPTObs,
      setSensorialPTCorr,
      setPresentacionFinalPTModo,
      setPresentacionFinalPTObs,
      setPresentacionFinalPTCorr,
      setNovedadesProcesoModo,
      setNovedadesProcesoTexto,
      setNovedadesProcesoCorrecciones,
      setNovedadesTemperaturaModo,
      setNovedadesTemperaturaTexto,
      setNovedadesTemperaturaCorrecciones,
      setLiberacionInicialNov,
      setLiberacionInicialCorr,
      setVerificacionAleatoriaNov,
      setVerificacionAleatoriaCorr,
    ]
  );

  React.useEffect(() => {
    if (!isOpen) return;

    if (isHydratingRef.current) return;

    rehydrateNovedadesCorreccionesUI();
  }, [isOpen, editingRecord, form, rehydrateNovedadesCorreccionesUI]);

  const parseMaxVaciosConfig = (raw: unknown): number | null => {
    if (raw === null || raw === undefined) return null;
    const s = String(raw).trim();
    if (!s) return null;

    const m = s.match(/\d+(?:[\.,]\d+)?/);
    if (!m) return null;
    const num = Number(m[0].replace(',', '.'));
    if (Number.isNaN(num)) return null;
    return num;
  };

  const getMaxPruebaVacio = () => {
    const max = maxPruebaVacioConfig;
    return typeof max === 'number' && Number.isFinite(max) ? max : null;
  };

  const parsePesosToArray = (raw: unknown) => {
    const s = String(raw || '').trim();
    if (!s) return [] as string[];
    return s
      .split(/[\s,;]+/)
      .map(v => v.trim())
      .filter(Boolean);
  };

  const ensureLength = (arr: string[], len: number) => {
    const out = arr.slice(0, len);
    while (out.length < len) out.push('');
    return out;
  };

  const parseCumpleNoCumple = (raw: unknown) => {
    const s = String(raw || '').trim();
    if (!s) return { modo: '' as const, obs: '', corr: '' };

    const lower = s.toLowerCase();
    const modo = lower.startsWith('no cumple') ? ('no_cumple' as const) : ('cumple' as const);

    const obsMatch = s.match(/Observaciones\s*:\s*([\s\S]*?)(?:\n|$)/i);
    const corrMatch = s.match(/Correcci[oó]n\s*:\s*([\s\S]*?)(?:\n|$)/i);

    return {
      modo,
      obs: obsMatch?.[1]?.trim?.() || '',
      corr: corrMatch?.[1]?.trim?.() || '',
    };
  };

  const buildNoCumpleText = (label: string, obs: string, corr: string) => {
    const obsFinal = String(obs || '').trim();
    const corrFinal = String(corr || '').trim();

    const lines = [
      `No cumple - ${label}`,
      `Observaciones: ${obsFinal || '-'}`,
      `Corrección: ${corrFinal || '-'}`,
    ];

    return lines.join('\n');
  };

  const buildAnalisisCorreccionesBlock = (values: any) => {
    const rows: Array<{ label: string; obs: string; corr: string }> = [];

    if (values?.analisisSensorial === 'No conforme') {
      rows.push({
        label: 'Análisis Sensorial',
        obs: String(values?.analisisSensorialObs || ''),
        corr: String(values?.analisisSensorialCorreccion || ''),
      });
    }
    if (values?.pruebaHermeticidad === 'No conforme') {
      rows.push({
        label: 'Prueba de Hermeticidad',
        obs: String(values?.pruebaHermeticidadObs || ''),
        corr: String(values?.pruebaHermeticidadCorreccion || ''),
      });
    }
    if (values?.inspeccionMicropesajeMezcla === 'No conforme') {
      rows.push({
        label: 'Inspección Micropesaje No. Mezcla',
        obs: String(values?.inspeccionMicropesajeMezclaObs || ''),
        corr: String(values?.inspeccionMicropesajeMezclaCorreccion || ''),
      });
    }
    if (values?.inspeccionMicropesajeResultado === 'No conforme') {
      rows.push({
        label: 'Inspección Micropesaje Resultado',
        obs: String(values?.inspeccionMicropesajeResultadoObs || ''),
        corr: String(values?.inspeccionMicropesajeResultadoCorreccion || ''),
      });
    }

    if (rows.length === 0) return '';

    const lines = rows
      .map((r) => {
        const obs = r.obs?.trim() ? r.obs.trim() : '-';
        const corr = r.corr?.trim() ? r.corr.trim() : '-';
        return `${r.label}: Observaciones: ${obs} | Correcciones: ${corr}`;
      })
      .join('\n');

    return `Análisis/Pruebas (NC)\n${lines}`;
  };

  const buildNoCumplePayload = (label: string, obsRaw: unknown, corrRaw: unknown) => {
    const obs = String(obsRaw ?? '').trim() || '-';
    const corr = String(corrRaw ?? '').trim() || '-';
    return [`No cumple - ${label}`, `Observaciones: ${obs}`, `Corrección: ${corr}`].join('\n');
  };

  const parseObsCorrBlock = (raw: unknown) => {
    const s = String(raw ?? '').trim();
    if (!s) return { obs: '', corr: '' };
    const obsMatch = s.match(/Observaciones\s*:\s*([\s\S]*?)(?:\n|$)/i);
    const corrMatch = s.match(/Correcci[oó]n\s*:\s*([\s\S]*?)(?:\n|$)/i);
    const corrAltMatch = s.match(/Correcciones\s*:\s*([\s\S]*?)(?:\n|$)/i);
    const novMatch = s.match(/Novedades\s*:\s*([\s\S]*?)(?:\n|$)/i);
    return {
      obs: String(obsMatch?.[1] ?? novMatch?.[1] ?? '').trim(),
      corr: String(corrMatch?.[1] ?? corrAltMatch?.[1] ?? '').trim(),
    };
  };

  const formatToDateInputValue = (raw: unknown) => {
    const s = String(raw ?? '').trim();
    if (!s) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        const dia = parts[0].padStart(2, '0');
        const mes = parts[1].padStart(2, '0');
        const anio = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${anio}-${mes}-${dia}`;
      }
    }

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return format(d, 'yyyy-MM-dd');
  };

  const isNoCumplePayload = (raw: unknown) => {
    const s = String(raw ?? '').trim().toLowerCase();
    return s.startsWith('no cumple') || s.includes('\nobservaciones:') || s.includes('observaciones:');
  };

  const normalizeConformidadValue = (raw: unknown) => {
    const s = String(raw ?? '').trim();
    if (!s) return '';
    if (s === '1') return 'Conforme';
    if (s === '0') return 'No conforme';
    if (s === '2') return 'No aplica';
    return s;
  };

  const hydrateNoCumpleFields = (raw: unknown) => {
    const normalized = normalizeConformidadValue(raw);
    const original = String(normalized ?? '').trim();
    if (!original) return { value: '', obs: '', corr: '', original: '' };

    if (!isNoCumplePayload(original)) {
      return { value: original, obs: '', corr: '', original };
    }

    const parsed = parseObsCorrBlock(original);
    const block = [`Observaciones: ${parsed.obs || '-'}`, `Corrección: ${parsed.corr || '-'}`].join('\n');
    return {
      value: 'No conforme',
      obs: parsed.obs,
      corr: parsed.corr,
      original: block,
    };
  };

  // Formulario para modo pendiente (validación relajada)
  const pendingForm = useForm<z.infer<typeof pendingProductionFormSchema>>({
    resolver: zodResolver(pendingProductionFormSchema),
    defaultValues: {
      fechaProduccion: getFechaActual(),
      mesCorte: getMesActual(),
      producto: productId,
      envase: '',
      lote: '',
      tamanoLote: '',
      area: '',
      equipo: '',
      responsableProduccion: '',
      // Todos los demás campos son opcionales y se quedan vacíos
    },
  });

  // Función auxiliar para obtener muestras requeridas según la letra
  const getMuestrasRequeridas = (letra: string): number => {
    const muestrasMap: { [key: string]: number } = {
      'A': 2, 'B': 3, 'C': 5, 'D': 8, 'E': 13,
      'F': 20, 'G': 32, 'H': 50, 'J': 80, 'K': 125, 'L': 200
    };
    return muestrasMap[letra.toUpperCase()] || 0;
  };

  const snakeToCamel = (s: string) => {
    return s.replace(/_([a-z0-9])/gi, (_, c: string) => c.toUpperCase());
  };

  React.useEffect(() => {
    form.setValue('producto', productId);
    pendingForm.setValue('producto', productId);
    
    // Cargar datos del registro pendiente si existe
    if (editingRecord) {
      isHydratingRef.current = true;

      // Mapeo de campos de base de datos (snake_case) a campos del formulario (camelCase)
      const fieldMapping: { [key: string]: string } = {
        // Campos básicos
        'fechaproduccion': 'fechaProduccion',
        'fechavencimiento': 'fechaVencimiento',
        'mescorte': 'mesCorte',
        'producto': 'producto',
        'envase': 'envase',
        'lote': 'lote',
        'tamano_lote': 'tamanoLote',
        'letratamano_muestra': 'letraTamanoMuestra',
        'area': 'area',
        'equipo': 'equipo',
        'liberacion_inicial': 'liberacionInicial',
        'liberacion_inicial_obs': 'liberacionInicialObs',
        'verificacion_aleatoria': 'verificacionAleatoria',
        'verificacion_aleatoria_obs': 'verificacionAleatoriaObs',
        'observaciones': 'observaciones',
        
        // Temperaturas
        'tempam1': 'tempAM1',
        'tempam2': 'tempAM2',
        'temppm1': 'tempPM1',
        'temppm2': 'tempPM2',
        'envase_temperatura': 'envaseTemperatura',
        
        // Análisis sensorial y pruebas
        'analisis_sensorial': 'analisisSensorial',
        'prueba_hermeticidad': 'pruebaHermeticidad',
        'inspeccion_micropesaje_mezcla': 'inspeccionMicropesajeMezcla',
        'inspeccion_micropesaje_resultado': 'inspeccionMicropesajeResultado',
        
        // Pesos drenados
        'total_unidades_revisar_drenado': 'totalUnidadesRevisarDrenado',
        'peso_drenado_declarado': 'pesoDrenadoDeclarado',
        'rango_peso_drenado_min': 'rangoPesoDrenadoMin',
        'rango_peso_drenado_max': 'rangoPesoDrenadoMax',
        'pesos_drenados': 'pesosDrenados',
        'promedio_peso_drenado': 'promedioPesoDrenado',
        'encima_peso_drenado': 'encimaPesoDrenado',
        'debajo_peso_drenado': 'debajoPesoDrenado',
        'und_incumplen_rango_drenado': 'undIncumplenRangoDrenado',
        'porcentaje_incumplen_rango_drenado': 'porcentajeIncumplenRangoDrenado',
        
        // Pesos netos
        'total_unidades_revisar_neto': 'totalUnidadesRevisarNeto',
        'peso_neto_declarado': 'pesoNetoDeclarado',
        'pesos_netos': 'pesosNetos',
        'promedio_peso_neto': 'promedioPesoNeto',
        'encima_peso_neto': 'encimaPesoNeto',
        'debajo_peso_neto': 'debajoPesoNeto',
        'und_incumplen_rango_neto': 'undIncumplenRangoNeto',
        'porcentaje_incumplen_rango_neto': 'porcentajeIncumplenRangoNeto',
        
        // Pruebas de vacío
        'pruebas_vacio': 'pruebasVacio',
        
        // Observaciones y acciones
        'novedades_proceso': 'novedadesProceso',
        'observaciones_acciones_correctivas': 'observacionesAccionesCorrectivas',
        'observaciones_analisis_pruebas': 'observacionesAnalisisPruebas',
        'observaciones_peso_drenado': 'observacionesPesoDrenado',
        'observaciones_peso_neto': 'observacionesPesoNeto',

        // Responsables
        'responsable_produccion': 'responsableProduccion',
        'supervisor_calidad': 'supervisorCalidad',
        'responsable_analisis_pt': 'responsableAnalisisPT',

        // Análisis PT
        'fechaanalisispt': 'fechaAnalisisPT',
        'no_mezcla_pt': 'noMezclaPT',
        'vacio_pt': 'vacioPT',
        'peso_neto_real_pt': 'pesoNetoRealPT',
        'peso_drenado_real_pt': 'pesoDrenadoRealPT',
        'brix_pt': 'brixPT',
        'ph_pt': 'phPT',
        'acidez_pt': 'acidezPT',
        'ppm_so2_pt': 'ppmSo2PT',
        'consistencia_pt': 'consistenciaPT',
        'sensorial_pt': 'sensorialPT',
        'tapado_cierre_pt': 'tapadoCierrePT',
        'etiqueta_pt': 'etiquetaPT',
        'presentacion_final_pt': 'presentacionFinalPT',
        'ubicacion_muestra_pt': 'ubicacionMuestraPT',
        'estado_pt': 'estadoPT',
        'observaciones_pt': 'observacionesPT',
      };

      // productionFormSchema tiene .superRefine() y se convierte en ZodEffects, por lo que no expone .shape.
      // Usamos las llaves actuales del formulario como base para poder hacer reset completo.
      const allSchemaFields = Object.keys(form.getValues() ?? {});
      const nextValues: Record<string, any> = {};
      for (const k of allSchemaFields) nextValues[k] = '';

      // Defaults mínimos para evitar inconsistencias
      nextValues.fechaProduccion = getFechaActual();
      nextValues.mesCorte = getMesActual();
      nextValues.producto = productId;
      nextValues.supervisorCalidad = '';
      nextValues.responsableProduccion = '';
      nextValues.hasAnalisisPT = false;

      // 1) Volcar valores desde DB (incluyendo vacíos) mapeando nombres
      Object.keys(editingRecord).forEach((dbField: string) => {
        const mappedField = fieldMapping[dbField];
        const formField = (mappedField || snakeToCamel(dbField) || dbField) as string;

        // Permitir campos que no estén en nextValues inicialmente (como observaciones)
        // pero que existen en el schema o son campos de sistema
        const isSystemField = ['created_at', 'updated_at', 'created_by', 'updated_by', 'status', 'id'].includes(dbField);
        if (!(formField in nextValues) && !isSystemField && !mappedField) return;

        const rawValue = (editingRecord as any)[dbField];

        // Producto siempre viene de prop
        if (formField === 'producto') return;

        const isFechaField =
          dbField.toLowerCase().includes('fecha') || formField.toLowerCase().includes('fecha');
        if (isFechaField) {
          nextValues[formField] = formatToDateInputValue(rawValue);
          return;
        }

        const nextRaw = rawValue ?? '';
        if (
          formField === 'liberacionInicial' ||
          formField === 'verificacionAleatoria' ||
          formField === 'analisisSensorial' ||
          formField === 'pruebaHermeticidad' ||
          formField === 'inspeccionMicropesajeMezcla' ||
          formField === 'inspeccionMicropesajeResultado' ||
          formField === 'tapadoCierrePT' ||
          formField === 'etiquetaPT' ||
          formField === 'presentacionFinalPT' ||
          formField === 'estadoPT'
        ) {
          nextValues[formField] = normalizeConformidadValue(nextRaw);
          return;
        }

        nextValues[formField] = nextRaw;
      });

      // 2) Rehidratar campos “No cumple” para que el UI recupere Obs/Corrección
      const lib = hydrateNoCumpleFields(nextValues.liberacionInicial);
      if (lib.value === 'No conforme') {
        nextValues.liberacionInicial = 'No conforme';
        nextValues.liberacionInicialObs = lib.original;
      }

      const ver = hydrateNoCumpleFields(nextValues.verificacionAleatoria);
      if (ver.value === 'No conforme') {
        nextValues.verificacionAleatoria = 'No conforme';
        nextValues.verificacionAleatoriaObs = ver.original;
      }

      const as = hydrateNoCumpleFields(nextValues.analisisSensorial);
      if (as.value === 'No conforme') {
        nextValues.analisisSensorial = 'No conforme';
        nextValues.analisisSensorialObs = as.obs;
        nextValues.analisisSensorialCorreccion = as.corr;
      }

      const ph = hydrateNoCumpleFields(nextValues.pruebaHermeticidad);
      if (ph.value === 'No conforme') {
        nextValues.pruebaHermeticidad = 'No conforme';
        nextValues.pruebaHermeticidadObs = ph.obs;
        nextValues.pruebaHermeticidadCorreccion = ph.corr;
      }

      const mix = hydrateNoCumpleFields(nextValues.inspeccionMicropesajeMezcla);
      if (mix.value === 'No conforme') {
        nextValues.inspeccionMicropesajeMezcla = 'No conforme';
        nextValues.inspeccionMicropesajeMezclaObs = mix.obs;
        nextValues.inspeccionMicropesajeMezclaCorreccion = mix.corr;
      }

      const res = hydrateNoCumpleFields(nextValues.inspeccionMicropesajeResultado);
      if (res.value === 'No conforme') {
        nextValues.inspeccionMicropesajeResultado = 'No conforme';
        nextValues.inspeccionMicropesajeResultadoObs = res.obs;
        nextValues.inspeccionMicropesajeResultadoCorreccion = res.corr;
      }

      // Rehidratar campos de observaciones (Sí/No + texto)
      const obsAnalisisPruebas = String((nextValues as any).observacionesAnalisisPruebas ?? '').trim();
      console.log('🔍 Rehidratando observaciones:', {
        obsAnalisisPruebas,
        obsPesoDrenado: String((nextValues as any).observacionesPesoDrenado ?? '').trim(),
        obsPesoNeto: String((nextValues as any).observacionesPesoNeto ?? '').trim(),
        nextValuesKeys: Object.keys(nextValues).filter(k => k.toLowerCase().includes('observacion'))
      });
      if (obsAnalisisPruebas) {
        nextValues.tieneObservacionesAnalisisPruebas = 'Si';
        nextValues.observacionesAnalisisPruebasTexto = obsAnalisisPruebas;
      } else {
        nextValues.tieneObservacionesAnalisisPruebas = 'No';
        nextValues.observacionesAnalisisPruebasTexto = '';
      }

      const obsPesoDrenado = String((nextValues as any).observacionesPesoDrenado ?? '').trim();
      if (obsPesoDrenado) {
        nextValues.tieneObservacionesPesoDrenado = 'Si';
        nextValues.observacionesPesoDrenadoTexto = obsPesoDrenado;
      } else {
        nextValues.tieneObservacionesPesoDrenado = 'No';
        nextValues.observacionesPesoDrenadoTexto = '';
      }

      const obsPesoNeto = String((nextValues as any).observacionesPesoNeto ?? '').trim();
      if (obsPesoNeto) {
        nextValues.tieneObservacionesPesoNeto = 'Si';
        nextValues.observacionesPesoNetoTexto = obsPesoNeto;
      } else {
        nextValues.tieneObservacionesPesoNeto = 'No';
        nextValues.observacionesPesoNetoTexto = '';
      }

      // Reset completo (evita que queden defaults/valores viejos en campos no presentes)
      form.reset(nextValues as any);
      pendingForm.reset(nextValues as any);

      // Rehidratar análisis PT extra desde observacionesPT
      const { base: obsBase, extras } = splitPtObservaciones((nextValues as any).observacionesPT);
      if (extras.length) {
        setExtraPtAnalyses(extras);
        setPtActiveTab('analysis-1');

        form.setValue('hasAnalisisPT', true, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
        pendingForm.setValue('hasAnalisisPT', true, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
      } else {
        setExtraPtAnalyses([]);
        setPtActiveTab('analysis-1');
      }
      if (String((nextValues as any).observacionesPT ?? '').includes(PT_ANALYSES_MARKER)) {
        form.setValue('observacionesPT', obsBase, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
        pendingForm.setValue('observacionesPT', obsBase, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
      }

      // Si ya hay datos PT en el registro, mostrar automáticamente la sección
      const ptFieldsToCheck = [
        'fechaAnalisisPT',
        'noMezclaPT',
        'vacioPT',
        'pesoNetoRealPT',
        'pesoDrenadoRealPT',
        'brixPT',
        'phPT',
        'acidezPT',
        'ppmSo2PT',
        'consistenciaPT',
        'sensorialPT',
        'tapadoCierrePT',
        'etiquetaPT',
        'presentacionFinalPT',
        'ubicacionMuestraPT',
        'estadoPT',
        'observacionesPT',
        'responsableAnalisisPT',
      ] as const;

      const hasAnyPTValue = ptFieldsToCheck.some((k) => {
        const v = String((nextValues as any)[k] ?? '').trim();
        if (!v) return false;
        return v.toLowerCase() !== 'pendiente';
      });

      if (hasAnyPTValue) {
        form.setValue('hasAnalisisPT', true, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
        pendingForm.setValue('hasAnalisisPT', true, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
      }

      // Rehidratar Responsable de Calidad (cuando es "Otro")
      const responsableValueRaw = String((nextValues as any).responsableProduccion ?? '').trim();
      const responsableValue = responsableValueRaw;
      const responsableLower = responsableValue.toLowerCase();

      if (responsableLower.includes('lesl')) {
        setResponsableCalidadSeleccionado('Lesly');
        setOtroResponsableCalidad('');
      } else if (responsableLower.includes('deis')) {
        setResponsableCalidadSeleccionado('Deisy');
        setOtroResponsableCalidad('');
      } else if (responsableValue) {
        setResponsableCalidadSeleccionado('Otro');
        setOtroResponsableCalidad(responsableValue);
      } else {
        setResponsableCalidadSeleccionado('');
        setOtroResponsableCalidad('');
      }

      // Rehidratar estados locales que controlan Textareas/Selects (novedades/correcciones)
      // usando los valores recién cargados (evita que queden vacíos por efectos previos al reset).
      rehydrateNovedadesCorreccionesUI(nextValues);

      // Rehidratar Pruebas de Vacío (UI usa estado local pruebasVacioValues)
      // El valor guardado viene como string separado por comas (p.ej. "10,11,12").
      const rawPruebasVacio =
        (nextValues as any).pruebasVacio ??
        (editingRecord as any)?.pruebasVacio ??
        (editingRecord as any)?.pruebas_vacio;
      const parsedPruebasVacio = String(rawPruebasVacio ?? '')
        .split(',')
        .map(v => String(v || '').trim())
        .filter((_, idx, arr) => idx < 5);
      const filledPruebasVacio = Array.from({ length: 5 }).map((_, i) => parsedPruebasVacio[i] ?? '');
      setPruebasVacioValues(filledPruebasVacio);

      // Permitir que efectos de sincronización vuelvan a ejecutarse solo después de hidratar.
      queueMicrotask(() => {
        isHydratingRef.current = false;
      });
      
      // Cargar equipos para el área del registro editado
      const areaValue = editingRecord.area || editingRecord['area'];
      if (areaValue) {
        cargarEquiposPorArea(areaValue);
      }

      // Rehidratar casillas de pesos desde lo guardado (string con comas)
      const letra = String(editingRecord.letraTamanoMuestra || editingRecord.letratamano_muestra || '').trim();
      const muestras = letra ? getMuestrasRequeridas(letra) : 0;
      const drenadosArr = parsePesosToArray(editingRecord.pesosDrenados ?? editingRecord.pesos_drenados);
      const netosArr = parsePesosToArray(editingRecord.pesosNetos ?? editingRecord.pesos_netos);
      if (muestras > 0) {
        setPesosDrenadosValues(ensureLength(drenadosArr, muestras));
        setPesosNetosValues(ensureLength(netosArr, muestras));
      } else {
        setPesosDrenadosValues(drenadosArr);
        setPesosNetosValues(netosArr);
      }
    } else {
      // Si no hay registro en edición, cargar valores por defecto
      form.setValue('fechaProduccion', getFechaActual());
      form.setValue('mesCorte', getMesActual());
      pendingForm.setValue('fechaProduccion', getFechaActual());
      pendingForm.setValue('mesCorte', getMesActual());

      setResponsableCalidadSeleccionado('');
      setOtroResponsableCalidad('');

      // Reset de casillas de pesos en modo nuevo
      setPesosDrenadosValues([]);
      setPesosNetosValues([]);

      // Reset Pruebas de Vacío en modo nuevo
      setPruebasVacioValues(['', '', '', '', '']);

      setNovedadesTemperaturaModo('');
      setNovedadesTemperaturaTexto('');
      setNovedadesTemperaturaCorrecciones('');
    }
    
    // Cargar áreas disponibles
    cargarAreas();
    
    // Cargar envases disponibles
    cargarEnvases();
    
    // Cleanup para timeouts
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      if (calculoDrenadosTimeoutRef.current) {
        clearTimeout(calculoDrenadosTimeoutRef.current);
        calculoDrenadosTimeoutRef.current = null;
      }
      if (calculoNetosTimeoutRef.current) {
        clearTimeout(calculoNetosTimeoutRef.current);
        calculoNetosTimeoutRef.current = null;
      }
    };
  }, [productName, productId, editingRecord, form, pendingForm]);

  React.useEffect(() => {
    if (!isOpen) return;
    const letra = String(form.getValues('letraTamanoMuestra') || '').trim();
    const muestras = letra ? getMuestrasRequeridas(letra) : 0;
    if (!muestras) return;

    setPesosDrenadosValues(prev => ensureLength(prev.length ? prev : parsePesosToArray(form.getValues('pesosDrenados')), muestras));
    setPesosNetosValues(prev => ensureLength(prev.length ? prev : parsePesosToArray(form.getValues('pesosNetos')), muestras));
  }, [isOpen, form.watch('letraTamanoMuestra')]);

  const handlePesosKeyDown = (
    prefix: 'pesosDrenados' | 'pesosNetos',
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    length: number
  ) => {
    const input = e.target as HTMLInputElement;
    if (e.key === 'Tab' && input.value.length > 0 && index < length - 1) {
      e.preventDefault();
      const nextInput = document.getElementById(`${prefix}-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
    if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
      e.preventDefault();
      const prevInput = document.getElementById(`${prefix}-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const syncPesosDrenadosToForm = (values: string[]) => {
    const joined = values.map(v => String(v || '').trim()).filter(Boolean).join(',');
    form.setValue('pesosDrenados', joined);
  };

  const syncPesosNetosToForm = (values: string[]) => {
    const joined = values.map(v => String(v || '').trim()).filter(Boolean).join(',');
    form.setValue('pesosNetos', joined);
  };

  // Efecto adicional para actualizar fechas cuando el modal se abre
  React.useEffect(() => {
    if (isOpen && !editingRecord) {
      // Actualizar fechas con valores precisos y actuales
      form.setValue('fechaProduccion', getFechaActual());
      form.setValue('mesCorte', getMesActual());
    }
  }, [isOpen, editingRecord, form]);

  // Efecto para procesar datos adicionales después de cargar listas
  React.useEffect(() => {
    if (editingRecord && areasDisponibles.length > 0 && envasesDisponibles.length > 0) {
      
      // Asegurar que el equipo se cargue correctamente después de cargar la lista de equipos
      const equipoValue = editingRecord.equipo || editingRecord['equipo'];
      const areaValue = editingRecord.area || editingRecord['area'];
      
      if (areaValue && equipoValue) {
        // Esperar un momento para que los equipos se carguen y luego establecer el valor
        setTimeout(() => {
          form.setValue('equipo', equipoValue);
          pendingForm.setValue('equipo', equipoValue);
        }, 500);
      }
      
      // Asegurar que el envase se cargue correctamente
      const envaseRawValue = editingRecord.envase || editingRecord['envase'];
      if (envaseRawValue) {
        // El Select usa envase.id como value (único). Si el registro viejo guardó el tipo (ej. "Vidrio"), convertirlo.
        const envaseIdEncontrado = envasesDisponibles.some(e => e.id === envaseRawValue)
          ? envaseRawValue
          : (envasesDisponibles.find(e => e.tipo === envaseRawValue)?.id || '');

        if (envaseIdEncontrado) {
          form.setValue('envase', envaseIdEncontrado);
          pendingForm.setValue('envase', envaseIdEncontrado);

          // Si hay envase, recalcular vencimiento / autocompletados
          handleEnvaseChange(envaseIdEncontrado);
        } else {
        }
      } else {
      }
      
      // Asegurar que el área se cargue correctamente
      if (areaValue) {
        form.setValue('area', areaValue);
        pendingForm.setValue('area', areaValue);
      }
    }
  }, [editingRecord, areasDisponibles, envasesDisponibles, equiposDisponibles, form, pendingForm, productId]);

  // Efecto para asegurar que el campo producto siempre esté sincronizado
  React.useEffect(() => {
    if (productId) {
      form.setValue('producto', productId);
      pendingForm.setValue('producto', productId);
    }
  }, [productId, form, pendingForm]);

  // Efecto para cargar equipos cuando el área cambia en modo edición
  React.useEffect(() => {
    if (editingRecord && form.getValues('area')) {
      const areaValue = form.getValues('area');
      cargarEquiposPorArea(areaValue);
    }
  }, [isOpen, editingRecord, productName]);

  React.useEffect(() => {
    const clearQualityErrors = () => {
      form.clearErrors('brixPT');
      form.clearErrors('phPT');
      form.clearErrors('acidezPT');
      form.clearErrors('consistenciaPT');
      form.clearErrors('ppmSo2PT');
    };

    if (!isOpen || !productId) {
      setCalidadRangoActual(null);
      setMaxPruebaVacioConfig(null);
      clearQualityErrors();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const detailedProduct = await productService.getById(productId);

        const envaseParaCalidad = envaseWatch && String(envaseWatch).trim() !== '' ? envaseWatch : 'general';
        let cfg = obtenerCalidadRangoPorEnvase(detailedProduct?.calidad_rangos_config, envaseParaCalidad);

        if (
          !cfg &&
          Array.isArray(detailedProduct?.calidad_rangos_config) &&
          detailedProduct.calidad_rangos_config.length >= 1 &&
          String(envaseParaCalidad).toLowerCase() === 'general'
        ) {
          cfg = detailedProduct.calidad_rangos_config[0];
        }
        if (cancelled) return;
        setCalidadRangoActual(cfg);
        setMaxPruebaVacioConfig(parseMaxVaciosConfig(cfg?.vacios));

        if (!cfg) {
          clearQualityErrors();
        }
      } catch (error) {
        if (!cancelled) {
          setCalidadRangoActual(null);
          setMaxPruebaVacioConfig(null);
          clearQualityErrors();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, productId, envaseWatch, form]);

  React.useEffect(() => {
    if (!isOpen) return;

    const min = getMaxPruebaVacio();
    const newErrors = pruebasVacioValues.map((v) => {
      const trimmed = String(v || '').trim();
      if (!trimmed) return '';
      const num = Number(trimmed);
      if (Number.isNaN(num)) return 'Valor inválido';
      if (min !== null && num < min) return `Mínimo permitido: ${min}`;
      return '';
    });

    setPruebasVacioErrors(newErrors);
    const hasErrors = newErrors.some(Boolean);
    if (hasErrors) {
      const minLabel = min !== null ? min : 'configurado';
      form.setError('pruebasVacio', {
        type: 'validate',
        message: `Las pruebas de vacío no pueden ser menores a ${minLabel}`,
      });
    } else {
      form.clearErrors('pruebasVacio');
    }
  }, [isOpen, maxPruebaVacioConfig, pruebasVacioValues, form]);

  React.useEffect(() => {
    if (!isOpen || !calidadRangoActual) {
      form.clearErrors('brixPT');
      form.clearErrors('phPT');
      form.clearErrors('acidezPT');
      form.clearErrors('consistenciaPT');
      form.clearErrors('ppmSo2PT');
      form.clearErrors('vacioPT');
      return;
    }

    const parseNum = (v: unknown) => {
      if (typeof v !== 'string') return null;
      if (v.trim() === '') return null;
      return parseNumberValue(v);
    };

    const validate = (
      fieldName: 'brixPT' | 'phPT' | 'acidezPT' | 'consistenciaPT' | 'ppmSo2PT',
      value: unknown,
      min: number | null,
      max: number | null
    ) => {
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        form.clearErrors(fieldName);
        return;
      }
      const n = parseNum(value);
      if (n === null) {
        form.clearErrors(fieldName);
        return;
      }
      if (n < (min as number) || n > (max as number)) {
        form.setError(fieldName, {
          type: 'manual',
          message: `Fuera de rango (${min} - ${max})`,
        });
      } else {
        form.clearErrors(fieldName);
      }
    };

    validate('brixPT', brixPTWatch, calidadRangoActual.brix_min, calidadRangoActual.brix_max);
    validate('phPT', phPTWatch, calidadRangoActual.ph_min, calidadRangoActual.ph_max);
    validate('acidezPT', acidezPTWatch, calidadRangoActual.acidez_min, calidadRangoActual.acidez_max);
    validate(
      'consistenciaPT',
      consistenciaPTWatch,
      calidadRangoActual.consistencia_min,
      calidadRangoActual.consistencia_max
    );
    validate('ppmSo2PT', ppmSo2PTWatch, calidadRangoActual.ppm_so2_min, calidadRangoActual.ppm_so2_max);

    const minVacio = getMaxPruebaVacio();
    const trimmedVacio = String(vacioPTWatch || '').trim();
    if (trimmedVacio && minVacio !== null) {
      const num = Number(trimmedVacio.replace(',', '.'));
      if (!Number.isFinite(num)) {
        form.setError('vacioPT', { type: 'manual', message: 'Vacío inválido' });
      } else if (num < minVacio) {
        form.setError('vacioPT', { type: 'manual', message: `Vacío fuera de rango (mín ${minVacio})` });
      } else {
        form.clearErrors('vacioPT');
      }
    } else {
      form.clearErrors('vacioPT');
    }
  }, [
    isOpen,
    calidadRangoActual,
    vacioPTWatch,
    brixPTWatch,
    phPTWatch,
    acidezPTWatch,
    consistenciaPTWatch,
    ppmSo2PTWatch,
    form,
  ]);

  // Cleanup completo cuando el modal se cierra para evitar removeChild errors
  React.useEffect(() => {
    if (!isOpen) {
      // Limpiar todos los timeouts cuando el modal se cierra
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        setDebounceTimeout(null);
      }
      if (calculoDrenadosTimeoutRef.current) {
        clearTimeout(calculoDrenadosTimeoutRef.current);
        calculoDrenadosTimeoutRef.current = null;
      }
      if (calculoNetosTimeoutRef.current) {
        clearTimeout(calculoNetosTimeoutRef.current);
        calculoNetosTimeoutRef.current = null;
      }
      setIsProcessingEnvase(false);
    }
  }, [isOpen]);

  // Cleanup function to prevent DOM issues
  React.useEffect(() => {
    return () => {
      // Cleanup all pending timeouts and async operations
      if (debounceTimeout) clearTimeout(debounceTimeout);
      if (calculoDrenadosTimeoutRef.current) clearTimeout(calculoDrenadosTimeoutRef.current);
      if (calculoNetosTimeoutRef.current) clearTimeout(calculoNetosTimeoutRef.current);
      toastTimeouts.forEach(timeout => clearTimeout(timeout));
      setIsProcessingEnvase(false);
      setLoteValidation({ isValid: true, message: '', isChecking: false });
      limpiezaCreationPromises.current.clear(); // <-- nuevo
    };
  }, [debounceTimeout, toastTimeouts]);


  // Manejador personalizado para el cierre del modal
  const handleModalClose = (open: boolean) => {
    if (!open) {
      // Limpiar todos los timeouts
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        setDebounceTimeout(null);
      }
      if (calculoDrenadosTimeoutRef.current) {
        clearTimeout(calculoDrenadosTimeoutRef.current);
        calculoDrenadosTimeoutRef.current = null;
      }
      if (calculoNetosTimeoutRef.current) {
        clearTimeout(calculoNetosTimeoutRef.current);
        calculoNetosTimeoutRef.current = null;
      }
      toastTimeouts.forEach(timeout => clearTimeout(timeout));
      setToastTimeouts([]);
      setIsProcessingEnvase(false);
      
      // Limpiar el registro en edición cuando el modal se cierra
      if (editingRecord) {
        // Notificar al padre que limpie el estado (sin setTimeout anidados)
        if (onSuccessfulSubmit) {
          onSuccessfulSubmit({} as any); // Llamar para limpiar el estado
        }
      }
    }
    
    // Llamar al onOpenChange original
    onOpenChange(open);
  };
  const cargarAreas = () => {
    try {
      // Cargar áreas desde la configuración fija
      const areas = AreasEquiposService.getTodasAreas();
      setAreasDisponibles(areas);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las áreas disponibles",
        variant: "destructive",
      });
    }
  };

  const cargarEquiposPorArea = async (areaId: string) => {
    setIsLoadingEquipos(true);
    try {
      // Cargar equipos según el área seleccionada desde la base de datos
      const equipos = await AreasEquiposService.getEquiposPorArea(areaId);
      setEquiposDisponibles(equipos);
      
      // Limpiar el campo de equipo cuando cambia el área
      form.setValue('equipo', '');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los equipos para esta área",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEquipos(false);
    }
  };

  const handleAreaChange = async (areaId: string) => {
    await cargarEquiposPorArea(areaId);
    
    // Validar temperaturas si el área es Salsas o Conservas
    if (areaId === 'salsas' || areaId === 'conservas') {
      validarProductoTemperaturas();
    } else {
      // Limpiar validación si no es Salsas
      setTemperaturaRango(null);
      setValidacionTemperatura(null);
    }
  };

  // Validar que el producto tenga temperaturas configuradas
  const validarProductoTemperaturas = async () => {
    if (!productId) return;
    
    try {
      const configurado = await TemperaturaEnvasadoService.productoConfigurado(productId);
      
      if (!configurado) {
        toast({
          title: "Error de Temperaturas",
          description: "Este producto no tiene temperaturas de envasado configuradas. Contacte al administrador.",
          variant: "destructive",
        });
        setValidacionTemperatura({
          productoConfigurado: false,
          mensaje: "Producto sin temperaturas configuradas"
        });
      } else {
        setValidacionTemperatura({
          productoConfigurado: true,
          mensaje: "Producto con temperaturas configuradas"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo validar la configuración de temperaturas",
        variant: "destructive",
      });
    }
  };

  // Obtener rango de temperatura cuando cambia el envase
  const handleEnvaseTemperaturaChange = async (envaseTipo: string) => {
    if (!productId || !envaseTipo) return;
    
    try {
      const rango = await TemperaturaEnvasadoService.obtenerRangoTemperatura(productId, envaseTipo);
      
      if (rango) {
        setTemperaturaRango(rango);
        // Limpiar errores anteriores al cambiar de envase
        setErroresTemperatura({
          tempAM1: '',
          tempAM2: '',
          tempPM1: '',
          tempPM2: ''
        });
        toast({
          title: "Rango de Temperatura",
          description: `Rango permitido: ${rango.min}-${rango.max}°C`,
        });
      } else {
        setTemperaturaRango(null);
        // Limpiar errores si no hay rango
        setErroresTemperatura({
          tempAM1: '',
          tempAM2: '',
          tempPM1: '',
          tempPM2: ''
        });
        toast({
          title: "Error",
          description: "No se encontró configuración de temperatura para este envase",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTemperaturaRango(null);
      // Limpiar errores en caso de error
      setErroresTemperatura({
        tempAM1: '',
        tempAM2: '',
        tempPM1: '',
        tempPM2: ''
      });
    }
  };

  // Validar las 4 temperaturas en tiempo real con debounce
  const validarTemperaturasEnTiempoReal = (campo: string, valor: string) => {
    // Limpiar timeout anterior
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Nuevo timeout con debounce de 300ms
    const newTimeout = setTimeout(() => {
      // Verificar que el modal aún esté abierto antes de ejecutar
      if (!isOpen) {
        return;
      }
      
      if (!temperaturaRango) {
        setErroresTemperatura(prev => ({ ...prev, [campo]: '' }));
        return;
      }
      
      if (!valor || valor.trim() === '') {
        setErroresTemperatura(prev => ({ ...prev, [campo]: '' }));
        return;
      }
      
      const temp = parseNumberValue(valor);
      
      if (temp === null) {
        setErroresTemperatura(prev => ({ ...prev, [campo]: '' }));
        return;
      }
      
      const dentroRango = temp >= temperaturaRango.min && temp <= temperaturaRango.max;
      
      if (!dentroRango) {
        const mensajeError = `Fuera del rango (${temperaturaRango.min}-${temperaturaRango.max}°C)`;
        setErroresTemperatura(prev => ({ ...prev, [campo]: mensajeError }));
      } else {
        setErroresTemperatura(prev => ({ ...prev, [campo]: '' }));
      }
    }, 300);
    
    setDebounceTimeout(newTimeout);
  };

  // Validar todas las temperaturas
  const validarTodasLasTemperaturas = () => {
    if (!temperaturaRango) {
      return;
    }
    
    const temperaturas = {
      tempAM1: form.getValues('tempAM1'),
      tempAM2: form.getValues('tempAM2'),
      tempPM1: form.getValues('tempPM1'),
      tempPM2: form.getValues('tempPM2'),
    };
    
    // Validar cada temperatura individualmente
    Object.entries(temperaturas).forEach(([campo, valor]) => {
      validarTemperaturasEnTiempoReal(campo, valor);
    });
  };

  // Autocompletar Nº Unidades a Revisar según Letra Tamaño de Muestra
  const handleLetraTamanoMuestraChange = (letra: string) => {
    // Evitar procesar si está vacío o es la misma letra
    if (!letra || letra.length === 0) return;
    
    const letraMayuscula = letra.toUpperCase();
    const unidades = tablaUnidadesPorLetra[letraMayuscula];
    
    if (unidades) {
      // Autocompletar ambos campos de unidades
      form.setValue('totalUnidadesRevisarDrenado', unidades.toString());
      form.setValue('totalUnidadesRevisarNeto', unidades.toString());
      
      // Evitar múltiples toast seguidos
      const toastTimeout = setTimeout(() => {
        if (isOpen) {
          toast({
            title: "Autocompletado",
            description: `Se han autocompletado ${unidades} unidades para la letra "${letraMayuscula}"`,
          });
        }
      }, 100);
      setToastTimeouts(prev => [...prev, toastTimeout]);
    } else if (letra && letra.length === 1) {
      // Solo mostrar error si es una letra completa
      const errorToastTimeout = setTimeout(() => {
        if (isOpen) {
          toast({
            title: "Letra no válida",
            description: `La letra "${letraMayuscula}" no tiene un número de unidades asignado`,
            variant: "destructive",
          });
        }
      }, 100);
      setToastTimeouts(prev => [...prev, errorToastTimeout]);
    }
  };

  // Función integrada para validar temperaturas y pesos según producto y envase seleccionados (simplificada)
  const handleEnvaseChangeComplete = async (envaseSeleccionado: string) => {
    // Verificar que el modal aún esté abierto antes de procesar
    if (!isOpen) {
      return;
    }
    
    if (!productId || !envaseSeleccionado) return;
    
    // Evitar múltiples llamadas simultáneas
    const envaseActual = form.getValues('envase');
    if (envaseSeleccionado === envaseActual) {
      return;
    }
    
    try {
      // 1. Validar y cargar temperaturas
      const temperaturaRango = await TemperaturaEnvasadoService.obtenerRangoTemperatura(productId, envaseSeleccionado);
      
      if (temperaturaRango) {
        setTemperaturaRango(temperaturaRango);
        
        // Autocompletar envaseTemperatura con el mismo envase seleccionado
        form.setValue('envaseTemperatura', envaseSeleccionado);
        
        // Toast simple sin setTimeout anidados (solo si modal está abierto)
        if (isOpen) {
          toast({
            title: "Rango de temperatura cargado",
            description: `${temperaturaRango.min}°C - ${temperaturaRango.max}°C para ${envaseSeleccionado}`,
            variant: "default",
          });
        }
      } else {
        // Autocompletar envaseTemperatura aunque no haya rango, para evitar error de validación
        form.setValue('envaseTemperatura', envaseSeleccionado);
        
        // Establecer valores por defecto para temperaturas cuando no hay configuración
        form.setValue('tempAM1', 'N/A');
        form.setValue('tempAM2', 'N/A');
        form.setValue('tempPM1', 'N/A');
        form.setValue('tempPM2', 'N/A');
        
        // Toast informativo sin setTimeout anidados
        if (isOpen) {
          toast({
            title: "Sin configuración de temperatura",
            description: `No hay temperaturas configuradas para ${envaseSeleccionado}. Se usarán valores por defecto.`,
            variant: "default",
          });
        }
      }
      
      // 2. Validar y cargar pesos
      const pesosConfig = await ProductoPesosService.obtenerPesosPorProductoYEnvase(productId, envaseSeleccionado);
      
      if (pesosConfig) {
        const isEmptyOrNA = (v: any) => {
          if (v === undefined || v === null) return true;
          const s = String(v).trim();
          return s.length === 0 || s.toUpperCase() === 'N/A';
        };

        // Actualizar campos del formulario directamente con validaciones
        const currentPesoDrenadoDeclarado = form.getValues('pesoDrenadoDeclarado');
        if (isEmptyOrNA(currentPesoDrenadoDeclarado) && pesosConfig.peso_drenado_declarado !== undefined && pesosConfig.peso_drenado_declarado !== null) {
          form.setValue('pesoDrenadoDeclarado', pesosConfig.peso_drenado_declarado.toString());
        }

        const currentRangoPesoDrenadoMin = form.getValues('rangoPesoDrenadoMin');
        if (isEmptyOrNA(currentRangoPesoDrenadoMin) && pesosConfig.peso_drenado_min !== undefined && pesosConfig.peso_drenado_min !== null) {
          form.setValue('rangoPesoDrenadoMin', pesosConfig.peso_drenado_min.toString());
        }

        const currentRangoPesoDrenadoMax = form.getValues('rangoPesoDrenadoMax');
        if (isEmptyOrNA(currentRangoPesoDrenadoMax) && pesosConfig.peso_drenado_max !== undefined && pesosConfig.peso_drenado_max !== null) {
          form.setValue('rangoPesoDrenadoMax', pesosConfig.peso_drenado_max.toString());
        }

        const currentPesoNetoDeclarado = form.getValues('pesoNetoDeclarado');
        if (isEmptyOrNA(currentPesoNetoDeclarado) && pesosConfig.peso_neto_declarado !== undefined && pesosConfig.peso_neto_declarado !== null) {
          form.setValue('pesoNetoDeclarado', pesosConfig.peso_neto_declarado.toString());
        }
        
        // Toast de éxito
        toast({
          title: "Configuración completa cargada",
          description: `Temperaturas y pesos cargados para ${envaseSeleccionado}`,
          variant: "default",
        });
        
      } else {
        const isEmptyOrNA = (v: any) => {
          if (v === undefined || v === null) return true;
          const s = String(v).trim();
          return s.length === 0 || s.toUpperCase() === 'N/A';
        };

        // Establecer valores por defecto para pesos cuando no hay configuración
        // Solo si los campos están vacíos (para no borrar datos persistidos de un pendiente)
        if (isEmptyOrNA(form.getValues('pesoDrenadoDeclarado'))) form.setValue('pesoDrenadoDeclarado', 'N/A');
        if (isEmptyOrNA(form.getValues('rangoPesoDrenadoMin'))) form.setValue('rangoPesoDrenadoMin', 'N/A');
        if (isEmptyOrNA(form.getValues('rangoPesoDrenadoMax'))) form.setValue('rangoPesoDrenadoMax', 'N/A');
        if (isEmptyOrNA(form.getValues('pesoNetoDeclarado'))) form.setValue('pesoNetoDeclarado', 'N/A');

        if (isEmptyOrNA(form.getValues('pesosDrenados'))) form.setValue('pesosDrenados', 'N/A');
        if (isEmptyOrNA(form.getValues('promedioPesoDrenado'))) form.setValue('promedioPesoDrenado', 'N/A');
        if (isEmptyOrNA(form.getValues('encimaPesoDrenado'))) form.setValue('encimaPesoDrenado', '0');
        if (isEmptyOrNA(form.getValues('debajoPesoDrenado'))) form.setValue('debajoPesoDrenado', '0');
        if (isEmptyOrNA(form.getValues('undIncumplenRangoDrenado'))) form.setValue('undIncumplenRangoDrenado', '0');
        if (isEmptyOrNA(form.getValues('porcentajeIncumplenRangoDrenado'))) form.setValue('porcentajeIncumplenRangoDrenado', '0');

        if (isEmptyOrNA(form.getValues('pesosNetos'))) form.setValue('pesosNetos', 'N/A');
        if (isEmptyOrNA(form.getValues('promedioPesoNeto'))) form.setValue('promedioPesoNeto', 'N/A');
        if (isEmptyOrNA(form.getValues('encimaPesoNeto'))) form.setValue('encimaPesoNeto', '0');
        if (isEmptyOrNA(form.getValues('debajoPesoNeto'))) form.setValue('debajoPesoNeto', '0');
        if (isEmptyOrNA(form.getValues('undIncumplenRangoNeto'))) form.setValue('undIncumplenRangoNeto', '0');
        if (isEmptyOrNA(form.getValues('porcentajeIncumplenRangoNeto'))) form.setValue('porcentajeIncumplenRangoNeto', '0');
        
        // Toast informativo
        toast({
          title: "Sin configuración de pesos",
          description: `No hay pesos configurados para ${envaseSeleccionado}. Se usarán valores por defecto.`,
          variant: "default",
        });
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración del producto",
        variant: "destructive",
      });
    }
  };

  const calcularPesosDrenadosNow = () => {
    const pesosDrenados = form.getValues('pesosDrenados');
    const rangoMin = parseNumberValue(form.getValues('rangoPesoDrenadoMin'));
    const rangoMax = parseNumberValue(form.getValues('rangoPesoDrenadoMax'));

    if (!pesosDrenados || rangoMin === null || rangoMax === null) {
      form.setValue('encimaPesoDrenado', '0');
      form.setValue('debajoPesoDrenado', '0');
      form.setValue('promedioPesoDrenado', '0');
      form.setValue('undIncumplenRangoDrenado', '0');
      form.setValue('porcentajeIncumplenRangoDrenado', '0');
      return;
    }

    const pesosArray = pesosDrenados
      .split(/[\s,;]+/)
      .map((p) => parseNumberValue(String(p || '').trim()))
      .filter((p): p is number => typeof p === 'number' && Number.isFinite(p));

    if (pesosArray.length === 0) {
      form.setValue('encimaPesoDrenado', '0');
      form.setValue('debajoPesoDrenado', '0');
      form.setValue('promedioPesoDrenado', '0');
      form.setValue('undIncumplenRangoDrenado', '0');
      form.setValue('porcentajeIncumplenRangoDrenado', '0');
      return;
    }

    const pesosEncima = pesosArray.filter((p) => p > rangoMax);
    const pesosDebajo = pesosArray.filter((p) => p < rangoMin);
    const promedio = pesosArray.reduce((sum, p) => sum + p, 0) / pesosArray.length;
    const undIncumplen = pesosEncima.length + pesosDebajo.length;
    const porcentajeIncumplen = (undIncumplen / pesosArray.length) * 100;

    form.setValue('encimaPesoDrenado', pesosEncima.length.toString());
    form.setValue('debajoPesoDrenado', pesosDebajo.length.toString());
    form.setValue('promedioPesoDrenado', promedio.toFixed(2));
    form.setValue('undIncumplenRangoDrenado', undIncumplen.toString());
    form.setValue('porcentajeIncumplenRangoDrenado', porcentajeIncumplen.toFixed(2));
  };

  const calcularPesosNetosNow = () => {
    const pesosNetos = form.getValues('pesosNetos');
    const pesoNetoDeclarado = parseNumberValue(form.getValues('pesoNetoDeclarado'));

    if (!pesosNetos || pesoNetoDeclarado === null) {
      form.setValue('encimaPesoNeto', '0');
      form.setValue('debajoPesoNeto', '0');
      form.setValue('promedioPesoNeto', '0');
      form.setValue('undIncumplenRangoNeto', '0');
      form.setValue('porcentajeIncumplenRangoNeto', '0');
      return;
    }

    const pesosArray = pesosNetos
      .split(/[\s,;]+/)
      .map((p) => parseNumberValue(String(p || '').trim()))
      .filter((p): p is number => typeof p === 'number' && Number.isFinite(p));

    if (pesosArray.length === 0) {
      form.setValue('encimaPesoNeto', '0');
      form.setValue('debajoPesoNeto', '0');
      form.setValue('promedioPesoNeto', '0');
      form.setValue('undIncumplenRangoNeto', '0');
      form.setValue('porcentajeIncumplenRangoNeto', '0');
      return;
    }

    const pesosEncima = pesosArray.filter((p) => p > pesoNetoDeclarado);
    const pesosDebajo = pesosArray.filter((p) => p < pesoNetoDeclarado);
    const promedio = pesosArray.reduce((sum, p) => sum + p, 0) / pesosArray.length;
    const undIncumplen = pesosEncima.length + pesosDebajo.length;
    const porcentajeIncumplen = (undIncumplen / pesosArray.length) * 100;

    form.setValue('encimaPesoNeto', pesosEncima.length.toString());
    form.setValue('debajoPesoNeto', pesosDebajo.length.toString());
    form.setValue('promedioPesoNeto', promedio.toFixed(1));
    form.setValue('undIncumplenRangoNeto', undIncumplen.toString());
    form.setValue('porcentajeIncumplenRangoNeto', porcentajeIncumplen.toFixed(2));
  };

  const syncPruebasVacioNow = () => {
    const joined = (pruebasVacioValues || [])
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .join(',');

    form.setValue('pruebasVacio', joined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  // Calcular automáticamente pesos por encima y debajo para pesos drenados (con debounce)
  const calcularPesosDrenados = () => {
    // Limpiar timeout anterior
    if (calculoDrenadosTimeoutRef.current) {
      clearTimeout(calculoDrenadosTimeoutRef.current);
    }
    
    // Nuevo timeout con debounce de 200ms
    const newTimeout = setTimeout(() => {
      // Verificar que el modal aún esté abierto antes de ejecutar
      if (!isOpen) {
        return;
      }
      
      calcularPesosDrenadosNow();
    }, 200);
    
    calculoDrenadosTimeoutRef.current = newTimeout;
  };

  // Calcular automáticamente pesos por encima y debajo para pesos netos (con debounce)
  const calcularPesosNetos = () => {
    // Limpiar timeout anterior
    if (calculoNetosTimeoutRef.current) {
      clearTimeout(calculoNetosTimeoutRef.current);
    }
    
    // Nuevo timeout con debounce de 200ms
    const newTimeout = setTimeout(() => {
      // Verificar que el modal aún esté abierto antes de ejecutar
      if (!isOpen) {
        return;
      }
      
      calcularPesosNetosNow();
    }, 200);
    
    calculoNetosTimeoutRef.current = newTimeout;
  };

  // Manejar cambios en las casillas de pruebas de vacío
  const handlePruebasVacioChange = (index: number, value: string) => {
    const newValues = [...pruebasVacioValues];
    newValues[index] = value;
    setPruebasVacioValues(newValues);

    const joined = newValues
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .join(',');
    form.setValue('pruebasVacio', joined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    const newErrors = [...pruebasVacioErrors];
    const trimmed = String(value || '').trim();
    const min = getMaxPruebaVacio();
    if (!trimmed) {
      newErrors[index] = '';
    } else {
      const num = Number(trimmed);
      if (Number.isNaN(num)) {
        newErrors[index] = 'Valor inválido';
      } else if (min !== null && num < min) {
        newErrors[index] = `Mínimo permitido: ${min}`;
      } else {
        newErrors[index] = '';
      }
    }
 
    setPruebasVacioErrors(newErrors);

    const hasErrors = newErrors.some(Boolean);
    if (hasErrors) {
      const minLabel = min !== null ? min : 'configurado';
      form.setError('pruebasVacio', {
        type: 'manual',
        message: `Uno o más valores están por debajo del mínimo permitido (${minLabel})`,
      });
    } else {
      // Si no hay errores de rango pero tampoco hay ningún valor, mantener el requerido
      if (!joined) {
        form.setError('pruebasVacio', {
          type: 'manual',
          message: 'Campo requerido',
        });
      } else {
        form.clearErrors('pruebasVacio');
      }
    }
  };

  // Manejar el evento de tabulación y retroceso para pruebas de vacío
  const handlePruebasVacioKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    
    // Si presiona Tab y el campo está lleno, ir al siguiente
    if (e.key === 'Tab' && input.value.length > 0 && index < 4) {
      e.preventDefault();
      const nextInput = document.getElementById(`pruebasVacio-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
    
    // Si presiona Backspace y el campo está vacío, ir al anterior
    if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
      e.preventDefault();
      const prevInput = document.getElementById(`pruebasVacio-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const getPruebasVacioInputClass = (index: number) => {
    if (pruebasVacioErrors[index]) return 'border-red-500 focus:border-red-500';

    const raw = String(pruebasVacioValues[index] ?? '').trim();
    if (!raw) return '';

    const min = getMaxPruebaVacio();
    if (min === null) return '';

    const n = Number(raw.replace(',', '.'));
    if (Number.isNaN(n)) return 'border-red-500 focus:border-red-500';
    if (n < min) return 'border-red-500 focus:border-red-500';
    return 'border-green-500 focus:border-green-500';
  };

  
  // Cargar envases y áreas disponibles
  React.useEffect(() => {
    if (productId && isOpen) {
      cargarEnvases();
      cargarAreas();
    }
  }, [productId, isOpen]);

  // Cargar equipos cuando cambia el área
  React.useEffect(() => {
    const areaSeleccionada = form.getValues('area');
    if (areaSeleccionada) {
      cargarEquiposPorArea(areaSeleccionada);
    }
  }, [form.watch('area')]);

  // Validar temperaturas cuando cambia el rango (sin requestAnimationFrame para evitar conflictos)
  React.useEffect(() => {
    if (temperaturaRango) {
      // Validar temperaturas existentes cuando se carga un nuevo rango
      validarTodasLasTemperaturas();
    }
  }, [temperaturaRango]);

  // Calcular fecha de vencimiento cuando cambia el envase o la fecha de producción
  const handleEnvaseChange = (envaseSeleccionadoId: string) => {
    // Evitar múltiples procesamientos simultáneos
    if (isProcessingEnvase) {
      return;
    }
    
    setIsProcessingEnvase(true);
    
    const fechaProduccion = form.getValues('fechaProduccion');
    
    // Validación síncrona para evitar problemas de DOM
    if (!envaseSeleccionadoId || !fechaProduccion) {
      setIsProcessingEnvase(false);
      return;
    }
    
    const envase = envasesDisponibles.find(e => e.id === envaseSeleccionadoId);
    
    if (!envase) {
      setIsProcessingEnvase(false);
      return;
    }
    
    // Calcular fecha de vencimiento
    const fechaVencimiento = EnvasesService.calcularFechaVencimiento(
      fechaProduccion, 
      envase.mesesVencimiento
    );
    
    // Actualizar formulario de forma síncrona
    form.setValue('fechaVencimiento', fechaVencimiento);
    
    // Autocompletar temperaturas y pesos de forma asíncrona pero sin anidamientos
    handleEnvaseChangeComplete(envase.tipo)
      .catch(error => {
      })
      .finally(() => {
        setIsProcessingEnvase(false);
      });
  };

  const handleFechaProduccionChange = (fechaProduccion: string) => {
    const envaseSeleccionadoId = form.getValues('envase');
    
    if (envaseSeleccionadoId && fechaProduccion) {
      const envase = envasesDisponibles.find(e => e.id === envaseSeleccionadoId);
      if (envase) {
        const fechaVencimiento = EnvasesService.calcularFechaVencimiento(
          fechaProduccion, 
          envase.mesesVencimiento
        );
        form.setValue('fechaVencimiento', fechaVencimiento);
      }
    }
  };

  const cargarEnvases = () => {
    setIsLoadingEnvases(true);
    try {
      // Cargar envases desde la configuración fija
      const envases = EnvasesService.getTodosEnvases();
      setEnvasesDisponibles(envases);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los envases disponibles",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEnvases(false);
    }
  };

  // Función para verificar si un lote ya existe
  const verificarLoteExistente = async (lote: string) => {
    if (!lote || lote.length < 3) {
      setLoteValidation({
        isValid: true,
        message: '',
        isChecking: false
      });
      return;
    }

    setLoteValidation(prev => ({
      ...prev,
      isChecking: true,
      message: 'Verificando lote...'
    }));

    try {
      // Obtener todos los registros de producción
      const records = await productionRecordsService.getAll();

      // Buscar si el lote ya existe (case insensitive)
      const loteExistente = records.find((record: any) =>
        record.lote?.toLowerCase() === lote.toLowerCase()
      );

      if (loteExistente) {
        setLoteValidation({
          isValid: false,
          message: `El lote "${lote}" ya existe para el producto "${loteExistente.producto}"`,
          isChecking: false
        });
      } else {
        setLoteValidation({
          isValid: true,
          message: 'Lote disponible',
          isChecking: false
        });
      }
    } catch (error) {
      setLoteValidation({
        isValid: true,
        message: 'No se pudo verificar el lote',
        isChecking: false
      });
    }
  };

  // Función para probar la conexión a la base de datos
  async function testDatabaseConnection() {
    try {
      // Intentar obtener registros existentes para probar la conexión
      const records = await productionRecordsService.getAll();
      return true;
    } catch (error) {
      return false;
    }
  }

const createAutomaticLimpiezaRecord = async (
  values: {
    fechaProduccion: string;
    mesCorte: string;
    equipo: string;
    responsableProduccion?: string;
    lote?: string;
    producto?: string;
    productoNombre?: string;
  },
  savedRecordId: string | null,
  isCreatingProductionRecord: boolean = false // Indica si se está creando un registro de producción nuevo
) => {
  // Formatear fecha
  let fechaFormateada = values.fechaProduccion;
  if (values.fechaProduccion.includes('/')) {
    const partes = values.fechaProduccion.split('/');
    if (partes.length === 3) {
      const dia = partes[0].padStart(2, '0');
      const mes = partes[1].padStart(2, '0');
      const año = partes[2].length === 2 ? '20' + partes[2] : partes[2];
      fechaFormateada = `${año}-${mes}-${dia}`;
    }
  }

  // Clave única (si algún campo es undefined se convierte a cadena vacía)
  const key = `${fechaFormateada}-${values.lote || ''}-${values.producto || ''}-${values.equipo || ''}-${savedRecordId || ''}`;

  // Si ya hay una promesa en curso para esta clave, la retornamos sin hacer nada más
  const existingPromise = limpiezaCreationPromises.current.get(key);
  if (existingPromise) {
    console.log('⚠️ Ya existe una creación de registro de limpieza en curso para esta clave:', key);
    return existingPromise;
  }

  // Creamos una nueva promesa
  const promise = (async () => {
    try {
      // 1. Verificar si ya existe un registro de limpieza vinculado a este registro de producción
      if (savedRecordId) {
        const allLimpiezaRegistros = await limpiezaRegistrosService.getAll();
        const duplicateLimpieza = allLimpiezaRegistros.find((r) => {
          if (r.origin !== 'produccion') return false;
          // Verificar vinculación directa por ID de producción
          if (r.generated_from_production_record_id) {
            return String(r.generated_from_production_record_id) === String(savedRecordId);
          }
          return false;
        });

        if (duplicateLimpieza) {
          console.log('✅ Ya existe un registro de limpieza vinculado a este registro de producción:', duplicateLimpieza.id);
          return;
        }
      }

      // 2. Verificación adicional por lote + fecha (solo si no hay savedRecordId)
      if (!savedRecordId && values.lote) {
        const allLimpiezaRegistros = await limpiezaRegistrosService.getAll();
        const duplicateByLote = allLimpiezaRegistros.find((r) => {
          if (r.origin !== 'produccion') return false;
          const sameLote = (r.lote || '') === (values.lote || '');
          const sameDate = String(r.fecha).startsWith(fechaFormateada);
          return sameLote && sameDate;
        });

        if (duplicateByLote) {
          console.log('✅ Ya existe un registro de limpieza para este lote y fecha:', duplicateByLote.id);
          return;
        }
      }

      // 3. Obtener nombre del equipo (opcional)
      let nombreEquipo = values.equipo;
      try {
        const equipo = await AreasEquiposService.getEquipoPorId(values.equipo);
        if (equipo && equipo.nombre) nombreEquipo = equipo.nombre;
      } catch {}

      // 4. Crear el registro de limpieza
      const limpiezaRegistroPayload = {
        fecha: fechaFormateada,
        mes_corte: values.mesCorte,
        lote: values.lote || null,
        producto: values.productoNombre || values.producto || null,
        origin: 'produccion' as const,
        generated_from_production_record_id: savedRecordId,
        created_by: '(Generado automáticamente)',
      };

      const created = await limpiezaRegistrosService.create(limpiezaRegistroPayload);
      console.log('✅ Registro de limpieza creado exitosamente:', created.id);
    } catch (error) {
      console.error('❌ Error al crear registro de limpieza:', error);
    } finally {
      // Una vez terminada (éxito o error), eliminamos la promesa del mapa
      limpiezaCreationPromises.current.delete(key);
    }
  })();

  // Guardamos la promesa en el mapa
  limpiezaCreationPromises.current.set(key, promise);
  return promise;
};

  async function onSubmitAsPending() {
    // Prevenir múltiples envíos
    if (isSubmitting) {
      return;
    }

    if (editingRecord?.status === 'completed') {
      toast({
        title: 'No se puede editar',
        description: 'Este registro ya está completado y no se puede modificar.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);

    calcularPesosDrenadosNow();
    calcularPesosNetosNow();
    syncPruebasVacioNow();
    
    // Sincronizar TODOS los valores del formulario principal al formulario pendiente antes de validar
    const mainFormValues = form.getValues();
    
    // Obtener todas las claves desde los valores actuales del formulario principal.
    // Nota: productionFormSchema tiene .superRefine(), por lo que se vuelve ZodEffects y no expone .shape.
    const allFormFields = Object.keys(mainFormValues ?? {});

    // Sincronizar TODOS los campos
    allFormFields.forEach((field) => {
      const value = mainFormValues[field as keyof typeof mainFormValues];
      if (value !== undefined && value !== null && value !== '') {
        pendingForm.setValue(field as any, value);
      }
    });
    
    // Obtener valores actualizados de ambos formularios
    const pendingValues = pendingForm.getValues();
    const updatedMainFormValues = form.getValues();
    
    // Validar directamente los valores del formulario principal (que es donde el usuario ingresa los datos)
    const requiredFields: Array<keyof typeof updatedMainFormValues> = [
      'fechaProduccion',
      'mesCorte',
      'producto',
      'envase',
      'lote',
      'tamanoLote',
      'area',
      'equipo',
      'responsableProduccion',
    ];
    const missingFields = requiredFields.filter((field) => !updatedMainFormValues[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Error de validación",
        description: `Complete los campos requeridos: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    // Verificar si el lote es válido antes de continuar
    const loteToValidate = updatedMainFormValues.lote;
    if (!loteValidation.isValid && loteValidation.message) {
      toast({
        title: "Error de validación",
        description: loteValidation.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!samplingRuleValidation.isValid) {
      toast({
        title: "Error de validación",
        description: samplingRuleValidation.message || 'No existe regla de muestreo para este equipo y tamaño de lote',
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const buildSeccionBlock = (titulo: string, novRaw: unknown, corrRaw: unknown) => {
        const nov = String(novRaw || '').trim();
        const corr = String(corrRaw || '').trim();
        if (!nov && !corr) return null;
        return {
          titulo,
          nov,
          corr,
        };
      };

      const secciones = [
        buildSeccionBlock(
          'Temperatura',
          updatedMainFormValues.novedadesProcesoTemperatura,
          updatedMainFormValues.observacionesAccionesCorrectivasTemperatura
        ),
        buildSeccionBlock(
          'Pruebas de Vacío',
          updatedMainFormValues.novedadesProceso,
          updatedMainFormValues.observacionesAccionesCorrectivas
        ),
      ].filter(Boolean) as Array<{ titulo: string; nov: string; corr: string }>;

      const novedadesProcesoFinal = secciones
        .map((s) => [`[${s.titulo}]`, `Novedades: ${s.nov || '-'}`].join('\n'))
        .join('\n\n');

      const observacionesAccionesCorrectivasFinal = secciones
        .map((s) => [`[${s.titulo}]`, `Correcciones: ${s.corr || '-'}`].join('\n'))
        .join('\n\n');

      const { obs: libObs, corr: libCorr } = parseObsCorrBlock(updatedMainFormValues.liberacionInicialObs);
      const { obs: verObs, corr: verCorr } = parseObsCorrBlock(updatedMainFormValues.verificacionAleatoriaObs);

      const normalizedValues: any = {
        ...updatedMainFormValues,
        novedadesProceso: novedadesProcesoFinal,
        liberacionInicial:
          updatedMainFormValues.liberacionInicial === 'No conforme'
            ? buildNoCumplePayload('Liberación Inicial Solución Desinfectante Envases', libObs, libCorr)
            : updatedMainFormValues.liberacionInicial,
        verificacionAleatoria:
          updatedMainFormValues.verificacionAleatoria === 'No conforme'
            ? buildNoCumplePayload('Verificación Aleatoria Solución Desinfectante', verObs, verCorr)
            : updatedMainFormValues.verificacionAleatoria,
        analisisSensorial:
          updatedMainFormValues.analisisSensorial === 'No conforme'
            ? buildNoCumplePayload(
                'Análisis Sensorial (1) C - (0) NC',
                updatedMainFormValues.analisisSensorialObs,
                updatedMainFormValues.analisisSensorialCorreccion
              )
            : updatedMainFormValues.analisisSensorial,
        pruebaHermeticidad:
          updatedMainFormValues.pruebaHermeticidad === 'No conforme'
            ? buildNoCumplePayload(
                'Prueba de Hermeticidad (1) C - (0) NC',
                updatedMainFormValues.pruebaHermeticidadObs,
                updatedMainFormValues.pruebaHermeticidadCorreccion
              )
            : updatedMainFormValues.pruebaHermeticidad,
        inspeccionMicropesajeMezcla:
          updatedMainFormValues.inspeccionMicropesajeMezcla === 'No conforme'
            ? buildNoCumplePayload(
                'Inspección Micropesaje No. Mezcla',
                updatedMainFormValues.inspeccionMicropesajeMezclaObs,
                updatedMainFormValues.inspeccionMicropesajeMezclaCorreccion
              )
            : updatedMainFormValues.inspeccionMicropesajeMezcla,
        inspeccionMicropesajeResultado:
          updatedMainFormValues.inspeccionMicropesajeResultado === 'No conforme'
            ? buildNoCumplePayload(
                'Inspección Micropesaje Resultado',
                updatedMainFormValues.inspeccionMicropesajeResultadoObs,
                updatedMainFormValues.inspeccionMicropesajeResultadoCorreccion
              )
            : updatedMainFormValues.inspeccionMicropesajeResultado,
      };

      const {
        analisisSensorialObs,
        analisisSensorialCorreccion,
        pruebaHermeticidadObs,
        pruebaHermeticidadCorreccion,
        inspeccionMicropesajeMezclaObs,
        inspeccionMicropesajeMezclaCorreccion,
        inspeccionMicropesajeResultadoObs,
        inspeccionMicropesajeResultadoCorreccion,
        ...payload
      } = normalizedValues as any;

      const completeValues: any = {
        ...payload,
        producto: productId,
        productoNombre: productName,
        observacionesAccionesCorrectivas: observacionesAccionesCorrectivasFinal,
        novedadesProceso: novedadesProcesoFinal,
        status: 'pending',
      };

      // Campo auxiliar solo de UI (no existe en BD)
      delete completeValues.hasAnalisisPT;

      completeValues.observacionesPT = mergePtObservaciones(
        String(updatedMainFormValues.observacionesPT ?? ''),
        extraPtAnalyses
      );

      // Persistir auxiliares (aunque no existan en DB) para que el frontend pueda rehidratar
      // en caso de usar un backend alterno o cache intermedio.
      // (El backend actual ignora estos campos en PUT, pero se mantienen en el payload en memoria.)
      (completeValues as any).liberacionInicialObs = updatedMainFormValues.liberacionInicialObs;
      (completeValues as any).verificacionAleatoriaObs = updatedMainFormValues.verificacionAleatoriaObs;
      (completeValues as any).analisisSensorialObs = updatedMainFormValues.analisisSensorialObs;
      (completeValues as any).analisisSensorialCorreccion = updatedMainFormValues.analisisSensorialCorreccion;
      (completeValues as any).pruebaHermeticidadObs = updatedMainFormValues.pruebaHermeticidadObs;
      (completeValues as any).pruebaHermeticidadCorreccion = updatedMainFormValues.pruebaHermeticidadCorreccion;
      (completeValues as any).inspeccionMicropesajeMezclaObs = updatedMainFormValues.inspeccionMicropesajeMezclaObs;
      (completeValues as any).inspeccionMicropesajeMezclaCorreccion = updatedMainFormValues.inspeccionMicropesajeMezclaCorreccion;
      (completeValues as any).inspeccionMicropesajeResultadoObs = updatedMainFormValues.inspeccionMicropesajeResultadoObs;
      (completeValues as any).inspeccionMicropesajeResultadoCorreccion = updatedMainFormValues.inspeccionMicropesajeResultadoCorreccion;
      (completeValues as any).observacionesAnalisisPruebas = updatedMainFormValues.observacionesAnalisisPruebasTexto;
      (completeValues as any).observacionesPesoDrenado = updatedMainFormValues.observacionesPesoDrenadoTexto;
      (completeValues as any).observacionesPesoNeto = updatedMainFormValues.observacionesPesoNetoTexto;

      let savedRecord: any;
      if (editingRecord?.id) {
        savedRecord = await productionRecordsService.update(editingRecord.id, completeValues);
        // NO crear registro de limpieza automático al editar un registro existente
      } else {
        savedRecord = await productionRecordsService.create(completeValues);
        // Solo crear registro de limpieza automático al crear un registro de producción nuevo
        await createAutomaticLimpiezaRecord(
          {
            fechaProduccion: updatedMainFormValues.fechaProduccion,
            mesCorte: updatedMainFormValues.mesCorte,
            equipo: updatedMainFormValues.equipo,
            responsableProduccion: updatedMainFormValues.responsableProduccion,
            lote: updatedMainFormValues.lote,
            producto: updatedMainFormValues.producto,
            productoNombre: productName,
          },
          savedRecord?.id ?? null,
          true
        );
      }

      toast({
        title: 'Guardado como pendiente',
        description: `Registro guardado (lote: ${completeValues.lote || 'N/A'})`,
      });

      if (onSuccessfulSubmit) {
        onSuccessfulSubmit(savedRecord || completeValues);
      }

      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el registro como pendiente.';
      toast({
        title: 'Error al guardar como pendiente',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmit(values: z.infer<typeof productionFormSchema>) {
    
    // Prevenir múltiples envíos
    if (isSubmitting) {
      return;
    }

    if (editingRecord?.status === 'completed') {
      toast({
        title: 'No se puede editar',
        description: 'Este registro ya está completado y no se puede modificar.',
        variant: 'destructive',
      });
      return;
    }

    if (samplingRuleValidation.isChecking) {
      toast({
        title: 'Validando regla de muestreo',
        description: 'Espera un momento y vuelve a intentar.',
        variant: 'default',
      });
      return;
    }

    syncPruebasVacioNow();

    if (!samplingRuleValidation.isValid) {
      toast({
        title: 'Error de validación',
        description:
          samplingRuleValidation.message ||
          'No existe regla de muestreo para este equipo y tamaño de lote',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const buildSeccionBlock = (titulo: string, novRaw: unknown, corrRaw: unknown) => {
        const nov = String(novRaw || '').trim();
        const corr = String(corrRaw || '').trim();
        if (!nov && !corr) return null;
        return {
          titulo,
          nov,
          corr,
        };
      };

      const secciones = [
        buildSeccionBlock(
          'Temperatura',
          values.novedadesProcesoTemperatura,
          values.observacionesAccionesCorrectivasTemperatura
        ),
        buildSeccionBlock('Pruebas de Vacío', values.novedadesProceso, values.observacionesAccionesCorrectivas),
      ].filter(Boolean) as Array<{ titulo: string; nov: string; corr: string }>;

      const novedadesProcesoFinal = secciones
        .map((s) => [`[${s.titulo}]`, `Novedades: ${s.nov || '-'}`].join('\n'))
        .join('\n\n');

      const observacionesAccionesCorrectivasFinal = secciones
        .map((s) => [`[${s.titulo}]`, `Correcciones: ${s.corr || '-'}`].join('\n'))
        .join('\n\n');

      const { obs: libObs, corr: libCorr } = parseObsCorrBlock(values.liberacionInicialObs);
      const { obs: verObs, corr: verCorr } = parseObsCorrBlock(values.verificacionAleatoriaObs);

      const normalizedValues: any = {
        ...values,
        liberacionInicial:
          values.liberacionInicial === 'No conforme'
            ? buildNoCumplePayload('Liberación Inicial Solución Desinfectante Envases', libObs, libCorr)
            : values.liberacionInicial,
        verificacionAleatoria:
          values.verificacionAleatoria === 'No conforme'
            ? buildNoCumplePayload('Verificación Aleatoria Solución Desinfectante', verObs, verCorr)
            : values.verificacionAleatoria,
        analisisSensorial:
          values.analisisSensorial === 'No conforme'
            ? buildNoCumplePayload(
                'Análisis Sensorial (1) C - (0) NC',
                values.analisisSensorialObs,
                values.analisisSensorialCorreccion
              )
            : values.analisisSensorial,
        pruebaHermeticidad:
          values.pruebaHermeticidad === 'No conforme'
            ? buildNoCumplePayload(
                'Prueba de Hermeticidad (1) C - (0) NC',
                values.pruebaHermeticidadObs,
                values.pruebaHermeticidadCorreccion
              )
            : values.pruebaHermeticidad,
        inspeccionMicropesajeMezcla:
          values.inspeccionMicropesajeMezcla === 'No conforme'
            ? buildNoCumplePayload(
                'Inspección Micropesaje No. Mezcla',
                values.inspeccionMicropesajeMezclaObs,
                values.inspeccionMicropesajeMezclaCorreccion
              )
            : values.inspeccionMicropesajeMezcla,
        inspeccionMicropesajeResultado:
          values.inspeccionMicropesajeResultado === 'No conforme'
            ? buildNoCumplePayload(
                'Inspección Micropesaje Resultado',
                values.inspeccionMicropesajeResultadoObs,
                values.inspeccionMicropesajeResultadoCorreccion
              )
            : values.inspeccionMicropesajeResultado,
      };

      const {
        analisisSensorialObs,
        analisisSensorialCorreccion,
        pruebaHermeticidadObs,
        pruebaHermeticidadCorreccion,
        inspeccionMicropesajeMezclaObs,
        inspeccionMicropesajeMezclaCorreccion,
        inspeccionMicropesajeResultadoObs,
        inspeccionMicropesajeResultadoCorreccion,
        ...payload
      } = normalizedValues as any;

      const valuesToSave: any = {
        ...payload,
        producto: productId,
        productoNombre: productName,
        observacionesAccionesCorrectivas: observacionesAccionesCorrectivasFinal,
        novedadesProceso: novedadesProcesoFinal,
        observacionesAnalisisPruebas: values.observacionesAnalisisPruebasTexto,
        observacionesPesoDrenado: values.observacionesPesoDrenadoTexto,
        observacionesPesoNeto: values.observacionesPesoNetoTexto,
      };

      // Campo auxiliar solo de UI (no existe en BD)
      delete valuesToSave.hasAnalisisPT;

      valuesToSave.observacionesPT = mergePtObservaciones(String(values.observacionesPT ?? ''), extraPtAnalyses);
      
      // NOTA: created_by y updated_by se asignan en el backend basado en el usuario autenticado
      // Esto asegura consistencia y seguridad en la auditoría
      
      let savedRecord: any;
      if (editingRecord?.id) {
        const updatedValues = {
          ...valuesToSave,
          status: 'completed'
        };
        savedRecord = await productionRecordsService.update(editingRecord.id, updatedValues);
      } else {
        savedRecord = await productionRecordsService.create({
          ...valuesToSave,
          status: 'completed'
        });
      }

      // Mostrar confirmación específica para registros completados
      if (editingRecord?.id && savedRecord?.status === 'completed') {
        toast({
          title: 'Registro Completado Exitosamente',
          description: `El registro pendiente (lote: ${savedRecord.lote || 'N/A'}) ha sido marcado como completado.`,
        });
      } else if (savedRecord?.status === 'completed') {
        toast({
          title: 'Registro Guardado',
          description: `Registro completado guardado (lote: ${savedRecord.lote || 'N/A'})`,
        });
      }

      // Solo crear registro de limpieza automático al crear un registro de producción nuevo
      if (!editingRecord?.id) {
        await createAutomaticLimpiezaRecord(
          {
            fechaProduccion: values.fechaProduccion,
            mesCorte: values.mesCorte,
            equipo: values.equipo,
            responsableProduccion: values.responsableProduccion,
            lote: values.lote,
            producto: values.producto,
            productoNombre: productName,
          },
          savedRecord?.id ?? null,
          true
        );
      }
      
      
      // Crear automáticamente registro de embalaje
      try {
        // Convertir fecha de producción al formato YYYY-MM-DD que espera la base de datos
        let fechaFormateadaEmbalaje = values.fechaProduccion;
        if (values.fechaProduccion.includes('/')) {
          // Si está en formato DD/MM/AA, convertir a YYYY-MM-DD
          const partes = values.fechaProduccion.split('/');
          if (partes.length === 3) {
            const dia = partes[0].padStart(2, '0');
            const mes = partes[1].padStart(2, '0');
            const año = partes[2].length === 2 ? '20' + partes[2] : partes[2];
            fechaFormateadaEmbalaje = `${año}-${mes}-${dia}`;
          }
        }

        // Verificar si ya existe un registro de embalaje para esta producción
        const existingEmbalajeRecords = await embalajeRecordsService.getAll();
        const duplicateEmbalaje = existingEmbalajeRecords.find((record: any) =>
          record.fecha === fechaFormateadaEmbalaje &&
          record.lote === values.lote
        );
        
        if (duplicateEmbalaje) {
        } else {
        // Preparar datos para el modal de embalaje
        const embalajeModalData = {
          fecha: fechaFormateadaEmbalaje,
          mesCorte: values.mesCorte || '',
          producto: values.producto || '',
          lote: values.lote || '',
          tamanoLote: values.tamanoLote || '',
          responsableEmbalaje: values.responsableProduccion || '',
          observacionesGenerales: `Registro automático post-producción - Lote: ${values.lote}`
        };
        
        // Abrir modal de embalaje con datos precargados
        if (onOpenEmbalajeModal) {
          onOpenEmbalajeModal(embalajeModalData);
        } else {
        }
        }
      } catch (embalajeError) {
        toast({
          title: "Registros creados parcialmente",
          description: `Se han creado registros de producción y limpieza, pero hubo un error al crear el registro de embalaje automático.`,
          variant: "default",
        });
      }
      
      if (onSuccessfulSubmit) {
        onSuccessfulSubmit(savedRecord || (valuesToSave as any));
      }
      
      // Cerrar el modal
      onOpenChange(false);
      
    } catch (error) {
      // Mostrar toast de error con detalles
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar el registro. Intente nuevamente.";
      
      toast({
        title: "Error al guardar registro",
        description: errorMessage,
        variant: "destructive",
      });
      
    } finally {
      // Asegurar que el estado de submitting siempre se resetee
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      {isOpen && (
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {editingRecord 
              ? 'RE-CAL-084 CONSOLIDADO VERIFICACIÓN PROCESO DE PRODUCCIÓN'
              : 'RE-CAL-084 CONSOLIDADO VERIFICACIÓN PROCESO DE PRODUCCIÓN'
            }
          </DialogTitle>
          <DialogDescription asChild className="text-sm">
            <div className="space-y-1">
              <div><strong>Formato:</strong> RE-CAL-084</div>
              <div><strong>Tipo:</strong> CONSOLIDADO VERIFICACIÓN PROCESO DE PRODUCCIÓN</div>
              <div><strong>Versión:</strong> 10</div>
              <div><strong>Fecha Aprobación:</strong> 01 DE JUNIO DE 2025</div>
              <div className="pt-2 text-gray-600">
                {editingRecord 
                  ? 'Complete los campos faltantes para finalizar el registro pendiente.'
                  : 'Complete todos los campos del formulario para crear un nuevo registro.'
                }
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              onSubmit,
              (errors) => {
                const firstKey = Object.keys(errors || {})[0];

                toast({
                  title: 'Campos requeridos',
                  description:
                    firstKey === 'responsableProduccion'
                      ? `Revisa el campo: ${firstKey}`
                      : firstKey
                        ? `Revisa el campo: ${firstKey}`
                        : 'Revisa los campos marcados en rojo.',
                  variant: 'destructive',
                });
              }
            )}
          >
            <ScrollArea className="h-[50vh] sm:h-[60vh] p-2 sm:p-4">
              <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue="info-general"
              >
                <AccordionItem value="info-general">
                  <AccordionTrigger>Información General</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="fechaProduccion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha Producción (DD/MM/AA)</FormLabel>
                            <FormControl>
                              <DateInput
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleFechaProduccionChange(e.target.value || '');
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fechaVencimiento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha Vencimiento (DD/MM/AA)</FormLabel>
                            <FormControl>
                              <DateInput {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mesCorte"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mes de Corte</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="producto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Producto</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input readOnly value={productName} />
                                <input type="hidden" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="envase"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Envase</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleEnvaseChange(value);
                                }}
                                disabled={isLoadingEnvases}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={isLoadingEnvases ? "Cargando envases..." : "Seleccione envase..."} />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                  {envasesDisponibles.map((envase) => (
                                    <SelectItem key={`envase-${envase.id}-${envase.tipo}`} value={envase.id} className="py-2">
                                      <div className="flex items-center justify-between w-full">
                                        <span className="font-medium">{envase.tipo}</span>
                                        <span className="text-sm text-muted-foreground ml-2">
                                          ({envase.mesesVencimiento} meses)
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  {envasesDisponibles.length === 0 && !isLoadingEnvases && (
                                    <div className="p-2 text-center text-sm text-gray-500">
                                      No hay envases disponibles
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lote</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Verificar lote en tiempo real con debounce
                                  const value = e.target.value;
                                  if (debounceTimeout) {
                                    clearTimeout(debounceTimeout);
                                  }
                                  const newTimeout = setTimeout(() => {
                                    verificarLoteExistente(value);
                                  }, 500); // 500ms de debounce
                                  setDebounceTimeout(newTimeout);
                                }}
                                className={`
                                  ${!loteValidation.isValid && loteValidation.message ? 'border-red-500 focus:border-red-500' : ''}
                                  ${loteValidation.isValid && loteValidation.message && !loteValidation.isChecking ? 'border-green-500 focus:border-green-500' : ''}
                                `}
                              />
                            </FormControl>
                            {loteValidation.isChecking && (
                              <p className="text-sm text-blue-600 flex items-center gap-1">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                                {loteValidation.message}
                              </p>
                            )}
                            {!loteValidation.isChecking && loteValidation.message && (
                              <p className={`text-sm ${loteValidation.isValid ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                                {loteValidation.isValid ? (
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                                {loteValidation.message}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Área</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleAreaChange(value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione área..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {areasDisponibles.map((area) => (
                                    <SelectItem key={`area-${area.id}-${area.nombre}`} value={area.id}>
                                      {area.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="responsableProduccion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsable de Calidad</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Select
                                  value={responsableCalidadSeleccionado}
                                  onValueChange={(value) => {
                                    setResponsableCalidadSeleccionado(value);

                                    if (value === 'Otro') {
                                      setOtroResponsableCalidad('');
                                      field.onChange('');
                                      pendingForm.setValue('responsableProduccion', '', {
                                        shouldDirty: true,
                                        shouldTouch: true,
                                        shouldValidate: true,
                                      });
                                      return;
                                    }

                                    setOtroResponsableCalidad('');
                                    field.onChange(value);
                                    pendingForm.setValue('responsableProduccion', value, {
                                      shouldDirty: true,
                                      shouldTouch: true,
                                      shouldValidate: true,
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Lesly">Lesly</SelectItem>
                                    <SelectItem value="Deisy">Deisy</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                  </SelectContent>
                                </Select>

                                {responsableCalidadSeleccionado === 'Otro' && (
                                  <Input
                                    placeholder="Ingresa el nombre"
                                    value={otroResponsableCalidad}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setOtroResponsableCalidad(value);
                                      form.setValue('responsableProduccion', value, {
                                        shouldDirty: true,
                                        shouldTouch: true,
                                        shouldValidate: true,
                                      });
                                      pendingForm.setValue('responsableProduccion', value, {
                                        shouldDirty: true,
                                        shouldTouch: true,
                                        shouldValidate: true,
                                      });
                                    }}
                                  />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="equipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Equipo</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  validarYAutocompletarSamplingRule(value, form.getValues('tamanoLote'));
                                }}
                                disabled={isLoadingEquipos || equiposDisponibles.length === 0}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione equipo..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                  <div className="max-h-60 overflow-y-auto">
                                    {equiposDisponibles.map((equipo) => (
                                      <SelectItem key={`equipo-${equipo.id}-${equipo.nombre}`} value={equipo.id}>
                                        {equipo.nombre}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tamanoLote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tamaño del Lote (Unidades)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                inputMode="numeric"
                                onChange={(e) => {
                                  field.onChange(e);
                                  validarYAutocompletarSamplingRule(form.getValues('equipo'), e.target.value);
                                }}
                              />
                            </FormControl>
                            {samplingRuleValidation.message && (
                              <p className={`text-sm ${samplingRuleValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                                {samplingRuleValidation.isChecking ? 'Verificando...' : samplingRuleValidation.message}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="letraTamanoMuestra"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Letra Tamaño de Muestra</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                maxLength={1}  // Solo permitir una letra
                                disabled
                                placeholder=""
                                className="uppercase"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="verificaciones">
                  <AccordionTrigger>
                    Verificaciones y Temperatura
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="liberacionInicial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Liberación Inicial Solución Desinfectante Envases
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value !== 'No conforme') {
                                setLiberacionInicialNov('');
                                setLiberacionInicialCorr('');
                                form.setValue('liberacionInicialObs', '', {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                });
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione una opción" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Conforme">Conforme</SelectItem>
                              <SelectItem value="No conforme">No conforme</SelectItem>
                              <SelectItem value="No aplica">No aplica</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage /> 
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="liberacionInicialObs"
                      render={({ field }) => (
                        form.watch('liberacionInicial') === 'No conforme' ? (
                          <FormItem>
                            <FormLabel>Novedades y Correcciones - Liberación Inicial</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <div className="grid gap-2">
                                  <FormLabel>Novedades</FormLabel>
                                  <Textarea
                                    value={liberacionInicialNov}
                                    rows={4}
                                    maxLength={2000}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setLiberacionInicialNov(value);
                                    }}
                                  />
                                </div>

                                <div className="grid gap-2">
                                  <FormLabel>Correcciones</FormLabel>
                                  <Textarea
                                    value={liberacionInicialCorr}
                                    rows={4}
                                    maxLength={2000}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setLiberacionInicialCorr(value);
                                    }}
                                  />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        ) : (
                          <></>
                        )
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="verificacionAleatoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Verificación Aleatoria Solución Desinfectante
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value !== 'No conforme') {
                                setVerificacionAleatoriaNov('');
                                setVerificacionAleatoriaCorr('');
                                form.setValue('verificacionAleatoriaObs', '', {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                });
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione una opción" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Conforme">Conforme</SelectItem>
                              <SelectItem value="No conforme">No conforme</SelectItem>
                              <SelectItem value="No aplica">No aplica</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="verificacionAleatoriaObs"
                      render={({ field }) => (
                        form.watch('verificacionAleatoria') === 'No conforme' ? (
                          <FormItem>
                            <FormLabel>Novedades y Correcciones - Verificación Aleatoria</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <div className="grid gap-2">
                                  <FormLabel>Novedades</FormLabel>
                                  <Textarea
                                    value={verificacionAleatoriaNov}
                                    rows={4}
                                    maxLength={2000}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setVerificacionAleatoriaNov(value);
                                    }}
                                  />
                                </div>

                                <div className="grid gap-2">
                                  <FormLabel>Correcciones</FormLabel>
                                  <Textarea
                                    value={verificacionAleatoriaCorr}
                                    rows={4}
                                    maxLength={2000}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setVerificacionAleatoriaCorr(value);
                                    }}
                                  />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        ) : (
                          <></>
                        )
                      )}
                    />
                                        <div className="space-y-4 pt-4">
                      {/* Mostrar dropdown de envase de temperatura solo si el área es Salsas */}
                      {form.watch('area') === 'salsas' && (
                        <FormField
                          control={form.control}
                          name="envaseTemperatura"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Envase para Temperatura de Envasado</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={(value) => {
                                  field.onChange(value);
                                  handleEnvaseTemperaturaChange(value);
                                }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione envase..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Vidrio">Vidrio</SelectItem>
                                    <SelectItem value="PET">PET</SelectItem>
                                    <SelectItem value="Doypack">Doypack</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {temperaturaRango && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">
                            Rango de temperatura configurado: {temperaturaRango.min}°C - {temperaturaRango.max}°C
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Las temperaturas fuera de este rango se marcarán en rojo
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="tempAM1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>T AM 1 Envasado (°C)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  className={getTemperatureInputClass('tempAM1', field.value)}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    validarTemperaturasEnTiempoReal('tempAM1', e.target.value);
                                  }}
                                />
                              </FormControl>
                              {erroresTemperatura.tempAM1 && (
                                <p className="text-sm text-red-500 mt-1">{erroresTemperatura.tempAM1}</p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      <FormField
                        control={form.control}
                        name="tempAM2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>T AM 2 Envasado (°C)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                className={getTemperatureInputClass('tempAM2', field.value)}
                                onChange={(e) => {
                                  field.onChange(e);
                                  validarTemperaturasEnTiempoReal('tempAM2', e.target.value);
                                }}
                              />
                            </FormControl>
                            {erroresTemperatura.tempAM2 && (
                              <p className="text-sm text-red-500 mt-1">{erroresTemperatura.tempAM2}</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tempPM1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>T PM 1 Envasado (°C)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                className={getTemperatureInputClass('tempPM1', field.value)}
                                onChange={(e) => {
                                  field.onChange(e);
                                  validarTemperaturasEnTiempoReal('tempPM1', e.target.value);
                                }}
                              />
                            </FormControl>
                            {erroresTemperatura.tempPM1 && (
                              <p className="text-sm text-red-500 mt-1">{erroresTemperatura.tempPM1}</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tempPM2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>T PM 2 Envasado (°C)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                className={getTemperatureInputClass('tempPM2', field.value)}
                                onChange={(e) => {
                                  field.onChange(e);
                                  validarTemperaturasEnTiempoReal('tempPM2', e.target.value);
                                }}
                              />
                            </FormControl>
                            {erroresTemperatura.tempPM2 && (
                              <p className="text-sm text-red-500 mt-1">{erroresTemperatura.tempPM2}</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      </div>

                      <FormField
                        control={form.control}
                        name="novedadesProcesoTemperatura"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Novedades encontradas en el proceso</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Select
                                  value={novedadesTemperaturaModo}
                                  onValueChange={(v) => {
                                    const modo = (v as any) as 'si' | 'no' | '';
                                    setNovedadesTemperaturaModo(modo);

                                    if (modo !== 'si') {
                                      setNovedadesTemperaturaTexto('');
                                      setNovedadesTemperaturaCorrecciones('');
                                      field.onChange('');
                                      form.setValue('observacionesAccionesCorrectivasTemperatura', '', {
                                        shouldDirty: true,
                                        shouldTouch: true,
                                        shouldValidate: true,
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="no">No</SelectItem>
                                    <SelectItem value="si">Sí</SelectItem>
                                  </SelectContent>
                                </Select>

                                {novedadesTemperaturaModo === 'si' && (
                                  <div className="space-y-3">
                                    <div className="grid gap-2">
                                      <FormLabel>Novedades encontradas</FormLabel>
                                      <Textarea
                                        value={novedadesTemperaturaTexto}
                                        rows={5}
                                        maxLength={3000}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setNovedadesTemperaturaTexto(value);
                                          field.onChange(value);
                                        }}
                                      />
                                    </div>

                                    <div className="grid gap-2">
                                      <FormLabel>Correcciones</FormLabel>
                                      <Textarea
                                        value={novedadesTemperaturaCorrecciones}
                                        rows={5}
                                        maxLength={3000}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setNovedadesTemperaturaCorrecciones(value);
                                          form.setValue('observacionesAccionesCorrectivasTemperatura', value, {
                                            shouldDirty: true,
                                            shouldTouch: true,
                                            shouldValidate: true,
                                          });
                                        }}
                                      />
                                    </div>

                                    <div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="analisis-pruebas">
                  <AccordionTrigger>Análisis y Pruebas en Línea</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="analisisSensorial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Análisis Sensorial (1) C - (0) NC
                          </FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Conforme"> Conforme</SelectItem>
                                <SelectItem value="No conforme"> No Conforme</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          {analisisSensorialWatch === 'No conforme' && (
                            <div className="mt-2 space-y-2">
                              <FormField
                                control={form.control}
                                name="analisisSensorialObs"
                                render={({ field: obsField }) => (
                                  <FormItem>
                                    <FormLabel>Observaciones</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        {...obsField} 
                                        rows={4}
                                        maxLength={2000}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="analisisSensorialCorreccion"
                                render={({ field: corrField }) => (
                                  <FormItem>
                                    <FormLabel>Correcciones</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        {...corrField} 
                                        rows={4}
                                        maxLength={2000}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pruebaHermeticidad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Prueba de Hermeticidad (1) C - (0) NC
                          </FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Conforme"> Conforme</SelectItem>
                                <SelectItem value="No conforme"> No Conforme</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          {pruebaHermeticidadWatch === 'No conforme' && (
                            <div className="mt-2 space-y-2">
                              <FormField
                                control={form.control}
                                name="pruebaHermeticidadObs"
                                render={({ field: obsField }) => (
                                  <FormItem>
                                    <FormLabel>Observaciones</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        {...obsField} 
                                        rows={4}
                                        maxLength={2000}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="pruebaHermeticidadCorreccion"
                                render={({ field: corrField }) => (
                                  <FormItem>
                                    <FormLabel>Correcciones</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        {...corrField} 
                                        rows={4}
                                        maxLength={2000}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="inspeccionMicropesajeMezcla"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Inspección Micropesaje No. Mezcla
                          </FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Conforme">Conforme</SelectItem>
                                <SelectItem value="No conforme">No conforme </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          {inspeccionMicropesajeMezclaWatch === 'No conforme' && (
                            <div className="mt-2 space-y-2">
                              <FormField
                                control={form.control}
                                name="inspeccionMicropesajeMezclaObs"
                                render={({ field: obsField }) => (
                                  <FormItem>
                                    <FormLabel>Observaciones</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        {...obsField} 
                                        rows={4}
                                        maxLength={2000}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="inspeccionMicropesajeMezclaCorreccion"
                                render={({ field: corrField }) => (
                                  <FormItem>
                                    <FormLabel>Correcciones</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        {...corrField} 
                                        rows={4}
                                        maxLength={2000}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="inspeccionMicropesajeResultado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Inspección Micropesaje (1) C - (0) NC
                          </FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Conforme">Conforme</SelectItem>
                                <SelectItem value="No conforme">No Conforme</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          {inspeccionMicropesajeResultadoWatch === 'No conforme' && (
                            <div className="mt-2 space-y-2">
                              <FormField
                                control={form.control}
                                name="inspeccionMicropesajeResultadoObs"
                                render={({ field: obsField }) => (
                                  <FormItem>
                                    <FormLabel>Observaciones</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        {...obsField}
                                        rows={4}
                                        maxLength={2000}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="inspeccionMicropesajeResultadoCorreccion"
                                render={({ field: corrField }) => (
                                  <FormItem>
                                    <FormLabel>Correcciones</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        {...corrField}
                                        rows={4}
                                        maxLength={2000}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tieneObservacionesAnalisisPruebas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Observaciones
                          </FormLabel>
                          <FormControl>
                            <Select value={field.value || 'No'} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="No">No</SelectItem>
                                <SelectItem value="Si">Sí</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {tieneObservacionesAnalisisPruebasWatch === 'Si' && (
                      <FormField
                        control={form.control}
                        name="observacionesAnalisisPruebasTexto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Escriba las observaciones
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                placeholder="Escriba observaciones..."
                                maxLength={2000}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="control-peso-drenado">
                  <AccordionTrigger>Control de Peso Drenado</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="totalUnidadesRevisarDrenado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nº Unidades a Revisar</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pesoDrenadoDeclarado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso Drenado Declarado</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rangoPesoDrenadoMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rango Peso (Mín)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  calcularPesosDrenados();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rangoPesoDrenadoMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rango Peso (Max)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  calcularPesosDrenados();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="promedioPesoDrenado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Promedio de Peso</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="encimaPesoDrenado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pesos por Encima</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="debajoPesoDrenado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pesos por Debajo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="undIncumplenRangoDrenado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel># Und. Incumplen</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="porcentajeIncumplenRangoDrenado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>% Und. Incumplen</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="pesosDrenados"
                      render={({ field }) => {
                        const letra = form.watch('letraTamanoMuestra');
                        const muestrasRequeridas = getMuestrasRequeridas(letra);
                        const pesosCount = pesosDrenadosValues.filter(v => String(v || '').trim() !== '').length;
                        
                        return (
                          <FormItem>
                            <FormLabel>
                              Pesos Drenados
                              {letra && (
                                <span className="ml-2 text-sm text-blue-600">
                                  - Letra {letra.toUpperCase()} requiere {muestrasRequeridas} muestras
                                </span>
                              )}
                              {pesosCount > 0 && (
                                <span className={`ml-2 text-sm ${pesosCount === muestrasRequeridas ? 'text-green-600' : 'text-orange-600'}`}>
                                  ({pesosCount} ingresados)
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <div className={`grid gap-2 ${muestrasRequeridas > 12 ? 'grid-cols-4' : 'grid-cols-3'} md:grid-cols-6`}>
                                {Array.from({ length: muestrasRequeridas || 0 }).map((_, idx) => (
                                  <Input
                                    key={idx}
                                    id={`pesosDrenados-${idx}`}
                                    type="text"
                                    value={pesosDrenadosValues[idx] || ''}
                                    onChange={(e) => {
                                      const next = ensureLength(pesosDrenadosValues, muestrasRequeridas || 0);
                                      next[idx] = e.target.value;
                                      setPesosDrenadosValues(next);
                                      syncPesosDrenadosToForm(next);
                                      field.onChange(next.map(v => String(v || '').trim()).filter(Boolean).join(','));
                                      calcularPesosDrenados();
                                    }}
                                    onKeyDown={(e) => handlePesosKeyDown('pesosDrenados', idx, e, muestrasRequeridas || 0)}
                                    className="text-center"
                                    placeholder={`${idx + 1}`}
                                  />
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                            {letra && pesosCount > 0 && pesosCount !== muestrasRequeridas && (
                              <p className="text-sm text-orange-600 mt-1">
                                Se requieren {muestrasRequeridas} valores
                              </p>
                            )}
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="tieneObservacionesPesoDrenado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Observaciones
                          </FormLabel>
                          <FormControl>
                            <Select value={field.value || 'No'} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="No">No</SelectItem>
                                <SelectItem value="Si">Sí</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {tieneObservacionesPesoDrenadoWatch === 'Si' && (
                      <FormField
                        control={form.control}
                        name="observacionesPesoDrenadoTexto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Escriba las observaciones
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                placeholder="Escriba observaciones..."
                                maxLength={2000}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="control-peso-neto">
                  <AccordionTrigger>Control de Peso Neto</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="totalUnidadesRevisarNeto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nº Unidades a Revisar</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pesoNetoDeclarado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso Neto Declarado</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  calcularPesosNetos();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="promedioPesoNeto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Promedio de Peso</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="encimaPesoNeto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pesos por Encima</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="debajoPesoNeto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pesos por Debajo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="undIncumplenRangoNeto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel># Und. Incumplen</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="porcentajeIncumplenRangoNeto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>% Und. Incumplen</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="pesosNetos"
                      render={({ field }) => {
                        const letra = form.watch('letraTamanoMuestra');
                        const muestrasRequeridas = getMuestrasRequeridas(letra);
                        const pesosCount = pesosNetosValues.filter(v => String(v || '').trim() !== '').length;
                        
                        return (
                          <FormItem>
                            <FormLabel>
                              Pesos Netos
                              {letra && (
                                <span className="ml-2 text-sm text-blue-600">
                                  - Letra {letra.toUpperCase()} requiere {muestrasRequeridas} muestras
                                </span>
                              )}
                              {pesosCount > 0 && (
                                <span className={`ml-2 text-sm ${pesosCount === muestrasRequeridas ? 'text-green-600' : 'text-orange-600'}`}>
                                  ({pesosCount} ingresados)
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <div className={`grid gap-2 ${muestrasRequeridas > 12 ? 'grid-cols-4' : 'grid-cols-3'} md:grid-cols-6`}>
                                {Array.from({ length: muestrasRequeridas || 0 }).map((_, idx) => (
                                  <Input
                                    key={idx}
                                    id={`pesosNetos-${idx}`}
                                    type="text"
                                    value={pesosNetosValues[idx] || ''}
                                    onChange={(e) => {
                                      const next = ensureLength(pesosNetosValues, muestrasRequeridas || 0);
                                      next[idx] = e.target.value;
                                      setPesosNetosValues(next);
                                      syncPesosNetosToForm(next);
                                      field.onChange(next.map(v => String(v || '').trim()).filter(Boolean).join(','));
                                      calcularPesosNetos();
                                    }}
                                    onKeyDown={(e) => handlePesosKeyDown('pesosNetos', idx, e, muestrasRequeridas || 0)}
                                    className="text-center"
                                    placeholder={`${idx + 1}`}
                                  />
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="tieneObservacionesPesoNeto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Observaciones
                          </FormLabel>
                          <FormControl>
                            <Select value={field.value || 'No'} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="No">No</SelectItem>
                                <SelectItem value="Si">Sí</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {tieneObservacionesPesoNetoWatch === 'Si' && (
                      <FormField
                        control={form.control}
                        name="observacionesPesoNetoTexto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Escriba las observaciones
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                placeholder="Escriba observaciones..."
                                maxLength={2000}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="novedades">
                  <AccordionTrigger>
                    Pruebas de Vacío
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pruebasVacio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Pruebas de Vacío en proceso
                          </FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-5 gap-2">
                              {[0, 1, 2, 3, 4].map((index) => (
                                <Input
                                  key={`pruebas-vacio-${index}`}
                                  id={`pruebasVacio-${index}`}
                                  type="text"
                                  value={pruebasVacioValues[index]}
                                  onChange={(e) => handlePruebasVacioChange(index, e.target.value)}
                                  onKeyDown={(e) => handlePruebasVacioKeyDown(index, e)}
                                  className={`text-center ${getPruebasVacioInputClass(index)}`}
                                  placeholder={`${index + 1}`}
                                />
                              ))}
                            </div>
                          </FormControl>
                          {pruebasVacioErrors.some(Boolean) && (
                            <div className="mt-2 space-y-1">
                              {pruebasVacioErrors.map((err, idx) =>
                                err ? (
                                  <p key={idx} className="text-sm text-red-500">
                                    Prueba {idx + 1}: {err}
                                  </p>
                                ) : null
                              )}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="novedadesProceso"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Novedades encontradas en el proceso</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Select
                                value={novedadesProcesoModo}
                                onValueChange={(v) => {
                                  const modo = (v as any) as 'si' | 'no' | '';
                                  setNovedadesProcesoModo(modo);

                                  if (modo !== 'si') {
                                    setNovedadesProcesoTexto('');
                                    setNovedadesProcesoCorrecciones('');
                                    field.onChange('');
                                    form.setValue('observacionesAccionesCorrectivas', '', {
                                      shouldDirty: true,
                                      shouldTouch: true,
                                      shouldValidate: true,
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no">No</SelectItem>
                                  <SelectItem value="si">Sí</SelectItem>
                                </SelectContent>
                              </Select>

                              {novedadesProcesoModo === 'si' && (
                                <div className="space-y-3">
                                  <div className="grid gap-2">
                                    <FormLabel>Novedades encontradas</FormLabel>
                                    <Textarea
                                      value={novedadesProcesoTexto}
                                      rows={5}
                                      maxLength={3000}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setNovedadesProcesoTexto(value);
                                        field.onChange(value);
                                      }}
                                    />
                                  </div>

                                  <div className="grid gap-2">
                                    <FormLabel>Correcciones</FormLabel>
                                    <Textarea
                                      value={novedadesProcesoCorrecciones}
                                      rows={5}
                                      maxLength={3000}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setNovedadesProcesoCorrecciones(value);
                                        form.setValue('observacionesAccionesCorrectivas', value, {
                                          shouldDirty: true,
                                          shouldTouch: true,
                                          shouldValidate: true,
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="analisis-pt">
                  <AccordionPrimitive.Header className="flex items-center">
                    <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180">
                      Análisis de Producto Terminado (PT)
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                    </AccordionPrimitive.Trigger>
                    <div className="ml-3 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!hasAnalisisPTWatch) {
                            form.setValue('hasAnalisisPT', true, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: false,
                            });
                            pendingForm.setValue('hasAnalisisPT', true, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: false,
                            });
                          }

                          setExtraPtAnalyses((prev) => {
                            const next = [...(prev || []), emptyExtraPtAnalysis()];
                            const nextIndex = next.length + 1;
                            setPtActiveTab(`analysis-${nextIndex}`);
                            return next;
                          });
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar análisis
                      </Button>
                    </div>
                  </AccordionPrimitive.Header>
                  <AccordionContent className="space-y-4">
                    <Tabs value={ptActiveTab} onValueChange={setPtActiveTab}>
                        <TabsList className="w-full justify-start">
                          <TabsTrigger value="analysis-1">Análisis 1</TabsTrigger>
                          {extraPtAnalyses.map((_, idx) => {
                            const tabValue = `analysis-${idx + 2}`;
                            return (
                              <div key={tabValue} className="flex items-center">
                                <TabsTrigger value={tabValue}>{`Análisis ${idx + 2}`}</TabsTrigger>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    setExtraPtAnalyses((prev) => {
                                      const next = [...(prev || [])];
                                      next.splice(idx, 1);

                                      const removedTabValue = tabValue;
                                      const remainingCount = next.length;
                                      const currentActive = ptActiveTab;

                                      if (currentActive === removedTabValue) {
                                        const fallbackIndex = Math.min(idx, remainingCount - 1);
                                        const fallbackTab = fallbackIndex >= 0 ? `analysis-${fallbackIndex + 2}` : 'analysis-1';
                                        setPtActiveTab(fallbackTab);
                                      } else {
                                        // Si se eliminó un tab anterior al actual, los índices se corren
                                        const currentMatch = /^analysis-(\d+)$/.exec(currentActive);
                                        const currentN = currentMatch ? Number(currentMatch[1]) : 1;
                                        const removedN = idx + 2;
                                        if (Number.isFinite(currentN) && currentN > removedN) {
                                          setPtActiveTab(`analysis-${currentN - 1}`);
                                        }
                                      }

                                      return next;
                                    });
                                  }}
                                  aria-label={`Eliminar Análisis ${idx + 2}`}
                                  title={`Eliminar Análisis ${idx + 2}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </TabsList>

                        <TabsContent value="analysis-1">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name="fechaAnalisisPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Fecha Análisis PT</FormLabel>
                                  <FormControl>
                                    <DateInput {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="noMezclaPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>No. Mezcla PT</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="vacioPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vacío INCH/HG</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" className={getVacioPTInputClass()} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="pesoNetoRealPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Peso Neto Real</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="pesoDrenadoRealPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Peso Drenado Real</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="brixPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>°Brix</FormLabel>
                                  {calidadRangoActual && (
                                    <div className="text-xs text-muted-foreground">
                                      Rango: {calidadRangoActual.brix_min} - {calidadRangoActual.brix_max}
                                    </div>
                                  )}
                                  <FormControl>
                                    <Input type="number" {...field} className={getPtRangeInputClass('brixPT')} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="phPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>pH</FormLabel>
                                  {calidadRangoActual && (
                                    <div className="text-xs text-muted-foreground">
                                      Rango: {calidadRangoActual.ph_min} - {calidadRangoActual.ph_max}
                                    </div>
                                  )}
                                  <FormControl>
                                    <Input type="number" {...field} className={getPtRangeInputClass('phPT')} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="acidezPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Acidez</FormLabel>
                                  {calidadRangoActual && (
                                    <div className="text-xs text-muted-foreground">
                                      Rango: {calidadRangoActual.acidez_min} - {calidadRangoActual.acidez_max}
                                    </div>
                                  )}
                                  <FormControl>
                                    <Input type="number" {...field} className={getPtRangeInputClass('acidezPT')} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="ppmSo2PT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PPM-SO2</FormLabel>
                                  {calidadRangoActual && (
                                    <div className="text-xs text-muted-foreground">
                                      Rango: {calidadRangoActual.ppm_so2_min} - {calidadRangoActual.ppm_so2_max}
                                    </div>
                                  )}
                                  <FormControl>
                                    <Input type="number" {...field} className={getPtRangeInputClass('ppmSo2PT')} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="consistenciaPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Consistencia</FormLabel>
                                  {calidadRangoActual && (
                                    <div className="text-xs text-muted-foreground">
                                      Rango: {calidadRangoActual.consistencia_min} - {calidadRangoActual.consistencia_max}
                                    </div>
                                  )}
                                  <FormControl>
                                    <Input type="number" {...field} className={getPtRangeInputClass('consistenciaPT')} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="tapadoCierrePT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tapado y Cierre</FormLabel>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccione..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Conforme">Conforme</SelectItem>
                                        <SelectItem value="No conforme">No conforme</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="etiquetaPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Etiqueta</FormLabel>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccione..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Conforme">Conforme</SelectItem>
                                        <SelectItem value="No conforme">No conforme</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="ubicacionMuestraPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ubicación Muestra</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="estadoPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estado</FormLabel>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccione estado..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Rechazado">Rechazado</SelectItem>
                                        <SelectItem value="Liberado">Liberado</SelectItem>
                                        <SelectItem value="Retenido">Retenido</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="responsableAnalisisPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Responsable Análisis</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="mt-4 space-y-4">
                            <FormField
                              control={form.control}
                              name="sensorialPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sensorial (Textura, color, olor, sabor)</FormLabel>
                                  <FormControl>
                                    <div className="space-y-2">
                                      <Select
                                        value={sensorialPTModo}
                                        onValueChange={(v) => {
                                          const modo = (v as any) as 'cumple' | 'no_cumple' | '';
                                          setSensorialPTModo(modo);
                                          if (modo === 'cumple') {
                                            field.onChange('Cumple');
                                          } else if (modo === 'no_cumple') {
                                            field.onChange(buildNoCumpleText('Sensorial', sensorialPTObs, sensorialPTCorr));
                                          } else {
                                            field.onChange('');
                                          }
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Seleccione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="cumple">Cumple</SelectItem>
                                          <SelectItem value="no_cumple">No cumple</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      {sensorialPTModo === 'no_cumple' && (
                                        <div className="grid gap-2">
                                          <Textarea
                                            value={sensorialPTObs}
                                            rows={3}
                                            className="min-h-[96px]"
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              setSensorialPTObs(v);
                                              field.onChange(buildNoCumpleText('Sensorial', v, sensorialPTCorr));
                                            }}
                                            placeholder="Observaciones"
                                          />
                                          <Textarea
                                            value={sensorialPTCorr}
                                            rows={3}
                                            className="min-h-[96px]"
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              setSensorialPTCorr(v);
                                              field.onChange(buildNoCumpleText('Sensorial', sensorialPTObs, v));
                                            }}
                                            placeholder="Corrección"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="presentacionFinalPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Presentación Final</FormLabel>
                                  <FormControl>
                                    <div className="space-y-2">
                                      <Select
                                        value={presentacionFinalPTModo}
                                        onValueChange={(v) => {
                                          const modo = (v as any) as 'cumple' | 'no_cumple' | '';
                                          setPresentacionFinalPTModo(modo);
                                          if (modo === 'cumple') {
                                            field.onChange('Cumple');
                                          } else if (modo === 'no_cumple') {
                                            field.onChange(
                                              buildNoCumpleText('Presentación Final', presentacionFinalPTObs, presentacionFinalPTCorr)
                                            );
                                          } else {
                                            field.onChange('');
                                          }
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Seleccione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="cumple">Cumple</SelectItem>
                                          <SelectItem value="no_cumple">No cumple</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      {presentacionFinalPTModo === 'no_cumple' && (
                                        <div className="grid gap-2">
                                          <Textarea
                                            value={presentacionFinalPTObs}
                                            rows={3}
                                            className="min-h-[96px]"
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              setPresentacionFinalPTObs(v);
                                              field.onChange(
                                                buildNoCumpleText('Presentación Final', v, presentacionFinalPTCorr)
                                              );
                                            }}
                                            placeholder="Observaciones"
                                          />
                                          <Textarea
                                            value={presentacionFinalPTCorr}
                                            rows={3}
                                            className="min-h-[96px]"
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              setPresentacionFinalPTCorr(v);
                                              field.onChange(
                                                buildNoCumpleText('Presentación Final', presentacionFinalPTObs, v)
                                              );
                                            }}
                                            placeholder="Corrección"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="observacionesPT"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Observaciones PT</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} rows={5} maxLength={3000} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>

                        {extraPtAnalyses.map((analysis, idx) => {
                          const tabValue = `analysis-${idx + 2}`;
                          const setField = (key: keyof typeof analysis, value: string) => {
                            setExtraPtAnalyses((prev) => {
                              const next = [...prev];
                              const current = next[idx] || emptyExtraPtAnalysis();
                              next[idx] = { ...(current as any), [key]: value };
                              return next;
                            });
                          };

                          return (
                            <TabsContent key={tabValue} value={tabValue}>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <FormLabel>Fecha Análisis PT</FormLabel>
                                  <DateInput value={analysis.fechaAnalisisPT} onChange={(e) => setField('fechaAnalisisPT', (e.target as any).value)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>No. Mezcla PT</FormLabel>
                                  <Input value={analysis.noMezclaPT} onChange={(e) => setField('noMezclaPT', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Vacío INCH/HG</FormLabel>
                                  <Input type="number" value={analysis.vacioPT} onChange={(e) => setField('vacioPT', e.target.value)} className={getVacioPTInputClass(analysis.vacioPT)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Peso Neto Real</FormLabel>
                                  <Input value={analysis.pesoNetoRealPT} onChange={(e) => setField('pesoNetoRealPT', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Peso Drenado Real</FormLabel>
                                  <Input value={analysis.pesoDrenadoRealPT} onChange={(e) => setField('pesoDrenadoRealPT', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>°Brix</FormLabel>
                                  {calidadRangoActual && <div className="text-xs text-muted-foreground">Rango: {calidadRangoActual.brix_min} - {calidadRangoActual.brix_max}</div>}
                                  <Input type="number" value={analysis.brixPT} onChange={(e) => setField('brixPT', e.target.value)} className={getPtRangeInputClass('brixPT', analysis.brixPT)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>pH</FormLabel>
                                  {calidadRangoActual && <div className="text-xs text-muted-foreground">Rango: {calidadRangoActual.ph_min} - {calidadRangoActual.ph_max}</div>}
                                  <Input type="number" value={analysis.phPT} onChange={(e) => setField('phPT', e.target.value)} className={getPtRangeInputClass('phPT', analysis.phPT)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Acidez</FormLabel>
                                  {calidadRangoActual && <div className="text-xs text-muted-foreground">Rango: {calidadRangoActual.acidez_min} - {calidadRangoActual.acidez_max}</div>}
                                  <Input type="number" value={analysis.acidezPT} onChange={(e) => setField('acidezPT', e.target.value)} className={getPtRangeInputClass('acidezPT', analysis.acidezPT)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>PPM-SO2</FormLabel>
                                  {calidadRangoActual && <div className="text-xs text-muted-foreground">Rango: {calidadRangoActual.ppm_so2_min} - {calidadRangoActual.ppm_so2_max}</div>}
                                  <Input type="number" value={analysis.ppmSo2PT} onChange={(e) => setField('ppmSo2PT', e.target.value)} className={getPtRangeInputClass('ppmSo2PT', analysis.ppmSo2PT)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Consistencia</FormLabel>
                                  {calidadRangoActual && <div className="text-xs text-muted-foreground">Rango: {calidadRangoActual.consistencia_min} - {calidadRangoActual.consistencia_max}</div>}
                                  <Input type="number" value={analysis.consistenciaPT} onChange={(e) => setField('consistenciaPT', e.target.value)} className={getPtRangeInputClass('consistenciaPT', analysis.consistenciaPT)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Tapado y Cierre</FormLabel>
                                  <Select value={analysis.tapadoCierrePT} onValueChange={(v) => setField('tapadoCierrePT', v)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Conforme">Conforme</SelectItem>
                                      <SelectItem value="No conforme">No conforme</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Etiqueta</FormLabel>
                                  <Select value={analysis.etiquetaPT} onValueChange={(v) => setField('etiquetaPT', v)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Conforme">Conforme</SelectItem>
                                      <SelectItem value="No conforme">No conforme</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Ubicación Muestra</FormLabel>
                                  <Input value={analysis.ubicacionMuestraPT} onChange={(e) => setField('ubicacionMuestraPT', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Estado</FormLabel>
                                  <Select value={analysis.estadoPT} onValueChange={(v) => setField('estadoPT', v)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione estado..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Rechazado">Rechazado</SelectItem>
                                      <SelectItem value="Liberado">Liberado</SelectItem>
                                      <SelectItem value="Retenido">Retenido</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Responsable Análisis</FormLabel>
                                  <Input value={analysis.responsableAnalisisPT} onChange={(e) => setField('responsableAnalisisPT', e.target.value)} />
                                </div>
                              </div>

                              <div className="mt-4 space-y-4">
                                <div className="space-y-2">
                                  <FormLabel>Sensorial (Textura, color, olor, sabor)</FormLabel>
                                  <Select value={analysis.sensorialPT} onValueChange={(v) => setField('sensorialPT', v)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Cumple">Cumple</SelectItem>
                                      <SelectItem value="No cumple">No cumple</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Presentación Final</FormLabel>
                                  <Select value={analysis.presentacionFinalPT} onValueChange={(v) => setField('presentacionFinalPT', v)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Cumple">Cumple</SelectItem>
                                      <SelectItem value="No cumple">No cumple</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <FormLabel>Observaciones PT</FormLabel>
                                  <Textarea value={analysis.observacionesPT} rows={5} maxLength={3000} onChange={(e) => setField('observacionesPT', e.target.value)} />
                                </div>
                              </div>
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollArea>
            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleModalClose(false)}
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
          
              {(() => {
                const pendingDisabledReason = isSubmitting
                  ? 'Se está guardando el registro.'
                  : editingRecord?.status === 'completed'
                    ? 'Este registro ya está completado y no se puede modificar.'
                    : samplingRuleValidation.isChecking
                      ? 'Se está validando la regla de muestreo.'
                      : !samplingRuleValidation.isValid
                        ? (samplingRuleValidation.message || 'Regla de muestreo inválida.')
                        : '';

                const isPendingDisabled = Boolean(pendingDisabledReason);

                const submitDisabledReason = isSubmitting
                  ? 'Se está guardando el registro.'
                  : editingRecord?.status === 'completed'
                    ? 'Este registro ya está completado y no se puede modificar.'
                    : samplingRuleValidation.isChecking
                      ? 'Se está validando la regla de muestreo.'
                      : '';

                const isSubmitDisabled = Boolean(submitDisabledReason);

                return (
                  <>
                    <div
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (!isPendingDisabled) return;
                        toast({
                          title: 'No se puede guardar como pendiente',
                          description: pendingDisabledReason,
                          variant: 'destructive',
                        });
                      }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 w-full sm:w-auto"
                        onClick={onSubmitAsPending}
                        disabled={isPendingDisabled}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Guardando...</span>
                            <span className="sm:hidden">Guardando...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Guardar como Pendiente</span>
                            <span className="sm:hidden">Pendiente</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <div
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (!isSubmitDisabled) return;
                        toast({
                          title: 'No se puede guardar',
                          description: submitDisabledReason,
                          variant: 'destructive',
                        });
                      }}
                    >
                      <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={isSubmitDisabled}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Guardando...
                          </>
                        ) : (
                          <>{editingRecord ? 'Completar Registro' : 'Guardar Registro'}</>
                        )}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      )}
    </Dialog>
  );
}