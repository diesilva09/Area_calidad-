// Servicio para interactuar con las APIs de registros de embalaje

// Tipo para los registros de embalaje (coincidente con la base de datos)
export interface EmbalajeRecord {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  is_active: boolean;
  status?: 'pending' | 'completed';
  fecha: string;
  mescorte: string;
  producto: string;
  presentacion: string;
  lote: string;
  tamano_lote: string;
  nivel_inspeccion: string;
  cajas_revisadas: string;
  total_unidades_revisadas: string;
  total_unidades_revisadas_real: string;
  observaciones_generales?: string;
  unidades_faltantes: string;
  porcentaje_faltantes: string;
  observaciones_faltantes?: string;
  etiqueta: string;
  porcentaje_etiqueta_no_conforme: string;
  observaciones_etiqueta?: string;
  marcacion: string;
  porcentaje_marcacion_no_conforme: string;
  observaciones_marcacion?: string;
  presentacion_no_conforme: string;
  porcentaje_presentacion_no_conforme: string;
  observaciones_presentacion?: string;
  cajas: string;
  porcentaje_cajas_no_conformes: string;
  observaciones_cajas?: string;
  correccion?: string;
  responsable_identificador_cajas: string;
  responsable_embalaje: string;
  responsable_calidad: string;
  unidades_no_conformes: string;
  porcentaje_incumplimiento: string;
}

// Tipo para crear nuevos registros (sin campos autogenerados)
export type CreateEmbalajeRecord = Omit<EmbalajeRecord, 
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'is_active'
>;

// API de Registros de Embalaje
export const embalajeRecordsAPI = {
  // Obtener todos los registros de embalaje
  async getAll(): Promise<EmbalajeRecord[]> {
    const response = await fetch('/api/embalaje-records');
    
    // Si el usuario no está autenticado, retornar array vacío
    if (response.status === 401) {
      return [];
    }
    
    if (!response.ok) throw new Error('Error al obtener registros de embalaje');
    return response.json();
  },

  // Obtener registros por producto
  async getByProduct(productId: string): Promise<EmbalajeRecord[]> {
    const response = await fetch(`/api/embalaje-records?producto=${productId}`);
    if (!response.ok) throw new Error('Error al obtener registros de embalaje por producto');
    return response.json();
  },

  // Obtener un registro por ID
  async getById(id: string): Promise<EmbalajeRecord | null> {
    const response = await fetch(`/api/embalaje-records/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Error al obtener registro de embalaje');
    }
    return response.json();
  },

  // Crear un nuevo registro de embalaje
  async create(record: CreateEmbalajeRecord): Promise<EmbalajeRecord> {
    const response = await fetch('/api/embalaje-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error('Error al crear registro de embalaje');
    return response.json();
  },

  // Actualizar un registro de embalaje
  async update(id: string, updates: Partial<CreateEmbalajeRecord>): Promise<EmbalajeRecord> {
    const token = localStorage.getItem('auth-token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/embalaje-records/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Error al actualizar registro de embalaje');
    return response.json();
  },

  // Eliminar un registro
  async delete(id: string): Promise<void> {
    const token = localStorage.getItem('auth-token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/embalaje-records/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Error al eliminar registro de embalaje');
  },
};

// Funciones CRUD para registros de embalaje
export const embalajeRecordsService = {
  getAll: embalajeRecordsAPI.getAll,
  getByProduct: embalajeRecordsAPI.getByProduct,
  getById: embalajeRecordsAPI.getById,
  create: embalajeRecordsAPI.create,
  update: embalajeRecordsAPI.update,
  delete: embalajeRecordsAPI.delete,
};
