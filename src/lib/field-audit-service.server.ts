import { Pool } from 'pg';
import { createDatabasePool } from './database-config';

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

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

class FieldAuditService {
  private pool: Pool;

  constructor() {
    this.pool = createDatabasePool('area_calidad');
  }

  /**
   * Registrar un cambio individual de campo
   */
  async logFieldChange(data: {
    tableName: string;
    recordId: string;
    fieldName: string;
    oldValue?: any;
    newValue?: any;
    changedBy: string;
    changeReason?: string;
    changeType?: 'INSERT' | 'UPDATE' | 'DELETE';
    userRole?: string;
    userEmail?: string;
    sessionId?: string;
    ipAddress?: string;
  }): Promise<FieldAuditLog> {
    const query = `
      INSERT INTO field_audit_log (
        table_name, record_id, field_name, old_value, new_value,
        changed_by, change_reason, change_type, user_role, 
        user_email, session_id, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      data.tableName,
      data.recordId,
      data.fieldName,
      data.oldValue ? String(data.oldValue) : null,
      data.newValue ? String(data.newValue) : null,
      data.changedBy,
      data.changeReason || null,
      data.changeType || 'UPDATE',
      data.userRole || null,
      data.userEmail || null,
      data.sessionId || null,
      data.ipAddress || null
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToAuditLog(result.rows[0]);
  }

  /**
   * Registrar múltiples cambios a la vez (para un UPDATE)
   */
  async logMultipleChanges(
    tableName: string,
    recordId: string,
    changes: FieldChange[],
    changedBy: string,
    options?: {
      changeReason?: string;
      userRole?: string;
      userEmail?: string;
      sessionId?: string;
      ipAddress?: string;
    }
  ): Promise<FieldAuditLog[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const logs: FieldAuditLog[] = [];
      
      for (const change of changes) {
        const query = `
          INSERT INTO field_audit_log (
            table_name, record_id, field_name, old_value, new_value,
            changed_by, change_reason, change_type, user_role, 
            user_email, session_id, ip_address
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `;

        const values = [
          tableName,
          recordId,
          change.field,
          change.oldValue ? String(change.oldValue) : null,
          change.newValue ? String(change.newValue) : null,
          changedBy,
          options?.changeReason || null,
          'UPDATE',
          options?.userRole || null,
          options?.userEmail || null,
          options?.sessionId || null,
          options?.ipAddress || null
        ];

        const result = await client.query(query, values);
        logs.push(this.mapRowToAuditLog(result.rows[0]));
      }
      
      await client.query('COMMIT');
      return logs;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener historial de cambios de un campo específico
   */
  async getFieldHistory(
    tableName: string,
    recordId: string,
    fieldName: string,
    limit: number = 50
  ): Promise<FieldAuditLog[]> {
    const query = `
      SELECT * FROM field_audit_log 
      WHERE table_name = $1 AND record_id = $2 AND field_name = $3
      ORDER BY created_at DESC
      LIMIT $4
    `;

    const result = await this.pool.query(query, [tableName, recordId, fieldName, limit]);
    return result.rows.map(row => this.mapRowToAuditLog(row));
  }

  /**
   * Obtener todos los cambios de un registro
   */
  async getRecordHistory(
    tableName: string,
    recordId: string,
    limit: number = 100
  ): Promise<FieldAuditLog[]> {
    const query = `
      SELECT * FROM field_audit_log 
      WHERE table_name = $1 AND record_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;

    const result = await this.pool.query(query, [tableName, recordId, limit]);
    return result.rows.map(row => this.mapRowToAuditLog(row));
  }

  /**
   * Obtener cambios recientes de un usuario
   */
  async getUserChanges(
    userEmail: string,
    limit: number = 50
  ): Promise<FieldAuditLog[]> {
    const query = `
      SELECT * FROM field_audit_log 
      WHERE user_email = $1 OR changed_by = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [userEmail, limit]);
    return result.rows.map(row => this.mapRowToAuditLog(row));
  }

  /**
   * Obtener campos modificados recientemente de un registro
   */
  async getRecentFieldChanges(
    tableName: string,
    recordId: string,
    hours: number = 24
  ): Promise<FieldAuditLog[]> {
    const query = `
      SELECT * FROM field_audit_log 
      WHERE table_name = $1 AND record_id = $2 
        AND created_at >= NOW() - INTERVAL '${hours} hours'
        AND field_name NOT IN ('CREATED_RECORD', 'DELETED_RECORD')
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [tableName, recordId]);
    return result.rows.map(row => this.mapRowToAuditLog(row));
  }

  /**
   * Verificar si un campo tiene historial de cambios
   */
  async hasFieldHistory(
    tableName: string,
    recordId: string,
    fieldName: string
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM field_audit_log 
      WHERE table_name = $1 AND record_id = $2 AND field_name = $3
        AND field_name NOT IN ('CREATED_RECORD', 'DELETED_RECORD')
    `;

    const result = await this.pool.query(query, [tableName, recordId, fieldName]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Obtener el último cambio de un campo específico
   */
  async getLastFieldChange(
    tableName: string,
    recordId: string,
    fieldName: string
  ): Promise<FieldAuditLog | null> {
    const query = `
      SELECT * FROM field_audit_log 
      WHERE table_name = $1 AND record_id = $2 AND field_name = $3
        AND field_name NOT IN ('CREATED_RECORD', 'DELETED_RECORD')
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [tableName, recordId, fieldName]);
    return result.rows.length > 0 ? this.mapRowToAuditLog(result.rows[0]) : null;
  }

  /**
   * Mapear fila de base de datos a objeto FieldAuditLog
   */
  private mapRowToAuditLog(row: any): FieldAuditLog {
    return {
      id: row.id,
      created_at: row.created_at,
      table_name: row.table_name,
      record_id: row.record_id,
      field_name: row.field_name,
      old_value: row.old_value,
      new_value: row.new_value,
      changed_by: row.changed_by,
      change_reason: row.change_reason,
      change_type: row.change_type,
      user_role: row.user_role,
      user_email: row.user_email,
      session_id: row.session_id,
      ip_address: row.ip_address
    };
  }
}

export const fieldAuditService = new FieldAuditService();
