'use client';

import React from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { custodiaMuestrasService } from '@/lib/custodia-muestras-service';

// Esquema de validación para el formulario
const custodiaMuestrasSchema = z.object({
  codigo: z.string().min(1, 'Campo requerido'),
  tipo: z.string().min(1, 'Campo requerido'),
  muestraId: z.string().min(1, 'Campo requerido'),
  area: z.string().min(1, 'Campo requerido'),
  temperatura: z.string().min(1, 'Campo requerido'),
  cantidad: z.string().min(1, 'Campo requerido'),
  motivo: z.string().min(1, 'Campo requerido'),
  tipoAnalisisSL: z.string().optional(),
  tipoAnalisisBC: z.string().optional(),
  tipoAnalisisYM: z.string().optional(),
  tipoAnalisisTC: z.string().optional(),
  tipoAnalisisEC: z.string().optional(),
  tipoAnalisisLS: z.string().optional(),
  tipoAnalisisETB: z.string().optional(),
  tipoAnalisisXSA: z.string().optional(),
  tomaMuestraFecha: z.string().min(1, 'Campo requerido'),
  tomaMuestraHora: z.string().min(1, 'Campo requerido'),
  recepcionLabFecha: z.string().min(1, 'Campo requerido'),
  recepcionLabHora: z.string().min(1, 'Campo requerido'),
  medioTransporte: z.string().min(1, 'Campo requerido'),
  responsable: z.string().min(1, 'Campo requerido'),
  observaciones: z.string().optional(),
});

type CustodiaMuestrasFormValues = z.infer<typeof custodiaMuestrasSchema>;

interface AddCustodiaMuestrasModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: CustodiaMuestrasFormValues) => void;
}

export function AddCustodiaMuestrasModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
}: AddCustodiaMuestrasModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CustodiaMuestrasFormValues>({
    resolver: zodResolver(custodiaMuestrasSchema),
    defaultValues: {
      codigo: '',
      tipo: '',
      muestraId: '',
      area: '',
      temperatura: '',
      cantidad: '',
      motivo: '',
      tipoAnalisisSL: '',
      tipoAnalisisBC: '',
      tipoAnalisisYM: '',
      tipoAnalisisTC: '',
      tipoAnalisisEC: '',
      tipoAnalisisLS: '',
      tipoAnalisisETB: '',
      tipoAnalisisXSA: '',
      tomaMuestraFecha: format(new Date(), 'yyyy-MM-dd'),
      tomaMuestraHora: '',
      recepcionLabFecha: format(new Date(), 'yyyy-MM-dd'),
      recepcionLabHora: '',
      medioTransporte: '',
      responsable: '',
      observaciones: '',
    },
  });

  // Función para obtener la hora actual
  const getCurrentTime = () => {
    return format(new Date(), 'HH:mm');
  };

  async function onSubmit(values: CustodiaMuestrasFormValues) {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values);
      
      // Transformar los datos para la API
      const transformedValues = {
        codigo: values.codigo,
        tipo: values.tipo,
        muestra_id: values.muestraId,
        area: values.area,
        temperatura: values.temperatura,
        cantidad: values.cantidad,
        motivo: values.motivo,
        tipo_analisis_sl: values.tipoAnalisisSL || null,
        tipo_analisis_bc: values.tipoAnalisisBC || null,
        tipo_analisis_ym: values.tipoAnalisisYM || null,
        tipo_analisis_tc: values.tipoAnalisisTC || null,
        tipo_analisis_ec: values.tipoAnalisisEC || null,
        tipo_analisis_ls: values.tipoAnalisisLS || null,
        tipo_analisis_etb: values.tipoAnalisisETB || null,
        tipo_analisis_xsa: values.tipoAnalisisXSA || null,
        toma_muestra_fecha: values.tomaMuestraFecha,
        toma_muestra_hora: values.tomaMuestraHora,
        recepcion_lab_fecha: values.recepcionLabFecha,
        recepcion_lab_hora: values.recepcionLabHora,
        medio_transporte: values.medioTransporte,
        responsable: values.responsable,
        observaciones: values.observaciones || undefined,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      await custodiaMuestrasService.create(transformedValues);
      console.log('✅ Registro de custodia de muestras guardado exitosamente');
      
      toast({
        title: "Registro guardado",
        description: "El registro de custodia de muestras ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('❌ Error al guardar registro de custodia de muestras:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de custodia de muestras.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900">
            RE-CAL-107 REGISTRO Y CADENA DE CUSTODIA DE MUESTRAS ANÁLISIS INTERNO
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            <div className="mt-2 space-y-1">
              <p><strong>Código:</strong> RE-CAL-107</p>
              <p><strong>Versión:</strong> 2</p>
              <p><strong>Fecha de Aprobación:</strong> Marzo 10 de 2022</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Sección 1: Información General */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
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
                          placeholder="Ej: M-001, M-002"
                        />
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

            {/* Sección 2: Datos de Muestra */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Datos de Muestra</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* ID DE MUESTRA */}
                <FormField
                  control={form.control}
                  name="muestraId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID DE MUESTRA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: M001-2024"
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

                {/* TEMPERATURA */}
                <FormField
                  control={form.control}
                  name="temperatura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TEMPERATURA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: 4°C, 25°C"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CANTIDAD */}
                <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CANTIDAD</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: 100 ml, 500 g"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 3: Propósitos y Análisis Solicitados */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-semibold mb-4 text-green-800">Propósitos y Análisis Solicitados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* MOTIVO */}
                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 lg:col-span-3">
                      <FormLabel>MOTIVO</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Describir el motivo del análisis"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TIPO DE ANÁLISIS - CHECKBOXES */}
                <div className="md:col-span-2 lg:col-span-3">
                  <FormLabel className="text-base font-medium">TIPO DE ANÁLISIS</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-2">
                    
                    <FormField
                      control={form.control}
                      name="tipoAnalisisSL"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'SL'}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? 'SL' : '')
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">SL</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisBC"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'BC'}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? 'BC' : '')
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">BC</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisYM"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'YM'}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? 'YM' : '')
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">YM</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisTC"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'TC'}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? 'TC' : '')
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">TC</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisEC"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'EC'}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? 'EC' : '')
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">EC</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisLS"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'LS'}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? 'LS' : '')
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">LS</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisETB"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'ETB'}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? 'ETB' : '')
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">ETB</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoAnalisisXSA"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={field.value === 'XSA'}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? 'XSA' : '')
                              }
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">XSA</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4: Cadena de Custodia */}
            <div className="border rounded-lg p-4 bg-orange-50">
              <h3 className="text-lg font-semibold mb-4 text-orange-800">Cadena de Custodia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* TOMA DE MUESTRA - FECHA */}
                <FormField
                  control={form.control}
                  name="tomaMuestraFecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TOMA DE MUESTRA - FECHA</FormLabel>
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

                {/* TOMA DE MUESTRA - HORA */}
                <FormField
                  control={form.control}
                  name="tomaMuestraHora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TOMA DE MUESTRA - HORA</FormLabel>
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

                {/* RECEPCIÓN LABORATORIO - FECHA */}
                <FormField
                  control={form.control}
                  name="recepcionLabFecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RECEPCIÓN LABORATORIO - FECHA</FormLabel>
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

                {/* RECEPCIÓN LABORATORIO - HORA */}
                <FormField
                  control={form.control}
                  name="recepcionLabHora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RECEPCIÓN LABORATORIO - HORA</FormLabel>
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

                {/* MEDIO DE TRANSPORTE */}
                <FormField
                  control={form.control}
                  name="medioTransporte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MEDIO DE TRANSPORTE</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: Bolsa térmica, Hielo, Nevera portátil"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 5: Observaciones */}
            <div className="border rounded-lg p-4 bg-purple-50">
              <h3 className="text-lg font-semibold mb-4 text-purple-800">Observaciones</h3>
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OBSERVACIONES</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Notas adicionales sobre la muestra y su custodia..."
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
                className="bg-blue-600 hover:bg-blue-700"
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
