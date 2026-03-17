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
import { registrosRecepcionFormatosService } from '@/lib/registros-recepcion-formatos-service';

// Esquema de validación para el formulario
const registrosRecepcionFormatosSchema = z.object({
  fechaEntrega: z.string().min(1, 'Campo requerido'),
  fechaRegistros: z.string().min(1, 'Campo requerido'),
  codigoVersionRegistros: z.string().min(1, 'Campo requerido'),
  numeroFolios: z.string().min(1, 'Campo requerido'),
  nombreQuienEntrega: z.string().min(1, 'Campo requerido'),
  nombreQuienRecibe: z.string().min(1, 'Campo requerido'),
  observaciones: z.string().optional(),
});

type RegistrosRecepcionFormatosFormValues = z.infer<typeof registrosRecepcionFormatosSchema>;

interface AddRegistrosRecepcionFormatosModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: (values: RegistrosRecepcionFormatosFormValues) => void;
}

export function AddRegistrosRecepcionFormatosModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
}: AddRegistrosRecepcionFormatosModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RegistrosRecepcionFormatosFormValues>({
    resolver: zodResolver(registrosRecepcionFormatosSchema),
    defaultValues: {
      fechaEntrega: format(new Date(), 'yyyy-MM-dd'),
      fechaRegistros: format(new Date(), 'yyyy-MM-dd'),
      codigoVersionRegistros: '',
      numeroFolios: '',
      nombreQuienEntrega: '',
      nombreQuienRecibe: '',
      observaciones: '',
    },
  });

  async function onSubmit(values: RegistrosRecepcionFormatosFormValues) {
    setIsSubmitting(true);
    
    try {
      console.log('🔍 DEBUG: Valores del formulario:', values);
      
      // Transformar los datos para la API
      const transformedValues = {
        fecha_entrega: values.fechaEntrega,
        fecha_registros: values.fechaRegistros,
        codigo_version_registros: values.codigoVersionRegistros,
        numero_folios: values.numeroFolios,
        nombre_quien_entrega: values.nombreQuienEntrega,
        nombre_quien_recibe: values.nombreQuienRecibe,
        observaciones: values.observaciones || undefined,
      };
      
      console.log('🔍 DEBUG: Valores transformados para API:', transformedValues);
      
      // Guardar en la base de datos
      await registrosRecepcionFormatosService.create(transformedValues);
      console.log('✅ Registro de recepción de formatos guardado exitosamente');
      
      toast({
        title: "Registro guardado",
        description: "El registro de recepción de formatos ha sido guardado exitosamente.",
      });
      
      onSuccessfulSubmit?.(values);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('❌ Error al guardar registro de recepción de formatos:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de recepción de formatos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900">
            RE-CAL-100 - REGISTROS RECEPCIÓN DE FORMATOS DILIGENCIADOS EN PROCESO
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            <div className="mt-2 space-y-1">
              <p><strong>Código:</strong> RE-CAL-100</p>
              <p><strong>Versión:</strong> 1</p>
              <p><strong>Fecha de Aprobación:</strong> Abril 24 de 2020</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Sección 1: Información de Recepción */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Información de Recepción</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* FECHA ENTREGA */}
                <FormField
                  control={form.control}
                  name="fechaEntrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FECHA ENTREGA</FormLabel>
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

                {/* FECHA REGISTROS */}
                <FormField
                  control={form.control}
                  name="fechaRegistros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FECHA REGISTROS</FormLabel>
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

                {/* CÓDIGO Y VERSIÓN REGISTROS */}
                <FormField
                  control={form.control}
                  name="codigoVersionRegistros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CÓDIGO Y VERSIÓN REGISTROS</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: RE-CAL-021 V1, RE-CAL-016 V2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* N° DE FOLIOS */}
                <FormField
                  control={form.control}
                  name="numeroFolios"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>N° DE FOLIOS</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: 5, 10, 15"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 2: Firmas */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Firmas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* NOMBRE O FIRMA DE QUIEN ENTREGA */}
                <FormField
                  control={form.control}
                  name="nombreQuienEntrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NOMBRE O FIRMA DE QUIEN ENTREGA</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Nombre completo de quien entrega los formatos"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* NOMBRE O FIRMA DE QUIEN RECIBE */}
                <FormField
                  control={form.control}
                  name="nombreQuienRecibe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NOMBRE O FIRMA DE QUIEN RECIBE</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Nombre completo de quien recibe los formatos"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección 3: Observaciones */}
            <div className="border rounded-lg p-4 bg-red-50">
              <h3 className="text-lg font-semibold mb-4 text-red-800">Observaciones</h3>
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OBSERVACIONES Y/O PENDIENTES</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Notas adicionales sobre la recepción de formatos, pendientes por resolver, etc..."
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
                className="bg-amber-600 hover:bg-amber-700"
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
