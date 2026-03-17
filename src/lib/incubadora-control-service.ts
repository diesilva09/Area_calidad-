// Tipos de datos para control de incubadora
export interface IncubadoraControl {
  id?: string;
  muestra: string;
  fecha_ingreso: string;
  hora_ingreso: string;
  fecha_salida: string;
  hora_salida: string;
  responsable: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

// Servicio para manejar control de incubadora
class IncubadoraControlService {
  private baseUrl = '/api/incubadora-control';

  // Obtener todos los registros
  async getAll(): Promise<IncubadoraControl[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros de control de incubadora');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en IncubadoraControlService.getAll():', error);
      throw error;
    }
  }

  // Obtener un registro por ID
  async getById(id: string): Promise<IncubadoraControl | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener el registro de control de incubadora');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en IncubadoraControlService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear un nuevo registro
  async create(data: Omit<IncubadoraControl, 'id' | 'created_at' | 'updated_at'>): Promise<IncubadoraControl> {
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
      console.error('Error en IncubadoraControlService.create():', error);
      throw error;
    }
  }

  // Actualizar un registro existente
  async update(id: string, data: Partial<IncubadoraControl>): Promise<IncubadoraControl> {
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
        throw new Error('Error al actualizar el registro de control de incubadora');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en IncubadoraControlService.update(${id}):`, error);
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
        throw new Error('Error al eliminar el registro de control de incubadora');
      }
    } catch (error) {
      console.error(`Error en IncubadoraControlService.delete(${id}):`, error);
      throw error;
    }
  }

  // Obtener registros por fecha
  async getByDate(fecha: string): Promise<IncubadoraControl[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha=${fecha}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por fecha');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en IncubadoraControlService.getByDate(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por rango de fechas
  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<IncubadoraControl[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por rango de fechas');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en IncubadoraControlService.getByDateRange(${fechaInicio}, ${fechaFin}):`, error);
      throw error;
    }
  }

  // Obtener registros por muestra
  async getByMuestra(muestra: string): Promise<IncubadoraControl[]> {
    try {
      const response = await fetch(`${this.baseUrl}?muestra=${encodeURIComponent(muestra)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por muestra');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en IncubadoraControlService.getByMuestra(${muestra}):`, error);
      throw error;
    }
  }

  // Obtener registros por responsable
  async getByResponsable(responsable: string): Promise<IncubadoraControl[]> {
    try {
      const response = await fetch(`${this.baseUrl}?responsable=${encodeURIComponent(responsable)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por responsable');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en IncubadoraControlService.getByResponsable(${responsable}):`, error);
      throw error;
    }
  }
}

export const incubadoraControlService = new IncubadoraControlService();
