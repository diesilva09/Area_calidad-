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
import { CalendarIcon, Beaker } from 'lucide-react';
import { cn } from '@/lib/utils';
import { esterilizacionAutoclaveService } from '@/lib/esterilizacion-autoclave-service';

// Esquema de validación para el formulario
// Todos los campos son opcionales para permitir guardar como pendiente
const esterilizacionAutoclaveSchema = z.object({
  fecha: z.string().optional(),
  elementosMediosCultivo: z.string().optional(),
  inicioCicloHora: z.string().optional(),
  inicioProcesoHora: z.string().optional(),
  inicioProcesoTC: z.string().optional(),
  inicioProcesoPresion: z.string().optional(),
  finProcesoHora: z.string().optional(),
  finProcesoTC: z.string().optional(),
  finProcesoPresion: z.string().optional(),
  finCicloHora: z.string().optional(),
  cintaIndicadora: z.string().optional(),
  realizadoPor: z.string().optional(),
  observaciones: z.string().optional(),
});

type EsterilizacionAutoclaveFormValues = z.infer<typeof esterilizacionAutoclaveSchema>;

interface AddEsterilizacionAutoclaveModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: EsterilizacionAutoclaveFormValues, estado: 'pendiente' | 'completado') => void;
  editingRecord?: any | null;
  onEditingRecordChange?: (record: any | null) => void;
}

export function AddEsterilizacionAutoclaveModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
  editingRecord,
  onEditingRecordChange,
}: AddEsterilizacionAutoclaveModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const toDateInput = (value: any, fallback: string) => {
    if (!value) return fallback;
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
    return String(value);
  };

  const emptyValues: EsterilizacionAutoclaveFormValues = {
    fecha: '',
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
  };

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

  React.useEffect(() => {
    if (!isOpen) return;
    if (!editingRecord) return;

    form.reset({
      fecha: editingRecord.fecha ? toDateInput(editingRecord.fecha, '') : '',
      elementosMediosCultivo: editingRecord.elementos_medios_cultivo ?? '',
      inicioCicloHora: editingRecord.inicio_ciclo_hora ?? '',
      inicioProcesoHora: editingRecord.inicio_proceso_hora ?? '',
      inicioProcesoTC: editingRecord.inicio_proceso_tc ?? '',
      inicioProcesoPresion: editingRecord.inicio_proceso_presion ?? '',
      finProcesoHora: editingRecord.fin_proceso_hora ?? '',
      finProcesoTC: editingRecord.fin_proceso_tc ?? '',
      finProcesoPresion: editingRecord.fin_proceso_presion ?? '',
      finCicloHora: editingRecord.fin_ciclo_hora ?? '',
      cintaIndicadora: editingRecord.cinta_indicadora ?? '',
      realizadoPor: editingRecord.realizado_por ?? '',
      observaciones: editingRecord.observaciones ?? '',
    });
  }, [editingRecord, form, isOpen]);

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

  async function handleSave(values: EsterilizacionAutoclaveFormValues, estado: 'pendiente' | 'completado') {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values, 'Estado:', estado);
      
      // Transformar los datos para la API
      const transformedValues = {
        fecha: values.fecha || '',
        elementos_medios_cultivo: values.elementosMediosCultivo || '',
        inicio_ciclo_hora: values.inicioCicloHora || '',
        inicio_proceso_hora: values.inicioProcesoHora || '',
        inicio_proceso_tc: values.inicioProcesoTC || '',
        inicio_proceso_presion: values.inicioProcesoPresion || '',
        fin_proceso_hora: values.finProcesoHora || '',
        fin_proceso_tc: values.finProcesoTC || '',
        fin_proceso_presion: values.finProcesoPresion || '',
        fin_ciclo_hora: values.finCicloHora || '',
        cinta_indicadora: values.cintaIndicadora || '',
        realizado_por: values.realizadoPor || '',
        observaciones: values.observaciones || undefined,
        estado: estado,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      if (editingRecord?.id) {
        await esterilizacionAutoclaveService.update(editingRecord.id, transformedValues);
      } else {
        await esterilizacionAutoclaveService.create(transformedValues);
      }
      console.log('✅ Registro de esterilización en autoclave guardado exitosamente');
      
      toast({
        title: estado === 'pendiente' ? "Registro guardado como pendiente" : "Registro completado",
        description: estado === 'pendiente' 
          ? "El registro ha sido guardado como pendiente. Puedes completarlo más tarde."
          : "El registro de esterilización en autoclave ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values, estado);
      onOpenChange(false);
      form.reset();
      onEditingRecordChange?.(null);
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
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex-shrink-0">
              <Beaker className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">RE-CAL-017</span>
                <span className="text-[10px] text-gray-400">v.2 · 03/05/2021</span>
              </div>
              <DialogTitle className="text-base font-semibold text-gray-900 leading-snug">
                Esterilización en Autoclave
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5 mt-4">
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
                        placeholder=""
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
                        placeholder=""
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
                        placeholder=""
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
                        placeholder=""
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
                        placeholder=""
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
                        placeholder=""
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
                        placeholder=""
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

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                  onEditingRecordChange?.(null);
                }}
              >
                Cancelar
              </Button>
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Completado'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
