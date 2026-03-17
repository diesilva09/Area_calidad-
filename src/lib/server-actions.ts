'use server';

import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductionRecords,
  getProductionRecordsByProduct,
  createProductionRecord,
  updateProductionRecord,
  deleteProductionRecord,
  type Category,
  type Product,
  type ProductionRecord
} from './server-db';

// Server Actions para categorías
export async function serverGetCategories(): Promise<Category[]> {
  return await getCategories();
}

export async function serverGetCategoryById(id: string): Promise<Category | null> {
  return await getCategoryById(id);
}

export async function serverCreateCategory(category: Omit<Category, 'created_at' | 'updated_at' | 'is_active' | 'type'>): Promise<Category> {
  return await createCategory(category);
}

export async function serverUpdateCategory(id: string, category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at' | 'type'>>): Promise<Category | null> {
  return await updateCategory(id, category);
}

export async function serverDeleteCategory(id: string): Promise<boolean> {
  return await deleteCategory(id);
}

// Server Actions para productos
export async function serverGetProducts(): Promise<Product[]> {
  return await getProducts();
}

export async function serverGetProductById(id: string): Promise<Product | null> {
  return await getProductById(id);
}

export async function serverCreateProduct(product: Omit<Product, 'created_at' | 'updated_at' | 'is_active'>): Promise<Product> {
  return await createProduct(product);
}

export async function serverUpdateProduct(id: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'is_active'>>): Promise<Product | null> {
  return await updateProduct(id, product);
}

export async function serverDeleteProduct(id: string): Promise<boolean> {
  return await deleteProduct(id);
}

// Server Actions para registros de producción
export async function serverGetProductionRecords(): Promise<ProductionRecord[]> {
  return await getProductionRecords();
}

export async function serverGetProductionRecordsByProduct(productName: string): Promise<ProductionRecord[]> {
  return await getProductionRecordsByProduct(productName);
}

export async function serverCreateProductionRecord(record: Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<ProductionRecord> {
  return await createProductionRecord(record);
}

export async function serverUpdateProductionRecord(id: string, record: Partial<Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at' | 'is_active'>>): Promise<ProductionRecord | null> {
  return await updateProductionRecord(id, record);
}

export async function serverDeleteProductionRecord(id: string): Promise<boolean> {
  return await deleteProductionRecord(id);
}
