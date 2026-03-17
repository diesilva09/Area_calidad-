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
  fecha: z.string().min(1, 'Campo requerido'),
  medioCultivo: z.string().min(1, 'Campo requerido'),
  cantidadMl: z.string().min(1, 'Campo requerido'),
  cantidadMedioCultivoG: z.string().min(1, 'Campo requerido'),
  controlNegativoInicio: z.string().min(1, 'Campo requerido'),
  controlNegativoFinal: z.string().min(1, 'Campo requerido'),
  controlNegativoCumple: z.string().min(1, 'Campo requerido'),
  controlNegativoNoCumple: z.string().min(1, 'Campo requerido'),
  accionCorrectiva: z.string().min(1, 'Campo requerido'),
  observaciones: z.string().optional(),
  responsable: z.string().min(1, 'Campo requerido'),
});

type MediosCultivoFormValues = z.infer<typeof mediosCultivoSchema>;

interface AddMediosCultivoModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: MediosCultivoFormValues) => void;
}

export function AddMediosCultivoModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
}: AddMediosCultivoModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      await mediosCultivoService.create(transformedValues);
      console.log('✅ Registro de medios de cultivo guardado exitosamente');
      
      toast({
        title: "Registro guardado",
        description: "El registro de medios de cultivo ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values);
      onOpenChange(false);
      form.reset();
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900">
            RE-CAL-022 REGISTRO DE PREPARACIÓN DE MEDIOS DE CULTIVO Y CONTROL NEGATIVO
          </DialogTitle>
          <DialogDescription className="text-gray-600">
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
