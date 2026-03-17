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
import { esterilizacionAutoclaveService } from '@/lib/esterilizacion-autoclave-service';

// Esquema de validación para el formulario
const esterilizacionAutoclaveSchema = z.object({
  fecha: z.string().min(1, 'Campo requerido'),
  elementosMediosCultivo: z.string().min(1, 'Campo requerido'),
  inicioCicloHora: z.string().min(1, 'Campo requerido'),
  inicioProcesoHora: z.string().min(1, 'Campo requerido'),
  inicioProcesoTC: z.string().min(1, 'Campo requerido'),
  inicioProcesoPresion: z.string().min(1, 'Campo requerido'),
  finProcesoHora: z.string().min(1, 'Campo requerido'),
  finProcesoTC: z.string().min(1, 'Campo requerido'),
  finProcesoPresion: z.string().min(1, 'Campo requerido'),
  finCicloHora: z.string().min(1, 'Campo requerido'),
  cintaIndicadora: z.string().min(1, 'Campo requerido'),
  realizadoPor: z.string().min(1, 'Campo requerido'),
  observaciones: z.string().optional(),
});

type EsterilizacionAutoclaveFormValues = z.infer<typeof esterilizacionAutoclaveSchema>;

interface AddEsterilizacionAutoclaveModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: EsterilizacionAutoclaveFormValues) => void;
}

export function AddEsterilizacionAutoclaveModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
}: AddEsterilizacionAutoclaveModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EsterilizacionAutoclaveFormValues>({
    resolver: zodResolver(esterilizacionAutoclaveSchema),
    defaultValues: {
      fecha: format(new Date(), 'yyyy-MM-dd'),
      elementosMediosCultivo: '',
      inicioCicloHora: '',
      inicioProcesoHora: '',
      inicioProcesoTC: '',
      inicioProcesoPresion: '',
      finProcesoHora: '',
      finProcesoTC: '',
      finProcesoPresion: '',
      finCicloHora: '',
      cintaIndicadora: '',
      realizadoPor: '',
      observaciones: '',
    },
  });

  // Función para obtener la hora actual
  const getCurrentTime = () => {
    return format(new Date(), 'HH:mm');
  };

  // Función para detectar automáticamente el período del día
  const getPeriodoDelDia = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'MAÑANA';
    if (hour >= 14 && hour < 22) return 'TARDE';
    return 'NOCHE';
  };

  // Auto-completar hora de inicio del ciclo
  const handleInicioCicloChange = (value: string) => {
    if (!value) {
      form.setValue('inicioCicloHora', getCurrentTime());
    }
  };

  async function onSubmit(values: EsterilizacionAutoclaveFormValues) {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values);
      
      // Transformar los datos para la API
      const transformedValues = {
        fecha: values.fecha,
        elementos_medios_cultivo: values.elementosMediosCultivo,
        inicio_ciclo_hora: values.inicioCicloHora,
        inicio_proceso_hora: values.inicioProcesoHora,
        inicio_proceso_tc: values.inicioProcesoTC,
        inicio_proceso_presion: values.inicioProcesoPresion,
        fin_proceso_hora: values.finProcesoHora,
        fin_proceso_tc: values.finProcesoTC,
        fin_proceso_presion: values.finProcesoPresion,
        fin_ciclo_hora: values.finCicloHora,
        cinta_indicadora: values.cintaIndicadora,
        realizado_por: values.realizadoPor,
        observaciones: values.observaciones || undefined,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      await esterilizacionAutoclaveService.create(transformedValues);
      console.log('✅ Registro de esterilización en autoclave guardado exitosamente');
      
      toast({
        title: "Registro guardado",
        description: "El registro de esterilización en autoclave ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('❌ Error al guardar registro de esterilización en autoclave:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de esterilización en autoclave.",
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
            RE-CAL-017 REGISTRO DE PROCESO DE ESTERILIZACIÓN EN AUTOCLAVE MICROBIOLOGÍA
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            <div className="mt-2 space-y-1">
              <p><strong>Código:</strong> RE-CAL-017</p>
              <p><strong>Versión:</strong> 2</p>
              <p><strong>Fecha de Aprobación:</strong> 03 de mayo de 2021</p>
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

              {/* ELEMENTOS O MEDIOS DE CULTIVO */}
              <FormField
                control={form.control}
                name="elementosMediosCultivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ELEMENTOS O MEDIOS DE CULTIVO</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: Medios TSA, Material de laboratorio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* INICIO DEL CICLO - HORA */}
              <FormField
                control={form.control}
                name="inicioCicloHora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>INICIO DEL CICLO - HORA</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="time"
                        placeholder="HH:MM"
                        onChange={(e) => {
                          field.onChange(e);
                          handleInicioCicloChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* INICIO PROCESO DE ESTERILIZACIÓN - HORA */}
              <FormField
                control={form.control}
                name="inicioProcesoHora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>INICIO PROCESO DE ESTERILIZACIÓN - HORA</FormLabel>
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

              {/* INICIO PROCESO DE ESTERILIZACIÓN - TC */}
              <FormField
                control={form.control}
                name="inicioProcesoTC"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>INICIO PROCESO DE ESTERILIZACIÓN - TC</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: 121"
                        type="number"
                        step="0.1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* INICIO PROCESO DE ESTERILIZACIÓN - PRESIÓN */}
              <FormField
                control={form.control}
                name="inicioProcesoPresion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>INICIO PROCESO DE ESTERILIZACIÓN - PRESIÓN</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: 15"
                        type="number"
                        step="0.1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* FIN PROCESO DE ESTERILIZACIÓN - HORA */}
              <FormField
                control={form.control}
                name="finProcesoHora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FIN PROCESO DE ESTERILIZACIÓN - HORA</FormLabel>
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

              {/* FIN PROCESO DE ESTERILIZACIÓN - TC */}
              <FormField
                control={form.control}
                name="finProcesoTC"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FIN PROCESO DE ESTERILIZACIÓN - TC</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: 121"
                        type="number"
                        step="0.1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* FIN PROCESO DE ESTERILIZACIÓN - PRESIÓN */}
              <FormField
                control={form.control}
                name="finProcesoPresion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FIN PROCESO DE ESTERILIZACIÓN - PRESIÓN</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: 15"
                        type="number"
                        step="0.1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* FIN DEL CICLO - HORA */}
              <FormField
                control={form.control}
                name="finCicloHora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FIN DEL CICLO - HORA</FormLabel>
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

              {/* CINTA INDICADORA */}
              <FormField
                control={form.control}
                name="cintaIndicadora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CINTA INDICADORA</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: 3M Comply, Sterigage"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* REALIZADO POR */}
              <FormField
                control={form.control}
                name="realizadoPor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>REALIZADO POR</FormLabel>
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
