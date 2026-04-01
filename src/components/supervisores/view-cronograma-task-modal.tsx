'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { LimpiezaTask } from '@/lib/limpieza-tasks-service';
import { parseYmdToLocalDate } from '@/lib/date-utils';
import {
  limpiezaLiberacionesService,
  limpiezaRegistrosService,
  type LimpiezaRegistro,
  type LimpiezaRegistroWithLiberaciones,
} from '@/lib/limpieza-registros-service';

interface ViewCronogramaTaskModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: LimpiezaTask | null;
  isJefe: boolean;
  onCreateLiberacion?: (registroId: string) => void;
  onEditLiberacion?: (registroId: string, liberacionId: string) => void;
  onViewLiberacion?: (registroId: string, liberacionId: string) => void;
}

export function ViewCronogramaTaskModal({
  isOpen,
  onOpenChange,
  task,
  isJefe,
  onCreateLiberacion,
  onEditLiberacion,
  onViewLiberacion,
}: ViewCronogramaTaskModalProps) {
  const { toast } = useToast();
  const [registro, setRegistro] = React.useState<LimpiezaRegistroWithLiberaciones | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteLiberacionId, setDeleteLiberacionId] = React.useState<string | null>(null);
  const [isDeletingLiberacion, setIsDeletingLiberacion] = React.useState(false);

  const withTimeout = React.useCallback(<T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), ms);
      promise
        .then((v) => {
          clearTimeout(t);
          resolve(v);
        })
        .catch((err) => {
          clearTimeout(t);
          reject(err);
        });
    });
  }, []);

  const statusBadge = (status: LimpiezaTask['status']) => {
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">COMPLETADO</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDIENTE</Badge>;
  };

  const registroStatusBadge = (status: LimpiezaRegistro['status']) => {
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">COMPLETADO</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDIENTE</Badge>;
  };

  const loadRegistro = React.useCallback(async () => {
    if (!task?.id) return;
    setIsLoading(true);
    try {
      const base = await limpiezaRegistrosService.getByCronogramaTaskId(task.id);
      const full = await limpiezaRegistrosService.getById(base.id);
      setRegistro(full);
    } catch {
      setRegistro(null);
    } finally {
      setIsLoading(false);
    }
  }, [task?.id]);

  React.useEffect(() => {
    if (isOpen) {
      loadRegistro();
    }
  }, [isOpen, loadRegistro]);

  const handleConfirmDeleteLiberacion = async () => {
    if (!isJefe) return;
    if (!deleteLiberacionId) return;
    if (isDeletingLiberacion) return;

    const liberacionId = deleteLiberacionId;
    // Cerrar el diálogo inmediatamente para evitar sensación de congelamiento
    setDeleteLiberacionId(null);
    setIsDeletingLiberacion(true);

    // Optimistic UI: eliminar de inmediato la liberación del estado local
    setRegistro((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        liberaciones: (prev.liberaciones || []).filter((l) => l.id !== liberacionId),
      };
    });

    try {
      await withTimeout(limpiezaLiberacionesService.delete(liberacionId), 15000);
      await withTimeout(loadRegistro(), 15000);
      toast({
        title: 'Liberación eliminada',
        description: 'Se eliminó correctamente.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la liberación. Intenta de nuevo.',
        variant: 'destructive',
      });

      // Re-sync en caso de error (por el optimistic update)
      try {
        await withTimeout(loadRegistro(), 15000);
      } catch {
        // noop
      }
    } finally {
      setIsDeletingLiberacion(false);
    }
  };

  const handleDialogOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open && (isDeletingLiberacion || deleteLiberacionId != null)) {
        return;
      }
      onOpenChange(open);
    },
    [onOpenChange, isDeletingLiberacion, deleteLiberacionId]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalles de la Tarea del Cronograma
          </DialogTitle>
          <DialogDescription className="sr-only">Detalles de la tarea y liberaciones asociadas.</DialogDescription>
        </DialogHeader>

        {!task && <div className="text-sm text-muted-foreground">No hay datos para mostrar.</div>}

        {task && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Información General</CardTitle>
                  {statusBadge(task.status)}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Fecha</div>
                    <div className="text-gray-600">{parseYmdToLocalDate(task.fecha).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Área/Proceso</div>
                    <div className="text-gray-600">{task.area}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="font-medium">Superficie</div>
                    <div className="text-gray-600">{task.tipo_muestra}</div>
                  </div>
                  {task.detalles && (
                    <div className="md:col-span-2">
                      <div className="font-medium">Detalles</div>
                      <div className="text-gray-600 whitespace-pre-wrap break-words">{task.detalles}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">Liberaciones</CardTitle>
                  {isJefe && registro?.id && task.status !== 'completed' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        onCreateLiberacion?.(registro.id);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear liberación
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {isLoading && <div className="text-sm text-muted-foreground">Cargando...</div>}

                {!isLoading && !registro && (
                  <div className="text-sm text-muted-foreground">
                    Aún no existe registro asociado a esta tarea.
                  </div>
                )}

                {!isLoading && registro && (
                  <>
                    <div className="flex items-center justify-between">
                      <div />
                      {registroStatusBadge(registro.status)}
                    </div>

                    <Separator />

                    {registro.liberaciones.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No hay liberaciones.</div>
                    ) : (
                      registro.liberaciones.map((lib, idx) => (
                        <div key={lib.id} className="rounded-md border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium">Liberación {idx + 1}</div>
                              <div className="text-xs text-muted-foreground">
                                {lib.hora ? String(lib.hora).slice(0, 5) : '--:--'}
                                {' · '}
                                {lib.tipo_verificacion || 'Sin tipo'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {registroStatusBadge(lib.status)}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  onViewLiberacion?.(registro.id, lib.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {isJefe && registro.status !== 'completed' && lib.status !== 'completed' && (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      onEditLiberacion?.(registro.id, lib.id);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteLiberacionId(lib.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          <Separator className="my-3" />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="font-medium">Línea</div>
                              <div className="text-gray-600">{lib.linea || 'No especificado'}</div>
                            </div>
                            <div>
                              <div className="font-medium">Superficie</div>
                              <div className="text-gray-600">{lib.superficie || 'No especificada'}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>

      <AlertDialog
        open={deleteLiberacionId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteLiberacionId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>¿Eliminar esta liberación?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingLiberacion}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={isDeletingLiberacion} onClick={handleConfirmDeleteLiberacion}>
              {isDeletingLiberacion ? 'Eliminando…' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
