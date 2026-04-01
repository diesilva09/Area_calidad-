// Servicio para gestionar la relación producto-envase-vencimiento

export interface ProductoEnvase {
  id: number;
  producto_id: string;
  envase_tipo: string;
  meses_vencimiento: number;
  created_at: string;
  updated_at: string;
}

export class ProductoEnvaseService {
  private baseUrl = '/api/producto-envase';

  // Obtener envases disponibles para un producto específico
  async getEnvasesByProducto(productoId: string): Promise<ProductoEnvase[]> {
    try {
      const response = await fetch(`${this.baseUrl}?producto_id=${productoId}`);
      if (!response.ok) {
        throw new Error(`Error al obtener envases: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error en ProductoEnvaseService.getEnvasesByProducto:', error);
      throw error;
    }
  }

  // Obtener todos los envases (para administración)
  async getAll(): Promise<ProductoEnvase[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Error al obtener envases: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error en ProductoEnvaseService.getAll:', error);
      throw error;
    }
  }

  // Crear nueva relación producto-envase
  async create(data: Omit<ProductoEnvase, 'id' | 'created_at' | 'updated_at'>): Promise<ProductoEnvase> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Error al crear relación producto-envase: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error en ProductoEnvaseService.create:', error);
      throw error;
    }
  }

  // Actualizar meses de vencimiento
  async update(id: number, mesesVencimiento: number): Promise<ProductoEnvase> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meses_vencimiento: mesesVencimiento }),
      });
      if (!response.ok) {
        throw new Error(`Error al actualizar envase: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error en ProductoEnvaseService.update:', error);
      throw error;
    }
  }

  // Eliminar relación producto-envase
  async delete(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Error al eliminar envase: ${response.statusText}`);
      }
      return true;
    } catch (error) {
      console.error('Error en ProductoEnvaseService.delete:', error);
      throw error;
    }
  }

  // Calcular fecha de vencimiento basada en fecha de producción y meses
  calcularFechaVencimiento(fechaProduccion: string, meses: number): string {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 Calculando fecha vencimiento:', { fechaProduccion, meses });
      }
      
      let fechaCompleta: Date;

      const parseLocalISODate = (dateStr: string): Date => {
        const m = String(dateStr || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return new Date(dateStr);
        const year = Number(m[1]);
        const month = Number(m[2]);
        const day = Number(m[3]);
        return new Date(year, month - 1, day);
      };
      
      // Detectar formato de entrada
      if (fechaProduccion.includes('-')) {
        // Formato YYYY-MM-DD (del DateInput)
        fechaCompleta = parseLocalISODate(fechaProduccion);
      } else if (fechaProduccion.includes('/')) {
        // Formato DD/MM/AA o DD/MM/YYYY
        const partes = fechaProduccion.split('/');
        if (partes[2].length === 2) {
          // DD/MM/AA
          fechaCompleta = new Date(2000 + parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
        } else {
          // DD/MM/YYYY
          fechaCompleta = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
        }
      } else {
        throw new Error('Formato de fecha no reconocido');
      }
      
      // Validar que la fecha sea válida
      if (isNaN(fechaCompleta.getTime())) {
        throw new Error('Fecha inválida');
      }
      
      // Agregar los meses
      fechaCompleta.setMonth(fechaCompleta.getMonth() + meses);
      
      // Formatear de vuelta a YYYY-MM-DD (para DateInput)
      const nuevoDia = fechaCompleta.getDate().toString().padStart(2, '0');
      const nuevoMes = (fechaCompleta.getMonth() + 1).toString().padStart(2, '0');
      const nuevoAnio = fechaCompleta.getFullYear();
      
      const resultado = `${nuevoAnio}-${nuevoMes}-${nuevoDia}`;
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Fecha vencimiento calculada:', resultado);
      }
      
      return resultado;
    } catch (error) {
      console.error('❌ Error al calcular fecha de vencimiento:', error);
      return fechaProduccion; // Retorna fecha original si hay error
    }
  }
}

export const productoEnvaseService = new ProductoEnvaseService();
