// Servicio para interactuar con las APIs de categorías y productos

export type Product = {
  id: string;
  name: string;
  category_id: string;
};

export const bpmVerificationsAPI = {
  getAll: async (date?: string) => {
    const url = date ? `/api/bpm-verifications?date=${encodeURIComponent(date)}` : '/api/bpm-verifications';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al obtener verificaciones BPM: ${response.statusText}`);
    }
    return response.json();
  },

  create: async (record: any) => {
    const response = await fetch('/api/bpm-verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al crear verificación BPM (${response.status}): ${errorText}`);
    }
    return response.json();
  },

  update: async (id: number, record: any) => {
    const response = await fetch('/api/bpm-verifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...record }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al actualizar verificación BPM (${response.status}): ${errorText}`);
    }
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`/api/bpm-verifications/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al eliminar verificación BPM (${response.status}): ${errorText}`);
    }
    return response.json();
  },
};

export const bpmIndicatorsAPI = {
  getDaily: async (anio: number, mes: number) => {
    const url = `/api/bpm-indicators?mode=daily&anio=${encodeURIComponent(String(anio))}&mes=${encodeURIComponent(String(mes))}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener indicadores BPM (${response.status}): ${errorText}`);
    }
    return response.json();
  },

  getMonthlyHistory: async () => {
    const response = await fetch('/api/bpm-indicators?mode=monthly');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener histórico de indicadores BPM (${response.status}): ${errorText}`);
    }
    return response.json();
  },

  upsertMonthly: async (anio: number, mes: number) => {
    const response = await fetch('/api/bpm-indicators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anio, mes }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al guardar indicador BPM mensual (${response.status}): ${errorText}`);
    }
    return response.json();
  },
};

export type ProductCategory = {
  id: string;
  name: string;
  type: 'produccion' | 'embalaje';
  products: Product[];
};

// API de Categorías
export const categoriesAPI = {
  // Obtener todas las categorías
  async getAll(): Promise<any[]> {
    const response = await fetch('/api/categories');
    if (!response.ok) throw new Error('Error al obtener categorías');
    return response.json();
  },

  // Obtener categorías por tipo
  async getByType(type: 'produccion' | 'embalaje'): Promise<any[]> {
    const response = await fetch(`/api/categories?type=${type}`);
    if (!response.ok) throw new Error('Error al obtener categorías por tipo');
    return response.json();
  },

  // Verificar si ID de producto ya existe en la misma categoría
  async checkProductIdExists(id: string, categoryId: string, excludeId?: string): Promise<boolean> {
    try {
      console.log(`Verificando si ID de producto "${id}" existe en categoría "${categoryId}"...`);
      const response = await fetch('/api/products/check-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, categoryId, excludeId }),
      });
      
      if (!response.ok) {
        console.error('Error al verificar ID de producto:', response.statusText);
        return false;
      }
      
      const result = await response.json();
      console.log(`Resultado de verificación de ID "${id}":`, result.exists);
      return result.exists;
    } catch (error) {
      console.error('Error al verificar ID de producto:', error);
      return false;
    }
  },

  // Verificar si código de categoría ya existe
  async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
    try {
      console.log(`Verificando si código de categoría "${code}" existe...`);
      const response = await fetch('/api/categories/check-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, excludeId }),
      });
      
      if (!response.ok) {
        console.error('Error al verificar código de categoría:', response.statusText);
        return false;
      }
      
      const result = await response.json();
      console.log(`Resultado de verificación de código "${code}":`, result.exists);
      return result.exists;
    } catch (error) {
      console.error('Error al verificar código de categoría:', error);
      return false;
    }
  },

  // Crear categoría
  async create(category: any): Promise<any> {
    try {
      console.log('Creando categoría en API:', category);
      console.log('Datos que se enviarán:', JSON.stringify(category));
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Error al crear categoría (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Categoría creada exitosamente:', result);
      return result;
    } catch (error) {
      console.error('Error en categoriesAPI.create:', error);
      throw error;
    }
  },

  // Actualizar categoría
  async update(id: string, category: Partial<{ name: string; description?: string }>) {
    const response = await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...category }),
    });
    if (!response.ok) throw new Error('Error al actualizar categoría');
    return response.json();
  },

  // Eliminar categoría (soft delete)
  async delete(id: string) {
    try {
      console.log('Eliminando categoría con ID:', id);
      console.log('URL de la petición:', `/api/categories?id=${id}`);
      
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Error al eliminar categoría (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Categoría eliminada exitosamente:', result);
      return result;
    } catch (error) {
      console.error('Error en categoriesAPI.delete:', error);
      throw error;
    }
  },
};

// API de Registros de Producción
export const productionRecordsAPI = {
  getAll: async () => {
    const response = await fetch('/api/production-records');
    if (!response.ok) {
      throw new Error(`Error al obtener registros de producción: ${response.statusText}`);
    }
    return response.json();
  },

  getByCreatedDate: async (createdDate: string) => {
    const response = await fetch(
      `/api/production-records?createdDate=${encodeURIComponent(createdDate)}`
    );
    if (!response.ok) {
      throw new Error(`Error al obtener registros del día: ${response.statusText}`);
    }
    return response.json();
  },

  getByProduct: async (productName: string) => {
    const response = await fetch(`/api/production-records?productName=${encodeURIComponent(productName)}`);
    if (!response.ok) {
      throw new Error(`Error al obtener registros del producto: ${response.statusText}`);
    }
    return response.json();
  },

  getByProductId: async (productId: string) => {
    const response = await fetch(`/api/production-records?productId=${encodeURIComponent(productId)}`);
    if (!response.ok) {
      throw new Error(`Error al obtener registros del producto por ID: ${response.statusText}`);
    }
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`/api/production-records?id=${encodeURIComponent(id)}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error al obtener registro de producción: ${response.statusText}`);
    }
    return response.json();
  },

  create: async (record: any) => {
    console.log('🚀 ENVIANDO PETICIÓN POST con datos:', JSON.stringify(record, null, 2));

    const controller = new AbortController();
    const timeoutMs = 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch('/api/production-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        throw new Error('Tiempo de espera agotado al guardar el registro (POST /api/production-records)');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`Error al crear registro de producción (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  update: async (id: string, record: any) => {
    const controller = new AbortController();
    const timeoutMs = 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch('/api/production-records', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...record }),
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        throw new Error('Tiempo de espera agotado al actualizar el registro (PUT /api/production-records)');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
    
    if (!response.ok) {
      throw new Error(`Error al actualizar registro de producción: ${response.statusText}`);
    }
    
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`/api/production-records?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error al eliminar registro de producción: ${response.statusText}`);
    }
    
    return response.json();
  },
};
export const productsAPI = {
  // Obtener todos los productos
  async getAll(): Promise<any[]> {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Error al obtener productos');
    return response.json();
  },

  async getById(id: string, categoryId?: string): Promise<any> {
    const url = categoryId
      ? `/api/products/${encodeURIComponent(id)}?category_id=${encodeURIComponent(categoryId)}`
      : `/api/products/${encodeURIComponent(id)}`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Error al obtener producto');
    }
    return response.json();
  },

  // Verificar si ID de producto ya existe en la misma categoría
  async checkIdExists(id: string, categoryId: string, excludeId?: string): Promise<boolean> {
    try {
      console.log(`Verificando si ID de producto "${id}" existe en categoría "${categoryId}"...`);
      const response = await fetch('/api/products/check-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, categoryId, excludeId }),
      });
      
      if (!response.ok) {
        console.error('Error al verificar ID de producto:', response.statusText);
        return false;
      }
      
      const result = await response.json();
      console.log(`Resultado de verificación de ID "${id}":`, result.exists);
      return result.exists;
    } catch (error) {
      console.error('Error al verificar ID de producto:', error);
      return false;
    }
  },

  // Obtener productos por categoría
  async getByCategory(categoryId: string): Promise<any[]> {
    const response = await fetch(`/api/products?category_id=${categoryId}`);
    if (!response.ok) throw new Error('Error al obtener productos de la categoría');
    return response.json();
  },

  // Crear nuevo producto
  async create(product: {
    id: string;
    name: string;
    category_id: string;
    description?: string;
    pesosConfig?: any[];
    temperaturasConfig?: any[];
    calidadRangosConfig?: any[];
  }) {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Error al crear producto');
    return response.json();
  },

  // Actualizar producto
  async update(
    id: string,
    product: Partial<{
      name: string;
      category_id: string;
      description?: string;
      pesosConfig?: any[];
      temperaturasConfig?: any[];
      calidadRangosConfig?: any[];
    }>,
    oldCategoryId?: string
  ) {
    const response = await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, oldCategoryId, ...product }),
    });
    if (!response.ok) throw new Error('Error al actualizar producto');
    return response.json();
  },

  // Eliminar producto (soft delete)
  async delete(id: string, categoryId?: string) {
    try {
      console.log('Eliminando producto con ID:', id, 'CategoryID:', categoryId);
      const url = categoryId ? `/api/products?id=${id}&categoryId=${categoryId}` : `/api/products?id=${id}`;
      console.log('URL de la petición:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      console.log('Producto eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('Error en productsAPI.delete:', error);
      throw error;
    }
  },

};

// Función combinada para obtener categorías con sus productos
export async function getCategoriesWithProducts(): Promise<ProductCategory[]> {
  console.log('📂 [getCategoriesWithProducts] INICIANDO - Obteniendo categorías...');
  const categories = await categoriesAPI.getAll();
  console.log('📂 [getCategoriesWithProducts] Categorías obtenidas:', categories.length, categories);

  console.log('📦 [getCategoriesWithProducts] Obteniendo productos para cada categoría...');
  const categoriesWithProducts = await Promise.all(
    categories.map(async (category: any) => {
      try {
        console.log(`📦 [getCategoriesWithProducts] Obteniendo productos para categoría ${category.id} (${category.name})...`);
        const products = await productsAPI.getByCategory(category.id);
        console.log(`📦 [getCategoriesWithProducts] Productos obtenidos para ${category.id}:`, products.length, products);

        // Asegurar que cada producto tenga el category_id correcto
        const validatedProducts = products.map((product: any) => {
          const validatedProduct = {
            ...product,
            category_id: product.category_id || category.id, // Asegurar correlación
          };
          console.log(`✅ [getCategoriesWithProducts] Producto validado: ${validatedProduct.id} -> ${validatedProduct.name} (categoría: ${validatedProduct.category_id})`);
          return validatedProduct;
        });

        const categoryWithProducts = {
          id: category.id,
          name: category.name,
          type: category.type || 'produccion',
          products: validatedProducts
        };

        console.log(`✅ [getCategoriesWithProducts] Categoría final ${category.id}:`, {
          name: categoryWithProducts.name,
          productCount: categoryWithProducts.products.length,
          products: categoryWithProducts.products.map(p => ({ id: p.id, name: p.name }))
        });

        return categoryWithProducts;
      } catch (productError) {
        console.error(`❌ [getCategoriesWithProducts] Error para categoría ${category.id}:`, productError);
        return {
          id: category.id,
          name: category.name,
          type: category.type || 'produccion',
          products: [] // Retornar categoría vacía si falla
        };
      }
    })
  );

  console.log('✅ [getCategoriesWithProducts] TOTAL - Categorías con productos:', categoriesWithProducts.length);
  categoriesWithProducts.forEach(cat => {
    console.log(`  - ${cat.name}: ${cat.products.length} productos`);
  });

  return categoriesWithProducts;
}
