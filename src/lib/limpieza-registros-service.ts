export type LimpiezaStatus = 'pending' | 'completed';

export interface LimpiezaLiberacion {
  id: string;
  registro_id: string;
  hora: string | null;
  tipo_verificacion: string | null;
  linea: string | null;
  superficie: string | null;
  estado_filtro: number | null;
  novedades_filtro: string | null;
  correcciones_filtro: string | null;
  presencia_elementos_extranos: string | null;
  detalle_elementos_extranos: string | null;
  resultados_atp_ri: string | null;
  resultados_atp_ac: string | null;
  resultados_atp_rf: string | null;
  lote_hisopo_atp: string | null;
  observacion_atp: string | null;
  equipo_atp: string | null;
  parte_atp: string | null;
  deteccion_alergenos_ri: string | null;
  deteccion_alergenos_ac: string | null;
  deteccion_alergenos_rf: string | null;
  lote_hisopo_alergenos: string | null;
  observacion_alergenos: string | null;
  equipo_alergenos: string | null;
  parte_alergenos: string | null;
  detergente: string | null;
  desinfectante: string | null;
  verificacion_visual: number | null;
  observacion_visual: string | null;
  verificado_por: string | null;
  responsable_produccion: string | null;
  responsable_mantenimiento: string | null;
  status: LimpiezaStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface LimpiezaRegistro {
  id: string;
  fecha: string;
  mes_corte: string | null;
  detalles: string | null;
  lote: string | null;
  producto: string | null;
  origin: 'manual' | 'produccion' | 'cronograma' | null;
  generated_from_production_record_id: string | null;
  cronograma_task_id?: number | null;
  status: LimpiezaStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type LimpiezaRegistroWithLiberaciones = LimpiezaRegistro & {
  liberaciones: LimpiezaLiberacion[];
};

// Type for API response that includes liberaciones
export type LimpiezaRegistroAPI = LimpiezaRegistroWithLiberaciones;

class LimpiezaRegistrosService {
  private baseUrl = '/api/limpieza-registros';

  async getAll(): Promise<LimpiezaRegistroAPI[]> {
    const res = await fetch(this.baseUrl);
    
    // Si el usuario no está autenticado, retornar array vacío
    if (res.status === 401) {
      return [];
    }
    
    if (!res.ok) throw new Error('Error al obtener registros de limpieza');
    return await res.json();
  }

  async getByDate(date: string): Promise<LimpiezaRegistro[]> {
    const res = await fetch(`${this.baseUrl}?date=${encodeURIComponent(date)}`);
    if (!res.ok) throw new Error('Error al obtener registros de limpieza por fecha');
    return await res.json();
  }

  async getById(id: string): Promise<LimpiezaRegistroWithLiberaciones> {
    const res = await fetch(`${this.baseUrl}?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Error al obtener registro de limpieza');
    return await res.json();
  }

  async getByCronogramaTaskId(cronogramaTaskId: number): Promise<LimpiezaRegistro> {
    const res = await fetch(`${this.baseUrl}?cronogramaTaskId=${encodeURIComponent(String(cronogramaTaskId))}`);
    if (!res.ok) throw new Error('Error al obtener registro de limpieza por tarea de cronograma');
    return await res.json();
  }

  async getByCronogramaTaskIds(cronogramaTaskIds: number[]): Promise<LimpiezaRegistro[]> {
    const ids = (cronogramaTaskIds || [])
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && !Number.isNaN(n));
    if (ids.length === 0) return [];

    const res = await fetch(`${this.baseUrl}?cronogramaTaskIds=${encodeURIComponent(ids.join(','))}`);
    if (!res.ok) throw new Error('Error al obtener registros de limpieza por tareas de cronograma');
    return await res.json();
  }

  async create(payload: {
    fecha: string;
    mes_corte?: string | null;
    detalles?: string | null;
    lote?: string | null;
    producto?: string | null;
    origin?: 'manual' | 'produccion' | 'cronograma';
    generated_from_production_record_id?: string | null;
    cronograma_task_id?: number | null;
    created_by?: string | null;
    liberaciones?: Array<Partial<LimpiezaLiberacion> & { status?: LimpiezaStatus }>;
  }): Promise<LimpiezaRegistroWithLiberaciones> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      throw new Error(
        `Error al crear registro de limpieza (${res.status}): ${bodyText || res.statusText}`
      );
    }
    return await res.json();
  }

  async update(id: string, payload: {
    fecha?: string;
    mes_corte?: string | null;
    detalles?: string | null;
    lote?: string | null;
    producto?: string | null;
    updated_by?: string | null;
  }): Promise<LimpiezaRegistro> {
    const res = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      throw new Error(
        `Error al actualizar registro de limpieza (${res.status}): ${bodyText || res.statusText}`
      );
    }
    return await res.json();
  }

  async delete(id: string): Promise<{ deleted: boolean; id: string }> {
    const res = await fetch(`${this.baseUrl}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      throw new Error(
        `Error al eliminar registro de limpieza (${res.status}): ${bodyText || res.statusText}`
      );
    }
    return await res.json();
  }
}

class LimpiezaLiberacionesService {
  private baseUrl = '/api/limpieza-liberaciones';

  async upsert(payload: any): Promise<any> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error al guardar liberación');
    return await res.json();
  }

  async delete(id: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}?id=${encodeURIComponent(id)}` , {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar liberación');
    return await res.json();
  }
}

export const limpiezaRegistrosService = new LimpiezaRegistrosService();
export const limpiezaLiberacionesService = new LimpiezaLiberacionesService();
