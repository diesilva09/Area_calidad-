'use client';

import React, { useState, useEffect } from 'react';
import { X, History, User, Clock, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { fieldAuditService, type FieldAuditLog } from '@/lib/field-audit-service';
import { formatAuditValue, getFieldDisplayName, getChangeColor, groupChangesByField } from '@/lib/audit-utils';
import { getUserDisplayName } from '@/lib/user-display-utils';

interface FieldHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  recordId: string;
  recordTitle?: string;
}

export function FieldHistoryPanel({
  isOpen,
  onClose,
  tableName,
  recordId,
  recordTitle = 'Registro'
}: FieldHistoryPanelProps) {
  const [history, setHistory] = useState<FieldAuditLog[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<FieldAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterField, setFilterField] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar historial cuando se abre el panel
  useEffect(() => {
    if (isOpen && recordId && tableName) {
      loadHistory();
    }
  }, [isOpen, recordId, tableName]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...history];

    // Filtrar por campo
    if (filterField !== 'all') {
      filtered = filtered.filter(change => change.field_name === filterField);
    }

    // Filtrar por usuario
    if (filterUser !== 'all') {
      filtered = filtered.filter(change => change.changed_by === filterUser);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(change => 
        change.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        change.changed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (change.old_value && change.old_value.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (change.new_value && change.new_value.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredHistory(filtered);
  }, [history, filterField, filterUser, searchTerm]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const recordHistory = await fieldAuditService.getRecordHistory(tableName, recordId, 100);
      setHistory(recordHistory);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener campos únicos para el filtro
  const uniqueFields = Array.from(new Set(history.map(h => h.field_name))).sort();
  const uniqueUsers = Array.from(new Set(history.map(h => h.changed_by))).sort();

  // Agrupar cambios por campo
  const groupedChanges = groupChangesByField(filteredHistory);

  // Exportar historial
  const exportHistory = () => {
    const csv = [
      ['Fecha', 'Campo', 'Usuario', 'Valor Anterior', 'Valor Nuevo', 'Motivo'],
      ...filteredHistory.map(change => [
        change.created_at.toLocaleString('es-ES'),
        getFieldDisplayName(change.field_name),
        getUserDisplayName(change.changed_by),
        formatAuditValue(change.old_value),
        formatAuditValue(change.new_value),
        change.change_reason || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_${tableName}_${recordId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Historial de Cambios</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={exportHistory}
            disabled={filteredHistory.length === 0}
            className="text-green-600"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 border-b bg-gray-50 space-y-3">
        <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        
        <Input
          placeholder="Buscar en historial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm"
        />

        <div className="grid grid-cols-1 gap-2">
          <Select value={filterField} onValueChange={setFilterField}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Campo" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">Todos los campos</SelectItem>
              {uniqueFields.map(field => (
                <SelectItem key={field} value={field} className="text-xs">
                  {getFieldDisplayName(field)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Usuario" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {uniqueUsers.map(user => (
                <SelectItem key={user} value={user} className="text-xs">
                  {getUserDisplayName(user)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-gray-600">
          Mostrando {filteredHistory.length} de {history.length} cambios
        </div>
      </div>

      {/* Contenido */}
      <ScrollArea className="flex-1 p-4 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-600">Cargando historial...</div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mb-3" />
            <div className="text-sm text-gray-600">
              {history.length === 0 
                ? 'No hay historial de cambios para este registro' 
                : 'No hay cambios que coincidan con los filtros'
              }
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedChanges).map(([fieldName, changes]) => (
              <div key={fieldName} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">
                    {getFieldDisplayName(fieldName)}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {changes.length} cambio{changes.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {changes.map((change, index) => (
                    <div 
                      key={change.id} 
                      className={`border-l-2 pl-3 py-2 ${
                        index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="text-sm font-medium">
                            {getUserDisplayName(change.changed_by)}
                          </span>
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">
                              Actual
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDistanceToNow(change.created_at, { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </div>
                      </div>

                      {/* Cambio de valores */}
                      <div className="flex flex-col gap-2 text-sm">
                        {change.old_value && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-red-600 line-through bg-red-50 px-2 py-1 rounded text-xs">
                              {formatAuditValue(change.old_value)}
                            </span>
                            <span className="text-gray-400 text-xs">→</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-green-600 bg-green-50 px-2 py-1 rounded text-xs">
                            {formatAuditValue(change.new_value)}
                          </span>
                        </div>
                      </div>

                      {/* Motivo */}
                      {change.change_reason && (
                        <div className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                          <strong>Motivo:</strong> {change.change_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          Registro: {recordTitle} | ID: {recordId}
        </div>
      </div>
    </div>
  );
}
