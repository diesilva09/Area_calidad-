export interface LimpiezaVerification {
  id: number;
  fecha: string;
  mes_corte: string | null;
  hora: string | null;
  tipo_verificacion: string;
  linea: string | null;
  superficie: string | null;
  estado_filtro: number | null;
  presencia_elementos_extranos: string | null;
  detalle_elementos_extranos: string | null;
  resultados_atp_ri: string | null;
  resultados_atp_ac: string | null;
  resultados_atp_rf: string | null;
  lote_hisopo: string | null;
  observacion_atp: string | null;
  deteccion_alergenos_ri: string | null;
  deteccion_alergenos_ac: string | null;
  deteccion_alergenos_rf: string | null;
  lote_hisopo2: string | null;
  observacion_alergenos: string | null;
  detergente: string | null;
  desinfectante: string | null;
  verificacion_visual: number | null;
  observacion_visual: string | null;
  verificado_por: string;
  responsable_produccion: string | null;
  responsable_mantenimiento: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

class LimpiezaVerificationsService {
  private baseUrl = '/api/limpieza-verifications';

  async getAll(): Promise<LimpiezaVerification[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) throw new Error('Error al obtener las verificaciones de limpieza');
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaVerificationsService.getAll:', error);
      throw error;
    }
  }

  async getByDate(date: Date): Promise<LimpiezaVerification[]> {
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const response = await fetch(`${this.baseUrl}?date=${dateStr}`);
      if (!response.ok) throw new Error('Error al obtener las verificaciones para la fecha');
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaVerificationsService.getByDate:', error);
      throw error;
    }
  }

  async create(verification: Omit<LimpiezaVerification, 'id' | 'created_at' | 'updated_at'>): Promise<LimpiezaVerification> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verification),
      });
      if (!response.ok) throw new Error('Error al crear la verificación de limpieza');
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaVerificationsService.create:', error);
      throw error;
    }
  }

  async update(id: number, verification: Partial<LimpiezaVerification>): Promise<LimpiezaVerification> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...verification }),
      });
      if (!response.ok) throw new Error('Error al actualizar la verificación de limpieza');
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaVerificationsService.update:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar la verificación de limpieza');
    } catch (error) {
      console.error('Error en LimpiezaVerificationsService.delete:', error);
      throw error;
    }
  }
}

export const limpiezaVerificationsService = new LimpiezaVerificationsService();
