// Tipos de datos para configuración de pesos de productos
export interface ProductoPesosConfig {
  id?: number;
  producto_id: string;
  envase_tipo: string;
  peso_drenado_declarado: number;
  peso_drenado_min: number;
  peso_drenado_max: number;
  peso_neto_declarado: number;
  created_at?: string;
  updated_at?: string;
}

// Servicio para manejar configuración de pesos de productos
class ProductoPesosConfigService {
  private baseUrl = '/api/producto-pesos';

  // Obtener todas las configuraciones de pesos
  async getAll(): Promise<ProductoPesosConfig[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener las configuraciones de pesos');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en ProductoPesosConfigService.getAll():', error);
      throw error;
    }
  }

  // Obtener configuraciones por producto
  async getByProductoId(productoId: string): Promise<ProductoPesosConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}?producto_id=${productoId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Error al obtener las configuraciones de pesos del producto');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ProductoPesosConfigService.getByProductoId(${productoId}):`, error);
      throw error;
    }
  }

  // Obtener una configuración por ID
  async getById(id: number): Promise<ProductoPesosConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener la configuración de pesos');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ProductoPesosConfigService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear nueva configuración de pesos
  async create(config: Omit<ProductoPesosConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ProductoPesosConfig> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear configuración de pesos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en ProductoPesosConfigService.create():', error);
      throw error;
    }
  }

  // Actualizar configuración de pesos
  async update(id: number, config: Omit<ProductoPesosConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ProductoPesosConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al actualizar configuración de pesos');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en ProductoPesosConfigService.update(${id}):`, error);
      throw error;
    }
  }

  // Eliminar configuración de pesos
  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar configuración de pesos');
      }
    } catch (error) {
      console.error(`Error en ProductoPesosConfigService.delete(${id}):`, error);
      throw error;
    }
  }

  // Crear múltiples configuraciones para un producto
  async createMultipleForProducto(productoId: string, configs: Omit<ProductoPesosConfig, 'id' | 'producto_id' | 'created_at' | 'updated_at'>[]): Promise<ProductoPesosConfig[]> {
    try {
      const payload = configs.map(config => ({
        ...config,
        producto_id: productoId
      }));

      const response = await fetch(`${this.baseUrl}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configs: payload }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear configuraciones de pesos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en ProductoPesosConfigService.createMultipleForProducto():', error);
      throw error;
    }
  }

  // Eliminar todas las configuraciones de un producto
  async deleteByProductoId(productoId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/producto/${productoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar configuraciones de pesos del producto');
      }
    } catch (error) {
      console.error(`Error en ProductoPesosConfigService.deleteByProductoId(${productoId}):`, error);
      throw error;
    }
  }
}

export const productoPesosConfigService = new ProductoPesosConfigService();
