// Tipos de datos para el cronograma de microbiología
export interface MicrobiologiaCronogramaTask {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  tipo: 'manipuladores' | 'superficies' | 'ambientes' | 'otro';
  tipo_personalizado?: string | null;
  area: string;
  area_personalizada?: string | null;
  frecuencia: 'Diaria' | 'Semanal' | 'Quincenal' | 'Mensual';
  responsable?: string | null;
  descripcion?: string | null;
  status: 'pending' | 'completed';
  all_day: boolean;
  marca_manual?: 'externo' | 'alergenos' | null | undefined;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

// Tipo para crear nueva tarea (sin campos autogenerados)
export type CreateMicrobiologiaCronogramaTask = Omit<
  MicrobiologiaCronogramaTask,
  'id' | 'created_at' | 'updated_at'
>;

// Tipo para actualizar tarea
export type UpdateMicrobiologiaCronogramaTask = Partial<CreateMicrobiologiaCronogramaTask> & {
  marcaManual?: 'externo' | 'alergenos' | null;
};

class MicrobiologiaCronogramaService {
  private baseUrl = '/api/microbiologia-cronograma';

  // Obtener todas las tareas
  async getAll(): Promise<MicrobiologiaCronogramaTask[]> {
    try {
      const response = await fetch(this.baseUrl, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener las tareas del cronograma');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en MicrobiologiaCronogramaService.getAll:', error);
      throw error;
    }
  }

  // Obtener tareas por rango de fechas
  async getByDateRange(startDate: string, endDate: string): Promise<MicrobiologiaCronogramaTask[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener las tareas por rango de fechas');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en MicrobiologiaCronogramaService.getByDateRange:', error);
      throw error;
    }
  }

  // Obtener tareas por fecha específica
  async getByDate(date: string): Promise<MicrobiologiaCronogramaTask[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}?date=${encodeURIComponent(date)}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener las tareas para la fecha');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en MicrobiologiaCronogramaService.getByDate:', error);
      throw error;
    }
  }

  // Obtener una tarea por ID
  async getById(id: number): Promise<MicrobiologiaCronogramaTask> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener la tarea del cronograma');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en MicrobiologiaCronogramaService.getById(${id}):`, error);
      throw error;
    }
  }

  // Crear nueva tarea
  async create(task: Omit<CreateMicrobiologiaCronogramaTask, 'created_by'>): Promise<MicrobiologiaCronogramaTask> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear la tarea del cronograma');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en MicrobiologiaCronogramaService.create:', error);
      throw error;
    }
  }

  // Actualizar tarea
  async updateTask(id: number, task: UpdateMicrobiologiaCronogramaTask): Promise<MicrobiologiaCronogramaTask> {
    return this.update(id, task);
  }

  // Actualizar tarea
  async update(id: number, task: UpdateMicrobiologiaCronogramaTask): Promise<MicrobiologiaCronogramaTask> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || `Error ${response.status}: No se pudo actualizar la tarea`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en MicrobiologiaCronogramaService.update(${id}):`, error);
      throw error;
    }
  }

  // Eliminar tarea
  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar la tarea del cronograma');
      }
    } catch (error) {
      console.error(`Error en MicrobiologiaCronogramaService.delete(${id}):`, error);
      throw error;
    }
  }

  // Cambiar estado de la tarea (pending/completed)
  async toggleStatus(id: number): Promise<MicrobiologiaCronogramaTask> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al cambiar el estado de la tarea');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en MicrobiologiaCronogramaService.toggleStatus(${id}):`, error);
      throw error;
    }
  }

  // Marcar tarea como completada
  async markAsCompleted(id: number): Promise<MicrobiologiaCronogramaTask> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', response.status, errorData);
        throw new Error(errorData.error || `Error al marcar la tarea como completada (${response.status})`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en MicrobiologiaCronogramaService.markAsCompleted(${id}):`, error);
      throw error;
    }
  }
}

export const microbiologiaCronogramaService = new MicrobiologiaCronogramaService();
