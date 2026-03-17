// Tipos de datos para custodia de muestras
export interface CustodiaMuestras {
  id?: string;
  codigo: string;
  tipo: string;
  muestra_id: string;
  area: string;
  temperatura: string;
  cantidad: string;
  motivo: string;
  tipo_analisis_sl?: string;
  tipo_analisis_bc?: string;
  tipo_analisis_ym?: string;
  tipo_analisis_tc?: string;
  tipo_analisis_ec?: string;
  tipo_analisis_ls?: string;
  tipo_analisis_etb?: string;
  tipo_analisis_xsa?: string;
  toma_muestra_fecha: string;
  toma_muestra_hora: string;
  recepcion_lab_fecha: string;
  recepcion_lab_hora: string;
  medio_transporte: string;
  responsable: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

// Servicio para manejar custodia de muestras
class CustodiaMuestrasService {
  private baseUrl = '/api/custodia-muestras';

  // Obtener todos los registros
  async getAll(): Promise<CustodiaMuestras[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros de custodia de muestras');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en CustodiaMuestrasService.getAll():', error);
      throw error;
    }
  }

  // Obtener un registro por ID
  async getById(id: string): Promise<CustodiaMuestras | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener el registro de custodia de muestras');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en CustodiaMuestrasService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear un nuevo registro
  async create(data: Omit<CustodiaMuestras, 'id' | 'created_at' | 'updated_at'>): Promise<CustodiaMuestras> {
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
      console.error('Error en CustodiaMuestrasService.create():', error);
      throw error;
    }
  }

  // Actualizar un registro existente
  async update(id: string, data: Partial<CustodiaMuestras>): Promise<CustodiaMuestras> {
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
        throw new Error('Error al actualizar el registro de custodia de muestras');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en CustodiaMuestrasService.update(${id}):`, error);
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
        throw new Error('Error al eliminar el registro de custodia de muestras');
      }
    } catch (error) {
      console.error(`Error en CustodiaMuestrasService.delete(${id}):`, error);
      throw error;
    }
  }

  // Obtener registros por fecha
  async getByDate(fecha: string): Promise<CustodiaMuestras[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha=${fecha}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por fecha');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en CustodiaMuestrasService.getByDate(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por rango de fechas
  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<CustodiaMuestras[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por rango de fechas');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en CustodiaMuestrasService.getByDateRange(${fechaInicio}, ${fechaFin}):`, error);
      throw error;
    }
  }

  // Obtener registros por código
  async getByCodigo(codigo: string): Promise<CustodiaMuestras[]> {
    try {
      const response = await fetch(`${this.baseUrl}?codigo=${codigo}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por código');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en CustodiaMuestrasService.getByCodigo(${codigo}):`, error);
      throw error;
    }
  }

  // Obtener registros por tipo de análisis
  async getByTipoAnalisis(tipoAnalisis: string): Promise<CustodiaMuestras[]> {
    try {
      const response = await fetch(`${this.baseUrl}?tipo_analisis=${tipoAnalisis}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por tipo de análisis');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en CustodiaMuestrasService.getByTipoAnalisis(${tipoAnalisis}):`, error);
      throw error;
    }
  }
}

export const custodiaMuestrasService = new CustodiaMuestrasService();
