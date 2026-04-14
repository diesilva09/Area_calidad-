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
import { mediosCultivoService } from '@/lib/medios-cultivo-service';

// Esquema de validación para el formulario
const mediosCultivoSchema = z.object({
  fecha: z.string().optional(),
  medioCultivo: z.string().optional(),
  cantidadMl: z.string().optional(),
  cantidadMedioCultivoG: z.string().optional(),
  controlNegativoInicio: z.string().optional(),
  controlNegativoFinal: z.string().optional(),
  controlNegativoCumple: z.string().optional(),
  controlNegativoNoCumple: z.string().optional(),
  accionCorrectiva: z.string().optional(),
  observaciones: z.string().optional(),
  responsable: z.string().optional(),
});

type MediosCultivoFormValues = z.infer<typeof mediosCultivoSchema>;

interface AddMediosCultivoModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: MediosCultivoFormValues) => void;
  editingRecord?: any | null;
  onEditingRecordChange?: (record: any | null) => void;
}

export function AddMediosCultivoModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
  editingRecord,
  onEditingRecordChange,
}: AddMediosCultivoModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const toDateInput = (value: any, fallback: string) => {
    if (!value) return fallback;
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
    return String(value);
  };

  const emptyValues: MediosCultivoFormValues = {
    fecha: '',
    medioCultivo: '',
    cantidadMl: '',
    cantidadMedioCultivoG: '',
    controlNegativoInicio: '',
    controlNegativoFinal: '',
    controlNegativoCumple: '',
    controlNegativoNoCumple: '',
    accionCorrectiva: '',
    observaciones: '',
    responsable: '',
  };

  const form = useForm<MediosCultivoFormValues>({
    resolver: zodResolver(mediosCultivoSchema),
    defaultValues: {
      fecha: format(new Date(), 'yyyy-MM-dd'),
      medioCultivo: '',
      cantidadMl: '',
      cantidadMedioCultivoG: '',
      controlNegativoInicio: '',
      controlNegativoFinal: '',
      controlNegativoCumple: '',
      controlNegativoNoCumple: '',
      accionCorrectiva: '',
      observaciones: '',
      responsable: '',
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    if (!editingRecord) return;

    form.reset({
      fecha: toDateInput(editingRecord.fecha, format(new Date(), 'yyyy-MM-dd')),
      medioCultivo: editingRecord.medio_cultivo ?? '',
      cantidadMl: editingRecord.cantidad_ml ?? '',
      cantidadMedioCultivoG: editingRecord.cantidad_medio_cultivo_g ?? '',
      controlNegativoInicio: editingRecord.control_negativo_inicio ?? '',
      controlNegativoFinal: editingRecord.control_negativo_final ?? '',
      controlNegativoCumple: editingRecord.control_negativo_cumple ?? '',
      controlNegativoNoCumple: editingRecord.control_negativo_no_cumple ?? '',
      accionCorrectiva: editingRecord.accion_correctiva ?? '',
      observaciones: editingRecord.observaciones ?? '',
      responsable: editingRecord.responsable ?? '',
    });
  }, [editingRecord, form, isOpen]);

  async function onSubmit(values: MediosCultivoFormValues) {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values);
      
      // Transformar los datos para la API
      const transformedValues = {
        fecha: values.fecha,
        medio_cultivo: values.medioCultivo,
        cantidad_ml: values.cantidadMl,
        cantidad_medio_cultivo_g: values.cantidadMedioCultivoG,
        control_negativo_inicio: values.controlNegativoInicio,
        control_negativo_final: values.controlNegativoFinal,
        control_negativo_cumple: values.controlNegativoCumple,
        control_negativo_no_cumple: values.controlNegativoNoCumple,
        accion_correctiva: values.accionCorrectiva,
        observaciones: values.observaciones || undefined,
        responsable: values.responsable,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      if (editingRecord?.id) {
        await mediosCultivoService.update(editingRecord.id, transformedValues);
      } else {
        await mediosCultivoService.create(transformedValues);
      }
      console.log('✅ Registro de medios de cultivo guardado exitosamente');
      
      toast({
        title: "Registro guardado",
        description: "El registro de medios de cultivo ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values);
      onOpenChange(false);
      form.reset(emptyValues);
      onEditingRecordChange?.(null);
    } catch (error) {
      console.error('❌ Error al guardar registro de medios de cultivo:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de medios de cultivo.",
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900">
            RE-CAL-022 REGISTRO DE PREPARACIÓN DE MEDIOS DE CULTIVO Y CONTROL NEGATIVO
          </DialogTitle>
          <DialogDescription asChild className="text-gray-600">
            <div className="mt-2 space-y-1">
              <p><strong>Código:</strong> RE-CAL-022</p>
              <p><strong>Versión:</strong> 2</p>
              <p><strong>Fecha de Aprobación:</strong> FEBRERO 28 DE 2020</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              {/* MEDIO DE CULTIVO */}
              <FormField
                control={form.control}
                name="medioCultivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MEDIO DE CULTIVO</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: TSA, McConkey, SSA"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CANTIDAD AD ML */}
              <FormField
                control={form.control}
                name="cantidadMl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CANTIDAD AD ML</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: 500"
                        type="number"
                        step="0.1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CANTIDAD MEDIO DE CULTIVO G */}
              <FormField
                control={form.control}
                name="cantidadMedioCultivoG"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CANTIDAD MEDIO DE CULTIVO G</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: 25"
                        type="number"
                        step="0.1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CONTROL NEGATIVO - INICIO */}
              <FormField
                control={form.control}
                name="controlNegativoInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CONTROL NEGATIVO - INICIO</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: E. coli ATCC 25922"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CONTROL NEGATIVO - FINAL */}
              <FormField
                control={form.control}
                name="controlNegativoFinal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CONTROL NEGATIVO - FINAL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: E. coli ATCC 25922"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CONTROL NEGATIVO - CUMPLE */}
              <FormField
                control={form.control}
                name="controlNegativoCumple"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CONTROL NEGATIVO - CUMPLE</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: Sí / No"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CONTROL NEGATIVO - NO CUMPLE */}
              <FormField
                control={form.control}
                name="controlNegativoNoCumple"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CONTROL NEGATIVO - NO CUMPLE</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: Sí / No"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ACCIÓN CORRECTIVA */}
              <FormField
                control={form.control}
                name="accionCorrectiva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ACCIÓN CORRECTIVA</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Describir acción correctiva"
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

              {/* OBSERVACIONES */}
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>OBSERVACIONES</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Notas adicionales..."
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
