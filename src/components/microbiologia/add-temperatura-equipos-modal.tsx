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
import { temperaturaEquiposService } from '@/lib/temperatura-equipos-service';

// Esquema de validación para el formulario
const temperaturaEquiposSchema = z.object({
  fecha: z.string().optional(),
  horario: z.string().optional(),
  incubadora037: z.string().optional(),
  incubadora038: z.string().optional(),
  nevera: z.string().optional(),
  realizadoPor: z.string().optional(),
  observaciones: z.string().optional(),
});

type TemperaturaEquiposFormValues = z.infer<typeof temperaturaEquiposSchema>;

interface AddTemperaturaEquiposModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: TemperaturaEquiposFormValues) => void;
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

// Función para convertir fecha a formato serial de Excel
const getExcelSerialDate = (date: Date): number => {
  // Excel usa 1 de enero de 1900 como día 1 (aunque hay un bug que considera 1900 como año bisiesto)
  // La fórmula es: (fecha - 01/01/1900) + 1
  const excelEpoch = new Date(1900, 0, 1); // 1 de enero de 1900
  const diffTime = date.getTime() - excelEpoch.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Ajuste por el bug de Excel (considera 1900 como bisiesto)
  const adjustment = date >= new Date(1900, 2, 1) ? 1 : 0;
  
  return diffDays + 1 + adjustment;
};

const excelSerialToDate = (serial: number): Date => {
  // Inverso aproximado de getExcelSerialDate, respetando el bug de Excel (1900 bisiesto).
  // Base: 1900-01-01 es día 1.
  const excelEpoch = new Date(1900, 0, 1);
  const needsBugAdjustment = serial > 60 ? 1 : 0;
  const days = serial - 1 - needsBugAdjustment;
  const d = new Date(excelEpoch);
  d.setDate(excelEpoch.getDate() + days);
  return d;
};

const normalizeExcelSerial = (value: any): string => {
  if (value === null || value === undefined || value === '') return getExcelSerialDate(new Date()).toString();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return trimmed;

    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) return getExcelSerialDate(d).toString();
    return trimmed;
  }
  return String(value);
};

export function AddTemperaturaEquiposModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
  editingRecord,
  onEditingRecordChange,
}: AddTemperaturaEquiposModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const emptyValues: TemperaturaEquiposFormValues = {
    fecha: '',
    horario: '',
    incubadora037: '',
    incubadora038: '',
    nevera: '',
    realizadoPor: '',
    observaciones: '',
  };

  const form = useForm<TemperaturaEquiposFormValues>({
    resolver: zodResolver(temperaturaEquiposSchema),
    defaultValues: {
      fecha: getExcelSerialDate(new Date()).toString(),
      horario: getPeriodoAutomatico(), // Horario automático basado en la hora actual
      incubadora037: '',
      incubadora038: '',
      nevera: '',
      realizadoPor: '',
      observaciones: '',
    },
  });

  // Efecto para actualizar el horario automáticamente cada minuto
  React.useEffect(() => {
    if (!isOpen) return;
    if (editingRecord) return;

    const actualizarHorario = () => {
      const nuevoPeriodo = getPeriodoAutomatico();
      form.setValue('horario', nuevoPeriodo);
    };

    // Actualizar inmediatamente al abrir
    actualizarHorario();

    // Configurar intervalo para actualizar cada minuto
    const interval = setInterval(actualizarHorario, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [editingRecord, isOpen, form]);

  React.useEffect(() => {
    if (!isOpen) return;
    if (!editingRecord) return;

    form.reset({
      fecha: normalizeExcelSerial(editingRecord.fecha ?? getExcelSerialDate(new Date()).toString()),
      horario: editingRecord.horario ?? getPeriodoAutomatico(),
      incubadora037: editingRecord.incubadora_037 ?? '',
      incubadora038: editingRecord.incubadora_038 ?? '',
      nevera: editingRecord.nevera ?? '',
      realizadoPor: editingRecord.realizado_por ?? '',
      observaciones: editingRecord.observaciones ?? '',
    });
  }, [editingRecord, form, isOpen]);

  async function onSubmit(values: TemperaturaEquiposFormValues) {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values);
      
      // Transformar los datos para la API
      const transformedValues = {
        fecha: values.fecha || '',
        horario: values.horario || '',
        incubadora_037: values.incubadora037 || '',
        incubadora_038: values.incubadora038 || '',
        nevera: values.nevera || '',
        realizado_por: values.realizadoPor || '',
        observaciones: values.observaciones || undefined,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      if (editingRecord?.id) {
        await temperaturaEquiposService.update(editingRecord.id, transformedValues);
      } else {
        await temperaturaEquiposService.create(transformedValues);
      }
      console.log('✅ Registro de temperatura de equipos guardado exitosamente');
      
      toast({
        title: "Registro guardado",
        description: "El registro de temperatura de equipos ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values);
      onOpenChange(false);
      form.reset();
      onEditingRecordChange?.(null);
    } catch (error) {
      console.error('❌ Error al guardar registro de temperatura de equipos:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de temperatura de equipos.",
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
            RE-CAL-016 REGISTRO DE TEMPERATURA EQUIPOS DE MICROBIOLOGÍA
          </DialogTitle>
          <DialogDescription asChild className="text-gray-600">
            <div className="mt-2 space-y-1">
              <p><strong>Código:</strong> RE-CAL-016</p>
              <p><strong>Versión:</strong> 2</p>
              <p><strong>Fecha de Aprobación:</strong> 03 de mayo de 2021</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* FECHA - Serial de Excel */}
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FECHA</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                (() => {
                                  const serial = Number(field.value);
                                  if (!Number.isFinite(serial)) return field.value;
                                  return format(excelSerialToDate(serial), 'PPP', { locale: es });
                                })()
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={(() => {
                                const serial = Number(field.value);
                                if (!Number.isFinite(serial)) return undefined;
                                return excelSerialToDate(serial);
                              })()}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(getExcelSerialDate(date).toString());
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="text-xs text-gray-500">
                          Serial (Excel): <span className="font-mono">{field.value || '-'}</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      Selecciona una fecha y el sistema la guardará como serial de Excel.
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* HORARIO - Automático */}
              <FormField
                control={form.control}
                name="horario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HORARIO</FormLabel>
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
                      Período determinado automáticamente según la hora actual
                    </div>
                  </FormItem>
                )}
              />

              {/* INCUBADORA (EMD-037) °C */}
              <FormField
                control={form.control}
                name="incubadora037"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>INCUBADORA (EMD-037) °C</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: 31"
                        type="number"
                        step="0.1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* INCUBADORA (EMD-038) °C */}
              <FormField
                control={form.control}
                name="incubadora038"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>INCUBADORA (EMD-038) °C</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: 24"
                        type="number"
                        step="0.1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* NEVERA °C */}
              <FormField
                control={form.control}
                name="nevera"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NEVERA °C</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: 3"
                        type="number"
                        step="0.1"
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>REALIZADO POR</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: Juan David Castañeda Ortiz"
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
                  <FormItem className="md:col-span-3">
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
