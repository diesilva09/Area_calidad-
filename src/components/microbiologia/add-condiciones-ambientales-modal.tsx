'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { condicionesAmbientalesService } from '@/lib/condiciones-ambientales-service';

// Esquema de validación para el formulario
const condicionesAmbientalesSchema = z.object({
  fecha: z.string().min(1, 'Campo requerido'),
  hora: z.string().min(1, 'Campo requerido'),
  temperatura: z.string().min(1, 'Campo requerido'),
  humedadRelativa: z.string().min(1, 'Campo requerido'),
  responsable: z.string().min(1, 'Campo requerido'),
  observaciones: z.string().optional(),
});

type CondicionesAmbientalesFormValues = z.infer<typeof condicionesAmbientalesSchema>;

interface AddCondicionesAmbientalesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: CondicionesAmbientalesFormValues) => void;
  editingRecord?: any | null;
  onEditingRecordChange?: (record: any | null) => void;
}

// Función para determinar el período automáticamente basado en la hora actual
const getPeriodoAutomatico = (): string => {
  const ahora = new Date();
  const hora = ahora.getHours();
  
  // 7 AM - 9 AM: MAÑANA
  // 3 PM - 5 PM: TARDE
  // Fuera de estos rangos: valor por defecto según la hora más cercana
  
  if (hora >= 7 && hora <= 9) {
    return 'MAÑANA (7-9 AM)';
  } else if (hora >= 15 && hora <= 17) {
    return 'TARDE (3-5 PM)';
  } else if (hora < 7) {
    return 'MAÑANA (7-9 AM)'; // Antes de las 7 AM, asumir mañana
  } else if (hora < 15) {
    return 'TARDE (3-5 PM)'; // Entre 10 AM y 2 PM, asumir tarde
  } else {
    return 'MAÑANA (7-9 AM)'; // Después de las 6 PM, asumir mañana del siguiente día
  }
};

export function AddCondicionesAmbientalesModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
  editingRecord,
  onEditingRecordChange,
}: AddCondicionesAmbientalesModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const toDateInput = (value: any, fallback: string) => {
    if (!value) return fallback;
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
    return String(value);
  };

  const emptyValues: CondicionesAmbientalesFormValues = {
    fecha: '',
    hora: '',
    temperatura: '',
    humedadRelativa: '',
    responsable: '',
    observaciones: '',
  };

  const form = useForm<CondicionesAmbientalesFormValues>({
    resolver: zodResolver(condicionesAmbientalesSchema),
    defaultValues: {
      fecha: format(new Date(), 'yyyy-MM-dd'),
      hora: getPeriodoAutomatico(), // Hora automática basada en la hora actual
      temperatura: '',
      humedadRelativa: '',
      responsable: '',
      observaciones: '',
    },
  });

  // Efecto para actualizar la hora automáticamente cada minuto
  React.useEffect(() => {
    if (!isOpen) return;
    if (editingRecord) return;

    const actualizarHora = () => {
      const nuevoPeriodo = getPeriodoAutomatico();
      form.setValue('hora', nuevoPeriodo);
    };

    // Actualizar inmediatamente al abrir
    actualizarHora();

    // Configurar intervalo para actualizar cada minuto
    const interval = setInterval(actualizarHora, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [isOpen, form]);

  React.useEffect(() => {
    if (!isOpen) return;
    if (!editingRecord) return;

    form.reset({
      fecha: toDateInput(editingRecord.fecha, format(new Date(), 'yyyy-MM-dd')),
      hora: editingRecord.hora ?? getPeriodoAutomatico(),
      temperatura: editingRecord.temperatura ?? '',
      humedadRelativa: editingRecord.humedad_relativa ?? '',
      responsable: editingRecord.responsable ?? '',
      observaciones: editingRecord.observaciones ?? '',
    });
  }, [editingRecord, form, isOpen]);

  async function onSubmit(values: CondicionesAmbientalesFormValues) {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values);
      
      // Transformar los datos para la API
      const transformedValues = {
        fecha: values.fecha,
        hora: values.hora,
        temperatura: values.temperatura,
        humedad_relativa: values.humedadRelativa,
        responsable: values.responsable,
        observaciones: values.observaciones || undefined, // Cambiar null a undefined
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      if (editingRecord?.id) {
        await condicionesAmbientalesService.update(editingRecord.id, transformedValues);
      } else {
        await condicionesAmbientalesService.create(transformedValues);
      }
      console.log('✅ Registro de condiciones ambientales guardado exitosamente');
      
      toast({
        title: "Registro guardado",
        description: "El registro de condiciones ambientales ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values);
      onOpenChange(false);
      form.reset();
      onEditingRecordChange?.(null);
    } catch (error) {
      console.error('❌ Error al guardar registro de condiciones ambientales:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de condiciones ambientales.",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900">
            RE-CAL-021 REGISTRO CONDICIONES AMBIENTALES
          </DialogTitle>
          <DialogDescription asChild className="text-gray-600">
            <div className="mt-2 space-y-1">
              <p><strong>Código:</strong> RE-CAL-021</p>
              <p><strong>Versión:</strong> 2</p>
              <p><strong>Fecha de Aprobación:</strong> 03 de mayo de 2021</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FECHA */}
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FECHA</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(format(date, 'yyyy-MM-dd'));
                            }
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* HORA - Automática */}
              <FormField
                control={form.control}
                name="hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HORA</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input 
                          {...field} 
                          readOnly
                          className="bg-gray-100 cursor-not-allowed"
                        />
                        <div className="text-sm text-gray-500">
                          {(() => {
                            const ahora = new Date();
                            const hora = ahora.getHours();
                            const minutos = ahora.getMinutes();
                            return `Actual: ${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
                          })()}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <div className="text-xs text-gray-500 mt-1">
                      Período determinado automáticamente según la hora actual:
                      <br />
                      • 7:00 AM - 9:00 AM = MAÑANA
                      <br />
                      • 3:00 PM - 5:00 PM = TARDE
                    </div>
                  </FormItem>
                )}
              />

              {/* TEMPERATURA °C */}
              <FormField
                control={form.control}
                name="temperatura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TEMPERATURA °C</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: 21" 
                        type="number"
                        step="0.1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* % HUMEDAD RELATIVA */}
              <FormField
                control={form.control}
                name="humedadRelativa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>% HUMEDAD RELATIVA</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: 81" 
                        type="number"
                        min="0"
                        max="100"
                        {...field} 
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>RESPONSABLE</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Juan David Castañeda Ortiz" 
                        {...field} 
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
                  <FormItem className="md:col-span-2">
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
