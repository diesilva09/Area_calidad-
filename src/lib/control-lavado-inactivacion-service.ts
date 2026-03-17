// Tipos de datos para control de lavado e inactivación
export interface ControlLavadoInactivacion {
  id?: string;
  fecha: string;
  actividad_realizada: string;
  sustancia_limpieza_nombre: string;
  sustancia_limpieza_cantidad_preparada: string;
  sustancia_limpieza_cantidad_sustancia: string;
  sustancia_desinfeccion_1_nombre: string;
  sustancia_desinfeccion_1_cantidad_preparada: string;
  sustancia_desinfeccion_1_cantidad_sustancia: string;
  sustancia_desinfeccion_2_nombre: string;
  sustancia_desinfeccion_2_cantidad_preparada: string;
  sustancia_desinfeccion_2_cantidad_sustancia: string;
  realizado_por: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

// Servicio para manejar control de lavado e inactivación
class ControlLavadoInactivacionService {
  private baseUrl = '/api/control-lavado-inactivacion';

  // Obtener todos los registros
  async getAll(): Promise<ControlLavadoInactivacion[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros de control de lavado e inactivación');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en ControlLavadoInactivacionService.getAll():', error);
      throw error;
    }
  }

  // Obtener un registro por ID
  async getById(id: string): Promise<ControlLavadoInactivacion | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener el registro de control de lavado e inactivación');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ControlLavadoInactivacionService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear un nuevo registro
  async create(data: Omit<ControlLavadoInactivacion, 'id' | 'created_at' | 'updated_at'>): Promise<ControlLavadoInactivacion> {
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
      console.error('Error en ControlLavadoInactivacionService.create():', error);
      throw error;
    }
  }

  // Actualizar un registro existente
  async update(id: string, data: Partial<ControlLavadoInactivacion>): Promise<ControlLavadoInactivacion> {
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
        throw new Error('Error al actualizar el registro de control de lavado e inactivación');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en ControlLavadoInactivacionService.update(${id}):`, error);
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
        throw new Error('Error al eliminar el registro de control de lavado e inactivación');
      }
    } catch (error) {
      console.error(`Error en ControlLavadoInactivacionService.delete(${id}):`, error);
      throw error;
    }
  }

  // Obtener registros por fecha
  async getByDate(fecha: string): Promise<ControlLavadoInactivacion[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha=${fecha}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por fecha');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ControlLavadoInactivacionService.getByDate(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por rango de fechas
  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<ControlLavadoInactivacion[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por rango de fechas');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ControlLavadoInactivacionService.getByDateRange(${fechaInicio}, ${fechaFin}):`, error);
      throw error;
    }
  }

  // Obtener registros por actividad realizada
  async getByActividad(actividad: string): Promise<ControlLavadoInactivacion[]> {
    try {
      const response = await fetch(`${this.baseUrl}?actividad=${encodeURIComponent(actividad)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por actividad');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ControlLavadoInactivacionService.getByActividad(${actividad}):`, error);
      throw error;
    }
  }

  // Obtener registros por responsable
  async getByResponsable(responsable: string): Promise<ControlLavadoInactivacion[]> {
    try {
      const response = await fetch(`${this.baseUrl}?responsable=${encodeURIComponent(responsable)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por responsable');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ControlLavadoInactivacionService.getByResponsable(${responsable}):`, error);
      throw error;
    }
  }

  // Obtener registros por sustancia de limpieza
  async getBySustanciaLimpieza(sustancia: string): Promise<ControlLavadoInactivacion[]> {
    try {
      const response = await fetch(`${this.baseUrl}?sustancia_limpieza=${encodeURIComponent(sustancia)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por sustancia de limpieza');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ControlLavadoInactivacionService.getBySustanciaLimpieza(${sustancia}):`, error);
      throw error;
    }
  }

  // Obtener registros por sustancia de desinfección
  async getBySustanciaDesinfeccion(sustancia: string): Promise<ControlLavadoInactivacion[]> {
    try {
      const response = await fetch(`${this.baseUrl}?sustancia_desinfeccion=${encodeURIComponent(sustancia)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por sustancia de desinfección');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ControlLavadoInactivacionService.getBySustanciaDesinfeccion(${sustancia}):`, error);
      throw error;
    }
  }
}

export const controlLavadoInactivacionService = new ControlLavadoInactivacionService();
