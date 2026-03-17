import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CheckCircle, AlertTriangle, Eye, Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddLimpiezaRecordModal } from '@/components/supervisores/add-limpieza-record-modal';
import { ViewLimpiezaRegistroModal } from '@/components/supervisores/view-limpieza-registro-modal';
import { EditLimpiezaRegistroModal } from '@/components/supervisores/edit-limpieza-registro-modal';
import { limpiezaRegistrosService, type LimpiezaRegistro } from '@/lib/limpieza-registros-service';
import { AddLimpiezaTaskModal } from '@/components/supervisores/add-limpieza-task-modal';
import { limpiezaTasksService, type LimpiezaTask } from '@/lib/limpieza-tasks-service';

interface LimpiezaRegistrosTabProps {
  registros: LimpiezaRegistro[];
  isJefe: boolean;
  onRefresh: () => void;
}

export function LimpiezaRegistrosTab({
  registros,
  isJefe,
  onRefresh
}: LimpiezaRegistrosTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnlyModal, setIsViewOnlyModal] = useState(false);
  const [editingVerification, setEditingVerification] = useState<any | null>(null);
  const [editingRegistroIdForLiberacion, setEditingRegistroIdForLiberacion] = useState<string | null>(null);
  const [editingLiberacionId, setEditingLiberacionId] = useState<string | null>(null);
  const [viewingRegistroId, setViewingRegistroId] = useState<string | null>(null);
  const [editingRegistro, setEditingRegistro] = useState<LimpiezaRegistro | null>(null);
  const [editingCronogramaTask, setEditingCronogramaTask] = useState<LimpiezaTask | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cronograma'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | null
    | { kind: 'cronograma_task'; taskId: number }
    | { kind: 'limpieza_registro'; registroId: string }
  >(null);

  const filteredRegistros = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    return (registros || []).filter((registro) => {
      const isCronogramaRegistro =
        registro.origin === 'cronograma' &&
        registro.cronograma_task_id != null &&
        !Number.isNaN(Number(registro.cronograma_task_id));

      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && registro.status === 'pending') ||
        (statusFilter === 'completed' && registro.status === 'completed') ||
        (statusFilter === 'cronograma' && isCronogramaRegistro);

      if (!statusMatch) return false;
      if (!q) return true;

      const lote = String(registro.lote || '').toLowerCase();
      const producto = String(registro.producto || '').toLowerCase();
      return lote.includes(q) || producto.includes(q);
    });
  }, [registros, searchTerm, statusFilter]);

  const getOriginBadge = (registro: LimpiezaRegistro) => {
    const isCronogramaRegistro =
      registro.origin === 'cronograma' &&
      registro.cronograma_task_id != null &&
      !Number.isNaN(Number(registro.cronograma_task_id));
    if (!isCronogramaRegistro) return null;
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        Cronograma
      </Badge>
    );
  };

  const handleCreateVerification = () => {
    setEditingVerification(null);
    setIsModalOpen(true);
  };

  const handleEditRegistro = (registro: LimpiezaRegistro) => {
    if (registro.origin === 'cronograma') {
      const taskId = registro.cronograma_task_id;
      if (!taskId) {
        alert('Este registro no tiene tarea de cronograma asociada.');
        return;
      }

      limpiezaTasksService
        .getById(Number(taskId))
        .then((task) => setEditingCronogramaTask(task))
        .catch((error) => {
          console.error('Error al cargar tarea de cronograma:', error);
          alert('No se pudo cargar la tarea del cronograma.');
        });

      return;
    }

    setEditingRegistro(registro);
  };

  const handleViewRegistro = (registroId: string) => {
    setViewingRegistroId(registroId);
  };

  const handleEditLiberacion = (registroId: string, liberacionId: string) => {
    if (!isJefe) return;
    setViewingRegistroId(null);
    setEditingVerification(null);
    setIsViewOnlyModal(false);
    setEditingRegistroIdForLiberacion(registroId);
    setEditingLiberacionId(liberacionId);
    setIsModalOpen(true);
  };

  const handleViewLiberacion = (registroId: string, liberacionId: string) => {
    setViewingRegistroId(null);
    setEditingVerification(null);
    setIsViewOnlyModal(true);
    setEditingRegistroIdForLiberacion(registroId);
    setEditingLiberacionId(liberacionId);
    setIsModalOpen(true);
  };

  const handleCreateLiberacion = (registroId: string) => {
    if (!isJefe) return;
    setViewingRegistroId(null);
    setEditingVerification(null);
    setIsViewOnlyModal(false);
    setEditingRegistroIdForLiberacion(registroId);
    setEditingLiberacionId(null);
    setIsModalOpen(true);
  };

  const handleCompleteRegistro = (registroId: string) => {
    setViewingRegistroId(null);
    setEditingVerification(null);
    setIsViewOnlyModal(false);
    setEditingRegistroIdForLiberacion(registroId);
    setEditingLiberacionId(null);
    setIsModalOpen(true);
  };

  const requestDeleteRegistro = (registroId: string) => {
    if (!isJefe) return;
    const registro = (registros || []).find((r) => r.id === registroId);
    if (registro?.origin === 'cronograma') {
      const taskId = registro.cronograma_task_id;
      if (!taskId) {
        alert('Este registro no tiene tarea de cronograma asociada.');
        return;
      }
      setPendingDelete({ kind: 'cronograma_task', taskId: Number(taskId) });
      setConfirmDeleteOpen(true);
      return;
    }

    setPendingDelete({ kind: 'limpieza_registro', registroId });
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      if (pendingDelete.kind === 'cronograma_task') {
        await limpiezaTasksService.delete(Number(pendingDelete.taskId));
      } else {
        await limpiezaRegistrosService.delete(pendingDelete.registroId);
      }
      onRefresh();
    } finally {
      setConfirmDeleteOpen(false);
      setPendingDelete(null);
    }
  };

  const getStatusBadge = (registro: LimpiezaRegistro) => {
    if (registro.status === 'completed') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <CheckCircle className="h-5 w-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Registros de Limpieza
          </h2>
        </div>
        
        {isJefe && (
          <Button onClick={handleCreateVerification} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Registro
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-64">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
              <SelectItem value="cronograma">Cronograma</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:max-w-md">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por lote o producto"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {registros.length}
            </div>
            <div className="text-sm text-gray-600">Total de Registros</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {registros.filter(v => v.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {registros.filter(v => v.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completados</div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRegistros.map((registro) => (
          <Card 
            key={registro.id} 
            className={`hover:shadow-md transition-shadow ${
              registro.status === 'pending' 
                ? 'border-yellow-200 bg-yellow-50' 
                : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">
                  Registro
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getOriginBadge(registro)}
                  {getStatusBadge(registro)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Fecha:</span>{' '}
                  {new Date(registro.fecha).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Mes corte:</span> {registro.mes_corte || 'N/A'}
                </div>
                {registro.detalles && (
                  <div>
                    <span className="font-medium">Observaciones:</span>{' '}
                    <span className="text-gray-600 block max-w-full overflow-hidden break-words [overflow-wrap:anywhere]">
                      {registro.detalles.length > 50 
                        ? `${registro.detalles.substring(0, 50)}...`
                        : registro.detalles
                      }
                    </span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <Button
                  onClick={() => handleViewRegistro(registro.id)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>

                {registro.status === 'pending' && (
                  <Button
                    onClick={() => handleCompleteRegistro(registro.id)}
                    size="sm"
                    className="w-full"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completar
                  </Button>
                )}
                
                {isJefe && (
                  <>
                    {(registro.origin === 'cronograma' || registro.status !== 'completed') && (
                      <>
                        <Button
                          onClick={() => handleEditRegistro(registro)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => requestDeleteRegistro(registro.id)}
                          variant="destructive"
                          size="sm"
                          className="w-full"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredRegistros.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay registros de limpieza
            </h3>
            <p className="text-gray-600 mb-4">
              {registros.length === 0
                ? isJefe
                  ? 'Crea tu primer registro de limpieza para comenzar.'
                  : 'No hay registros de limpieza disponibles.'
                : 'No se encontraron registros con los filtros actuales.'}
            </p>
            {isJefe && (
              <Button onClick={handleCreateVerification}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Registro
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {isModalOpen && (
        <AddLimpiezaRecordModal
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setEditingRegistroIdForLiberacion(null);
              setEditingLiberacionId(null);
              setIsViewOnlyModal(false);
            }
          }}
          initialVerification={editingVerification}
          registroIdToEdit={editingRegistroIdForLiberacion}
          liberacionIdToEdit={editingLiberacionId}
          viewOnlyMode={isViewOnlyModal}
          onSuccessfulSubmit={onRefresh}
        />
      )}

      {viewingRegistroId && (
        <ViewLimpiezaRegistroModal
          isOpen={true}
          onOpenChange={() => setViewingRegistroId(null)}
          registroId={viewingRegistroId}
          isJefe={isJefe}
          onDeleted={onRefresh}
          onCreateLiberacion={handleCreateLiberacion}
          onEditLiberacion={handleEditLiberacion}
          onViewLiberacion={handleViewLiberacion}
        />
      )}

      {editingRegistro && (
        <EditLimpiezaRegistroModal
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setEditingRegistro(null);
          }}
          registro={editingRegistro}
          onSaved={onRefresh}
        />
      )}

      {editingCronogramaTask && (
        <AddLimpiezaTaskModal
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setEditingCronogramaTask(null);
          }}
          initialTask={editingCronogramaTask}
          onSuccessfulSubmit={() => {
            onRefresh();
            setEditingCronogramaTask(null);
          }}
        />
      )}

      <AlertDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          setConfirmDeleteOpen(open);
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === 'cronograma_task'
                ? '¿Eliminar esta tarea del cronograma?'
                : '¿Eliminar este registro de limpieza y todas sus liberaciones?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
