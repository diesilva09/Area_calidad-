// Tipos de datos para condiciones ambientales
export interface CondicionesAmbientales {
  id?: string;
  fecha: string;
  hora: string;
  temperatura: string;
  humedad_relativa: string;
  responsable: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

// Servicio para manejar condiciones ambientales
class CondicionesAmbientalesService {
  private baseUrl = '/api/condiciones-ambientales';

  // Obtener todos los registros
  async getAll(): Promise<CondicionesAmbientales[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros de condiciones ambientales');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en CondicionesAmbientalesService.getAll():', error);
      throw error;
    }
  }

  // Obtener un registro por ID
  async getById(id: string): Promise<CondicionesAmbientales | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener el registro de condiciones ambientales');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en CondicionesAmbientalesService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear un nuevo registro
  async create(data: Omit<CondicionesAmbientales, 'id' | 'created_at' | 'updated_at'>): Promise<CondicionesAmbientales> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Incluir cookies para autenticación
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al crear el registro: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en CondicionesAmbientalesService.create():', error);
      throw error;
    }
  }

  // Actualizar un registro existente
  async update(id: string, data: Partial<CondicionesAmbientales>): Promise<CondicionesAmbientales> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Incluir cookies para autenticación
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el registro de condiciones ambientales');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en CondicionesAmbientalesService.update(${id}):`, error);
      throw error;
    }
  }

  // Eliminar un registro
  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Incluir cookies para autenticación
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el registro de condiciones ambientales');
      }
    } catch (error) {
      console.error(`Error en CondicionesAmbientalesService.delete(${id}):`, error);
      throw error;
    }
  }

  // Obtener registros por fecha
  async getByDate(fecha: string): Promise<CondicionesAmbientales[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha=${fecha}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por fecha');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en CondicionesAmbientalesService.getByDate(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por rango de fechas
  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<CondicionesAmbientales[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por rango de fechas');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en CondicionesAmbientalesService.getByDateRange(${fechaInicio}, ${fechaFin}):`, error);
      throw error;
    }
  }
}

export const condicionesAmbientalesService = new CondicionesAmbientalesService();
