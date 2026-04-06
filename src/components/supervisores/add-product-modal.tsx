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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Settings } from 'lucide-react';
import type { Product, ProductCategory, ProductPesosConfig, ProductTemperaturasConfig, ProductCalidadRangosConfig } from '@/lib/supervisores-data';
import { categoriesAPI, productsAPI } from '@/lib/api-service';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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

const toOptionalNonNegativeNumber = () =>
  z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return null;
      return v;
    },
    z.number().min(0, 'Debe ser mayor o igual a 0').nullable()
  );

const formSchema = z
  .object({
    type: z.enum(['category', 'product', 'produccion', 'embalaje']),
    name: z.string().optional(),
    categoryId: z.string().optional(),
    id: z.string().optional(),
    // Configuración de pesos
    pesosConfig: z.array(z.object({
      envase_tipo: z.string().min(1, 'Tipo de envase requerido'),
      peso_drenado_declarado: toOptionalNonNegativeNumber(),
      peso_drenado_min: toOptionalNonNegativeNumber(),
      peso_drenado_max: toOptionalNonNegativeNumber(),
      peso_neto_declarado: toOptionalNonNegativeNumber(),
    })).optional(),
    // Configuración de temperaturas
    temperaturasConfig: z.array(z.object({
      envase_tipo: z.string().min(1, 'Tipo de envase requerido'),
      temperatura_min: z.number().min(-50, 'Temperatura mínima inválida'),
      temperatura_max: z.number().min(-50, 'Temperatura máxima inválida'),
    })).optional(),
    // Configuración de rangos de calidad
    calidadRangosConfig: z.array(z.object({
      envase_tipo: z.string().min(1, 'Tipo de envase requerido'),
      brix_min: toOptionalNonNegativeNumber(),
      brix_max: toOptionalNonNegativeNumber(),
      ph_min: toOptionalNonNegativeNumber(),
      ph_max: toOptionalNonNegativeNumber(),
      acidez_min: toOptionalNonNegativeNumber(),
      acidez_max: toOptionalNonNegativeNumber(),
      consistencia_min: toOptionalNonNegativeNumber(),
      consistencia_max: toOptionalNonNegativeNumber(),
      ppm_so2_min: toOptionalNonNegativeNumber(),
      ppm_so2_max: toOptionalNonNegativeNumber(),
    })).optional(),
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

type AddEditProductModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (values: AddItemFormValues, initialData: AddItemFormValues | null) => Promise<void>;
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
  const [showConfig, setShowConfig] = useState(false);

  type EditablePesosDrenadosConfig = Omit<ProductPesosConfig,
    'peso_drenado_declarado' | 'peso_drenado_min' | 'peso_drenado_max' | 'peso_neto_declarado'
  > & {
    peso_drenado_declarado: number | '';
    peso_drenado_min: number | '';
    peso_drenado_max: number | '';
  };

  type EditablePesoNetoConfig = {
    peso_neto_declarado: number | '';
  };

  type EditableTemperaturasConfig = Omit<ProductTemperaturasConfig, 'temperatura_min' | 'temperatura_max'> & {
    temperatura_min: number | '';
    temperatura_max: number | '';
  };

  type EditableCalidadRangosConfig = Omit<ProductCalidadRangosConfig,
    | 'brix_min'
    | 'brix_max'
    | 'ph_min'
    | 'ph_max'
    | 'acidez_min'
    | 'acidez_max'
    | 'consistencia_min'
    | 'consistencia_max'
    | 'ppm_so2_min'
    | 'ppm_so2_max'
  > & {
    brix_min: number | '';
    brix_max: number | '';
    ph_min: number | '';
    ph_max: number | '';
    acidez_min: number | '';
    acidez_max: number | '';
    consistencia_min: number | '';
    consistencia_max: number | '';
    ppm_so2_min: number | '';
    ppm_so2_max: number | '';
  };

  const [pesosDrenadosConfigList, setPesosDrenadosConfigList] = useState<EditablePesosDrenadosConfig[]>([]);
  const [pesoNetoConfigList, setPesoNetoConfigList] = useState<EditablePesoNetoConfig[]>([]);
  const [temperaturasConfigList, setTemperaturasConfigList] = useState<EditableTemperaturasConfig[]>([]);
  const [calidadRangosConfigList, setCalidadRangosConfigList] = useState<EditableCalidadRangosConfig[]>([]);
  const [vaciosManualMode, setVaciosManualMode] = useState<Record<number, boolean>>({});
  const [vaciosManualValue, setVaciosManualValue] = useState<Record<number, string>>({});

  const vaciosPreset = ['>2', '>4', '>6', '>10'];

  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      type: 'product',
      name: '',
      categoryId: undefined,
      id: '',
      pesosConfig: [],
      temperaturasConfig: [],
      calidadRangosConfig: [],
    },
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      if (initialData.pesosConfig) {
        const drenados = (initialData.pesosConfig as any[]).map((cfg) => ({
          envase_tipo: cfg.envase_tipo ?? '',
          peso_drenado_declarado: cfg.peso_drenado_declarado ?? '',
          peso_drenado_min: cfg.peso_drenado_min ?? '',
          peso_drenado_max: cfg.peso_drenado_max ?? '',
          categoria_id: cfg.categoria_id,
        }));
        setPesosDrenadosConfigList(drenados);

        const firstNeto = (initialData.pesosConfig as any[]).find(
          (cfg) => cfg?.peso_neto_declarado !== null && cfg?.peso_neto_declarado !== undefined
        );
        if (firstNeto) {
          setPesoNetoConfigList([
            {
              peso_neto_declarado: firstNeto.peso_neto_declarado ?? '',
            },
          ]);
        } else {
          setPesoNetoConfigList([]);
        }
      }
      if (initialData.temperaturasConfig) {
        setTemperaturasConfigList(initialData.temperaturasConfig as any);
      }
      if (initialData.calidadRangosConfig) {
        setCalidadRangosConfigList(initialData.calidadRangosConfig as any);
        const nextVaciosMode: Record<number, boolean> = {};
        const nextVaciosValue: Record<number, string> = {};

        initialData.calidadRangosConfig.forEach((cfg: any, idx: number) => {
          const vac = typeof cfg?.vacios === 'string' ? cfg.vacios : '';

          if (vac && !vaciosPreset.includes(vac)) {
            nextVaciosMode[idx] = true;
            nextVaciosValue[idx] = vac;
          }
        });
        setVaciosManualMode(nextVaciosMode);
        setVaciosManualValue(nextVaciosValue);
      }
    } else {
      form.reset({
        type: 'product',
        name: '',
        categoryId: undefined,
        id: '',
        pesosConfig: [],
        temperaturasConfig: [],
        calidadRangosConfig: [],
      });
      setPesosDrenadosConfigList([]);
      setPesoNetoConfigList([]);
      setTemperaturasConfigList([]);
      setCalidadRangosConfigList([]);
      setVaciosManualMode({});
      setVaciosManualValue({});
    }
  }, [initialData, form]);

  // Funciones para manejar configuración de pesos drenados
  const addPesoDrenadoConfig = () => {
    const newConfig: EditablePesosDrenadosConfig = {
      envase_tipo: '',
      peso_drenado_declarado: '',
      peso_drenado_min: '',
      peso_drenado_max: '',
    };
    setPesosDrenadosConfigList([...pesosDrenadosConfigList, newConfig]);
  };

  const updatePesoDrenadoConfig = (index: number, field: keyof EditablePesosDrenadosConfig, value: any) => {
    const updated = [...pesosDrenadosConfigList];
    updated[index] = { ...updated[index], [field]: value };
    setPesosDrenadosConfigList(updated);
  };

  const removePesoDrenadoConfig = (index: number) => {
    setPesosDrenadosConfigList(pesosDrenadosConfigList.filter((_, i) => i !== index));
  };

  // Funciones para manejar configuración de peso neto
  const addPesoNetoConfig = () => {
    const newConfig: EditablePesoNetoConfig = {
      peso_neto_declarado: '',
    };
    setPesoNetoConfigList([newConfig]);
  };

  const updatePesoNetoConfig = (index: number, field: keyof EditablePesoNetoConfig, value: any) => {
    const updated = [...pesoNetoConfigList];
    updated[index] = { ...updated[index], [field]: value };
    setPesoNetoConfigList(updated);
  };

  const removePesoNetoConfig = (index: number) => {
    setPesoNetoConfigList(pesoNetoConfigList.filter((_, i) => i !== index));
  };

  // Funciones para manejar configuración de temperaturas
  const addTemperaturaConfig = () => {
    const newConfig: EditableTemperaturasConfig = {
      envase_tipo: '',
      temperatura_min: '',
      temperatura_max: '',
    };
    setTemperaturasConfigList([...temperaturasConfigList, newConfig]);
  };

  const updateTemperaturaConfig = (index: number, field: keyof EditableTemperaturasConfig, value: any) => {
    const updated = [...temperaturasConfigList];
    updated[index] = { ...updated[index], [field]: value };
    setTemperaturasConfigList(updated);
  };

  const removeTemperaturaConfig = (index: number) => {
    setTemperaturasConfigList(temperaturasConfigList.filter((_, i) => i !== index));
  };

  // Funciones para manejar configuración de rangos de calidad
  const addCalidadRangosConfig = () => {
    const newConfig: EditableCalidadRangosConfig = {
      envase_tipo: 'General',
      referencia: '',
      vacios: '',
      brix_min: '',
      brix_max: '',
      ph_min: '',
      ph_max: '',
      acidez_min: '',
      acidez_max: '',
      consistencia_min: '',
      consistencia_max: '',
      ppm_so2_min: '',
      ppm_so2_max: '',
    };
    setCalidadRangosConfigList([...calidadRangosConfigList, newConfig]);
  };

  const updateCalidadRangosConfig = (index: number, field: keyof EditableCalidadRangosConfig, value: any) => {
    const updated = [...calidadRangosConfigList];
    updated[index] = { ...updated[index], [field]: value };
    setCalidadRangosConfigList(updated);
  };

  const removeCalidadRangosConfig = (index: number) => {
    setCalidadRangosConfigList(calidadRangosConfigList.filter((_, i) => i !== index));
    setVaciosManualMode((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setVaciosManualValue((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

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
        });
      }
      setIsCodeDuplicate(false);
    }
  }, [isOpen, initialData, form]);

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
      
      // Validar configuración de pesos drenados si hay datos
      if (pesosDrenadosConfigList.length > 0) {
        const invalidPeso = pesosDrenadosConfigList.find(config => 
          !config.envase_tipo.trim() || 
          (config.peso_drenado_min !== '' && config.peso_drenado_max !== '' && Number(config.peso_drenado_min) > Number(config.peso_drenado_max)) ||
          (config.peso_drenado_declarado !== '' && Number(config.peso_drenado_declarado) < 0)
        );
        if (invalidPeso) {
          toast({
            title: "Error en configuración de pesos drenados",
            description: "Verifique los datos. El peso mínimo no puede ser mayor al máximo.",
            variant: "destructive",
          });
          return;
        }
      }

      // Validar configuración de peso neto si hay datos
      if (pesoNetoConfigList.length > 0) {
        const invalidPesoNeto = pesoNetoConfigList.find(config =>
          (config.peso_neto_declarado !== '' && Number(config.peso_neto_declarado) < 0)
        );
        if (invalidPesoNeto) {
          toast({
            title: "Error en configuración de peso neto",
            description: "Verifique los datos de peso neto.",
            variant: "destructive",
          });
          return;
        }
      }

      // Validar configuración de temperaturas si hay datos
      if (temperaturasConfigList.length > 0) {
        const invalidTemp = temperaturasConfigList.find(config => 
          !config.envase_tipo.trim() || 
          config.temperatura_min === '' ||
          config.temperatura_max === '' ||
          Number(config.temperatura_min) > Number(config.temperatura_max)
        );
        if (invalidTemp) {
          toast({
            title: "Error en configuración de temperaturas",
            description: "Verifique los datos de temperaturas. La temperatura mínima no puede ser mayor a la máxima.",
            variant: "destructive",
          });
          return;
        }
      }

      // Validar configuración de rangos de calidad si hay datos
      if (calidadRangosConfigList.length > 0) {
        const invalidRango = calidadRangosConfigList.find(config => 
          !config.envase_tipo.trim() || 
          (config.brix_min !== '' && config.brix_max !== '' && Number(config.brix_min) > Number(config.brix_max)) ||
          (config.ph_min !== '' && config.ph_max !== '' && Number(config.ph_min) > Number(config.ph_max)) ||
          (config.acidez_min !== '' && config.acidez_max !== '' && Number(config.acidez_min) > Number(config.acidez_max)) ||
          (config.consistencia_min !== '' && config.consistencia_max !== '' && Number(config.consistencia_min) > Number(config.consistencia_max)) ||
          (config.ppm_so2_min !== '' && config.ppm_so2_max !== '' && Number(config.ppm_so2_min) > Number(config.ppm_so2_max))
        );
        if (invalidRango) {
          toast({
            title: "Error en configuración de rangos de calidad",
            description: "Verifique los datos de rangos. Los valores mínimos no pueden ser mayores a los máximos.",
            variant: "destructive",
          });
          return;
        }
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

      const pesosMergedByEnvase = new Map<string, any>();

      pesosDrenadosConfigList.forEach((p) => {
        const key = String(p.envase_tipo ?? '').trim();
        if (!key) return;

        const prev = pesosMergedByEnvase.get(key) ?? { envase_tipo: key };
        pesosMergedByEnvase.set(key, {
          ...prev,
          envase_tipo: key,
          peso_drenado_declarado: p.peso_drenado_declarado === '' ? null : Number(p.peso_drenado_declarado),
          peso_drenado_min: p.peso_drenado_min === '' ? null : Number(p.peso_drenado_min),
          peso_drenado_max: p.peso_drenado_max === '' ? null : Number(p.peso_drenado_max),
        });
      });

      pesoNetoConfigList.forEach((p) => {
        const neto = p.peso_neto_declarado === '' ? null : Number(p.peso_neto_declarado);

        // Si ya hay envases drenados, aplicar el neto a todos
        if (pesosMergedByEnvase.size > 0) {
          for (const [key, prev] of pesosMergedByEnvase.entries()) {
            pesosMergedByEnvase.set(key, {
              ...prev,
              peso_neto_declarado: neto,
            });
          }
          return;
        }

        // Si no hay drenados, guardar una entrada "General" para mantener compatibilidad con el schema del backend
        pesosMergedByEnvase.set('General', {
          envase_tipo: 'General',
          peso_neto_declarado: neto,
        });
      });

      const valuesWithConfig: AddItemFormValues = {
        ...values,
        pesosConfig: Array.from(pesosMergedByEnvase.values()) as any,
        temperaturasConfig: temperaturasConfigList.map((t) => ({
          ...t,
          temperatura_min: t.temperatura_min === '' ? null : Number(t.temperatura_min),
          temperatura_max: t.temperatura_max === '' ? null : Number(t.temperatura_max),
        })) as any,
        calidadRangosConfig: calidadRangosConfigList.map((c) => ({
          ...c,
          brix_min: c.brix_min === '' ? null : Number(c.brix_min),
          brix_max: c.brix_max === '' ? null : Number(c.brix_max),
          ph_min: c.ph_min === '' ? null : Number(c.ph_min),
          ph_max: c.ph_max === '' ? null : Number(c.ph_max),
          acidez_min: c.acidez_min === '' ? null : Number(c.acidez_min),
          acidez_max: c.acidez_max === '' ? null : Number(c.acidez_max),
          consistencia_min: c.consistencia_min === '' ? null : Number(c.consistencia_min),
          consistencia_max: c.consistencia_max === '' ? null : Number(c.consistencia_max),
          ppm_so2_min: c.ppm_so2_min === '' ? null : Number(c.ppm_so2_min),
          ppm_so2_max: c.ppm_so2_max === '' ? null : Number(c.ppm_so2_max),
        })) as any,
      };

      await onSave(valuesWithConfig, initialData);
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
        description: error instanceof Error ? error.message : "No se pudo guardar el elemento. Intente nuevamente.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Elemento' : 'Añadir a la Lista'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifique los detalles del elemento.'
              : 'Añada un nuevo producto (subcategoría) a una categoría existente, o cree una nueva categoría.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
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
                        <Input placeholder="Nombre de la categoría" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Sección de configuración para productos */}
            {(addType === 'product' || addType === 'produccion' || addType === 'embalaje') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuración del Producto
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfig(!showConfig)}
                  >
                    {showConfig ? 'Ocultar' : 'Mostrar'} Configuración
                  </Button>
                </div>

                {showConfig && (
                  <div className="space-y-6">
                    {/* Configuración de Pesos Drenados */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Configuración de Pesos Drenados</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {pesosDrenadosConfigList.map((config, index) => (
                          <div key={`pesos-drenados-${config.envase_tipo || index}-${index}`} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Configuración #{index + 1}</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removePesoDrenadoConfig(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Tipo de Envase</Label>
                                <Select
                                  value={config.envase_tipo}
                                  onValueChange={(value) => updatePesoDrenadoConfig(index, 'envase_tipo', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione tipo de envase" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Vidrio">Vidrio</SelectItem>
                                    <SelectItem value="PET">PET</SelectItem>
                                    <SelectItem value="Lata">Lata</SelectItem>
                                    <SelectItem value="Bolsa">Bolsa</SelectItem>
                                    <SelectItem value="Doypack">Doypack</SelectItem>
                                    <SelectItem value="Caja">Caja</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label>Peso Drenado Declarado (g)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={config.peso_drenado_declarado}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    updatePesoDrenadoConfig(index, 'peso_drenado_declarado', v === '' ? '' : parseFloat(v));
                                  }}
                                />
                              </div>
                              
                              <div>
                                <Label>Peso Drenado Mínimo (g)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={config.peso_drenado_min}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    updatePesoDrenadoConfig(index, 'peso_drenado_min', v === '' ? '' : parseFloat(v));
                                  }}
                                />
                              </div>
                              
                              <div>
                                <Label>Peso Drenado Máximo (g)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={config.peso_drenado_max}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    updatePesoDrenadoConfig(index, 'peso_drenado_max', v === '' ? '' : parseFloat(v));
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addPesoDrenadoConfig}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Configuración de Pesos Drenados
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Configuración de Peso Neto */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Configuración de Peso Neto</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {pesoNetoConfigList.map((config, index) => (
                          <div key={`peso-neto-${config.envase_tipo || index}-${index}`} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Configuración #{index + 1}</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removePesoNetoConfig(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div>
                              <Label>Peso Neto Declarado (g)(ml)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={config.peso_neto_declarado}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updatePesoNetoConfig(index, 'peso_neto_declarado', v === '' ? '' : parseFloat(v));
                                }}
                              />
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={addPesoNetoConfig}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Configuración de Peso Neto
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Configuración de Temperaturas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Configuración de Temperaturas de Envasado</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {temperaturasConfigList.map((config, index) => (
                          <div key={`temperatura-${config.equipo || index}-${index}`} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Temperatura #{index + 1}</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTemperaturaConfig(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label>Tipo de Envase</Label>
                                <Select
                                  value={config.envase_tipo}
                                  onValueChange={(value) => updateTemperaturaConfig(index, 'envase_tipo', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione tipo de envase" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Vidrio">Vidrio</SelectItem>
                                    <SelectItem value="PET">PET</SelectItem>
                                    <SelectItem value="Lata">Lata</SelectItem>
                                    <SelectItem value="Bolsa">Bolsa</SelectItem>
                                    <SelectItem value="Doypack">Doypack</SelectItem>
                                    <SelectItem value="Caja">Caja</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label>Temperatura Mínima (°C)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={config.temperatura_min}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    updateTemperaturaConfig(index, 'temperatura_min', v === '' ? '' : parseFloat(v));
                                  }}
                                />
                              </div>
                              
                              <div>
                                <Label>Temperatura Máxima (°C)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={config.temperatura_max}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    updateTemperaturaConfig(index, 'temperatura_max', v === '' ? '' : parseFloat(v));
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTemperaturaConfig}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Configuración de Temperaturas
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Configuración de Rangos de Calidad */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Configuración de Rangos de Calidad</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {calidadRangosConfigList.map((config, index) => (
                          <div key={`calidad-rangos-${(config as any).parametro || 'item'}-${index}`} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Rango de Calidad #{index + 1}</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeCalidadRangosConfig(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label>Vacíos</Label>
                                <Select
                                  value={
                                    vaciosManualMode[index]
                                      ? '__other__'
                                      : config.vacios
                                        ? config.vacios
                                        : ''
                                  }
                                  onValueChange={(value) => {
                                    if (value === '__other__') {
                                      setVaciosManualMode((prev) => ({ ...prev, [index]: true }));
                                      const existing = vaciosManualValue[index] || '';
                                      updateCalidadRangosConfig(index, 'vacios', existing);
                                      return;
                                    }
                                    setVaciosManualMode((prev) => ({ ...prev, [index]: false }));
                                    setVaciosManualValue((prev) => {
                                      const next = { ...prev };
                                      delete next[index];
                                      return next;
                                    });
                                    updateCalidadRangosConfig(index, 'vacios', value);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione vacíos" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vaciosPreset.map((v) => (
                                      <SelectItem key={v} value={v}>
                                        {v}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="__other__">Otro</SelectItem>
                                  </SelectContent>
                                </Select>
                                {vaciosManualMode[index] && (
                                  <Input
                                    className="mt-2"
                                    value={vaciosManualValue[index] ?? (config.vacios || '')}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setVaciosManualValue((prev) => ({ ...prev, [index]: v }));
                                      updateCalidadRangosConfig(index, 'vacios', v);
                                    }}
                                    placeholder="Escriba el valor de vacíos"
                                  />
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Brix (%)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Mínimo</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={config.brix_min}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateCalidadRangosConfig(index, 'brix_min', v === '' ? '' : parseFloat(v));
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Máximo</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={config.brix_max}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateCalidadRangosConfig(index, 'brix_max', v === '' ? '' : parseFloat(v));
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Label>pH</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Mínimo</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={config.ph_min}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateCalidadRangosConfig(index, 'ph_min', v === '' ? '' : parseFloat(v));
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Máximo</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={config.ph_max}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateCalidadRangosConfig(index, 'ph_max', v === '' ? '' : parseFloat(v));
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Label>Acidez (%)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Mínimo</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={config.acidez_min}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateCalidadRangosConfig(index, 'acidez_min', v === '' ? '' : parseFloat(v));
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Máximo</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={config.acidez_max}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateCalidadRangosConfig(index, 'acidez_max', v === '' ? '' : parseFloat(v));
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Label>Consistencia</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Mínimo</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={config.consistencia_min}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateCalidadRangosConfig(index, 'consistencia_min', v === '' ? '' : parseFloat(v));
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Máximo</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={config.consistencia_max}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateCalidadRangosConfig(index, 'consistencia_max', v === '' ? '' : parseFloat(v));
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Label>PPM SO2</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Mínimo</Label>
                                    <Input
                                      type="number"
                                      step="1"
                                      value={config.ppm_so2_min}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateCalidadRangosConfig(index, 'ppm_so2_min', v === '' ? '' : parseFloat(v));
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Máximo</Label>
                                    <Input
                                      type="number"
                                      step="1"
                                      value={config.ppm_so2_max}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        updateCalidadRangosConfig(index, 'ppm_so2_max', v === '' ? '' : parseFloat(v));
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addCalidadRangosConfig}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Configuración de Rangos de Calidad
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isCodeDuplicate || isCheckingCode}
                className={isCodeDuplicate ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                {isCodeDuplicate ? 'Código Duplicado' : isEditing ? 'Guardar Cambios' : 'Añadir'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
