'use client';

import React, { useState, useEffect } from 'react';
import { Clock, History, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { fieldAuditService, type FieldAuditLog } from '@/lib/field-audit-service';
import { formatAuditValue, getChangeColor, getFieldDisplayName } from '@/lib/audit-utils';
import { getRoleDisplayName, getUserDisplayName } from '@/lib/user-display-utils';

interface AuditedFieldProps {
  label: string;
  value: string | number | null | undefined;
  fieldName: string;
  recordId: string;
  tableName?: string;
  showHistoryButton?: boolean;
  className?: string;
  disabled?: boolean;
}

export function AuditedField({
  label,
  value,
  fieldName,
  recordId,
  tableName = 'production_records',
  showHistoryButton = true,
  className = '',
  disabled = false
}: AuditedFieldProps) {
  const [hasHistory, setHasHistory] = useState(false);
  const [lastChange, setLastChange] = useState<FieldAuditLog | null>(null);
  const [history, setHistory] = useState<FieldAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Cargar información de auditoría
  useEffect(() => {
    const loadAuditInfo = async () => {
      if (!recordId || !fieldName || disabled) return;

      try {
        setIsLoading(true);
        
        // Verificar si tiene historial
        const hasFieldHistory = await fieldAuditService.hasFieldHistory(tableName, recordId, fieldName);
        setHasHistory(hasFieldHistory);

        if (hasFieldHistory) {
          // Obtener el último cambio
          const lastChange = await fieldAuditService.getLastFieldChange(tableName, recordId, fieldName);
          setLastChange(lastChange);
        }
      } catch (error) {
        console.error('Error cargando información de auditoría:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuditInfo();
  }, [recordId, fieldName, tableName, disabled]);

  // Cargar historial completo cuando se abre el diálogo
  const loadHistory = async () => {
    if (!recordId || !fieldName) return;

    try {
      setIsLoading(true);
      const fieldHistory = await fieldAuditService.getFieldHistory(tableName, recordId, fieldName, 20);
      setHistory(fieldHistory);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    loadHistory();
  };

  const displayValue = formatAuditValue(value);
  const changeColor = lastChange ? getChangeColor(lastChange.created_at) : '';
  const isRecent = lastChange && (new Date().getTime() - new Date(lastChange.created_at).getTime()) < (24 * 60 * 60 * 1000);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {label}
      </label>

      {/* Valor con indicador */}
      <div className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
        hasHistory ? 'border-l-4 ' + changeColor : 'border-gray-200'
      }`}>
        <div className="flex-1">
          <div className="text-lg font-semibold">{displayValue}</div>
        </div>

        {/* Botón de historial */}
        {hasHistory && showHistoryButton && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenDialog}
                  disabled={isLoading}
                  className="text-blue-600 hover:bg-blue-50"
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver historial de cambios</p>
                {lastChange && (
                  <p className="text-xs text-gray-600 mt-1">
                    Por: {getUserDisplayName(lastChange.changed_by)}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Diálogo de historial */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de cambios: {getFieldDisplayName(fieldName)}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 max-h-[70vh] pr-4">
            <div className="space-y-4 pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-600">Cargando historial...</div>
                </div>
              ) : history.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-600">No hay historial de cambios para este campo</div>
                </div>
              ) : (
                history.map((change, index) => (
                  <div 
                    key={change.id} 
                    className={`border rounded-lg p-4 ${
                      index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {index === 0 ? "Actual" : "Anterior"}
                        </Badge>
                        <span className="font-medium">
                          {getUserDisplayName(change.changed_by)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(change.created_at).toLocaleString('es-ES')}
                      </div>
                    </div>

                    {/* Cambio de valores */}
                    <div className="flex items-center gap-3 mb-2">
                      {change.old_value && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-600 line-through">
                            {formatAuditValue(change.old_value)}
                          </span>
                          <span className="text-gray-400">→</span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-green-600">
                        {formatAuditValue(change.new_value)}
                      </span>
                    </div>

                    {/* Motivo del cambio */}
                    {change.change_reason && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Motivo:</strong> {change.change_reason}
                      </div>
                    )}

                    {/* Metadatos */}
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
                      {change.user_role && <span>Rol: {getRoleDisplayName(change.user_role)}</span>}
                      {change.ip_address && <span>IP: {change.ip_address}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
