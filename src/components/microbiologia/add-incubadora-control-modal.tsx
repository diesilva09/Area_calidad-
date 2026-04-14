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
import { incubadoraControlService } from '@/lib/incubadora-control-service';

// Esquema de validación para el formulario
const incubadoraControlSchema = z.object({
  muestra: z.string().min(1, 'Campo requerido'),
  fechaIngreso: z.string().min(1, 'Campo requerido'),
  horaIngreso: z.string().min(1, 'Campo requerido'),
  fechaSalida: z.string().min(1, 'Campo requerido'),
  horaSalida: z.string().min(1, 'Campo requerido'),
  responsable: z.string().min(1, 'Campo requerido'),
  observaciones: z.string().optional(),
});

type IncubadoraControlFormValues = z.infer<typeof incubadoraControlSchema>;

interface AddIncubadoraControlModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: IncubadoraControlFormValues) => void;
  editingRecord?: any | null;
  onEditingRecordChange?: (record: any | null) => void;
}

export function AddIncubadoraControlModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
  editingRecord,
  onEditingRecordChange,
}: AddIncubadoraControlModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<IncubadoraControlFormValues>({
    resolver: zodResolver(incubadoraControlSchema),
    defaultValues: {
      muestra: '',
      fechaIngreso: format(new Date(), 'yyyy-MM-dd'),
      horaIngreso: '',
      fechaSalida: format(new Date(), 'yyyy-MM-dd'),
      horaSalida: '',
      responsable: '',
      observaciones: '',
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    if (!editingRecord) return;

    form.reset({
      muestra: editingRecord.muestra ?? '',
      fechaIngreso: editingRecord.fecha_ingreso ?? format(new Date(), 'yyyy-MM-dd'),
      horaIngreso: editingRecord.hora_ingreso ?? '',
      fechaSalida: editingRecord.fecha_salida ?? format(new Date(), 'yyyy-MM-dd'),
      horaSalida: editingRecord.hora_salida ?? '',
      responsable: editingRecord.responsable ?? '',
      observaciones: editingRecord.observaciones ?? '',
    });
  }, [editingRecord, form, isOpen]);

  async function onSubmit(values: IncubadoraControlFormValues) {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values);
      
      // Transformar los datos para la API
      const transformedValues = {
        muestra: values.muestra,
        fecha_ingreso: values.fechaIngreso,
        hora_ingreso: values.horaIngreso,
        fecha_salida: values.fechaSalida,
        hora_salida: values.horaSalida,
        responsable: values.responsable,
        observaciones: values.observaciones || undefined,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      if (editingRecord?.id) {
        await incubadoraControlService.update(editingRecord.id, transformedValues);
      } else {
        await incubadoraControlService.create(transformedValues);
      }
      console.log('✅ Registro de incubadora guardado exitosamente');
      
      toast({
        title: "Registro guardado",
        description: "El registro de operación y control de incubadora ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values);
      onOpenChange(false);
      form.reset();
      onEditingRecordChange?.(null);
    } catch (error) {
      console.error('❌ Error al guardar registro de incubadora:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de operación y control de incubadora.",
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
          form.reset();
          onEditingRecordChange?.(null);
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-900">
            RE-CAL-089 - REGISTRO DE OPERACIÓN Y CONTROL DE INCUBADORA
          </DialogTitle>
          <DialogDescription asChild className="text-gray-600">
            <div className="mt-2 space-y-1">
              <p><strong>Código:</strong> RE-CAL-089</p>
              <p><strong>Versión:</strong> 1</p>
              <p><strong>Fecha de Aprobación:</strong> 07 de noviembre de 2025</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Sección 1: Información de Muestra */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-semibold mb-4 text-green-800">Información de Muestra</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
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
                          placeholder="Ej: M-001, AGUA-001, ALIMENTO-001"
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

            {/* Sección 2: Ingreso a Incubadora */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Ingreso a Incubadora</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* FECHA INGRESO */}
                <FormField
                  control={form.control}
                  name="fechaIngreso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FECHA INGRESO</FormLabel>
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

                {/* HORA INGRESO */}
                <FormField
                  control={form.control}
                  name="horaIngreso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HORA INGRESO</FormLabel>
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
              </div>
            </div>

            {/* Sección 3: Salida de Incubadora */}
            <div className="border rounded-lg p-4 bg-orange-50">
              <h3 className="text-lg font-semibold mb-4 text-orange-800">Salida de Incubadora</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* FECHA SALIDA */}
                <FormField
                  control={form.control}
                  name="fechaSalida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FECHA SALIDA</FormLabel>
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

                {/* HORA SALIDA */}
                <FormField
                  control={form.control}
                  name="horaSalida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HORA SALIDA</FormLabel>
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
              </div>
            </div>

            {/* Sección 4: Observaciones */}
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
                        placeholder="Notas adicionales sobre la operación de la incubadora..."
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
                className="bg-green-600 hover:bg-green-700"
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
