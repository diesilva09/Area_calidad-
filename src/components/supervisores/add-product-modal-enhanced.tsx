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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Thermometer, Weight } from 'lucide-react';
import type { Product, ProductCategory } from '@/lib/supervisores-data';
import { categoriesAPI, productsAPI } from '@/lib/api-service';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Esquemas de validación
const productSchema = z.object({
  id: z.string().min(1, 'El código del producto es requerido'),
  name: z.string().min(1, 'El nombre del producto es requerido'),
  categoryId: z
    .string({ required_error: 'Debe seleccionar una categoría' })
    .min(1, 'Debe seleccionar una categoría'),
});

const categorySchema = z.object({
  id: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre de la categoría es requerido'),
});

// Esquema para pesos de producto
const pesoConfigSchema = z.object({
  envase_tipo: z.string().min(1, 'El tipo de envase es requerido'),
  peso_drenado_declarado: z.number().min(0, 'El peso drenado debe ser mayor o igual a 0'),
  peso_drenado_min: z.number().min(0, 'El peso drenado mínimo debe ser mayor o igual a 0'),
  peso_drenado_max: z.number().min(0, 'El peso drenado máximo debe ser mayor o igual a 0'),
  peso_neto_declarado: z.number().min(0, 'El peso neto debe ser mayor o igual a 0'),
});

// Esquema para temperaturas
const temperaturaSchema = z.object({
  horario: z.string().min(1, 'El horario es requerido'),
  incubadora_037: z.number().min(-50, 'Temperatura inválida').max(100, 'Temperatura inválida'),
  incubadora_038: z.number().min(-50, 'Temperatura inválida').max(100, 'Temperatura inválida'),
  nevera: z.number().min(-50, 'Temperatura inválida').max(100, 'Temperatura inválida'),
  realizado_por: z.string().min(1, 'El responsable es requerido'),
  observaciones: z.string().optional(),
});

const formSchema = z
  .object({
    type: z.enum(['category', 'product', 'produccion', 'embalaje']),
    name: z.string().optional(),
    categoryId: z.string().optional(),
    id: z.string().optional(),
    // Campos adicionales para productos
    pesosConfigs: z.array(pesoConfigSchema).optional(),
    temperaturas: z.array(temperaturaSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'product' || data.type === 'produccion' || data.type === 'embalaje') {
      const result = productSchema.safeParse(data);
      if (!result.success) {
        result.error.issues.forEach((issue) => ctx.addIssue(issue));
      }
    } else if (data.type === 'category') {
      const result = categorySchema.safeParse(data);
      if (!result.success) {
        result.error.issues.forEach((issue) => ctx.addIssue(issue));
      }
    }
  });

export type AddItemFormValues = z.infer<typeof formSchema>;
export type PesoConfigValues = z.infer<typeof pesoConfigSchema>;
export type TemperaturaValues = z.infer<typeof temperaturaSchema>;

type AddEditProductModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (values: AddItemFormValues, initialData: AddItemFormValues | null) => void;
  categories: ProductCategory[];
  initialData: AddItemFormValues | null;
};

export function AddEditProductModal({
  isOpen,
  onOpenChange,
  onSave,
  categories,
  initialData,
}: AddEditProductModalProps) {
  const { toast } = useToast();
  const isEditing = !!initialData;
  const [isCodeDuplicate, setIsCodeDuplicate] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      type: 'product',
      name: '',
      categoryId: undefined,
      id: '',
      pesosConfigs: [],
      temperaturas: [],
    },
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        type: 'product',
        name: '',
        categoryId: undefined,
        id: '',
        pesosConfigs: [],
        temperaturas: [],
      });
    }
  }, [initialData, form]);

  const addType = form.watch('type');
  const currentCode = form.watch('id');

  // Verificar si el código está duplicado
  const checkCodeDuplicate = async (code: string) => {
    if (!code.trim()) {
      setIsCodeDuplicate(false);
      return;
    }

    setIsCheckingCode(true);
    try {
      const isDuplicate = addType === 'category' 
        ? await categoriesAPI.checkCodeExists(code, initialData?.id)
        : await productsAPI.checkIdExists(code, form.getValues('categoryId') || '', initialData?.id);
      
      setIsCodeDuplicate(isDuplicate);
    } catch (error) {
      console.error('Error checking code duplicate:', error);
      setIsCodeDuplicate(false);
    } finally {
      setIsCheckingCode(false);
    }
  };

  // Efecto para verificar código cuando cambia
  React.useEffect(() => {
    if (currentCode && !isEditing) {
      const timeoutId = setTimeout(() => {
        checkCodeDuplicate(currentCode);
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [currentCode, isEditing]);

  // Efecto para verificar código cuando cambia la categoría (solo para productos)
  React.useEffect(() => {
    if (currentCode && (addType === 'product' || addType === 'produccion' || addType === 'embalaje') && !isEditing) {
      const categoryId = form.getValues('categoryId');
      if (categoryId) {
        const timeoutId = setTimeout(() => {
          checkCodeDuplicate(currentCode);
        }, 300); // Debounce más corto para cambio de categoría

        return () => clearTimeout(timeoutId);
      }
    }
  }, [form.getValues('categoryId'), addType, isEditing, currentCode]);

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset(initialData);
      } else {
        form.reset({
          type: 'product',
          name: '',
          categoryId: undefined,
          id: '',
          pesosConfigs: [],
          temperaturas: [],
        });
      }
      setIsCodeDuplicate(false);
    }
  }, [isOpen, initialData, form]);

  // Funciones para manejar arrays dinámicos
  const addPesoConfig = () => {
    const currentConfigs = form.getValues('pesosConfigs') || [];
    form.setValue('pesosConfigs', [
      ...currentConfigs,
      {
        envase_tipo: '',
        peso_drenado_declarado: 0,
        peso_drenado_min: 0,
        peso_drenado_max: 0,
        peso_neto_declarado: 0,
      }
    ]);
  };

  const removePesoConfig = (index: number) => {
    const currentConfigs = form.getValues('pesosConfigs') || [];
    form.setValue('pesosConfigs', currentConfigs.filter((_, i) => i !== index));
  };

  const addTemperatura = () => {
    const currentTemps = form.getValues('temperaturas') || [];
    form.setValue('temperaturas', [
      ...currentTemps,
      {
        horario: '',
        incubadora_037: 0,
        incubadora_038: 0,
        nevera: 0,
        realizado_por: '',
        observaciones: '',
      }
    ]);
  };

  const removeTemperatura = (index: number) => {
    const currentTemps = form.getValues('temperaturas') || [];
    form.setValue('temperaturas', currentTemps.filter((_, i) => i !== index));
  };

  async function onSubmit(values: AddItemFormValues) {
    try {
      // Validar campos requeridos según el tipo
      const missingFields: string[] = [];
      
      if (values.type === 'product' || values.type === 'produccion' || values.type === 'embalaje') {
        if (!values.id?.trim()) missingFields.push('código del producto');
        if (!values.name?.trim()) missingFields.push('nombre del producto');
        if (!values.categoryId?.trim()) missingFields.push('categoría');
      } else if (values.type === 'category') {
        if (!values.id?.trim()) missingFields.push('código de la categoría');
        if (!values.name?.trim()) missingFields.push('nombre de la categoría');
      }
      
      if (missingFields.length > 0) {
        toast({
          title: "Campos requeridos",
          description: `Complete los siguientes campos: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      // Verificar duplicados antes de guardar
      if (!isEditing) {
        const isDuplicate = addType === 'category' 
          ? await categoriesAPI.checkCodeExists(values.id!)
          : await productsAPI.checkIdExists(values.id!, values.categoryId!);
        
        if (isDuplicate) {
          setIsCodeDuplicate(true);
          toast({
            title: "Código duplicado",
            description: "Este código ya existe. Por favor, use un código diferente.",
            variant: "destructive",
          });
          return;
        }
      }
      
      onSave(values, initialData);
      onOpenChange(false);
      
      // Mensaje de éxito
      toast({
        title: isEditing ? "Elemento actualizado" : "Elemento creado",
        description: isEditing 
          ? "El elemento ha sido actualizado exitosamente."
          : "El elemento ha sido creado exitosamente.",
      });
    } catch (error) {
      console.error('Error al guardar elemento:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el elemento. Intente nuevamente.",
        variant: "destructive",
      });
    }
  }

  const pesosConfigs = form.watch('pesosConfigs') || [];
  const temperaturas = form.watch('temperaturas') || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Elemento' : 'Añadir a la Lista'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifique los detalles del elemento.'
              : 'Añada un nuevo producto con sus configuraciones de pesos y temperaturas, o cree una nueva categoría.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Elemento</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.clearErrors();
                      }}
                      defaultValue={field.value}
                      className="flex space-x-4"
                      disabled={isEditing}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="product" id="r1" />
                        </FormControl>
                        <FormLabel htmlFor="r1" className="font-normal">
                          Producto
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="category" id="r2" />
                        </FormControl>
                        <FormLabel htmlFor="r2" className="font-normal">
                          Categoría
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(addType === 'product' || addType === 'produccion' || addType === 'embalaje') && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código del Producto</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="" 
                            {...field} 
                            disabled={isCheckingCode}
                            className={isCodeDuplicate ? 'border-red-500 focus:border-red-500' : ''}
                          />
                        </FormControl>
                        {isCodeDuplicate && (
                          <p className="text-sm text-red-500">
                            Este código ya existe
                          </p>
                        )}
                        {isCheckingCode && (
                          <p className="text-sm text-gray-500">
                            Verificando código...
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Producto</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nombre del producto" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={`category-${category.id}-${category.name}`} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sección de Pesos Drenados y Netos */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Weight className="h-5 w-5" />
                        <span>Configuración de Pesos</span>
                      </CardTitle>
                      <Button
                        type="button"
                        onClick={addPesoConfig}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Configuración
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pesosConfigs.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No hay configuraciones de pesos agregadas
                      </div>
                    ) : (
                      pesosConfigs.map((_, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant="outline">Configuración {index + 1}</Badge>
                            <Button
                              type="button"
                              onClick={() => removePesoConfig(index)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`pesosConfigs.${index}.envase_tipo`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tipo de Envase</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccione tipo" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Vidrio">Vidrio</SelectItem>
                                      <SelectItem value="PET">PET</SelectItem>
                                      <SelectItem value="Bolsa">Bolsa</SelectItem>
                                      <SelectItem value="Lata">Lata</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`pesosConfigs.${index}.peso_neto_declarado`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Peso Neto (g)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`pesosConfigs.${index}.peso_drenado_declarado`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Peso Drenado (g)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`pesosConfigs.${index}.peso_drenado_min`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Peso Drenado Mínimo (g)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`pesosConfigs.${index}.peso_drenado_max`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Peso Drenado Máximo (g)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Sección de Temperaturas */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Thermometer className="h-5 w-5" />
                        <span>Configuración de Temperaturas</span>
                      </CardTitle>
                      <Button
                        type="button"
                        onClick={addTemperatura}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Temperatura
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {temperaturas.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No hay configuraciones de temperaturas agregadas
                      </div>
                    ) : (
                      temperaturas.map((_, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant="outline">Temperatura {index + 1}</Badge>
                            <Button
                              type="button"
                              onClick={() => removeTemperatura(index)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`temperaturas.${index}.horario`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Horario</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccione horario" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="MAÑANA (7-9 AM)">MAÑANA (7-9 AM)</SelectItem>
                                      <SelectItem value="TARDE (3-5 PM)">TARDE (3-5 PM)</SelectItem>
                                      <SelectItem value="NOCHE (9-11 PM)">NOCHE (9-11 PM)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`temperaturas.${index}.realizado_por`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Responsable</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nombre del responsable" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`temperaturas.${index}.incubadora_037`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Incubadora EMD-037 (°C)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      placeholder="0.0"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`temperaturas.${index}.incubadora_038`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Incubadora EMD-038 (°C)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      placeholder="0.0"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`temperaturas.${index}.nevera`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nevera (°C)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      placeholder="0.0"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`temperaturas.${index}.observaciones`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Observaciones</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Observaciones adicionales..."
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {addType === 'category' && (
              <>
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de la Categoría</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="" 
                          {...field} 
                          disabled={isCheckingCode}
                          className={isCodeDuplicate ? 'border-red-500 focus:border-red-500' : ''}
                        />
                      </FormControl>
                      {isCodeDuplicate && (
                        <p className="text-sm text-red-500">
                          Este código ya existe
                        </p>
                      )}
                      {isCheckingCode && (
                        <p className="text-sm text-gray-500">
                          Verificando código...
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Categoría</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre de la categoría" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCodeDuplicate}>
                {isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
