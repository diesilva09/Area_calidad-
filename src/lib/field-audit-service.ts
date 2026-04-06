// Types moved from server-side service
export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface FieldAuditLog {
  id: string;
  created_at: Date;
  table_name: string;
  record_id: string;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by: string;
  change_reason?: string | null;
  change_type: 'INSERT' | 'UPDATE' | 'DELETE';
  user_role?: string | null;
  user_email?: string | null;
  session_id?: string | null;
  ip_address?: string | null;
}

// Client-side API service
class FieldAuditClientService {
  private baseUrl = '/api/field-audit';

  /**
   * Obtener historial completo de un registro
   */
  async getRecordHistory(
    tableName: string,
    recordId: string,
    limit: number = 50
  ): Promise<FieldAuditLog[]> {
    const params = new URLSearchParams({
      tableName,
      recordId,
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Error fetching record history: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Obtener historial de un campo específico
   */
  async getFieldHistory(
    tableName: string,
    recordId: string,
    fieldName: string,
    limit: number = 50
  ): Promise<FieldAuditLog[]> {
    const params = new URLSearchParams({
      tableName,
      recordId,
      fieldName,
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Error fetching field history: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Obtener cambios de un usuario
   */
  async getUserChanges(
    userEmail: string,
    limit: number = 50
  ): Promise<FieldAuditLog[]> {
    const params = new URLSearchParams({
      userEmail,
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Error fetching user changes: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Obtener cambios recientes de un registro
   */
  async getRecentFieldChanges(
    tableName: string,
    recordId: string,
    hours: number = 24
  ): Promise<FieldAuditLog[]> {
    const params = new URLSearchParams({
      tableName,
      recordId,
      hours: hours.toString()
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Error fetching recent changes: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Verificar si un campo tiene historial de cambios
   */
  async hasFieldHistory(
    tableName: string,
    recordId: string,
    fieldName: string
  ): Promise<boolean> {
    try {
      const history = await this.getFieldHistory(tableName, recordId, fieldName, 1);
      return history.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Obtener el último cambio de un campo específico
   */
  async getLastFieldChange(
    tableName: string,
    recordId: string,
    fieldName: string
  ): Promise<FieldAuditLog | null> {
    try {
      const history = await this.getFieldHistory(tableName, recordId, fieldName, 1);
      return history.length > 0 ? history[0] : null;
    } catch {
      return null;
    }
  }
}

export const fieldAuditService = new FieldAuditClientService();
