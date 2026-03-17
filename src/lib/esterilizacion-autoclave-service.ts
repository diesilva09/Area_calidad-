// Tipos de datos para esterilización en autoclave
export interface EsterilizacionAutoclave {
  id?: string;
  fecha: string;
  elementos_medios_cultivo: string;
  inicio_ciclo_hora: string;
  inicio_proceso_hora: string;
  inicio_proceso_tc: string;
  inicio_proceso_presion: string;
  fin_proceso_hora: string;
  fin_proceso_tc: string;
  fin_proceso_presion: string;
  fin_ciclo_hora: string;
  cinta_indicadora: string;
  realizado_por: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

// Servicio para manejar esterilización en autoclave
class EsterilizacionAutoclaveService {
  private baseUrl = '/api/esterilizacion-autoclave';

  // Obtener todos los registros
  async getAll(): Promise<EsterilizacionAutoclave[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros de esterilización en autoclave');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en EsterilizacionAutoclaveService.getAll():', error);
      throw error;
    }
  }

  // Obtener un registro por ID
  async getById(id: string): Promise<EsterilizacionAutoclave | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener el registro de esterilización en autoclave');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en EsterilizacionAutoclaveService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear un nuevo registro
  async create(data: Omit<EsterilizacionAutoclave, 'id' | 'created_at' | 'updated_at'>): Promise<EsterilizacionAutoclave> {
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
      console.error('Error en EsterilizacionAutoclaveService.create():', error);
      throw error;
    }
  }

  // Actualizar un registro existente
  async update(id: string, data: Partial<EsterilizacionAutoclave>): Promise<EsterilizacionAutoclave> {
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
        throw new Error('Error al actualizar el registro de esterilización en autoclave');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en EsterilizacionAutoclaveService.update(${id}):`, error);
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
        throw new Error('Error al eliminar el registro de esterilización en autoclave');
      }
    } catch (error) {
      console.error(`Error en EsterilizacionAutoclaveService.delete(${id}):`, error);
      throw error;
    }
  }

  // Obtener registros por fecha
  async getByDate(fecha: string): Promise<EsterilizacionAutoclave[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha=${fecha}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por fecha');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en EsterilizacionAutoclaveService.getByDate(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por rango de fechas
  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<EsterilizacionAutoclave[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por rango de fechas');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en EsterilizacionAutoclaveService.getByDateRange(${fechaInicio}, ${fechaFin}):`, error);
      throw error;
    }
  }
}

export const esterilizacionAutoclaveService = new EsterilizacionAutoclaveService();
