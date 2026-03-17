// Tipos de datos para temperatura de equipos
export interface TemperaturaEquipos {
  id?: string;
  fecha: string;
  horario: string;
  incubadora_037: string;
  incubadora_038: string;
  nevera: string;
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
  async getById(id: string): Promise<TemperaturaEquipos | null> {
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

  // Crear un nuevo registro
  async create(data: Omit<TemperaturaEquipos, 'id' | 'created_at' | 'updated_at'>): Promise<TemperaturaEquipos> {
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
      console.error('Error en TemperaturaEquiposService.create():', error);
      throw error;
    }
  }

  // Actualizar un registro existente
  async update(id: string, data: Partial<TemperaturaEquipos>): Promise<TemperaturaEquipos> {
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
        throw new Error('Error al actualizar el registro de temperatura de equipos');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en TemperaturaEquiposService.update(${id}):`, error);
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
        throw new Error('Error al eliminar el registro de temperatura de equipos');
      }
    } catch (error) {
      console.error(`Error en TemperaturaEquiposService.delete(${id}):`, error);
      throw error;
    }
  }

  // Obtener registros por fecha
  async getByDate(fecha: string): Promise<TemperaturaEquipos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha=${fecha}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por fecha');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en TemperaturaEquiposService.getByDate(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por rango de fechas
  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<TemperaturaEquipos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por rango de fechas');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en TemperaturaEquiposService.getByDateRange(${fechaInicio}, ${fechaFin}):`, error);
      throw error;
    }
  }
}

export const temperaturaEquiposService = new TemperaturaEquiposService();
