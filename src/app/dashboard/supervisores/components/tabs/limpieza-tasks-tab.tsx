import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CheckCircle, Eye, Pencil, Trash2 } from 'lucide-react';
import { SupervisorHandlers } from '../hooks/use-supervisor-data';
import { LimpiezaTask } from '@/lib/limpieza-tasks-service';
import { AddLimpiezaTaskModal } from '@/components/supervisores/add-limpieza-task-modal';
import { ViewCronogramaTaskModal } from '@/components/supervisores/view-cronograma-task-modal';
import { AddLimpiezaRecordModal } from '@/components/supervisores/add-limpieza-record-modal';
import { limpiezaRegistrosService, type LimpiezaRegistro } from '@/lib/limpieza-registros-service';
import { EquipmentManagement } from '@/components/supervisores/equipment-management';
import { EquipmentManagementViewOnly } from '@/components/supervisores/equipment-management-view-only';
import { SimpleCalendar } from '@/components/ui/simple-calendar';
import { es } from 'date-fns/locale';
import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface LimpiezaTasksTabProps {
  tasks: LimpiezaTask[];
  handlers: SupervisorHandlers;
  isJefe: boolean;
  onRefresh: () => void;
}

export function LimpiezaTasksTab({
  tasks,
  handlers,
  isJefe,
  onRefresh
}: LimpiezaTasksTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LimpiezaTask | null>(null);
  const [viewingTask, setViewingTask] = useState<LimpiezaTask | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isRegistroModalOpen, setIsRegistroModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<LimpiezaTask | null>(null);
  const [registroIdToEdit, setRegistroIdToEdit] = useState<string | null>(null);
  const [liberacionIdToEdit, setLiberacionIdToEdit] = useState<string | null>(null);
  const [registroViewOnlyMode, setRegistroViewOnlyMode] = useState(false);
  const [registrosByTaskId, setRegistrosByTaskId] = useState<Record<number, LimpiezaRegistro | null>>({});

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: LimpiezaTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleViewTask = (task: LimpiezaTask) => {
    setViewingTask(task);
  };

  const handleCompleteTask = async (task: LimpiezaTask) => {
    try {
      const registro = await limpiezaRegistrosService.getByCronogramaTaskId(task.id);
      setTaskToComplete(null);
      setRegistroIdToEdit(registro.id);
      setRegistroViewOnlyMode(registro.status === 'completed');
      setIsRegistroModalOpen(true);
    } catch (error) {
      // Si no existe registro asociado aún, entonces se crea desde el modal usando initialTask
      setTaskToComplete(task);
      setRegistroIdToEdit(null);
      setRegistroViewOnlyMode(false);
      setIsRegistroModalOpen(true);
    }
  };

  const handleOpenRegistroForTask = async (task: LimpiezaTask) => {
    try {
      const registro = await limpiezaRegistrosService.getByCronogramaTaskId(task.id);
      setTaskToComplete(null);
      setRegistroIdToEdit(registro.id);
      setLiberacionIdToEdit(null);
      setRegistroViewOnlyMode(registro.status === 'completed');
      setIsRegistroModalOpen(true);
    } catch (error) {
      console.error('Error al obtener registro por cronograma_task_id:', error);
      alert('No se pudo obtener el registro asociado a la tarea.');
    }
  };

  const handleCreateLiberacionForTask = async (task: LimpiezaTask) => {
    if (!isJefe) return;
    try {
      const registro = await limpiezaRegistrosService.getByCronogramaTaskId(task.id);
      setTaskToComplete(null);
      setRegistroIdToEdit(registro.id);
      setLiberacionIdToEdit(null);
      setRegistroViewOnlyMode(false);
      setIsRegistroModalOpen(true);
    } catch (error) {
      console.error('Error al obtener registro por cronograma_task_id:', error);
      alert('No se pudo obtener el registro asociado a la tarea.');
    }
  };

  const handleEditLiberacionForTask = async (task: LimpiezaTask, liberacionId: string, viewOnly: boolean) => {
    try {
      const registro = await limpiezaRegistrosService.getByCronogramaTaskId(task.id);
      setTaskToComplete(null);
      setRegistroIdToEdit(registro.id);
      setLiberacionIdToEdit(liberacionId);
      setRegistroViewOnlyMode(viewOnly);
      setIsRegistroModalOpen(true);
    } catch (error) {
      console.error('Error al obtener registro por cronograma_task_id:', error);
      alert('No se pudo obtener el registro asociado a la tarea.');
    }
  };

  const handleDeleteTask = async (task: LimpiezaTask) => {
    if (!isJefe) return;
    if (!window.confirm('¿Eliminar esta tarea del cronograma?')) return;
    await handlers.handleDeleteLimpiezaTask(String(task.id));
    onRefresh();
  };

  const pendingTasks = useMemo(() => {
    return tasks.filter((task) => task.status === 'pending');
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter((task) => task.status === 'completed');
  }, [tasks]);

  const pendingDays = useMemo(() => {
    return pendingTasks
      .map((task) => new Date(task.fecha));
  }, [pendingTasks]);

  const completedDays = useMemo(() => {
    return completedTasks.map((task) => new Date(task.fecha));
  }, [completedTasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return (tasks || [])
      .filter((task) => isSameDay(new Date(task.fecha), selectedDate))
      .sort((a, b) => a.id - b.id);
  }, [tasks, selectedDate]);

  useEffect(() => {
    let cancelled = false;

    const loadRegistrosForSelectedDay = async () => {
      const uniqueTaskIds = Array.from(
        new Set((selectedDayTasks || []).map((t) => Number(t.id)).filter((id) => !Number.isNaN(id)))
      );
      if (uniqueTaskIds.length === 0) return;

      const idsToLoad = uniqueTaskIds.filter((id) => !(id in registrosByTaskId));
      if (idsToLoad.length === 0) return;

      const entries = await Promise.all(
        idsToLoad.map(async (taskId) => {
          try {
            const registro = await limpiezaRegistrosService.getByCronogramaTaskId(taskId);
            return [taskId, registro as LimpiezaRegistro] as const;
          } catch {
            return [taskId, null] as const;
          }
        })
      );

      if (cancelled) return;
      setRegistrosByTaskId((prev) => {
        const next = { ...prev };
        for (const [taskId, registro] of entries) {
          next[taskId] = registro;
        }
        return next;
      });
    };

    loadRegistrosForSelectedDay();

    return () => {
      cancelled = true;
    };
  }, [selectedDayTasks, registrosByTaskId]);

  const totalPendientes = pendingTasks.length;
  const totalCompletadas = completedTasks.length;

  const getStatusDotClass = (task: LimpiezaTask) => {
    return task.status === 'completed' ? 'bg-green-500' : 'bg-yellow-400';
  };

  const getStatusBadge = (task: LimpiezaTask) => {
    if (task.status === 'completed') {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Completada
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Pendiente
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Cronograma de Limpieza
          </h2>
        </div>
        
        {isJefe && (
          <Button onClick={handleCreateTask} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Limpieza</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-sm flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="text-sm font-medium text-yellow-700">
                  Pendientes: <span className="font-bold">{totalPendientes}</span>
                </div>
                <div className="text-sm font-medium text-green-700">
                  Completadas: <span className="font-bold">{totalCompletadas}</span>
                </div>
              </div>
              <div className="flex justify-center">
                <SimpleCalendar
                  selected={selectedDate ?? new Date()}
                  onSelect={(date) => setSelectedDate(date)}
                  className="rounded-md border w-full max-w-sm overflow-x-auto"
                  modifiers={{
                    pending: pendingDays,
                    completed: completedDays,
                  }}
                  modifiersClassNames={{
                    pending: 'bg-yellow-100',
                    completed: 'bg-green-100',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="font-headline text-xl mb-4">
              Labores para{' '}
              {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : '...'}
            </h3>

            <div className="flex-1 space-y-4">
              {selectedDayTasks.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {selectedDayTasks.map((task) => (
                    <AccordionItem key={task.id} value={String(task.id)}>
                      <AccordionTrigger className="no-underline hover:no-underline py-3">
                        <div className="flex items-center gap-3 text-left w-full">
                          <span className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(task)}`} />
                          <div className="flex flex-col min-w-0">
                            <div className="font-medium truncate">
                              {task.tipo_muestra}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {task.area}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium text-gray-900">Detalle del registro de limpieza</div>
                            {getStatusBadge(task)}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Producto:</span>{' '}
                              {registrosByTaskId[task.id]?.producto || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Lote:</span>{' '}
                              {registrosByTaskId[task.id]?.lote || 'N/A'}
                            </div>
                            <div className="sm:col-span-2">
                              <span className="font-medium">Fecha:</span>{' '}
                              {new Date(task.fecha).toLocaleDateString()}
                            </div>
                            {(registrosByTaskId[task.id]?.detalles || '').trim() && (
                              <div className="sm:col-span-2">
                                <span className="font-medium">Detalles:</span>{' '}
                                <span className="text-muted-foreground">{registrosByTaskId[task.id]?.detalles}</span>
                              </div>
                            )}
                            {!registrosByTaskId[task.id] && (
                              <div className="sm:col-span-2">
                                <span className="text-muted-foreground">
                                  Aún no existe registro asociado a esta tarea.
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Button
                              onClick={() => handleViewTask(task)}
                              variant="outline"
                              size="sm"
                              className="sm:flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>

                            {isJefe && (
                              <>
                                <Button
                                  onClick={() => handleEditTask(task)}
                                  variant="outline"
                                  size="sm"
                                  className="sm:flex-1"
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  onClick={() => handleDeleteTask(task)}
                                  variant="destructive"
                                  size="sm"
                                  className="sm:w-auto"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>

                          {task.status === 'pending' && (
                            <div className="pt-1">
                              <Button onClick={() => handleCompleteTask(task)} size="sm" className="w-full">
                                Completar
                              </Button>
                            </div>
                          )}

                          {task.status === 'completed' && (
                            <div className="pt-1">
                              <Button
                                onClick={() => handleOpenRegistroForTask(task)}
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                {isJefe ? 'Ver/Editar Registro' : 'Ver Registro'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay labores para esta fecha.
                </p>
              )}
            </div>

            <div className="mt-auto space-y-4 pt-4">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span>Pendiente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Completada</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {isModalOpen && (
        <AddLimpiezaTaskModal
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setEditingTask(null);
          }}
          onSuccessfulSubmit={() => {
            onRefresh();
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          initialTask={editingTask}
        />
      )}

      {isRegistroModalOpen && (taskToComplete || registroIdToEdit) && (
        <AddLimpiezaRecordModal
          isOpen={isRegistroModalOpen}
          onOpenChange={(open) => {
            setIsRegistroModalOpen(open);
            if (!open) {
              setTaskToComplete(null);
              setRegistroIdToEdit(null);
              setLiberacionIdToEdit(null);
              setRegistroViewOnlyMode(false);
            }
          }}
          initialTask={taskToComplete}
          registroIdToEdit={registroIdToEdit}
          liberacionIdToEdit={liberacionIdToEdit}
          viewOnlyMode={registroViewOnlyMode}
          onSuccessfulSubmit={() => {
            onRefresh();
            setIsRegistroModalOpen(false);
            setTaskToComplete(null);
            setRegistroIdToEdit(null);
            setLiberacionIdToEdit(null);
            setRegistroViewOnlyMode(false);
          }}
        />
      )}

      {viewingTask && (
        <ViewCronogramaTaskModal
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setViewingTask(null);
          }}
          task={viewingTask}
          isJefe={isJefe}
          onCreateLiberacion={() => handleCreateLiberacionForTask(viewingTask)}
          onEditLiberacion={(_, liberacionId) => handleEditLiberacionForTask(viewingTask, liberacionId, false)}
          onViewLiberacion={(_, liberacionId) => handleEditLiberacionForTask(viewingTask, liberacionId, true)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Equipos</CardTitle>
        </CardHeader>
        <CardContent>
          {isJefe ? <EquipmentManagement /> : <EquipmentManagementViewOnly />}
        </CardContent>
      </Card>
    </div>
  );
}