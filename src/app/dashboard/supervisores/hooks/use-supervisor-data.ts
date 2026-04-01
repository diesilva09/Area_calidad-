import { startTransition, useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getProductCategories, 
  categoryService, 
  productService, 
  type Product, 
  type ProductCategory 
} from '@/lib/supervisores-data';
import { embalajeRecordsService, type EmbalajeRecord } from '@/lib/embalaje-records-service';
import { limpiezaTasksService, type LimpiezaTask } from '@/lib/limpieza-tasks-service';
import { limpiezaRegistrosService, type LimpiezaRegistro } from '@/lib/limpieza-registros-service';

export interface SupervisorData {
  categories: ProductCategory[];
  embalajeRecords: EmbalajeRecord[];
  limpiezaTasks: LimpiezaTask[];
  limpiezaRegistros: LimpiezaRegistro[];
  equiposNombres: Record<string, string>;
}

export interface SupervisorHandlers {
  // Categories
  handleCreateCategory: (category: ProductCategory) => Promise<void>;
  handleEditCategory: (category: ProductCategory) => Promise<void>;
  handleDeleteCategory: (categoryId: string) => Promise<void>;
  
  // Products
  handleCreateProduct: (product: Product) => Promise<void>;
  handleEditProduct: (product: Product) => Promise<void>;
  handleDeleteProduct: (productId: string) => Promise<void>;
  
  // Embalaje Records
  handleCreateEmbalajeRecord: (record: Omit<EmbalajeRecord, 'id'>) => Promise<void>;
  handleEditEmbalajeRecord: (record: EmbalajeRecord) => Promise<void>;
  handleDeleteEmbalajeRecord: (recordId: string) => Promise<void>;
  
  // Limpieza Tasks
  handleCreateLimpiezaTask: (task: Omit<LimpiezaTask, 'id'>) => Promise<void>;
  handleEditLimpiezaTask: (task: LimpiezaTask) => Promise<void>;
  handleDeleteLimpiezaTask: (taskId: string) => Promise<void>;
  handleCompleteTask: (taskId: string) => Promise<void>;
}

export function useSupervisorData() {
  const { toast } = useToast();
  
  // Data state
  const [data, setData] = useState<SupervisorData>({
    categories: [],
    embalajeRecords: [],
    limpiezaTasks: [],
    limpiezaRegistros: [],
    equiposNombres: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadData = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? false;
    try {
      if (showLoading) setLoading(true);
      if (showLoading) {
        setError(null);
      } else {
        startTransition(() => setError(null));
      }
      
      const [
        categoriesResult,
        embalajeRecordsResult,
        limpiezaTasksResult,
        limpiezaRegistrosResult
      ] = await Promise.allSettled([
        getProductCategories(),
        embalajeRecordsService.getAll(),
        limpiezaTasksService.getAll(),
        limpiezaRegistrosService.getAll()
      ]);

      // Process results
      const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
      const embalajeRecords = embalajeRecordsResult.status === 'fulfilled' ? embalajeRecordsResult.value : [];
      const limpiezaTasks = limpiezaTasksResult.status === 'fulfilled' ? limpiezaTasksResult.value : [];
      const limpiezaRegistros = limpiezaRegistrosResult.status === 'fulfilled' ? limpiezaRegistrosResult.value : [];

      // Log errors if any
      if (categoriesResult.status === 'rejected') {
        console.error('Error loading categories:', categoriesResult.reason);
      }
      if (embalajeRecordsResult.status === 'rejected') {
        console.error('Error loading embalaje records:', embalajeRecordsResult.reason);
      }
      if (limpiezaTasksResult.status === 'rejected') {
        console.error('Error loading limpieza tasks:', limpiezaTasksResult.reason);
      }
      if (limpiezaRegistrosResult.status === 'rejected') {
        console.error('Error loading limpieza registros:', limpiezaRegistrosResult.reason);
      }

      const nextData: SupervisorData = {
        categories,
        embalajeRecords,
        limpiezaTasks,
        limpiezaRegistros,
        equiposNombres: {}, // TODO: Load equipment names
      };

      if (showLoading) {
        setData(nextData);
      } else {
        startTransition(() => setData(nextData));
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      if (showLoading) {
        setError(errorMessage);
      } else {
        startTransition(() => setError(errorMessage));
      }
      toast({
        title: "Error al cargar datos",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    loadData({ showLoading: true });
  }, [loadData]);

  // Category handlers
  const handleCreateCategory = useCallback(async (category: ProductCategory) => {
    try {
      await categoryService.create(category);
      await loadData();
      toast({
        title: "Categoría creada",
        description: `La categoría "${category.name}" ha sido creada exitosamente.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al crear categoría",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  const handleEditCategory = useCallback(async (category: ProductCategory) => {
    try {
      await categoryService.update(category.id, category);
      await loadData();
      toast({
        title: "Categoría actualizada",
        description: `La categoría "${category.name}" ha sido actualizada exitosamente.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al actualizar categoría",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    try {
      await categoryService.delete(categoryId);
      await loadData();
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al eliminar categoría",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  // Product handlers
  const handleCreateProduct = useCallback(async (product: Product) => {
    try {
      await productService.create(product);
      await loadData();
      toast({
        title: "Producto creado",
        description: `El producto "${product.name}" ha sido creado exitosamente.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al crear producto",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  const handleEditProduct = useCallback(async (product: Product) => {
    try {
      await productService.update(product.id, product as any, (product as any).oldCategoryId ?? product.category_id);
      await loadData();
      toast({
        title: "Producto actualizado",
        description: `El producto "${product.name}" ha sido actualizado exitosamente.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al actualizar producto",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      await productService.delete(productId);
      await loadData();
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al eliminar producto",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  // Embalaje record handlers
  const handleCreateEmbalajeRecord = useCallback(async (record: Omit<EmbalajeRecord, 'id'>) => {
    try {
      await embalajeRecordsService.create(record);
      await loadData();
      toast({
        title: "Registro de embalaje creado",
        description: "El registro ha sido creado exitosamente.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al crear registro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  const handleEditEmbalajeRecord = useCallback(async (record: EmbalajeRecord) => {
    try {
      await embalajeRecordsService.update(record.id, record);
      await loadData();
      toast({
        title: "Registro actualizado",
        description: "El registro ha sido actualizado exitosamente.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al actualizar registro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  const handleDeleteEmbalajeRecord = useCallback(async (recordId: string) => {
    try {
      await embalajeRecordsService.delete(recordId);
      await loadData();
      toast({
        title: "Registro eliminado",
        description: "El registro ha sido eliminado exitosamente.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al eliminar registro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  // Limpieza task handlers
  const handleCreateLimpiezaTask = useCallback(async (task: Omit<LimpiezaTask, 'id'>) => {
    try {
      await limpiezaTasksService.create(task);
      await loadData();
      toast({
        title: "Tarea de limpieza creada",
        description: "La tarea ha sido creada exitosamente.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al crear tarea",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  const handleEditLimpiezaTask = useCallback(async (task: LimpiezaTask) => {
    try {
      await limpiezaTasksService.update(task.id, task);
      await loadData();
      toast({
        title: "Tarea actualizada",
        description: "La tarea ha sido actualizada exitosamente.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al actualizar tarea",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  const handleDeleteLimpiezaTask = useCallback(async (taskId: string) => {
    try {
      await limpiezaTasksService.delete(Number(taskId));
      await loadData();
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada exitosamente.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al eliminar tarea",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      await limpiezaTasksService.markAsCompleted(Number(taskId));
      await loadData();
      toast({
        title: "Tarea completada",
        description: "La tarea ha sido marcada como completada.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al completar tarea",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [loadData, toast]);


  const handlers: SupervisorHandlers = {
    handleCreateCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleCreateProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleCreateEmbalajeRecord,
    handleEditEmbalajeRecord,
    handleDeleteEmbalajeRecord,
    handleCreateLimpiezaTask,
    handleEditLimpiezaTask,
    handleDeleteLimpiezaTask,
    handleCompleteTask,
  };

  return {
    data,
    loading,
    error,
    handlers,
    refresh: loadData
  };
}
