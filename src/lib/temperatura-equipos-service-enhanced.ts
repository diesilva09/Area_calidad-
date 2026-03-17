// Tipos de datos para temperatura de equipos
export interface TemperaturaEquipos {
  id?: number;
  fecha: number; // Formato serial de Excel
  horario: string;
  incubadora_037: number;
  incubadora_038: number;
  nevera: number;
  realizado_por: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

// Servicio para manejar temperatura de equipos
class TemperaturaEquiposService {
  private baseUrl = '/api/temperatura-equipos';

  // Obtener todos los registros
  async getAll(): Promise<TemperaturaEquipos[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros de temperatura de equipos');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en TemperaturaEquiposService.getAll():', error);
      throw error;
    }
  }

  // Obtener un registro por ID
  async getById(id: number): Promise<TemperaturaEquipos | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener el registro de temperatura de equipos');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en TemperaturaEquiposService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear nuevo registro
  async create(temperatura: Omit<TemperaturaEquipos, 'id' | 'created_at' | 'updated_at'>): Promise<TemperaturaEquipos> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(temperatura),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear registro de temperatura');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en TemperaturaEquiposService.create():', error);
      throw error;
    }
  }

  // Actualizar registro
  async update(id: number, temperatura: Omit<TemperaturaEquipos, 'id' | 'created_at' | 'updated_at'>): Promise<TemperaturaEquipos> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(temperatura),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al actualizar registro de temperatura');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en TemperaturaEquiposService.update(${id}):`, error);
      throw error;
    }
  }

  // Eliminar registro
  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al eliminar registro de temperatura');
      }
    } catch (error) {
      console.error(`Error en TemperaturaEquiposService.delete(${id}):`, error);
      throw error;
    }
  }

  // Crear múltiples registros
  async createMultiple(temperaturas: Omit<TemperaturaEquipos, 'id' | 'created_at' | 'updated_at'>[]): Promise<TemperaturaEquipos[]> {
    try {
      const response = await fetch(`${this.baseUrl}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ temperaturas }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear múltiples registros de temperatura');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en TemperaturaEquiposService.createMultiple():', error);
      throw error;
    }
  }

  // Obtener registros por fecha
  async getByDate(fecha: number): Promise<TemperaturaEquipos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha=${fecha}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Error al obtener registros por fecha');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en TemperaturaEquiposService.getByDate(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por rango de fechas
  async getByDateRange(fechaInicio: number, fechaFin: number): Promise<TemperaturaEquipos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Error al obtener registros por rango de fechas');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en TemperaturaEquiposService.getByDateRange(${fechaInicio}, ${fechaFin}):`, error);
      throw error;
    }
  }
}

export const temperaturaEquiposService = new TemperaturaEquiposService();
