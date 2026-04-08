import React, { useState, useEffect, useRef } from 'react';
import { X, History, User, Clock, Filter, Download, AlertCircle, CheckCircle, TrendingUp, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { fieldAuditService, type FieldAuditLog } from '@/lib/field-audit-service';
import { 
  formatAuditValue, 
  getFieldDisplayName, 
  isRecentChange, 
  getChangeColor, 
  groupChangesByField,
  getChangeDescription,
  getChangeStats,
  filterChangesByType
} from '@/lib/audit-utils';
import { getUserDisplayName } from '@/lib/user-display-utils';

interface FieldHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  recordId: string;
  recordTitle?: string;
}

export default function FieldHistoryPanel({
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
  const [filterType, setFilterType] = useState<'all' | 'recent' | 'important'>('all');
  const [isClient, setIsClient] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const truncate = (text: string, max: number) => {
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + '…';
  };

  const toShortValue = (value: unknown) => truncate(formatAuditValue(value), 42);
  const toFullValue = (value: unknown) => formatAuditValue(value);

  const renderValueChange = (change: FieldAuditLog) => {
    const oldFull = toFullValue(change.old_value);
    const newFull = toFullValue(change.new_value);
    const oldShort = truncate(oldFull, 42);
    const newShort = truncate(newFull, 42);

    const isTruncated = oldShort !== oldFull || newShort !== newFull;

    const compact = (
      <div className="mt-2 text-sm text-gray-800">
        <span className="text-gray-500">{oldShort}</span>
        <span className="mx-2 text-gray-400">→</span>
        <span className="font-medium">{newShort}</span>
      </div>
    );

    if (!isTruncated) return compact;

    return (
      <details className="group mt-2">
        <summary className="cursor-pointer list-none">
          {compact}
          <div className="mt-1 text-[11px] text-gray-500 group-open:hidden">Ver valor completo</div>
          <div className="mt-1 text-[11px] text-gray-500 hidden group-open:block">Ocultar valor completo</div>
        </summary>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <div className="rounded-md border bg-white p-2">
            <div className="text-[11px] text-gray-500 mb-1">Anterior</div>
            <div className="text-xs text-gray-800 whitespace-pre-wrap break-words">{oldFull}</div>
          </div>
          <div className="rounded-md border bg-white p-2">
            <div className="text-[11px] text-gray-500 mb-1">Nuevo</div>
            <div className="text-xs text-gray-800 whitespace-pre-wrap break-words">{newFull}</div>
          </div>
        </div>
      </details>
    );
  };

  const isToday = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // Detectar si estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setHistory([]);
        setFilteredHistory([]);
        setFilterField('all');
        setFilterUser('all');
        setSearchTerm('');
        setFilterType('all');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Cargar historial
  const loadHistory = async () => {
    try {
      setIsLoading(true);
      console.log('📋 CARGANDO HISTORIAL - Iniciando carga...');
      
      const recordHistory = await fieldAuditService.getRecordHistory(tableName, recordId, 100);
      console.log(`📋 HISTORIAL CARGADO - ${recordHistory.length} registros encontrados`);
      
      setHistory(recordHistory);
    } catch (error) {
      console.error('❌ Error cargando historial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    if (!history.length) return;

    console.log('🔍 APLICANDO FILTROS...');
    
    let filtered = history;

    // Filtrar por tipo
    filtered = filterChangesByType(filtered, filterType);

    // Filtrar por campo
    if (filterField !== 'all') {
      filtered = filtered.filter(h => h.field_name === filterField);
    }

    // Filtrar por usuario
    if (filterUser !== 'all') {
      filtered = filtered.filter(h => h.changed_by === filterUser);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(h => 
        h.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.changed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.new_value && h.new_value.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (h.old_value && h.old_value.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    console.log(`🔍 FILTROS APLICADOS - Resultados: ${filtered.length} de ${history.length}`);
    setFilteredHistory(filtered);
  }, [history, filterField, filterUser, searchTerm, filterType]);

  // Obtener campos únicos para el filtro
  const uniqueFields = Array.from(new Set(history.map(h => h.field_name))).sort();
  const uniqueUsers = Array.from(new Set(history.map(h => h.changed_by))).sort();

  // Agrupar cambios por campo
  const groupedChanges = groupChangesByField(filteredHistory);

  // Estadísticas
  const stats = getChangeStats(history);

  // Exportar historial
  const exportHistory = () => {
    if (filteredHistory.length === 0) return;

    try {
      const csv = [
        ['Fecha', 'Campo', 'Usuario', 'Tipo', 'Valor Anterior', 'Valor Nuevo', 'Motivo'],
        ...filteredHistory.map(change => [
          new Date(change.created_at).toLocaleString('es-ES'),
          getFieldDisplayName(change.field_name),
          getUserDisplayName(change.changed_by),
          change.change_type,
          formatAuditValue(change.old_value),
          formatAuditValue(change.new_value),
          change.change_reason || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historial_${tableName}_${recordId}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('📥 HISTORIAL EXPORTADO - CSV generado exitosamente');
    } catch (error) {
      console.error('❌ Error exportando historial:', error);
    }
  };

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen && isClient) {
      loadHistory();
    }
  }, [isOpen, tableName, recordId, isClient]);

  // Auto-refresh mientras el panel esté abierto (para que "Hoy" se actualice solo)
  useEffect(() => {
    if (!isOpen || !isClient) return;

    const intervalId = window.setInterval(() => {
      loadHistory();
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOpen, isClient, tableName, recordId]);

  // Si no está en el cliente o no está abierto, no renderizar nada
  if (!isClient || !isOpen) {
    return null;
  }

  // Renderizar contenido del panel
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-sm text-gray-600">Cargando historial de cambios...</div>
          <div className="text-xs text-gray-500 mt-2">Analizando registros de auditoría</div>
        </div>
      );
    }

    if (filteredHistory.length === 0) {
      return (
        <div className="text-center py-12">
          <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No hay cambios registrados</p>
          <p className="text-gray-400 text-sm">Este registro no tiene historial de modificaciones</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-xs text-gray-600 flex items-center justify-between">
          <span>
            Total: <strong>{stats.total}</strong>
          </span>
          <span>
            Hoy: <strong>{history.filter(h => isToday(h.created_at)).length}</strong>
          </span>
          <span>
            Importantes: <strong>{stats.important}</strong>
          </span>
        </div>

        {/* Sección de cambios recientes (Hoy) */}
        {(() => {
          const recentChanges = filteredHistory.filter((change: FieldAuditLog) => isToday(change.created_at));
          
          if (recentChanges.length === 0) return null;
          
          return (
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Cambios de Hoy
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 ml-auto">
                    {recentChanges.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {recentChanges.slice(0, 12).map((change: FieldAuditLog, index: number) => (
                    <div 
                      key={change.id} 
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        index === 0 ? 'bg-red-100 border-red-300' : 'bg-white border-orange-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${getChangeColor(change.created_at)} text-xs`}>
                            {getFieldDisplayName(change.field_name)}
                          </Badge>
                          {index === 0 ? (
                            <Badge variant="default" className="text-xs">
                              Más reciente
                            </Badge>
                          ) : null}
                        </div>

                        {renderValueChange(change)}

                        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                          <span className="truncate">
                            {getUserDisplayName(change.changed_by)}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(change.created_at), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentChanges.length > 12 ? (
                    <div className="text-xs text-gray-600 text-center">
                      Mostrando 12 de {recentChanges.length}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Historial completo agrupado por campo - MEJORADO */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial Completo por Campo
            <Badge variant="outline" className="text-xs">
              {Object.keys(groupedChanges).length} campos
            </Badge>
          </h3>
          
          <div className="space-y-4">
            {Object.entries(groupedChanges).map(([fieldName, changes]) => (
              <Card key={fieldName} className="border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-800">
                      {getFieldDisplayName(fieldName)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {changes.length} cambio{changes.length !== 1 ? 's' : ''}
                      </Badge>
                      {changes.some(c => isRecentChange(c.created_at, 24)) && (
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          Reciente
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {changes.map((change: FieldAuditLog, index: number) => (
                      <div 
                        key={change.id} 
                        className={`border-l-4 pl-4 py-3 ${
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
                            {isRecentChange(change.created_at, 24) && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                Reciente
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatDistanceToNow(new Date(change.created_at), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </div>
                        </div>

                        {/* Descripción del cambio */}
                        <div className="text-sm text-gray-700 mb-2">
                          {getChangeDescription(change)}
                        </div>

                        {/* Cambio de valores */}
                        <div className="flex flex-col gap-2 text-sm mb-2">
                          {change.old_value && change.old_value !== change.new_value && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-red-600 line-through bg-red-50 px-2 py-1 rounded text-xs">
                                {formatAuditValue(change.old_value)}
                              </span>
                              <span className="text-gray-400 text-xs">{">"}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-green-600 bg-green-50 px-2 py-1 rounded text-xs">
                              {formatAuditValue(change.new_value)}
                            </span>
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(change.created_at).toLocaleDateString('es-ES')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(change.created_at).toLocaleTimeString('es-ES')}
                          </span>
                          {change.change_type && (
                            <Badge variant="outline" className="text-xs">
                              {change.change_type}
                            </Badge>
                          )}
                        </div>

                        {/* Motivo */}
                        {change.change_reason && (
                          <div className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            <strong>Motivo:</strong> {change.change_reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={panelRef}
      className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col"
      style={{ 
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        visibility: isOpen ? 'visible' : 'hidden'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Historial de Cambios
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          {recordTitle}
        </div>
      </div>

      {/* Filtros - MEJORADOS */}
      <div className="p-4 border-b bg-gray-50">
        <div className="space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <Input
              placeholder="Buscar cambios por campo, usuario o valor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm pl-9"
            />
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Filtros principales */}
          <div className="grid grid-cols-3 gap-2">
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="recent">Recientes (24h)</SelectItem>
                <SelectItem value="important">Importantes</SelectItem>
              </SelectContent>
            </Select>
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
        </div>

        {/* Contador de resultados */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Mostrando {filteredHistory.length} de {history.length} cambios
          </span>
          {history.length > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {stats.recent} recientes
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <ScrollArea className="flex-1 p-4 min-h-0">
        {renderContent()}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={exportHistory}
          disabled={filteredHistory.length === 0}
          className="text-green-600"
        >
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
        <div className="text-xs text-gray-600 text-center">
          Registro: {recordTitle} | ID: {recordId}
        </div>
      </div>
    </div>
  );
}
