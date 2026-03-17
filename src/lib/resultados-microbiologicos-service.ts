// Tipos de datos para resultados microbiológicos
export interface ResultadosMicrobiologicos {
  id?: string;
  fecha: string;
  mes_muestreo: string;
  hora_muestreo: string;
  interno_externo: string;
  tipo: string;
  area: string;
  muestra: string;
  lote: string;
  fecha_produccion: string;
  fecha_vencimiento: string;
  mesofilos?: string;
  coliformes_totales?: string;
  coliformes_fecales?: string;
  e_coli?: string;
  mohos?: string;
  levaduras?: string;
  staphylococcus_aureus?: string;
  bacillus_cereus?: string;
  listeria?: string;
  salmonella?: string;
  enterobacterias?: string;
  clostridium?: string;
  esterilidad_comercial?: string;
  anaerobias?: string;
  observaciones?: string;
  parametros_referencia?: string;
  cumple?: boolean;
  no_cumple?: boolean;
  codigo: string;
  medio_diluyente?: string;
  factor_dilucion?: string;
  responsable: string;
  created_at?: string;
  updated_at?: string;
}

// Servicio para manejar resultados microbiológicos
class ResultadosMicrobiologicosService {
  private baseUrl = '/api/resultados-microbiologicos';

  // Obtener todos los registros
  async getAll(): Promise<ResultadosMicrobiologicos[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros de resultados microbiológicos');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en ResultadosMicrobiologicosService.getAll():', error);
      throw error;
    }
  }

  // Obtener un registro por ID
  async getById(id: string): Promise<ResultadosMicrobiologicos | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Error al obtener el registro de resultados microbiológicos');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ResultadosMicrobiologicosService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear un nuevo registro
  async create(data: Omit<ResultadosMicrobiologicos, 'id' | 'created_at' | 'updated_at'>): Promise<ResultadosMicrobiologicos> {
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
      console.error('Error en ResultadosMicrobiologicosService.create():', error);
      throw error;
    }
  }

  // Actualizar un registro existente
  async update(id: string, data: Partial<ResultadosMicrobiologicos>): Promise<ResultadosMicrobiologicos> {
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
        throw new Error('Error al actualizar el registro de resultados microbiológicos');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en ResultadosMicrobiologicosService.update(${id}):`, error);
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
        throw new Error('Error al eliminar el registro de resultados microbiológicos');
      }
    } catch (error) {
      console.error(`Error en ResultadosMicrobiologicosService.delete(${id}):`, error);
      throw error;
    }
  }

  // Obtener registros por fecha
  async getByDate(fecha: string): Promise<ResultadosMicrobiologicos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha=${fecha}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por fecha');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ResultadosMicrobiologicosService.getByDate(${fecha}):`, error);
      throw error;
    }
  }

  // Obtener registros por rango de fechas
  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<ResultadosMicrobiologicos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por rango de fechas');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ResultadosMicrobiologicosService.getByDateRange(${fechaInicio}, ${fechaFin}):`, error);
      throw error;
    }
  }

  // Obtener registros por muestra
  async getByMuestra(muestra: string): Promise<ResultadosMicrobiologicos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?muestra=${encodeURIComponent(muestra)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por muestra');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ResultadosMicrobiologicosService.getByMuestra(${muestra}):`, error);
      throw error;
    }
  }

  // Obtener registros por lote
  async getByLote(lote: string): Promise<ResultadosMicrobiologicos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?lote=${encodeURIComponent(lote)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por lote');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ResultadosMicrobiologicosService.getByLote(${lote}):`, error);
      throw error;
    }
  }

  // Obtener registros por tipo (interno/externo)
  async getByTipo(tipo: string): Promise<ResultadosMicrobiologicos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?tipo=${encodeURIComponent(tipo)}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por tipo');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ResultadosMicrobiologicosService.getByTipo(${tipo}):`, error);
      throw error;
    }
  }

  // Obtener registros por cumplimiento
  async getByCumplimiento(cumple: boolean): Promise<ResultadosMicrobiologicos[]> {
    try {
      const response = await fetch(`${this.baseUrl}?cumple=${cumple}`, {
        credentials: 'include', // Incluir cookies para autenticación
      });
      if (!response.ok) {
        throw new Error('Error al obtener los registros por cumplimiento');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en ResultadosMicrobiologicosService.getByCumplimiento(${cumple}):`, error);
      throw error;
    }
  }
}

export const resultadosMicrobiologicosService = new ResultadosMicrobiologicosService();
