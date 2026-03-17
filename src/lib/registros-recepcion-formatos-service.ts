// Tipos de datos para registros de recepción de formatos
export interface RegistrosRecepcionFormatos {
  id?: string;
  fecha_entrega: string;
  fecha_registros: string;
  codigo_version_registros: string;
  numero_folios: string;
  nombre_quien_entrega: string;
  nombre_quien_recibe: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

// Servicio para manejar registros de recepción de formatos
class RegistrosRecepcionFormatosService {
  private baseUrl = '/api/registros-recepcion-formatos';

  // Obtener todos los registros
  async getAll(): Promise<RegistrosRecepcionFormatos[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros de recepción de formatos');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en RegistrosRecepcionFormatosService.getAll():', error);
      throw error;
    }
  }

  // Obtener un registro por ID
  async getById(id: string): Promise<RegistrosRecepcionFormatos | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener el registro de recepción de formatos');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en RegistrosRecepcionFormatosService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear un nuevo registro
  async create(data: Omit<RegistrosRecepcionFormatos, 'id' | 'created_at' | 'updated_at'>): Promise<RegistrosRecepcionFormatos> {
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
      console.error('Error en RegistrosRecepcionFormatosService.create():', error);
      throw error;
    }
  }

  // Actualizar un registro existente
  async update(id: string, data: Partial<RegistrosRecepcionFormatos>): Promise<RegistrosRecepcionFormatos> {
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
        throw new Error('Error al actualizar el registro de recepción de formatos');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en RegistrosRecepcionFormatosService.update(${id}):`, error);
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
        throw new Error('Error al eliminar el registro de recepción de formatos');
      }
    } catch (error) {
      console.error(`Error en RegistrosRecepcionFormatosService.delete(${id}):`, error);
      throw error;
    }
  }

  // Obtener registros por fecha de entrega
  async getByFechaEntrega(fecha: string): Promise<RegistrosRecepcionFormatos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_entrega=${fecha}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por fecha de entrega');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en RegistrosRecepcionFormatosService.getByFechaEntrega(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por rango de fechas de entrega
  async getByFechaEntregaRange(fechaInicio: string, fechaFin: string): Promise<RegistrosRecepcionFormatos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_entrega_inicio=${fechaInicio}&fecha_entrega_fin=${fechaFin}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por rango de fechas de entrega');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en RegistrosRecepcionFormatosService.getByFechaEntregaRange(${fechaInicio}, ${fechaFin}):`, error);
      throw error;
    }
  }

  // Obtener registros por fecha de registros
  async getByFechaRegistros(fecha: string): Promise<RegistrosRecepcionFormatos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_registros=${fecha}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por fecha de registros');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en RegistrosRecepcionFormatosService.getByFechaRegistros(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por código y versión
  async getByCodigoVersion(codigoVersion: string): Promise<RegistrosRecepcionFormatos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?codigo_version=${encodeURIComponent(codigoVersion)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por código y versión');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en RegistrosRecepcionFormatosService.getByCodigoVersion(${codigoVersion}):`, error);
      throw error;
    }
  }

  // Obtener registros por quien entrega
  async getByQuienEntrega(nombre: string): Promise<RegistrosRecepcionFormatos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?quien_entrega=${encodeURIComponent(nombre)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por quien entrega');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en RegistrosRecepcionFormatosService.getByQuienEntrega(${nombre}):`, error);
      throw error;
    }
  }

  // Obtener registros por quien recibe
  async getByQuienRecibe(nombre: string): Promise<RegistrosRecepcionFormatos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?quien_recibe=${encodeURIComponent(nombre)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por quien recibe');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en RegistrosRecepcionFormatosService.getByQuienRecibe(${nombre}):`, error);
      throw error;
    }
  }
}

export const registrosRecepcionFormatosService = new RegistrosRecepcionFormatosService();
