'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getUserDisplayName } from '@/lib/user-display-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LimpiezaTask } from '@/lib/limpieza-tasks-service';
import { parseYmdToLocalDate } from '@/lib/date-utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, User } from 'lucide-react';

type ViewLimpiezaTaskModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: LimpiezaTask | null;
  onCompleteTask?: () => void;
  onEditTask?: () => void;
  onTaskCompleted?: () => void; // Nueva prop para notificar cuando se completa una tarea
};

export function ViewLimpiezaTaskModal({
  isOpen,
  onOpenChange,
  task,
  onCompleteTask,
  onEditTask,
  onTaskCompleted,
}: ViewLimpiezaTaskModalProps) {
  if (!task) return null;

  // Función para manejar el completado de tarea
  const handleCompleteTask = () => {
    if (onCompleteTask) {
      onCompleteTask();
    }
    if (onTaskCompleted) {
      onTaskCompleted();
    }
  };

  const getStatusIcon = () => {
    if (task.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusBadge = () => {
    if (task.status === 'completed') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          Completada
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
        Pendiente
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Detalles de la Tarea de Limpieza
          </DialogTitle>
          <DialogDescription>
            Información completa de la tarea programada en el cronograma de limpieza.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado de la tarea */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{task.tipo_muestra}</h3>
                  <p className="text-gray-600 mt-1">Estado actual de la tarea</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Área</h4>
                    <p className="text-gray-600">{task.area}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Fecha Programada</h4>
                    <p className="text-gray-600">
                      {format(parseYmdToLocalDate(task.fecha), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {task.created_by && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Creado por</h4>
                      <p className="text-gray-600">{getUserDisplayName(task.created_by)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Fecha de Creación</h4>
                    <p className="text-gray-600">
                      {format(new Date(task.created_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalles adicionales */}
          {task.detalles && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium mb-4 text-gray-900 text-lg">Detalles Adicionales</h4>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 w-full">
                  <div className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed text-sm max-h-96 overflow-y-auto w-full">
                    <div className= "flex.center-auto whitespace-pre-wrap">
                      {task.detalles}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información de actualización */}
          {task.updated_at && task.updated_at !== task.created_at && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 text-gray-900">Última Actualización</h4>
                <p className="text-gray-600">
                  {format(new Date(task.updated_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Acciones disponibles */}
          <div className="flex gap-3 pt-6 border-t bg-gray-50 -mx-6 px-6 -mb-6 pb-6 sticky bottom-0">
            {task.status === 'pending' && onCompleteTask && (
              <Button onClick={handleCompleteTask} className="flex-1 bg-green-600 hover:bg-green-700 h-12">
                <CheckCircle className="mr-2 h-4 w-4" />
                Completar Tarea
              </Button>
            )}
            
            {onEditTask && (
              <Button variant="outline" onClick={onEditTask} className="flex-1 h-12">
                Editar Tarea
              </Button>
            )}
            
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
