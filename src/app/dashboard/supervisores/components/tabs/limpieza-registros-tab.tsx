'use client';

import React, { startTransition, useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CheckCircle, AlertTriangle, Eye, Trash2, Pencil, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { parseYmdToLocalDate } from '@/lib/date-utils';
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
import { EditLimpiezaRegistroModal } from '@/components/supervisores/edit-limpieza-registro-modal';
import { ViewLimpiezaRegistroModal } from '@/components/supervisores/view-limpieza-registro-modal';
import { ViewCronogramaTaskModal } from '@/components/supervisores/view-cronograma-task-modal';
import { limpiezaRegistrosService, type LimpiezaRegistro, type LimpiezaRegistroAPI } from '@/lib/limpieza-registros-service';
import { AddLimpiezaTaskModal } from '@/components/supervisores/add-limpieza-task-modal';
import { limpiezaTasksService, type LimpiezaTask } from '@/lib/limpieza-tasks-service';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LimpiezaRegistrosTabProps {
  registros: LimpiezaRegistroAPI[];
  isJefe: boolean;
  onRefresh: () => void;
}

export function LimpiezaRegistrosTab({
  registros,
  isJefe,
  onRefresh
}: LimpiezaRegistrosTabProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnlyModal, setIsViewOnlyModal] = useState(false);
  const [editingVerification, setEditingVerification] = useState<any | null>(null);
  const [editingRegistroIdForLiberacion, setEditingRegistroIdForLiberacion] = useState<string | null>(null);
  const [editingLiberacionId, setEditingLiberacionId] = useState<string | null>(null);
  const [viewingRegistroId, setViewingRegistroId] = useState<string | null>(null);
  const [editingCronogramaTask, setEditingCronogramaTask] = useState<LimpiezaTask | null>(null);
  const [viewingCronogramaTask, setViewingCronogramaTask] = useState<LimpiezaTask | null>(null);
  const [editingRegistroPrincipal, setEditingRegistroPrincipal] = useState<LimpiezaRegistro | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cronograma'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | null
    | { kind: 'cronograma_task'; taskId: number }
    | { kind: 'limpieza_registro'; registroId: string }
  >(null);

  const refreshNonBlocking = useCallback(() => {
    startTransition(() => {
      onRefresh();
    });
  }, [onRefresh]);

  // Funciones para filtros rápidos de fecha
  const handleFiltroHoy = () => {
    const hoy = new Date();
    setFechaInicio(hoy);
    setFechaFin(hoy);
  };

  const handleFiltroUltimos7Dias = () => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 7);
    setFechaInicio(inicio);
    setFechaFin(fin);
  };

  const handleFiltroEsteMes = () => {
    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
    setFechaInicio(inicio);
    setFechaFin(fin);
  };

  const handleFiltroMesAnterior = () => {
    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
    setFechaInicio(inicio);
    setFechaFin(fin);
  };

  const handleLimpiarFechas = () => {
    setFechaInicio(undefined);
    setFechaFin(undefined);
  };

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

      // Filtro por rango de fechas
      if (fechaInicio || fechaFin) {
        const registroFecha = new Date(registro.fecha);
        registroFecha.setHours(0, 0, 0, 0);

        if (fechaInicio) {
          const inicio = new Date(fechaInicio);
          inicio.setHours(0, 0, 0, 0);
          if (registroFecha < inicio) return false;
        }

        if (fechaFin) {
          const fin = new Date(fechaFin);
          fin.setHours(23, 59, 59, 999);
          if (registroFecha > fin) return false;
        }
      }

      if (!q) return true;

      // Buscar en lote y producto
      const lote = String(registro.lote || '').toLowerCase();
      const producto = String(registro.producto || '').toLowerCase();

      // Buscar en liberaciones (responsable y verificado por)
      const liberaciones = registro.liberaciones || [];
      const responsableMatch = liberaciones.some((lib) => {
        const responsableProduccion = String(lib.responsable_produccion || '').toLowerCase();
        const responsableMantenimiento = String(lib.responsable_mantenimiento || '').toLowerCase();
        const verificadoPor = String(lib.verificado_por || '').toLowerCase();
        return responsableProduccion.includes(q) ||
               responsableMantenimiento.includes(q) ||
               verificadoPor.includes(q);
      });

      return lote.includes(q) || producto.includes(q) || responsableMatch;
    });
  }, [registros, searchTerm, statusFilter, fechaInicio, fechaFin]);

  const getOriginBadge = (registro: LimpiezaRegistro) => {
    const isCronogramaRegistro =
      registro.origin === 'cronograma' &&
      registro.cronograma_task_id != null &&
      !Number.isNaN(Number(registro.cronograma_task_id));
    if (!isCronogramaRegistro) return null;
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5">
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
        toast({ title: 'Error', description: 'No se pudo cargar. Intenta de nuevo.', variant: 'destructive' });
        return;
      }
      limpiezaTasksService
        .getById(Number(taskId))
        .then((task) => setEditingCronogramaTask(task))
        .catch((error) => {
          console.error('Error al cargar tarea de cronograma:', error);
          toast({ title: 'Error', description: 'No se pudo cargar. Intenta de nuevo.', variant: 'destructive' });
        });
      return;
    }
    // Editar registro principal (fecha, mes_corte, detalles)
    setEditingRegistroPrincipal(registro);
  };

  const handleViewRegistro = (registro: LimpiezaRegistro) => {
    if (registro.origin === 'cronograma') {
      const taskId = registro.cronograma_task_id;
      if (!taskId) {
        toast({ title: 'Error', description: 'No se pudo cargar. Intenta de nuevo.', variant: 'destructive' });
        return;
      }
      limpiezaTasksService
        .getById(Number(taskId))
        .then((task) => setViewingCronogramaTask(task))
        .catch((error) => {
          console.error('Error al cargar tarea de cronograma:', error);
          toast({ title: 'Error', description: 'No se pudo cargar. Intenta de nuevo.', variant: 'destructive' });
        });
      return;
    }
    setViewingRegistroId(registro.id);
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
        toast({ title: 'Error', description: 'No se pudo cargar. Intenta de nuevo.', variant: 'destructive' });
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
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      if (pendingDelete.kind === 'cronograma_task') {
        await limpiezaTasksService.delete(Number(pendingDelete.taskId));
      } else {
        await limpiezaRegistrosService.delete(pendingDelete.registroId);
      }
      refreshNonBlocking();
      toast({ title: 'Eliminado', description: 'Se eliminó correctamente.' });
      setConfirmDeleteOpen(false);
      setPendingDelete(null);
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar. Intenta de nuevo.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (registro: LimpiezaRegistro) => {
    if (registro.status === 'completed') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 shrink-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 shrink-0">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  const totalRegistros = registros.length;
  const pendingCount = registros.filter(v => v.status === 'pending').length;
  const completedCount = registros.filter(v => v.status === 'completed').length;

  return (
    <div className="space-y-5 pb-6">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100">
            <CheckCircle className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 leading-none">
              Registros de Limpieza
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalRegistros} {totalRegistros === 1 ? 'registro' : 'registros'} en total
            </p>
          </div>
        </div>

        {isJefe && (
          <Button onClick={handleCreateVerification} size="sm" className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Registro
          </Button>
        )}
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border border-gray-200">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalRegistros}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total</div>
          </CardContent>
        </Card>

        <Card className="border border-yellow-200 bg-yellow-50/60">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-xs text-yellow-700 mt-0.5">Pendientes</div>
          </CardContent>
        </Card>

        <Card className="border border-green-200 bg-green-50/60">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-green-700 mt-0.5">Completados</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Fila 1: Estado y Búsqueda */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-48 shrink-0">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-9 text-sm">
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

          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por lote, producto, responsable o verificado por…"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Fila 2: Filtros de fecha */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 pt-2">
            <CalendarIcon className="h-4 w-4" />
            <span>Periodo:</span>
          </div>

          {/* Fecha inicio */}
          <div className="relative w-full sm:w-auto">
            <Popover modal>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal h-9",
                    !fechaInicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaInicio ? format(fechaInicio, "dd/MM/yyyy", { locale: es }) : "Desde"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-fit p-0"
                align="start"
                sideOffset={8}
                avoidCollisions
                collisionPadding={16}
              >
                <Calendar
                  mode="single"
                  selected={fechaInicio}
                  onSelect={setFechaInicio}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Separador visual */}
          <div className="flex items-center justify-center w-8 h-9 text-gray-300">
            <span className="text-lg font-light">→</span>
          </div>

          {/* Fecha fin */}
          <div className="relative w-full sm:w-auto">
            <Popover modal>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal h-9",
                    !fechaFin && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaFin ? format(fechaFin, "dd/MM/yyyy", { locale: es }) : "Hasta"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-fit p-0"
                align="start"
                sideOffset={8}
                avoidCollisions
                collisionPadding={16}
              >
                <Calendar
                  mode="single"
                  selected={fechaFin}
                  onSelect={setFechaFin}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Botón limpiar fechas */}
          {(fechaInicio || fechaFin) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimpiarFechas}
              className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFiltroHoy}
            className="h-7 text-xs"
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFiltroUltimos7Dias}
            className="h-7 text-xs"
          >
            Últimos 7 días
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFiltroEsteMes}
            className="h-7 text-xs"
          >
            Este mes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFiltroMesAnterior}
            className="h-7 text-xs"
          >
            Mes anterior
          </Button>
        </div>
      </div>

      {/* ── Results count ─────────────────────────────────────────── */}
      {(searchTerm || statusFilter !== 'all' || fechaInicio || fechaFin) && (
        <p className="text-xs text-gray-500 -mt-1">
          {filteredRegistros.length} {filteredRegistros.length === 1 ? 'resultado' : 'resultados'} encontrados
          {(fechaInicio || fechaFin) && (
            <span className="ml-1 font-medium text-gray-600">
              en el rango {fechaInicio ? format(fechaInicio, "dd/MM/yyyy", { locale: es }) : '...'} - {fechaFin ? format(fechaFin, "dd/MM/yyyy", { locale: es }) : '...'}
            </span>
          )}
        </p>
      )}

      {/* ── Cards Grid ────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRegistros.map((registro) => {
          const isPending = registro.status === 'pending';
          const canEdit =
            isJefe &&
            (registro.origin === 'cronograma' || registro.status !== 'completed');

          return (
            <Card
              key={registro.id}
              className={`transition-shadow hover:shadow-md flex flex-col ${
                isPending
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Card top bar — status stripe */}
              <div
                className={`h-1 w-full rounded-t-lg ${
                  isPending ? 'bg-yellow-400' : 'bg-green-400'
                }`}
              />

              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold text-gray-800 leading-snug">
                    Detalles de limpieza
                  </CardTitle>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {getOriginBadge(registro)}
                    {getStatusBadge(registro)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-3 px-4 pb-4">
                {/* Info rows */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div>
                    <dt className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Fecha</dt>
                    <dd className="text-gray-800 font-medium">
                      {parseYmdToLocalDate(registro.fecha).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Mes corte</dt>
                    <dd className="text-gray-800 font-medium">{registro.mes_corte || '—'}</dd>
                  </div>

                  <div>
                    <dt className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Turno</dt>
                    <dd className="text-gray-800 font-medium">
                      {registro.turno === 'dia' ? 'Día' : registro.turno === 'noche' ? 'Noche' : '—'}
                    </dd>
                  </div>

                  {registro.detalles && (
                    <div className="col-span-2">
                      <dt className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Detalles de limpieza</dt>
                      <dd className="text-gray-600 text-xs mt-0.5 line-clamp-2 break-words">
                        {registro.detalles}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleViewRegistro(registro)}
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[72px] h-8 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1.5" />
                    Ver
                  </Button>

                  {isPending && (
                    <Button
                      onClick={() => handleCompleteRegistro(registro.id)}
                      size="sm"
                      className="flex-1 min-w-[88px] h-8 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                      Completar
                    </Button>
                  )}

                  {canEdit && (
                    <Button
                      onClick={() => handleEditRegistro(registro)}
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[72px] h-8 text-xs"
                    >
                      <Pencil className="h-3 w-3 mr-1.5" />
                      Editar
                    </Button>
                  )}

                  {canEdit && (
                    <Button
                      onClick={() => requestDeleteRegistro(registro.id)}
                      variant="destructive"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Empty State ───────────────────────────────────────────── */}
      {filteredRegistros.length === 0 && (
        <Card className="border-dashed border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
              <ClipboardList className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              {registros.length === 0
                ? 'Sin registros de limpieza'
                : 'Sin resultados'}
            </h3>
            <p className="text-sm text-gray-500 mb-5 max-w-xs">
              {registros.length === 0
                ? isJefe
                  ? 'Crea tu primer registro de limpieza para comenzar.'
                  : 'No hay registros de limpieza disponibles.'
                : 'No se encontraron registros con los filtros actuales.'}
            </p>
            {isJefe && registros.length === 0 && (
              <Button onClick={handleCreateVerification} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Registro
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Modals ────────────────────────────────────────────────── */}
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
          onSuccessfulSubmit={refreshNonBlocking}
        />
      )}

      {editingRegistroPrincipal && (
        <EditLimpiezaRegistroModal
          isOpen={true}
          onOpenChange={(open) => { if (!open) setEditingRegistroPrincipal(null); }}
          registro={editingRegistroPrincipal}
          onSaved={() => {
            refreshNonBlocking();
            setEditingRegistroPrincipal(null);
          }}
        />
      )}

      {viewingRegistroId && (
        <ViewLimpiezaRegistroModal
          isOpen={true}
          onOpenChange={() => setViewingRegistroId(null)}
          registroId={viewingRegistroId}
          isJefe={isJefe}
          onDeleted={refreshNonBlocking}
          onCreateLiberacion={handleCreateLiberacion}
          onEditLiberacion={handleEditLiberacion}
          onViewLiberacion={handleViewLiberacion}
        />
      )}

      {viewingCronogramaTask && (
        <ViewCronogramaTaskModal
          isOpen={true}
          onOpenChange={(open) => { if (!open) setViewingCronogramaTask(null); }}
          task={viewingCronogramaTask}
          isJefe={isJefe}
          onCreateLiberacion={handleCreateLiberacion}
          onEditLiberacion={handleEditLiberacion}
          onViewLiberacion={handleViewLiberacion}
        />
      )}

      {editingCronogramaTask && (
        <AddLimpiezaTaskModal
          isOpen={true}
          onOpenChange={(open) => { if (!open) setEditingCronogramaTask(null); }}
          initialTask={editingCronogramaTask}
          onSuccessfulSubmit={() => {
            refreshNonBlocking();
            setEditingCronogramaTask(null);
          }}
        />
      )}

      <AlertDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          if (!open && isDeleting) return;
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
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}