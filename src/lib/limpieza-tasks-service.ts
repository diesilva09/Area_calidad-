export interface LimpiezaTask {
  id: number;
  area: string;
  tipo_muestra: string;
  detalles: string | null;
  fecha: string;
  mes_corte?: string | null;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
  created_by: string | null;

  recurrence_template_id?: number | null;
  recurrence_active?: boolean | null;
  recurrence_frequency_type?: 'daily' | 'weekly' | 'monthly' | 'custom' | null;
  recurrence_frequency_unit?: 'day' | 'week' | 'month' | null;
  recurrence_frequency_interval?: number | null;
  recurrence_start_date?: string | null;
  recurrence_end_date?: string | null;
  recurrence_timezone?: string | null;
}

class LimpiezaTasksService {
  private baseUrl = '/api/limpieza-tasks';

  async getAll(): Promise<LimpiezaTask[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) throw new Error('Error al obtener las labores de limpieza');
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaTasksService.getAll:', error);
      throw error;
    }
  }

  async getByDate(date: Date): Promise<LimpiezaTask[]> {
    try {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`; // YYYY-MM-DD (local)
      const response = await fetch(`${this.baseUrl}?date=${dateStr}`);
      if (!response.ok) throw new Error('Error al obtener las labores para la fecha');
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaTasksService.getByDate:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<LimpiezaTask> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) throw new Error('Error al obtener la labor de limpieza');
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaTasksService.getById:', error);
      throw error;
    }
  }

  async create(task: Omit<LimpiezaTask, 'id' | 'created_at' | 'updated_at'>): Promise<LimpiezaTask> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear la labor de limpieza');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaTasksService.create:', error);
      throw error;
    }
  }

  async update(id: number, task: Partial<LimpiezaTask>): Promise<LimpiezaTask> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error('Error al actualizar la labor de limpieza');
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaTasksService.update:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar la labor de limpieza');
    } catch (error) {
      console.error('Error en LimpiezaTasksService.delete:', error);
      throw error;
    }
  }

  async toggleStatus(id: number): Promise<LimpiezaTask> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/toggle`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Error al cambiar el estado de la labor');
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaTasksService.toggleStatus:', error);
      throw error;
    }
  }

  async markAsCompleted(id: number): Promise<LimpiezaTask> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!response.ok) throw new Error('Error al marcar la tarea como completada');
      return await response.json();
    } catch (error) {
      console.error('Error en LimpiezaTasksService.markAsCompleted:', error);
      throw error;
    }
  }
}

export const limpiezaTasksService = new LimpiezaTasksService();
