export interface Equipo {
  id: number;
  area: 'Salsas' | 'Conservas';
  codigo: string;
  nombre: string;
  created_at: string;
  updated_at: string;
  partes?: Parte[];
}

export interface Parte {
  id: number;
  equipo_id: number;
  nombre: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipoData {
  area: 'Salsas' | 'Conservas';
  codigo: string;
  nombre: string;
}

export interface UpdateEquipoData {
  area?: 'Salsas' | 'Conservas';
  codigo?: string;
  nombre?: string;
}

export interface CreateParteData {
  equipo_id: number;
  nombre: string;
  observaciones?: string;
}

export interface UpdateParteData {
  nombre?: string;
  observaciones?: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
};

export const equiposApi = {
  // Obtener todos los equipos
  async getAll(): Promise<Equipo[]> {
    const response = await fetch('/api/equipos');
    return handleResponse(response);
  },

  // Obtener un equipo por ID
  async getById(id: number): Promise<Equipo> {
    const response = await fetch(`/api/equipos/${id}`);
    return handleResponse(response);
  },

  // Crear un nuevo equipo
  async create(data: CreateEquipoData): Promise<Equipo> {
    const response = await fetch('/api/equipos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Actualizar un equipo
  async update(id: number, data: UpdateEquipoData): Promise<Equipo> {
    console.log('🔧 equiposApi.update llamado con:', { id, tipo: typeof id, data });
    
    if (isNaN(id) || id <= 0) {
      throw new Error('ID de equipo inválido');
    }
    
    const response = await fetch(`/api/equipos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Eliminar un equipo
  async delete(id: number): Promise<void> {
    console.log('🗑️ equiposApi.delete llamado con:', { id, tipo: typeof id });
    
    if (isNaN(id) || id <= 0) {
      throw new Error('ID de equipo inválido');
    }
    
    const response = await fetch(`/api/equipos/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  // Crear una parte para un equipo
  async createParte(data: CreateParteData): Promise<Parte> {
    const response = await fetch('/api/partes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Actualizar una parte
  async updateParte(id: number, data: UpdateParteData): Promise<Parte> {
    const response = await fetch(`/api/partes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Eliminar una parte
  async deleteParte(id: number): Promise<void> {
    const response = await fetch(`/api/partes/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  }
};
