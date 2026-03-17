import { createDatabasePool } from './database-config';

export interface ModalHistory {
  id: string;
  modalType: 'production' | 'embalaje' | 'limpieza' | 'cronograma';
  version: number;
  format: string;
  type: string;
  approvalDate: string;
  changes: string[];
  createdAt: Date;
  createdBy: string;
}

class ModalHistoryService {
  private readonly STORAGE_KEY = 'modal_history';
  private readonly pool = createDatabasePool();

  // Obtener historial desde localStorage
  getLocalHistory(): ModalHistory[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al obtener historial local:', error);
      return [];
    }
  }

  // Guardar historial en localStorage
  saveLocalHistory(history: ModalHistory[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error al guardar historial local:', error);
    }
  }

  // Obtener historial de un modal específico (desde BD)
  async getHistory(modalType: 'production' | 'embalaje' | 'limpieza'): Promise<ModalHistory[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM modal_history 
         WHERE modal_type = $1 
         ORDER BY created_at DESC`,
        [modalType]
      );

      return result.rows;
    } catch (error) {
      console.error('Error al obtener historial desde BD:', error);
      // Fallback a localStorage
      return this.getLocalHistory().filter(item => item.modalType === modalType);
    }
  }

  // Agregar nueva versión al historial (BD + localStorage)
  async addVersion(history: Omit<ModalHistory, 'id' | 'createdAt' | 'createdBy'>): Promise<ModalHistory | null> {
    try {
      const newHistory: ModalHistory = {
        ...history,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        createdBy: 'system', // Podría venir del contexto de autenticación
      };

      // Guardar en base de datos
      const result = await this.pool.query(
        `INSERT INTO modal_history 
         (id, modal_type, version, format, type, approval_date, changes, created_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          newHistory.id,
          newHistory.modalType,
          newHistory.version,
          newHistory.format,
          newHistory.type,
          newHistory.approvalDate,
          JSON.stringify(newHistory.changes),
          newHistory.createdAt,
          newHistory.createdBy
        ]
      );

      // Actualizar localStorage
      const localHistory = this.getLocalHistory();
      localHistory.unshift(newHistory);
      this.saveLocalHistory(localHistory);

      return result.rows[0] || newHistory;
    } catch (error) {
      console.error('Error al agregar versión al historial:', error);
      return null;
    }
  }

  // Obtener última versión de un modal
  async getLatestVersion(modalType: 'production' | 'embalaje' | 'limpieza'): Promise<ModalHistory | null> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM modal_history 
         WHERE modal_type = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [modalType]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener última versión:', error);
      // Fallback a localStorage
      const localHistory = this.getLocalHistory().filter(item => item.modalType === modalType);
      return localHistory.length > 0 ? localHistory[0] : null;
    }
  }

  // Obtener formato actual
  getCurrentFormat(modalType?: 'production' | 'embalaje' | 'limpieza' | 'cronograma'): {
    format: string;
    type: string;
    version: number;
    approvalDate: string;
  } {
    const formats = {
      production: {
        format: 'RE-CAL-084',
        type: 'CONSOLIDADO VERIFICACIÓN PROCESO DE PRODUCCIÓN',
        version: 10,
        approvalDate: '01 DE JUNIO DE 2025'
      },
      embalaje: {
        format: 'RE-CAL-093',
        type: 'CONSOLIDADO CALIDAD DE PRODUCTO TERMINADO-EMBALAJE',
        version: 6,
        approvalDate: '21 DE MARZO DE 2023'
      },
      limpieza: {
        format: 'RE-CAL-037',
        type: 'CONSOLIDADO VERIFICACIÓN ORDEN, LIMPIEZA Y DESINFECCIÓN 2026',
        version: 15,
        approvalDate: '21 DE MARZO DE 2023'
      },
      cronograma: {
        format: 'PL-CAL-013',
        type: 'CRONOGRAMA ATP 2026',
        version: 1,
        approvalDate: '21 DE MARZO DE 2023'
      }
    };

    return modalType ? formats[modalType] : formats.production;
  }

  // Crear tabla para historial si no existe
  async createHistoryTable(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS modal_history (
          id VARCHAR(36) PRIMARY KEY,
          modal_type VARCHAR(20) NOT NULL,
          version INTEGER NOT NULL,
          format VARCHAR(50) NOT NULL,
          type VARCHAR(100) NOT NULL,
          approval_date VARCHAR(100) NOT NULL,
          changes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100)
        );
      `);

      console.log('✅ Tabla modal_history creada o verificada');
    } catch (error) {
      console.error('Error al crear tabla modal_history:', error);
    }
  }
}

export const modalHistoryService = new ModalHistoryService();
