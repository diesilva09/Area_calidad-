import {
  getCategoriesWithProducts,
  categoriesAPI,
  productsAPI,
  productionRecordsAPI,
  bpmVerificationsAPI,
  bpmIndicatorsAPI,
} from './api-service';

// Importar tipos de producción
export type { ProductionRecord } from './server-db';

export type {
  ProductPesosConfig,
  ProductTemperaturasConfig,
  ProductCalidadRangosConfig,
} from './server-db';

export type Product = {
  id: string;
  name: string;
  category_id: string;
  pesos_config?: import('./server-db').ProductPesosConfig[];
  temperaturas_config?: import('./server-db').ProductTemperaturasConfig[];
  calidad_rangos_config?: import('./server-db').ProductCalidadRangosConfig[];
};

export type ProductCategory = {
  id: string;
  name: string;
  type: 'produccion' | 'embalaje';
  products: Product[];
};

// Función para obtener categorías desde la API
export async function getProductCategories(): Promise<ProductCategory[]> {
  return await getCategoriesWithProducts();
}

// Funciones para obtener categorías por tipo
export async function getCategoriesByType(type: 'produccion' | 'embalaje'): Promise<ProductCategory[]> {
  const categories = await categoriesAPI.getByType(type);
  
  const categoriesWithProducts = await Promise.all(
    categories.map(async (category: any) => {
      const products = await productsAPI.getByCategory(category.id);
      
      return {
        id: category.id,
        name: category.name,
        type: category.type,
        products: products.map((product: any) => ({
          id: product.id,
          name: product.name,
          category_id: product.category_id || category.id
        }))
      };
    })
  );
  
  return categoriesWithProducts;
}

// Funciones CRUD para categorías
export const categoryService = {
  getAll: categoriesAPI.getAll,
  create: categoriesAPI.create,
  update: categoriesAPI.update,
  delete: categoriesAPI.delete,
};

// Funciones CRUD para productos
export const productService = {
  create: productsAPI.create,
  update: productsAPI.update,
  delete: productsAPI.delete,
  getById: productsAPI.getById,
};

// Funciones CRUD para registros de producción
export const productionRecordsService = {
  getAll: productionRecordsAPI.getAll,
  getByCreatedDate: productionRecordsAPI.getByCreatedDate,
  getByProduct: productionRecordsAPI.getByProduct,
  getByProductId: productionRecordsAPI.getByProductId,
  getById: productionRecordsAPI.getById,
  create: productionRecordsAPI.create,
  update: productionRecordsAPI.update,
  delete: productionRecordsAPI.delete,
};

export const bpmVerificationsService = {
  getAll: bpmVerificationsAPI.getAll,
  create: bpmVerificationsAPI.create,
  update: bpmVerificationsAPI.update,
  delete: bpmVerificationsAPI.delete,
};

export const bpmIndicatorsService = {
  getDaily: bpmIndicatorsAPI.getDaily,
  getMonthlyHistory: bpmIndicatorsAPI.getMonthlyHistory,
  upsertMonthly: bpmIndicatorsAPI.upsertMonthly,
};
