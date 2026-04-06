'use client';

import { useState, useEffect } from 'react';
import { fieldAuditService, type FieldAuditLog } from '@/lib/field-audit-service';

interface UseFieldAuditOptions {
  tableName?: string;
  recordId?: string;
  fieldName?: string;
  autoLoad?: boolean;
}

interface UseFieldAuditReturn {
  history: FieldAuditLog[];
  hasHistory: boolean;
  lastChange: FieldAuditLog | null;
  isLoading: boolean;
  error: string | null;
  loadHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  hasFieldHistory: (fieldName: string) => Promise<boolean>;
  getLastFieldChange: (fieldName: string) => Promise<FieldAuditLog | null>;
}

export function useFieldAudit({
  tableName = 'production_records',
  recordId,
  fieldName,
  autoLoad = true
}: UseFieldAuditOptions = {}): UseFieldAuditReturn {
  const [history, setHistory] = useState<FieldAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!recordId) {
      setError('Se requiere recordId');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let auditHistory: FieldAuditLog[] = [];

      if (fieldName) {
        // Historial de un campo específico
        auditHistory = await fieldAuditService.getFieldHistory(tableName, recordId, fieldName);
      } else {
        // Historial completo del registro
        auditHistory = await fieldAuditService.getRecordHistory(tableName, recordId);
      }

      setHistory(auditHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHistory = async () => {
    await loadHistory();
  };

  const hasFieldHistory = async (specificFieldName: string): Promise<boolean> => {
    if (!recordId) return false;
    
    try {
      return await fieldAuditService.hasFieldHistory(tableName, recordId, specificFieldName);
    } catch (err) {
      console.error('Error verificando historial del campo:', err);
      return false;
    }
  };

  const getLastFieldChange = async (specificFieldName: string): Promise<FieldAuditLog | null> => {
    if (!recordId) return null;
    
    try {
      return await fieldAuditService.getLastFieldChange(tableName, recordId, specificFieldName);
    } catch (err) {
      console.error('Error obteniendo último cambio:', err);
      return null;
    }
  };

  // Cargar automáticamente si se especifica
  useEffect(() => {
    if (autoLoad && recordId) {
      loadHistory();
    }
  }, [autoLoad, recordId, tableName, fieldName]);

  return {
    history,
    hasHistory: history.length > 0,
    lastChange: history.length > 0 ? history[0] : null,
    isLoading,
    error,
    loadHistory,
    refreshHistory,
    hasFieldHistory,
    getLastFieldChange
  };
}

// Hook para verificar cambios recientes
export function useRecentChanges(
  tableName: string = 'production_records',
  recordId: string,
  hours: number = 24
) {
  const [recentChanges, setRecentChanges] = useState<FieldAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadRecentChanges = async () => {
      if (!recordId) return;

      try {
        setIsLoading(true);
        const changes = await fieldAuditService.getRecentFieldChanges(tableName, recordId, hours);
        setRecentChanges(changes);
      } catch (err) {
        console.error('Error cargando cambios recientes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentChanges();
  }, [tableName, recordId, hours]);

  return {
    recentChanges,
    hasRecentChanges: recentChanges.length > 0,
    isLoading,
    refreshRecentChanges: () => {
      // Recargar los cambios recientes
      if (!recordId) return;
      
      fieldAuditService.getRecentFieldChanges(tableName, recordId, hours)
        .then(changes => setRecentChanges(changes))
        .catch(err => console.error('Error recargando cambios recientes:', err));
    }
  };
}
