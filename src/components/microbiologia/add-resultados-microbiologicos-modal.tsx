'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Microscope } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { resultadosMicrobiologicosService, ResultadosMicrobiologicos } from '@/lib/resultados-microbiologicos-service';

// Esquema de validación para el formulario
const resultadosMicrobiologicosSchema = z.object({
  fecha: z.string().optional(),
  mesMuestreo: z.string().optional(),
  horaMuestreo: z.string().optional(),
  internoExterno: z.string().optional(),
  tipo: z.string().optional(),
  area: z.string().optional(),
  muestra: z.string().optional(),
  // Nuevos campos para especificar el tipo de muestra (reemplazan lote)
  tipoMuestra: z.string().optional(),
  valorMuestra: z.string().optional(),
  fechaProduccion: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  mesofilos: z.string().optional(),
  coliformesTotales: z.string().optional(),
  coliformesFecales: z.string().optional(),
  eColi: z.string().optional(),
  mohos: z.string().optional(),
  levaduras: z.string().optional(),
  staphylococcusAureus: z.string().optional(),
  bacillusCereus: z.string().optional(),
  listeria: z.string().optional(),
  salmonella: z.string().optional(),
  enterobacterias: z.string().optional(),
  clostridium: z.string().optional(),
  esterilidadComercial: z.string().optional(),
  anaerobias: z.string().optional(),
  observaciones: z.string().optional(),
  parametrosReferencia: z.string().optional(),
  cumple: z.boolean().optional(),
  noCumple: z.boolean().optional(),
  codigo: z.string().optional(),
  medioDiluyente: z.string().optional(),
  factorDilucion: z.string().optional(),
  responsable: z.string().optional(),
});

type ResultadosMicrobiologicosFormValues = z.infer<typeof resultadosMicrobiologicosSchema>;

interface AddResultadosMicrobiologicosModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: ResultadosMicrobiologicosFormValues, estado: 'pendiente' | 'completado') => void;
  editingRecord?: any | null;
  onEditingRecordChange?: (record: any | null) => void;
}

export function AddResultadosMicrobiologicosModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
  editingRecord,
  onEditingRecordChange,
}: AddResultadosMicrobiologicosModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [cronogramaTaskId, setCronogramaTaskId] = React.useState<number | null>(null);
  const isViewOnly = Boolean(editingRecord?.cronograma_task_id);

  const toDateInput = (value: any, fallback: string) => {
    if (!value) return fallback;
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
    // Si ya viene como yyyy-MM-dd lo dejamos; si viene otro string, retornamos tal cual
    return String(value);
  };

  const emptyValues: ResultadosMicrobiologicosFormValues = {
    fecha: '',
    mesMuestreo: '',
    horaMuestreo: '',
    internoExterno: '',
    tipo: '',
    area: '',
    muestra: '',
    tipoMuestra: '',
    valorMuestra: '',
    fechaProduccion: '',
    fechaVencimiento: '',
    mesofilos: '',
    coliformesTotales: '',
    coliformesFecales: '',
    eColi: '',
    mohos: '',
    levaduras: '',
    staphylococcusAureus: '',
    bacillusCereus: '',
    listeria: '',
    salmonella: '',
    enterobacterias: '',
    clostridium: '',
    esterilidadComercial: '',
    anaerobias: '',
    observaciones: '',
    parametrosReferencia: '',
    cumple: false,
    noCumple: false,
    codigo: '',
    medioDiluyente: '',
    factorDilucion: '',
    responsable: '',
  };

  const form = useForm<ResultadosMicrobiologicosFormValues>({
    resolver: zodResolver(resultadosMicrobiologicosSchema),
    defaultValues: {
      fecha: format(new Date(), 'yyyy-MM-dd'),
      mesMuestreo: '',
      horaMuestreo: '',
      internoExterno: '',
      tipo: '',
      area: '',
      muestra: '',
      tipoMuestra: '',
      valorMuestra: '',
      fechaProduccion: '',
      fechaVencimiento: '',
      mesofilos: '',
      coliformesTotales: '',
      coliformesFecales: '',
      eColi: '',
      mohos: '',
      levaduras: '',
      staphylococcusAureus: '',
      bacillusCereus: '',
      listeria: '',
      salmonella: '',
      enterobacterias: '',
      clostridium: '',
      esterilidadComercial: '',
      anaerobias: '',
      observaciones: '',
      parametrosReferencia: '',
      cumple: false,
      noCumple: false,
      codigo: '',
      medioDiluyente: '',
      factorDilucion: '',
      responsable: '',
    },
  });

  // Watch para mostrar/ocultar campo de valor según el tipo de muestra seleccionado
  const tipoMuestra = form.watch('tipoMuestra');

  // Función para limpiar el tipo de muestra de valores duplicados o corruptos
  const limpiarTipoMuestra = (tipo: string): string => {
    if (!tipo) return '';

    // Lista de tipos válidos
    const tiposValidos = ['nombre', 'linea', 'producto', 'lote', 'envase', 'otro'];

    // Si el tipo ya es válido, retornarlo
    if (tiposValidos.includes(tipo)) return tipo;

    // Buscar si contiene una subcadena que coincida con un tipo válido
    for (const tipoValido of tiposValidos) {
      if (tipo.toLowerCase().includes(tipoValido)) {
        return tipoValido;
      }
    }

    // Si no se encuentra coincidencia, retornar el valor original
    return tipo;
  };

  // Función para limpiar el área de valores duplicados o corruptos
  const limpiarArea = (area: string): string => {
    if (!area) return '';

    // Lista de áreas válidas
    const areasValidas = [
      'Conservas', 'Salsas', 'Preparación Conservas', 'Preparación Salsas',
      'Embalaje', 'Frutos Secos', 'Micropesaje', 'BD MP (Bodega Materia Prima)',
      'BD PT (Bodega Producto Terminado)', 'Personal de Aseo', 'Mantenimiento (MTTO)',
      'Laboratorio Procesos', 'Laboratorio MP', 'Vestier Masculino 1',
      'Vestier Masculino 2', 'Vestier Femenino 1', 'Vestier Femenino 2',
      'Esclusa Ingreso Área de Preparación', 'Estación de Lavado de Manos Preparación de Salsas',
      'Estación de Lavado de Manos Envasado de Salsas', 'Esclusa Ingreso Área de Producción',
      'Envases (general)', 'Dispensadores', 'Secador Vestier Masculino 1',
      'Secador Vestier Masculino 2', 'Secador Vestier Femenino 1', 'Secador Vestier Femenino 2',
      'Otro'
    ];

    // Si el área ya es válida, retornarla
    if (areasValidas.includes(area)) return area;

    // Buscar si contiene una subcadena que coincida con un área válida
    for (const areaValida of areasValidas) {
      if (area.includes(areaValida)) {
        return areaValida;
      }
    }

    // Si no se encuentra coincidencia, retornar el valor original
    return area;
  };

  // Vigilar el valor del tipo de muestra y limpiarlo automáticamente si es corrupto
  const tipoMuestraActual = form.watch('tipoMuestra');
  const tipoMuestraProcesadaRef = React.useRef<string>('');

  React.useEffect(() => {
    if (tipoMuestraActual && tipoMuestraActual !== tipoMuestraProcesadaRef.current) {
      const tipoLimpio = limpiarTipoMuestra(tipoMuestraActual);
      tipoMuestraProcesadaRef.current = tipoLimpio;
      if (tipoLimpio !== tipoMuestraActual) {
        console.log('🔍 DEBUG: Auto-limpieza de tipoMuestra:', tipoMuestraActual, '->', tipoLimpio);
        // Pequeño delay para evitar conflictos con el renderizado
        setTimeout(() => {
          form.setValue('tipoMuestra', tipoLimpio, { shouldValidate: false, shouldDirty: true });
        }, 0);
      }
    }
  }, [tipoMuestraActual, form]);

  // Vigilar el valor del área y limpiarlo automáticamente si es corrupto
  const areaActual = form.watch('area');
  const areaProcesadaRef = React.useRef<string>('');

  React.useEffect(() => {
    if (areaActual && areaActual !== areaProcesadaRef.current) {
      const areaLimpia = limpiarArea(areaActual);
      areaProcesadaRef.current = areaLimpia;
      if (areaLimpia !== areaActual) {
        console.log('🔍 DEBUG: Auto-limpieza de área:', areaActual, '->', areaLimpia);
        // Pequeño delay para evitar conflictos con el renderizado
        setTimeout(() => {
          form.setValue('area', areaLimpia, { shouldValidate: false, shouldDirty: true });
        }, 0);
      }
    }
  }, [areaActual, form]);

  React.useEffect(() => {
    if (!isOpen) return;

    // Si hay editingRecord (modo edición o vista)
    if (editingRecord) {
      setCronogramaTaskId(editingRecord.cronograma_task_id || null);
      // Limpiar área y tipo de muestra para corregir valores corruptos
      const areaLimpia = limpiarArea(editingRecord.area ?? '');
      const tipoMuestraLimpio = limpiarTipoMuestra(editingRecord.tipo_muestra ?? '');
      form.reset({
        fecha: editingRecord.fecha ? toDateInput(editingRecord.fecha, '') : '',
        mesMuestreo: editingRecord.mes_muestreo ?? '',
        horaMuestreo: editingRecord.hora_muestreo ?? '',
        internoExterno: editingRecord.interno_externo ?? '',
        tipo: editingRecord.tipo ?? '',
        area: areaLimpia,
        muestra: editingRecord.muestra ?? '',
        tipoMuestra: tipoMuestraLimpio,
        valorMuestra: editingRecord.valor_muestra ?? '',
        fechaProduccion: toDateInput(editingRecord.fecha_produccion, ''),
        fechaVencimiento: toDateInput(editingRecord.fecha_vencimiento, ''),
        mesofilos: editingRecord.mesofilos ?? '',
        coliformesTotales: editingRecord.coliformes_totales ?? '',
        coliformesFecales: editingRecord.coliformes_fecales ?? '',
        eColi: editingRecord.e_coli ?? '',
        mohos: editingRecord.mohos ?? '',
        levaduras: editingRecord.levaduras ?? '',
        staphylococcusAureus: editingRecord.staphylococcus_aureus ?? '',
        bacillusCereus: editingRecord.bacillus_cereus ?? '',
        listeria: editingRecord.listeria ?? '',
        salmonella: editingRecord.salmonella ?? '',
        enterobacterias: editingRecord.enterobacterias ?? '',
        clostridium: editingRecord.clostridium ?? '',
        esterilidadComercial: editingRecord.esterilidad_comercial ?? '',
        anaerobias: editingRecord.anaerobias ?? '',
        observaciones: editingRecord.observaciones ?? '',
        parametrosReferencia: editingRecord.parametros_referencia ?? '',
        cumple: Boolean(editingRecord.cumple),
        noCumple: Boolean(editingRecord.no_cumple),
        codigo: editingRecord.codigo ?? '',
        medioDiluyente: editingRecord.medio_diluyente ?? '',
        factorDilucion: editingRecord.factor_dilucion ?? '',
        responsable: editingRecord.responsable ?? '',
      });
      return;
    }

    // Resetear si no hay editingRecord
    setCronogramaTaskId(null);
    form.reset({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      mesMuestreo: '',
      horaMuestreo: '',
      internoExterno: '',
      tipo: '',
      area: '',
      muestra: '',
      tipoMuestra: '',
      valorMuestra: '',
      fechaProduccion: '',
      fechaVencimiento: '',
      mesofilos: '',
      coliformesTotales: '',
      coliformesFecales: '',
      eColi: '',
      mohos: '',
      levaduras: '',
      staphylococcusAureus: '',
      bacillusCereus: '',
      listeria: '',
      salmonella: '',
      enterobacterias: '',
      clostridium: '',
      esterilidadComercial: '',
      anaerobias: '',
      observaciones: '',
      parametrosReferencia: '',
      cumple: false,
      noCumple: false,
      codigo: '',
      medioDiluyente: '',
      factorDilucion: '',
      responsable: '',
    });
  }, [editingRecord, form, isOpen]);

  async function handleSave(values: ResultadosMicrobiologicosFormValues, estado: 'pendiente' | 'completado') {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values, 'Estado:', estado);
      
      // Transformar los datos para la API
      const transformedValues = {
        fecha: values.fecha || '',
        mes_muestreo: values.mesMuestreo || '',
        hora_muestreo: values.horaMuestreo || '',
        interno_externo: values.internoExterno || '',
        tipo: values.tipo || '',
        area: values.area || '',
        muestra: values.muestra || '',
        // Nuevos campos para especificar el tipo de muestra
        tipo_muestra: values.tipoMuestra || '',
        valor_muestra: values.valorMuestra || '',
        // Si el tipo es 'lote', usar el valor_muestra como lote también
        lote: values.tipoMuestra === 'lote' ? values.valorMuestra || '' : '',
        fecha_produccion: values.fechaProduccion || '',
        fecha_vencimiento: values.fechaVencimiento || '',
        mesofilos: values.mesofilos || undefined,
        coliformes_totales: values.coliformesTotales || undefined,
        coliformes_fecales: values.coliformesFecales || undefined,
        e_coli: values.eColi || undefined,
        mohos: values.mohos || undefined,
        levaduras: values.levaduras || undefined,
        staphylococcus_aureus: values.staphylococcusAureus || undefined,
        bacillus_cereus: values.bacillusCereus || undefined,
        listeria: values.listeria || undefined,
        salmonella: values.salmonella || undefined,
        enterobacterias: values.enterobacterias || undefined,
        clostridium: values.clostridium || undefined,
        esterilidad_comercial: values.esterilidadComercial || undefined,
        anaerobias: values.anaerobias || undefined,
        observaciones: values.observaciones || undefined,
        parametros_referencia: values.parametrosReferencia || undefined,
        cumple: values.cumple || false,
        no_cumple: values.noCumple || false,
        codigo: values.codigo || '',
        medio_diluyente: values.medioDiluyente || undefined,
        factor_dilucion: values.factorDilucion || undefined,
        responsable: values.responsable || '',
        estado: estado,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      if (editingRecord?.id) {
        await resultadosMicrobiologicosService.update(editingRecord.id, transformedValues);
      } else {
        // Incluir cronograma_task_id si existe, sino undefined
        const createValues: Omit<ResultadosMicrobiologicos, 'id' | 'created_at' | 'updated_at'> = {
          ...transformedValues,
          cronograma_task_id: cronogramaTaskId ?? undefined,
        };
        console.log('📋 Creando registro con values:', createValues);
        console.log('🔗 cronograma_task_id:', cronogramaTaskId);
        await resultadosMicrobiologicosService.create(createValues);
      }
      console.log('✅ Registro de resultados microbiológicos guardado exitosamente');
      
      toast({
        title: estado === 'pendiente' ? "Registro guardado como pendiente" : "Registro completado",
        description: estado === 'pendiente' 
          ? "El registro ha sido guardado como pendiente. Puedes completarlo más tarde."
          : "El registro de resultados microbiológicos ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values, estado);
      onOpenChange(false);
      form.reset(emptyValues);
      onEditingRecordChange?.(null);
    } catch (error) {
      console.error('❌ Error al guardar registro de resultados microbiológicos:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de resultados microbiológicos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          form.reset(emptyValues);
          onEditingRecordChange?.(null);
        } else if (!editingRecord) {
          form.reset(emptyValues);
        }
      }}
    >
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex-shrink-0">
              <Microscope className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">RE-CAL-046</span>
                <span className="text-[10px] text-gray-400">v.2 · 03/05/2021</span>
                {isViewOnly && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">SOLO LECTURA</span>
                )}
              </div>
              <DialogTitle className="text-base font-semibold text-gray-900 leading-snug">
                Resultados Microbiológicos
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6">
            
            {/* Sección 1: Información General */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* FECHA */}
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FECHA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* MES DE MUESTREO */}
                <FormField
                  control={form.control}
                  name="mesMuestreo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MES DE MUESTREO</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* HORA DE REALIZACIÓN MUESTREO */}
                <FormField
                  control={form.control}
                  name="horaMuestreo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HORA DE REALIZACIÓN MUESTREO</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="time"
                          placeholder="HH:MM"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* INTERNO O EXTERNO */}
                <FormField
                  control={form.control}
                  name="internoExterno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>INTERNO O EXTERNO</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="INTERNO">INTERNO</option>
                          <option value="EXTERNO">EXTERNO</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TIPO */}
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TIPO</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ÁREA */}
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ÁREA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* MUESTRA */}
                <FormField
                  control={form.control}
                  name="muestra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MUESTRA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TIPO DE MUESTRA */}
                <FormField
                  control={form.control}
                  name="tipoMuestra"
                  render={({ field }) => {
                    // Limpiar el valor del tipo de muestra antes de usarlo
                    const tipoValue = limpiarTipoMuestra(field.value || '');
                    
                    // DEBUG
                    console.log('🔍 RENDER tipoMuestra - field.value:', field.value, '| tipoValue:', tipoValue);
                    
                    // Forzar limpieza si el valor es corrupto
                    if (field.value && field.value !== tipoValue && tipoValue !== '') {
                      console.log('🧹 FORZANDO LIMPIEZA de tipoMuestra:', field.value, '->', tipoValue);
                      setTimeout(() => {
                        field.onChange(tipoValue);
                      }, 0);
                    }
                    
                    // Opciones para navegación con teclado
                    const options = ['nombre', 'linea', 'producto', 'lote', 'envase', 'otro'];

                    const handleKeyDown = (e: React.KeyboardEvent) => {
                      const currentIndex = options.indexOf(tipoValue || '');

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
                        field.onChange(options[nextIndex]);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
                        field.onChange(options[prevIndex]);
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel>TIPO DE MUESTRA</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={tipoValue}
                        >
                          <FormControl>
                            <SelectTrigger onKeyDown={handleKeyDown}>
                              <SelectValue placeholder="Seleccionar tipo">
                                {tipoValue && (
                                  tipoValue === 'nombre' ? 'Nombre' :
                                  tipoValue === 'linea' ? 'Línea' :
                                  tipoValue === 'producto' ? 'Producto' :
                                  tipoValue === 'lote' ? 'Lote' :
                                  tipoValue === 'envase' ? 'Envase' :
                                  tipoValue === 'otro' ? 'Otro' : tipoValue
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nombre">Nombre</SelectItem>
                            <SelectItem value="linea">Línea</SelectItem>
                            <SelectItem value="producto">Producto</SelectItem>
                            <SelectItem value="lote">Lote</SelectItem>
                            <SelectItem value="envase">Envase</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* VALOR DE MUESTRA - Solo aparece si se seleccionó un tipo */}
                {form.watch('tipoMuestra') && (
                  <FormField
                    control={form.control}
                    name="valorMuestra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          VALOR {form.watch('tipoMuestra')?.toUpperCase()}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ''}
                            placeholder={`Ingrese ${form.watch('tipoMuestra')}...`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* FECHA DE PRODUCCIÓN */}
                <FormField
                  control={form.control}
                  name="fechaProduccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FECHA DE PRODUCCIÓN</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* FECHA DE VENCIMIENTO */}
                <FormField
                  control={form.control}
                  name="fechaVencimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FECHA DE VENCIMIENTO</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CÓDIGO */}
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CÓDIGO</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* RESPONSABLE */}
                <FormField
                  control={form.control}
                  name="responsable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RESPONSABLE</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 2: Análisis Microbiológicos (UFC) */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Análisis Microbiológicos (UFC)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* MESÓFILOS */}
                <FormField
                  control={form.control}
                  name="mesofilos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MESÓFILOS (UFC)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* COLIFORMES TOTALES */}
                <FormField
                  control={form.control}
                  name="coliformesTotales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>COLIFORMES TOTALES (UFC)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* COLIFORMES FECALES */}
                <FormField
                  control={form.control}
                  name="coliformesFecales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>COLIFORMES FECALES (UFC)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* E. COLI */}
                <FormField
                  control={form.control}
                  name="eColi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E. COLI (UFC)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* MOHOS */}
                <FormField
                  control={form.control}
                  name="mohos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MOHOS (UFC)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* LEVADURAS */}
                <FormField
                  control={form.control}
                  name="levaduras"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LEVADURAS (UFC)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* STAPHYLOCOCCUS AUREUS */}
                <FormField
                  control={form.control}
                  name="staphylococcusAureus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>STAPHYLOCOCCUS AUREUS (UFC)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* BACILLUS CEREUS */}
                <FormField
                  control={form.control}
                  name="bacillusCereus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BACILLUS CEREUS (UFC)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ENTEROBACTERIAS */}
                <FormField
                  control={form.control}
                  name="enterobacterias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ENTEROBACTERIAS UFC</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CLOSTRIDIUM SULFITO REDUCTOR */}
                <FormField
                  control={form.control}
                  name="clostridium"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CLOSTRIDIUM SULFITO REDUCTOR - RECUENTO DE ESPORAS (UFC)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ANAEROBIAS SULFITO REDUCTORAS */}
                <FormField
                  control={form.control}
                  name="anaerobias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ANAEROBIAS SULFITO REDUCTORAS (UFC)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 3: Análisis de Presencia/Ausencia */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-semibold mb-4 text-green-800">Análisis de Presencia/Ausencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* LISTERIA */}
                <FormField
                  control={form.control}
                  name="listeria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LISTERIA (AUSENTE/PRESENTE)</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="AUSENTE">AUSENTE</option>
                          <option value="PRESENTE">PRESENTE</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SALMONELLA */}
                <FormField
                  control={form.control}
                  name="salmonella"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SALMONELLA (AUSENTE/PRESENTE)</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="AUSENTE">AUSENTE</option>
                          <option value="PRESENTE">PRESENTE</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ESTERILIDAD COMERCIAL */}
                <FormField
                  control={form.control}
                  name="esterilidadComercial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ESTERILIDAD COMERCIAL (CUMPLE/NO CUMPLE)</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="CUMPLE">CUMPLE</option>
                          <option value="NO CUMPLE">NO CUMPLE</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 4: Dilución y Parámetros */}
            <div className="border rounded-lg p-4 bg-orange-50">
              <h3 className="text-lg font-semibold mb-4 text-orange-800">Dilución y Parámetros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* MEDIO DILUYENTE */}
                <FormField
                  control={form.control}
                  name="medioDiluyente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MEDIO DILUYENTE</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* FACTOR DILUCIÓN */}
                <FormField
                  control={form.control}
                  name="factorDilucion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FACTOR DILUCIÓN</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PARÁMETROS DE REFERENCIA */}
                <FormField
                  control={form.control}
                  name="parametrosReferencia"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 lg:col-span-3">
                      <FormLabel>PARÁMETROS DE REFERENCIA</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder=""
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 5: Evaluación de Cumplimiento */}
            <div className="border rounded-lg p-4 bg-purple-50">
              <h3 className="text-lg font-semibold mb-4 text-purple-800">Evaluación de Cumplimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* CUMPLE */}
                <FormField
                  control={form.control}
                  name="cumple"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">CUMPLE</FormLabel>
                        <FormDescription className="text-xs">
                          Marcar si el análisis cumple con los estándares
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* NO CUMPLE */}
                <FormField
                  control={form.control}
                  name="noCumple"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">NO CUMPLE</FormLabel>
                        <FormDescription className="text-xs">
                          Marcar si el análisis no cumple con los estándares
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 6: Observaciones */}
            <div className="border rounded-lg p-4 bg-red-50">
              <h3 className="text-lg font-semibold mb-4 text-red-800">Observaciones</h3>
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OBSERVACIONES</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Notas adicionales sobre los resultados microbiológicos..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {isViewOnly ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!isViewOnly && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={form.handleSubmit((values) => handleSave(values, 'pendiente'))}
                    className="border-orange-400 text-orange-700 hover:bg-orange-50"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar como Pendiente'}
                  </Button>
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={form.handleSubmit((values) => handleSave(values, 'completado'))}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar Completado'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
