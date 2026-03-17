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
import { useToast } from '@/hooks/use-toast';
import { controlLavadoInactivacionService } from '@/lib/control-lavado-inactivacion-service';

// Esquema de validación para el formulario
const controlLavadoInactivacionSchema = z.object({
  fecha: z.string().min(1, 'Campo requerido'),
  actividadRealizada: z.string().min(1, 'Campo requerido'),
  sustanciaLimpiezaNombre: z.string().min(1, 'Campo requerido'),
  sustanciaLimpiezaCantidadPreparada: z.string().min(1, 'Campo requerido'),
  sustanciaLimpiezaCantidadSustancia: z.string().min(1, 'Campo requerido'),
  sustanciaDesinfeccion1Nombre: z.string().min(1, 'Campo requerido'),
  sustanciaDesinfeccion1CantidadPreparada: z.string().min(1, 'Campo requerido'),
  sustanciaDesinfeccion1CantidadSustancia: z.string().min(1, 'Campo requerido'),
  sustanciaDesinfeccion2Nombre: z.string().min(1, 'Campo requerido'),
  sustanciaDesinfeccion2CantidadPreparada: z.string().min(1, 'Campo requerido'),
  sustanciaDesinfeccion2CantidadSustancia: z.string().min(1, 'Campo requerido'),
  realizadoPor: z.string().min(1, 'Campo requerido'),
  observaciones: z.string().optional(),
});

type ControlLavadoInactivacionFormValues = z.infer<typeof controlLavadoInactivacionSchema>;

interface AddControlLavadoInactivacionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: ControlLavadoInactivacionFormValues) => void;
}

export function AddControlLavadoInactivacionModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
}: AddControlLavadoInactivacionModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ControlLavadoInactivacionFormValues>({
    resolver: zodResolver(controlLavadoInactivacionSchema),
    defaultValues: {
      fecha: format(new Date(), 'yyyy-MM-dd'),
      actividadRealizada: '',
      sustanciaLimpiezaNombre: '',
      sustanciaLimpiezaCantidadPreparada: '',
      sustanciaLimpiezaCantidadSustancia: '',
      sustanciaDesinfeccion1Nombre: '',
      sustanciaDesinfeccion1CantidadPreparada: '',
      sustanciaDesinfeccion1CantidadSustancia: '',
      sustanciaDesinfeccion2Nombre: '',
      sustanciaDesinfeccion2CantidadPreparada: '',
      sustanciaDesinfeccion2CantidadSustancia: '',
      realizadoPor: '',
      observaciones: '',
    },
  });

  async function onSubmit(values: ControlLavadoInactivacionFormValues) {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values);
      
      // Transformar los datos para la API
      const transformedValues = {
        fecha: values.fecha,
        actividad_realizada: values.actividadRealizada,
        sustancia_limpieza_nombre: values.sustanciaLimpiezaNombre,
        sustancia_limpieza_cantidad_preparada: values.sustanciaLimpiezaCantidadPreparada,
        sustancia_limpieza_cantidad_sustancia: values.sustanciaLimpiezaCantidadSustancia,
        sustancia_desinfeccion_1_nombre: values.sustanciaDesinfeccion1Nombre,
        sustancia_desinfeccion_1_cantidad_preparada: values.sustanciaDesinfeccion1CantidadPreparada,
        sustancia_desinfeccion_1_cantidad_sustancia: values.sustanciaDesinfeccion1CantidadSustancia,
        sustancia_desinfeccion_2_nombre: values.sustanciaDesinfeccion2Nombre,
        sustancia_desinfeccion_2_cantidad_preparada: values.sustanciaDesinfeccion2CantidadPreparada,
        sustancia_desinfeccion_2_cantidad_sustancia: values.sustanciaDesinfeccion2CantidadSustancia,
        realizado_por: values.realizadoPor,
        observaciones: values.observaciones || undefined,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      await controlLavadoInactivacionService.create(transformedValues);
      console.log('✅ Registro de control de lavado e inactivación guardado exitosamente');
      
      toast({
        title: "Registro guardado",
        description: "El registro de control de lavado e inactivación ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('❌ Error al guardar registro de control de lavado e inactivación:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de control de lavado e inactivación.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-cyan-900">
            RE-CAL-111 - CONTROL LAVADO E INACTIVACIÓN DE MATERIAL - LABORATORIO MICROBIOLOGÍA
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            <div className="mt-2 space-y-1">
              <p><strong>Código:</strong> RE-CAL-111</p>
              <p><strong>Versión:</strong> 1</p>
              <p><strong>Fecha de Aprobación:</strong> Julio 01 de 2020</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Sección 1: Información General */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
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

                {/* ACTIVIDAD REALIZADA */}
                <FormField
                  control={form.control}
                  name="actividadRealizada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ACTIVIDAD REALIZADA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: Limpieza de material de laboratorio, Desinfección de equipos"
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
              </div>
            </div>

            {/* Sección 2: Sustancia de Limpieza */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Sustancia de Limpieza Usada</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* NOMBRE */}
                <FormField
                  control={form.control}
                  name="sustanciaLimpiezaNombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NOMBRE</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: Detergente enzimático, Jabón líquido"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CANTIDAD PREPARADA (ml) */}
                <FormField
                  control={form.control}
                  name="sustanciaLimpiezaCantidadPreparada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CANTIDAD PREPARADA (ml)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: 500, 1000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CANTIDAD DE SUSTANCIA (ml) */}
                <FormField
                  control={form.control}
                  name="sustanciaLimpiezaCantidadSustancia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CANTIDAD DE SUSTANCIA (ml)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: 50, 100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 3: Sustancia de Desinfección 1 */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="text-lg font-semibold mb-4 text-green-800">Sustancia de Desinfección Utilizada 1</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* NOMBRE */}
                <FormField
                  control={form.control}
                  name="sustanciaDesinfeccion1Nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NOMBRE</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: Alcohol al 70%, Hipoclorito de sodio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CANTIDAD PREPARADA (ml) */}
                <FormField
                  control={form.control}
                  name="sustanciaDesinfeccion1CantidadPreparada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CANTIDAD PREPARADA (ml)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: 250, 500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CANTIDAD DE SUSTANCIA (ml) */}
                <FormField
                  control={form.control}
                  name="sustanciaDesinfeccion1CantidadSustancia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CANTIDAD DE SUSTANCIA (ml)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: 25, 50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 4: Sustancia de Desinfección 2 */}
            <div className="border rounded-lg p-4 bg-orange-50">
              <h3 className="text-lg font-semibold mb-4 text-orange-800">Sustancia de Desinfección Utilizada 2</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* NOMBRE */}
                <FormField
                  control={form.control}
                  name="sustanciaDesinfeccion2Nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NOMBRE</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: Glutaraldehído, Peróxido de hidrógeno"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CANTIDAD PREPARADA (ml) */}
                <FormField
                  control={form.control}
                  name="sustanciaDesinfeccion2CantidadPreparada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CANTIDAD PREPARADA (ml)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: 200, 400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CANTIDAD DE SUSTANCIA (ml) */}
                <FormField
                  control={form.control}
                  name="sustanciaDesinfeccion2CantidadSustancia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CANTIDAD DE SUSTANCIA (ml)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: 20, 40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 5: Observaciones */}
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
                        placeholder="Notas adicionales sobre el proceso de lavado e inactivación..."
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
                className="bg-cyan-600 hover:bg-cyan-700"
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
