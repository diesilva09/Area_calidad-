'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { useToast } from '@/hooks/use-toast';
import { resultadosMicrobiologicosService } from '@/lib/resultados-microbiologicos-service';

// Esquema de validación para el formulario
const resultadosMicrobiologicosSchema = z.object({
  fecha: z.string().optional(),
  mesMuestreo: z.string().optional(),
  horaMuestreo: z.string().optional(),
  internoExterno: z.string().optional(),
  tipo: z.string().optional(),
  area: z.string().optional(),
  muestra: z.string().optional(),
  lote: z.string().optional(),
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
  onSuccessfulSubmit?: (values: ResultadosMicrobiologicosFormValues) => void;
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
    lote: '',
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
      lote: '',
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

  React.useEffect(() => {
    if (!isOpen) return;
    if (!editingRecord) return;

    form.reset({
      fecha: toDateInput(editingRecord.fecha, format(new Date(), 'yyyy-MM-dd')),
      mesMuestreo: editingRecord.mes_muestreo ?? '',
      horaMuestreo: editingRecord.hora_muestreo ?? '',
      internoExterno: editingRecord.interno_externo ?? '',
      tipo: editingRecord.tipo ?? '',
      area: editingRecord.area ?? '',
      muestra: editingRecord.muestra ?? '',
      lote: editingRecord.lote ?? '',
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
  }, [editingRecord, form, isOpen]);

  async function onSubmit(values: ResultadosMicrobiologicosFormValues) {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values);
      
      // Transformar los datos para la API
      const transformedValues = {
        fecha: values.fecha,
        mes_muestreo: values.mesMuestreo,
        hora_muestreo: values.horaMuestreo,
        interno_externo: values.internoExterno,
        tipo: values.tipo,
        area: values.area,
        muestra: values.muestra,
        lote: values.lote,
        fecha_produccion: values.fechaProduccion,
        fecha_vencimiento: values.fechaVencimiento,
        mesofilos: values.mesofilos || null,
        coliformes_totales: values.coliformesTotales || null,
        coliformes_fecales: values.coliformesFecales || null,
        e_coli: values.eColi || null,
        mohos: values.mohos || null,
        levaduras: values.levaduras || null,
        staphylococcus_aureus: values.staphylococcusAureus || null,
        bacillus_cereus: values.bacillusCereus || null,
        listeria: values.listeria || null,
        salmonella: values.salmonella || null,
        enterobacterias: values.enterobacterias || null,
        clostridium: values.clostridium || null,
        esterilidad_comercial: values.esterilidadComercial || null,
        anaerobias: values.anaerobias || null,
        observaciones: values.observaciones || undefined,
        parametros_referencia: values.parametrosReferencia || undefined,
        cumple: values.cumple || false,
        no_cumple: values.noCumple || false,
        codigo: values.codigo,
        medio_diluyente: values.medioDiluyente || undefined,
        factor_dilucion: values.factorDilucion || undefined,
        responsable: values.responsable,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      if (editingRecord?.id) {
        await resultadosMicrobiologicosService.update(editingRecord.id, transformedValues);
      } else {
        await resultadosMicrobiologicosService.create(transformedValues);
      }
      console.log('✅ Registro de resultados microbiológicos guardado exitosamente');
      
      toast({
        title: "Registro guardado",
        description: "El registro de resultados microbiológicos ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values);
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
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900">
            RE-CAL-046 RESULTADOS MICROBIOLÓGICOS
          </DialogTitle>
          <DialogDescription asChild className="text-gray-600">
            <div className="mt-2 space-y-1">
              <p><strong>Código:</strong> RE-CAL-046</p>
              <p><strong>Versión:</strong> 2</p>
              <p><strong>Fecha de Aprobación:</strong> 03 de mayo de 2021</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
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
                          placeholder="Ej: Enero, Febrero, Marzo"
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
                          placeholder="Ej: Agua, Alimento, Superficie"
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
                          placeholder="Ej: Producción, Empaque, Bodega"
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
                          placeholder="Ej: M-001, AGUA-001"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* LOTE */}
                <FormField
                  control={form.control}
                  name="lote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LOTE</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: L-12345"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          placeholder="Ej: RM-001, RM-002"
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
                          placeholder="Nombre completo del responsable"
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
                          placeholder="Ej: <10, 25, 1000"
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
                          placeholder="Ej: <3, 10, 100"
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
                          placeholder="Ej: <3, 5, 50"
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
                          placeholder="Ej: <3, 0, 10"
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
                          placeholder="Ej: <50, 100, 500"
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
                          placeholder="Ej: <50, 80, 300"
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
                          placeholder="Ej: <10, 5, 100"
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
                          placeholder="Ej: <100, 50, 1000"
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
                          placeholder="Ej: <100, 200, 5000"
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
                          placeholder="Ej: <10, 5, 100"
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
                          placeholder="Ej: <10, 20, 200"
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
                          placeholder="Ej: Agua peptonada, PBS"
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
                          placeholder="Ej: 1:10, 1:100, 1:1000"
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
                          placeholder="Especificar los parámetros de referencia utilizados..."
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

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
