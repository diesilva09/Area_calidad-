'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getFechaActual, getMesActual } from '@/lib/date-utils';
import { limpiezaTasksService, type LimpiezaTask } from '@/lib/limpieza-tasks-service';
import { useToast } from '@/hooks/use-toast';

const limpiezaTaskSchema = z.object({
  area: z.string().min(1, 'Campo requerido'),
  tipo_muestra: z.string().min(1, 'Campo requerido'),
  detalles: z.string().nullish(), // Changed from optional() to nullish()
  fecha: z.string().min(1, 'Campo requerido'),
  mes_corte: z.string().min(1, 'Campo requerido'),
});

type AddLimpiezaTaskModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccessfulSubmit?: () => void;
  initialTask?: LimpiezaTask | null;
};

export function AddLimpiezaTaskModal({
  isOpen,
  onOpenChange,
  onSuccessfulSubmit,
  initialTask,
}: AddLimpiezaTaskModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOtroArea, setIsOtroArea] = React.useState(false);
  const [otroAreaText, setOtroAreaText] = React.useState('');
  const [isOtroTipoMuestra, setIsOtroTipoMuestra] = React.useState(false);
  const [otroTipoMuestraText, setOtroTipoMuestraText] = React.useState('');

  const form = useForm<z.infer<typeof limpiezaTaskSchema>>({
    resolver: zodResolver(limpiezaTaskSchema),
    defaultValues: {
      area: initialTask?.area || '',
      tipo_muestra: initialTask?.tipo_muestra || '',
      detalles: initialTask?.detalles || '',
      fecha: initialTask?.fecha || getFechaActual(),
      mes_corte: getMesActual(),
    },
  });

  React.useEffect(() => {
    if (initialTask && isOpen) {
      form.setValue('area', initialTask.area);
      form.setValue('tipo_muestra', initialTask.tipo_muestra);
      form.setValue('detalles', initialTask.detalles || '');
      form.setValue('fecha', initialTask.fecha);
      
      // Verificar si el área inicial es "Otro"
      const areasPredefinidas = [
        'PREPARACIÓN DE SALSAS',
        'PREPARACIÓN DE LÍQUIDOS Y ADECUACIÓN DE MP',
        'MICROPESAJE',
        'ENVASADO DE FRUTOS (TECNOPACK)',
        'ENVASADO DE FRUTOS (EMÉRITO)',
        'ENVASADO SALSAS (6 BOQUILLAS)',
        'ENVASADO SALSAS (7 BOQUILLAS)',
        'ENVASADO SALSAS (10 BOQUILLAS)',
        'ENVASADO SALSAS ESPESAS 1 BOQUILLA',
        'ENVASADO SALSAS ESPESAS 2 BOQUILLAS',
        'ENVASADO SALSAS ESPESAS 3 BOQUILLAS',
        'LINEA SACHET',
        'LÍNEA SACHET',
        'LINEA DOYPACK',
        'LÍNEA DOYPACK',
        'MANTENIMIENTO',
        'PLANTA',
        'ENVASADO DE CONSERVAS (TECNOPACK)',
        'ENVASADO DE CONSERVAS (EMÉRITO)',
        'ENVASADO DE CONSERVAS (DOYPACK)',
        'ENVASADO DE CONSERVAS (LÍNEA MANUAL BOLSA)',
        'ENVASADO DE CONSERVAS (LÍNEA MANUAL FRUTOS SECOS)',
        'TAPADO TWIST OFF',
        'DOSIFICADORA 2 PISTONES',
        'FLAUTA Y BAJANTE',
        'SUPERFICIES ATP',
      ];
      
      if (!areasPredefinidas.includes(initialTask.area)) {
        setIsOtroArea(true);
        setOtroAreaText(initialTask.area);
      }

      const tiposMuestraPredefinidos = ['SUPERFICIES ATP'];
      if (!tiposMuestraPredefinidos.includes(initialTask.tipo_muestra)) {
        setIsOtroTipoMuestra(true);
        setOtroTipoMuestraText(initialTask.tipo_muestra);
      }
    }
  }, [initialTask, isOpen, form]);

  React.useEffect(() => {
    if (isOpen) {
      form.setValue('fecha', getFechaActual());
      form.setValue('mes_corte', getMesActual());
    }
  }, [isOpen, form]);

  // Manejar cambio en el select de área
  const handleAreaChange = (value: string) => {
    if (value === 'OTRO') {
      setIsOtroArea(true);
      form.setValue('area', '');
    } else {
      setIsOtroArea(false);
      setOtroAreaText('');
      form.setValue('area', value);
    }
  };

  // Manejar cambio en el texto de "Otro"
  const handleOtroAreaChange = (value: string) => {
    setOtroAreaText(value);
    form.setValue('area', value);
  };

  const handleTipoMuestraChange = (value: string) => {
    if (value === 'OTRO') {
      setIsOtroTipoMuestra(true);
      form.setValue('tipo_muestra', '');
    } else {
      setIsOtroTipoMuestra(false);
      setOtroTipoMuestraText('');
      form.setValue('tipo_muestra', value);
    }
  };

  const handleOtroTipoMuestraChange = (value: string) => {
    setOtroTipoMuestraText(value);
    form.setValue('tipo_muestra', value);
  };

  async function onSubmit(values: z.infer<typeof limpiezaTaskSchema>) {
    setIsLoading(true);
    console.log('📋 Enviando tarea de limpieza:', values);
    
    try {
      // Validar campos requeridos
      const missingFields: string[] = [];
      
      if (!values.area?.trim()) missingFields.push('área');
      if (!values.tipo_muestra?.trim()) missingFields.push('tipo de muestra');
      if (!values.fecha?.trim()) missingFields.push('fecha');
      
      if (missingFields.length > 0) {
        toast({
          title: "Campos requeridos",
          description: `Complete los siguientes campos: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      if (initialTask) {
        // Modo edición
        console.log('🔄 Actualizando tarea:', initialTask.id);
        await limpiezaTasksService.update(initialTask.id, values);
        toast({
          title: "Tarea Actualizada",
          description: "La tarea de limpieza ha sido actualizada exitosamente",
        });
      } else {
        // Modo creación
        console.log('✨ Creando nueva tarea de limpieza');
        const taskData = {
          ...values,
          status: 'pending' as const,
          created_by: 'supervisor', // Esto debería venir del contexto de autenticación
          detalles: values.detalles ?? null,
        };
        
        await limpiezaTasksService.create(taskData);
        toast({
          title: "Tarea Creada",
          description: "La tarea de limpieza ha sido agregada al cronograma exitosamente",
        });
      }
      
      if (onSuccessfulSubmit) {
        onSuccessfulSubmit();
      } else {
        onOpenChange(false);
      }
      
      form.reset();
    } catch (error) {
      console.error('❌ Error al guardar tarea de limpieza:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea de limpieza. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialTask ? 'Editar Tarea del Cronograma' : 'Agregar Tarea al Cronograma'}
          </DialogTitle>
          <DialogDescription>
            {initialTask 
              ? 'Modifique los datos de la tarea programada de limpieza.'
              : 'Complete los campos para agregar una nueva tarea al cronograma de limpieza.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área</FormLabel>
                    <FormControl>
                      <Select onValueChange={handleAreaChange} value={isOtroArea ? 'OTRO' : field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un área..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PREPARACIÓN DE SALSAS">PREPARACIÓN DE SALSAS</SelectItem>
                          <SelectItem value="PREPARACIÓN DE LÍQUIDOS Y ADECUACIÓN DE MP">PREPARACIÓN DE LÍQUIDOS Y ADECUACIÓN DE MP</SelectItem>
                          <SelectItem value="MICROPESAJE">MICROPESAJE</SelectItem>
                          <SelectItem value="ENVASADO DE FRUTOS (TECNOPACK)">ENVASADO DE FRUTOS (TECNOPACK)</SelectItem>
                          <SelectItem value="ENVASADO DE FRUTOS (EMÉRITO)">ENVASADO DE FRUTOS (EMÉRITO)</SelectItem>
                          <SelectItem value="ENVASADO SALSAS (6 BOQUILLAS)">ENVASADO SALSAS (6 BOQUILLAS)</SelectItem>
                          <SelectItem value="ENVASADO SALSAS (7 BOQUILLAS)">ENVASADO SALSAS (7 BOQUILLAS)</SelectItem>
                          <SelectItem value="ENVASADO SALSAS (10 BOQUILLAS)">ENVASADO SALSAS (10 BOQUILLAS)</SelectItem>
                          <SelectItem value="ENVASADO SALSAS ESPESAS 1 BOQUILLA">ENVASADO SALSAS ESPESAS 1 BOQUILLA</SelectItem>
                          <SelectItem value="ENVASADO SALSAS ESPESAS 2 BOQUILLAS">ENVASADO SALSAS ESPESAS 2 BOQUILLAS</SelectItem>
                          <SelectItem value="ENVASADO SALSAS ESPESAS 3 BOQUILLAS">ENVASADO SALSAS ESPESAS 3 BOQUILLAS</SelectItem>
                          <SelectItem value="LINEA SACHET">LINEA SACHET</SelectItem>
                          <SelectItem value="LÍNEA SACHET">LÍNEA SACHET</SelectItem>
                          <SelectItem value="LINEA DOYPACK">LINEA DOYPACK</SelectItem>
                          <SelectItem value="LÍNEA DOYPACK">LÍNEA DOYPACK</SelectItem>
                          <SelectItem value="MANTENIMIENTO">MANTENIMIENTO</SelectItem>
                          <SelectItem value="PLANTA">PLANTA</SelectItem>
                          <SelectItem value="ENVASADO DE CONSERVAS (TECNOPACK)">ENVASADO DE CONSERVAS (TECNOPACK)</SelectItem>
                          <SelectItem value="ENVASADO DE CONSERVAS (EMÉRITO)">ENVASADO DE CONSERVAS (EMÉRITO)</SelectItem>
                          <SelectItem value="ENVASADO DE CONSERVAS (DOYPACK)">ENVASADO DE CONSERVAS (DOYPACK)</SelectItem>
                          <SelectItem value="ENVASADO DE CONSERVAS (LÍNEA MANUAL BOLSA)">ENVASADO DE CONSERVAS (LÍNEA MANUAL BOLSA)</SelectItem>
                          <SelectItem value="ENVASADO DE CONSERVAS (LÍNEA MANUAL FRUTOS SECOS)">ENVASADO DE CONSERVAS (LÍNEA MANUAL FRUTOS SECOS)</SelectItem>
                          <SelectItem value="TAPADO TWIST OFF">TAPADO TWIST OFF</SelectItem>
                          <SelectItem value="DOSIFICADORA 2 PISTONES">DOSIFICADORA 2 PISTONES</SelectItem>
                          <SelectItem value="FLAUTA Y BAJANTE">FLAUTA Y BAJANTE</SelectItem>
                          <SelectItem value="OTRO">Otro...</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isOtroArea && (
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especificar Área</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Escriba el nombre del área..." 
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={otroAreaText}
                          onChange={(e) => handleOtroAreaChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="mes_corte"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mes de Corte</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: marzo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha Programada</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo_muestra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Muestra</FormLabel>
                  <FormControl>
                    <Select onValueChange={handleTipoMuestraChange} value={isOtroTipoMuestra ? 'OTRO' : field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un tipo de muestra..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPERFICIES ATP">SUPERFICIES ATP</SelectItem>
                        <SelectItem value="OTRO">Otro...</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isOtroTipoMuestra && (
              <FormField
                control={form.control}
                name="tipo_muestra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especificar Tipo de Muestra</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Escriba el tipo de muestra..."
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={otroTipoMuestraText}
                        onChange={(e) => handleOtroTipoMuestraChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="detalles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalles Adicionales</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ingrese cualquier detalle adicional sobre la tarea...&#10;Puede usar saltos de línea para organizar mejor la información."
                      className="min-h-[150px] resize-y"
                      rows={6}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={(field.value ?? '') as any}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    {initialTask ? 'Actualizar Tarea' : 'Agregar Tarea'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
