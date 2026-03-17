import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  SUPERVISOR_CONFIG, 
  SupervisorError, 
  SupervisorErrorType, 
  SupervisorErrorUtils,
  SupervisorValidationUtils,
  SupervisorBaseHook
} from '../lib/supervisor-config';
import { 
  getProductCategories, 
  categoryService, 
  productService, 
  type Product, 
  type ProductCategory 
} from '@/lib/supervisores-data';
import { embalajeRecordsService, type EmbalajeRecord } from '@/lib/embalaje-records-service';
import { limpiezaTasksService, type LimpiezaTask } from '@/lib/limpieza-tasks-service';
import { limpiezaVerificationsService, type LimpiezaVerification } from '@/lib/limpieza-verifications-service';

export interface SupervisorData {
  categories: ProductCategory[];
  embalajeRecords: EmbalajeRecord[];
  limpiezaTasks: LimpiezaTask[];
  limpiezaVerifications: LimpiezaVerification[];
  equiposNombres: Record<string, string>;
  loading: boolean;
  error: SupervisorError | null;
}

export interface SupervisorStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  totalVerifications: number;
  pendingVerifications: number;
  completedVerifications: number;
  totalProducts: number;
  totalCategories: number;
}

export interface SupervisorHandlers {
  // Categories
  handleCreateCategory: (category: Omit<ProductCategory, 'id'>) => Promise<boolean>;
  handleEditCategory: (category: ProductCategory) => Promise<boolean>;
  handleDeleteCategory: (categoryId: string) => Promise<boolean>;
  
  // Products
  handleCreateProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  handleEditProduct: (product: Product) => Promise<boolean>;
  handleDeleteProduct: (productId: string) => Promise<boolean>;
  
  // Embalaje Records
  handleCreateEmbalajeRecord: (record: Omit<EmbalajeRecord, 'id'>) => Promise<boolean>;
  handleEditEmbalajeRecord: (record: EmbalajeRecord) => Promise<boolean>;
  handleDeleteEmbalajeRecord: (recordId: string) => Promise<boolean>;
  
  // Limpieza Tasks
  handleCreateLimpiezaTask: (task: Omit<LimpiezaTask, 'id'>) => Promise<boolean>;
  handleEditLimpiezaTask: (task: LimpiezaTask) => Promise<boolean>;
  handleDeleteLimpiezaTask: (taskId: string) => Promise<boolean>;
  handleCompleteTask: (taskId: string) => Promise<boolean>;
  
  // Limpieza Verifications
  handleCreateLimpiezaVerification: (verification: Omit<LimpiezaVerification, 'id'>) => Promise<boolean>;
  handleEditLimpiezaVerification: (verification: LimpiezaVerification) => Promise<boolean>;
  handleDeleteLimpiezaVerification: (verificationId: string) => Promise<boolean>;
}

export function useSupervisorData() {
  const { toast } = useToast();
  
  // Data state
  const [data, setData] = useState<Omit<SupervisorData, 'loading' | 'error'>>({
    categories: [],
    embalajeRecords: [],
    limpiezaTasks: [],
    limpiezaVerifications: [],
    equiposNombres: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SupervisorError | null>(null);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading supervisor data...');
      
      const [
        categoriesResult,
        embalajeRecordsResult,
        limpiezaTasksResult,
        limpiezaVerificationsResult
      ] = await Promise.allSettled([
        getProductCategories(),
        embalajeRecordsService.getAll(),
        limpiezaTasksService.getAll(),
        limpiezaVerificationsService.getAll()
      ]);

      // Process results with error logging
      const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
      const embalajeRecords = embalajeRecordsResult.status === 'fulfilled' ? embalajeRecordsResult.value : [];
      const limpiezaTasks = limpiezaTasksResult.status === 'fulfilled' ? limpiezaTasksResult.value : [];
      const limpiezaVerifications = limpiezaVerificationsResult.status === 'fulfilled' ? limpiezaVerificationsResult.value : [];

      // Log errors for debugging
      if (categoriesResult.status === 'rejected') {
        console.error('❌ Error loading categories:', categoriesResult.reason);
      }
      if (embalajeRecordsResult.status === 'rejected') {
        console.error('❌ Error loading embalaje records:', embalajeRecordsResult.reason);
      }
      if (limpiezaTasksResult.status === 'rejected') {
        console.error('❌ Error loading limpieza tasks:', limpiezaTasksResult.reason);
      }
      if (limpiezaVerificationsResult.status === 'rejected') {
        console.error('❌ Error loading limpieza verifications:', limpiezaVerificationsResult.reason);
      }

      setData({
        categories,
        embalajeRecords,
        limpiezaTasks,
        limpiezaVerifications,
        equiposNombres: {} // TODO: Implement equipment names loading
      });
      
      console.log('✅ Supervisor data loaded successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      const supervisorError = SupervisorErrorUtils.createError(
        SupervisorErrorType.SERVER_ERROR,
        errorMessage,
        { originalError: err }
      );
      
      setError(supervisorError);
      toast({
        title: "Error al cargar datos",
        description: SupervisorErrorUtils.getErrorMessage(supervisorError),
        variant: "destructive",
      });
      
      console.error('❌ Critical error loading supervisor data:', err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Validation helpers
  const validateCategory = useCallback((category: Omit<ProductCategory, 'id'>): string[] => {
    const errors: string[] = [];
    
    const nameError = SupervisorValidationUtils.validateRequired(category.name, 'nombre');
    if (nameError) errors.push(nameError);
    
    const typeError = SupervisorValidationUtils.validateRequired(category.type, 'tipo');
    if (typeError) errors.push(typeError);
    
    const nameLengthError = SupervisorValidationUtils.validateMaxLength(
      category.name, 
      SUPERVISOR_CONFIG.MAX_CHARACTERS_IN_TEXTAREA, 
      'nombre'
    );
    if (nameLengthError) errors.push(nameLengthError);
    
    return errors;
  }, []);

  const validateProduct = useCallback((product: Omit<Product, 'id'>): string[] => {
    const errors: string[] = [];
    
    const nameError = SupervisorValidationUtils.validateRequired(product.name, 'nombre');
    if (nameError) errors.push(nameError);
    
    const idError = SupervisorValidationUtils.validateRequired(product.id, 'ID');
    if (idError) errors.push(idError);
    
    const categoryError = SupervisorValidationUtils.validateRequired(product.category_id, 'categoría');
    if (categoryError) errors.push(categoryError);
    
    return errors;
  }, []);

  // Generic handler with validation and error handling
  const createHandler = useCallback(<T extends Record<string, any>>(
    operation: (data: T) => Promise<void>,
    validator: (data: T) => string[],
    successMessage: string,
    context: string
  ) => {
    return async (data: T): Promise<boolean> => {
      try {
        // Validate data
        const validationErrors = validator(data);
        if (validationErrors.length > 0) {
          toast({
            title: "Error de validación",
            description: validationErrors.join(', '),
            variant: "destructive",
          });
          return false;
        }

        // Execute operation
        await operation(data);
        await loadData();
        
        toast({
          title: "Operación exitosa",
          description: successMessage,
        });
        
        console.log(`✅ ${context} completed successfully`);
        return true;
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        const supervisorError = SupervisorErrorUtils.createError(
          SupervisorErrorType.SERVER_ERROR,
          errorMessage,
          { originalError: err }
        );
        
        toast({
          title: "Error en la operación",
          description: SupervisorErrorUtils.getErrorMessage(supervisorError),
          variant: "destructive",
        });
        
        console.error(`❌ Error in ${context}:`, err);
        return false;
      }
    };
  }, [loadData, toast]);

  // Category handlers
  const handleCreateCategory = useCallback(
    createHandler(
      categoryService.create,
      validateCategory,
      "La categoría ha sido creada exitosamente.",
      "Create Category"
    ),
    [createHandler, validateCategory]
  );

  const handleEditCategory = useCallback(
    createHandler(
      (category: ProductCategory) => categoryService.update(category.id, category),
      (category: ProductCategory) => validateCategory(category),
      "La categoría ha sido actualizada exitosamente.",
      "Edit Category"
    ),
    [createHandler, validateCategory]
  );

  const handleDeleteCategory = useCallback(async (categoryId: string): Promise<boolean> => {
    try {
      await categoryService.delete(categoryId);
      await loadData();
      
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente.",
      });
      
      console.log(`✅ Category ${categoryId} deleted successfully`);
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      const supervisorError = SupervisorErrorUtils.createError(
        SupervisorErrorType.SERVER_ERROR,
        errorMessage,
        { originalError: err }
      );
      
      toast({
        title: "Error al eliminar categoría",
        description: SupervisorErrorUtils.getErrorMessage(supervisorError),
        variant: "destructive",
      });
      
      console.error(`❌ Error deleting category ${categoryId}:`, err);
      return false;
    }
  }, [loadData, toast]);

  // Product handlers
  const handleCreateProduct = useCallback(
    createHandler(
      productService.create,
      validateProduct,
      "El producto ha sido creado exitosamente.",
      "Create Product"
    ),
    [createHandler, validateProduct]
  );

  const handleEditProduct = useCallback(
    createHandler(
      (product: Product) => productService.update(product.id, product),
      (product: Product) => validateProduct(product),
      "El producto ha sido actualizado exitosamente.",
      "Edit Product"
    ),
    [createHandler, validateProduct]
  );

  const handleDeleteProduct = useCallback(async (productId: string): Promise<boolean> => {
    try {
      await productService.delete(productId);
      await loadData();
      
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente.",
      });
      
      console.log(`✅ Product ${productId} deleted successfully`);
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      const supervisorError = SupervisorErrorUtils.createError(
        SupervisorErrorType.SERVER_ERROR,
        errorMessage,
        { originalError: err }
      );
      
      toast({
        title: "Error al eliminar producto",
        description: SupervisorErrorUtils.getErrorMessage(supervisorError),
        variant: "destructive",
      });
      
      console.error(`❌ Error deleting product ${productId}:`, err);
      return false;
    }
  }, [loadData, toast]);

  // Calculate statistics
  const stats = useMemo((): SupervisorStats => {
    const totalTasks = data.limpiezaTasks.length;
    const pendingTasks = data.limpiezaTasks.filter(task => task.status === 'pending').length;
    const completedTasks = data.limpiezaTasks.filter(task => task.status === 'completed').length;
    
    const totalVerifications = data.limpiezaVerifications.length;
    const pendingVerifications = data.limpiezaVerifications.filter(v => v.status === 'pending').length;
    const completedVerifications = data.limpiezaVerifications.filter(v => v.status === 'completed').length;
    
    const totalProducts = data.categories.reduce((sum, cat) => sum + (cat.products?.length || 0), 0);
    const totalCategories = data.categories.length;

    return {
      totalTasks,
      pendingTasks,
      completedTasks,
      totalVerifications,
      pendingVerifications,
      completedVerifications,
      totalProducts,
      totalCategories
    };
  }, [data]);

  const handlers: SupervisorHandlers = {
    handleCreateCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleCreateProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleCreateEmbalajeRecord: async () => false, // TODO: Implement
    handleEditEmbalajeRecord: async () => false, // TODO: Implement
    handleDeleteEmbalajeRecord: async () => false, // TODO: Implement
    handleCreateLimpiezaTask: async () => false, // TODO: Implement
    handleEditLimpiezaTask: async () => false, // TODO: Implement
    handleDeleteLimpiezaTask: async () => false, // TODO: Implement
    handleCompleteTask: async () => false, // TODO: Implement
    handleCreateLimpiezaVerification: async () => false, // TODO: Implement
    handleEditLimpiezaVerification: async () => false, // TODO: Implement
    handleDeleteLimpiezaVerification: async () => false // TODO: Implement
  };

  return {
    data: {
      ...data,
      loading,
      error
    },
    handlers,
    stats,
    refresh: loadData
  };
}
