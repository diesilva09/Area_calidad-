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
import {
  limpiezaLiberacionesService,
  limpiezaRegistrosService,
  type LimpiezaRegistro,
  type LimpiezaRegistroWithLiberaciones,
} from '@/lib/limpieza-registros-service';

interface ViewLimpiezaRegistroModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  registroId: string | null;
  isJefe: boolean;
  onDeleted?: () => void;
  onCreateLiberacion?: (registroId: string) => void;
  onEditLiberacion?: (registroId: string, liberacionId: string) => void;
  onViewLiberacion?: (registroId: string, liberacionId: string) => void;
}

export function ViewLimpiezaRegistroModal({
  isOpen,
  onOpenChange,
  registroId,
  isJefe,
  onDeleted,
  onCreateLiberacion,
  onEditLiberacion,
  onViewLiberacion,
}: ViewLimpiezaRegistroModalProps) {
  const { toast } = useToast();
  const [data, setData] = React.useState<LimpiezaRegistroWithLiberaciones | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteLiberacionId, setDeleteLiberacionId] = React.useState<string | null>(null);
  const [isDeletingLiberacion, setIsDeletingLiberacion] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!registroId) return;
    setIsLoading(true);
    try {
      const result = await limpiezaRegistrosService.getById(registroId);
      setData(result);
    } finally {
      setIsLoading(false);
    }
  }, [registroId]);

  React.useEffect(() => {
    if (isOpen) {
      load();
    }
  }, [isOpen, load]);

  const statusBadge = (status: LimpiezaRegistro['status']) => {
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">COMPLETADO</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDIENTE</Badge>;
  };

  const handleConfirmDeleteLiberacion = async () => {
    if (!isJefe) return;
    if (!deleteLiberacionId) return;
    if (isDeletingLiberacion) return;

    const liberacionId = deleteLiberacionId;
    // Cerrar el diálogo inmediatamente para evitar sensación de congelamiento
    setDeleteLiberacionId(null);
    setIsDeletingLiberacion(true);

    // Optimistic UI: eliminar de inmediato la liberación del estado local
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        liberaciones: (prev.liberaciones || []).filter((l) => l.id !== liberacionId),
      };
    });
    try {
      await limpiezaLiberacionesService.delete(liberacionId);
      await load();
      try {
        onDeleted?.();
      } catch {
        // no-op
      }
      toast({
        title: 'Liberación eliminada',
        description: 'Se eliminó correctamente.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la liberación. Intenta de nuevo.',
        variant: 'destructive',
      });

      // Re-sync en caso de error (por el optimistic update)
      try {
        await load();
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
            Detalles del Registro de Limpieza
          </DialogTitle>
          <DialogDescription className="sr-only">Detalles del registro y liberaciones asociadas.</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        )}

        {!isLoading && data && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Información General</CardTitle>
                  {statusBadge(data.status)}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Fecha</div>
                    <div className="text-gray-600">{new Date(data.fecha).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Mes de Corte</div>
                    <div className="text-gray-600">{data.mes_corte || 'No especificado'}</div>
                  </div>
                  <div>
                    <div className="font-medium">Turno</div>
                    <div className="text-gray-600">
                      {(data as any)?.turno === 'dia'
                        ? 'Día'
                        : (data as any)?.turno === 'noche'
                          ? 'Noche'
                          : 'No especificado'}
                    </div>
                  </div>
                  {data.detalles && (
                    <div className="md:col-span-2">
                      <div className="font-medium">Detalles</div>
                      <div className="text-gray-600 whitespace-pre-wrap break-words">{data.detalles}</div>
                    </div>
                  )}
                  {data.origin === 'produccion' && (
                    <>
                      <div>
                        <div className="font-medium">Lote</div>
                        <div className="text-gray-600">{data.lote || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Producto</div>
                        <div className="text-gray-600">{data.producto || 'N/A'}</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">Liberaciones</CardTitle>
                  {isJefe && data.status !== 'completed' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (!registroId) return;
                        onCreateLiberacion?.(registroId);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear liberación
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {data.liberaciones.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No hay liberaciones.</div>
                ) : (
                  data.liberaciones.map((lib, idx) => (
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
                          {statusBadge(lib.status)}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!registroId) return;
                              onViewLiberacion?.(registroId, lib.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isJefe && data.status !== 'completed' && lib.status !== 'completed' && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!registroId) return;
                                  onEditLiberacion?.(registroId, lib.id);
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
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && !data && (
          <div className="text-sm text-muted-foreground">No hay datos para mostrar.</div>
        )}

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
      </DialogContent>
    </Dialog>
  );
}
