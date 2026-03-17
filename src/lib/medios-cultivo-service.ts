// Tipos de datos para medios de cultivo
export interface MediosCultivo {
  id?: string;
  fecha: string;
  medio_cultivo: string;
  cantidad_ml: string;
  cantidad_medio_cultivo_g: string;
  control_negativo_inicio: string;
  control_negativo_final: string;
  control_negativo_cumple: string;
  control_negativo_no_cumple: string;
  accion_correctiva: string;
  observaciones?: string;
  responsable: string;
  created_at?: string;
  updated_at?: string;
}

// Servicio para manejar medios de cultivo
class MediosCultivoService {
  private baseUrl = '/api/medios-cultivo';

  // Obtener todos los registros
  async getAll(): Promise<MediosCultivo[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros de medios de cultivo');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en MediosCultivoService.getAll():', error);
      throw error;
    }
  }

  // Obtener un registro por ID
  async getById(id: string): Promise<MediosCultivo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener el registro de medios de cultivo');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en MediosCultivoService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear un nuevo registro
  async create(data: Omit<MediosCultivo, 'id' | 'created_at' | 'updated_at'>): Promise<MediosCultivo> {
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
      console.error('Error en MediosCultivoService.create():', error);
      throw error;
    }
  }

  // Actualizar un registro existente
  async update(id: string, data: Partial<MediosCultivo>): Promise<MediosCultivo> {
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
        throw new Error('Error al actualizar el registro de medios de cultivo');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en MediosCultivoService.update(${id}):`, error);
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
        throw new Error('Error al eliminar el registro de medios de cultivo');
      }
    } catch (error) {
      console.error(`Error en MediosCultivoService.delete(${id}):`, error);
      throw error;
    }
  }

  // Obtener registros por fecha
  async getByDate(fecha: string): Promise<MediosCultivo[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha=${fecha}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por fecha');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en MediosCultivoService.getByDate(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por rango de fechas
  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<MediosCultivo[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por rango de fechas');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en MediosCultivoService.getByDateRange(${fechaInicio}, ${fechaFin}):`, error);
      throw error;
    }
  }
}

export const mediosCultivoService = new MediosCultivoService();
