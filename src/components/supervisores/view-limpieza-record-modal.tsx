'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getUserDisplayName } from '@/lib/user-display-utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AreasEquiposService } from '@/lib/areas-equipos-config';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertTriangle, Droplets, Search, Eye } from 'lucide-react';

interface ViewLimpiezaRecordModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  record: any | null;
};

export default function ViewLimpiezaRecordModal({ isOpen, onOpenChange, record }: ViewLimpiezaRecordModalProps) {
  const [equiposNombres, setEquiposNombres] = useState<Record<string, string>>({});

  // Función para cargar nombres de equipos
  const cargarNombresEquipos = async (equipoId: string) => {
    if (!equipoId || equiposNombres[equipoId]) return;
    
    try {
      const equipo = await AreasEquiposService.getEquipoPorId(equipoId);
      if (equipo && equipo.nombre) {
        setEquiposNombres(prev => ({
          ...prev,
          [equipoId]: equipo.nombre
        }));
      }
    } catch (error) {
      console.error(`Error cargando nombre del equipo ${equipoId}:`, error);
      // Fallback a mapeo directo
      const equipoMapeoDirecto: Record<string, string> = {
        'ENV-001': 'Envasadora 1',
        'ENV-002': 'Envasadora 2',
        'ENV-003': 'Envasadora 3',
        'LAV-001': 'Lavadora 1',
        'LAV-002': 'Lavadora 2',
        'COC-001': 'Cocina 1',
        'COC-002': 'Cocina 2',
        'LLN-001': 'Llenadora 1',
        'LLN-002': 'Llenadora 2',
        'ETQ-001': 'Etiquetadora 1',
        'ETQ-002': 'Etiquetadora 2',
        'EMP-001': 'Empacadora 1',
        'EMP-002': 'Empacadora 2',
        'PES-001': 'Pesadora 1',
        'PES-002': 'Pesadora 2'
      };
      
      const nombreDirecto = equipoMapeoDirecto[equipoId];
      if (nombreDirecto) {
        setEquiposNombres(prev => ({
          ...prev,
          [equipoId]: nombreDirecto
        }));
      } else {
        setEquiposNombres(prev => ({
          ...prev,
          [equipoId]: `Equipo ${equipoId}`
        }));
      }
    }
  };

  // Cargar nombre del equipo cuando cambia el registro
  useEffect(() => {
    if (record && record.linea) {
      cargarNombresEquipos(record.linea);
    }
  }, [record]);

  if (!record) return null;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">COMPLETADO</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDIENTE</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">SIN ESTADO</Badge>;
    }
  };

  const getEstadoFiltroIcon = (estado: number | null) => {
    switch (estado) {
      case 1:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 0:
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getVerificacionVisualIcon = (estado: number | null) => {
    switch (estado) {
      case 1:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 0:
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalles del Registro de Limpieza
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Encabezado con información básica */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Información General</CardTitle>
                {getStatusBadge(record.status)}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Fecha</p>
                    <p className="text-sm text-gray-600">{formatFecha(record.fecha)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Hora</p>
                    <p className="text-sm text-gray-600">{record.hora || 'No registrada'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Verificado por</p>
                    <p className="text-sm text-gray-600">{record.verificado_por}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Mes de Corte</p>
                    <p className="text-sm text-gray-600">{record.mes_corte || 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Estado actual de la tarea</p>
                    <p className="text-sm text-gray-600">{getStatusBadge(record.status)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del equipo y superficie */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Equipo y Superficie</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Línea/Equipo</p>
                  <p className="text-lg font-semibold">{record.linea ? (equiposNombres[record.linea] || `Equipo ${record.linea}`) : 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Superficie</p>
                  <p className="text-lg font-semibold">{record.superficie || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Tipo de Verificación</p>
                  <p className="text-lg font-semibold">{record.tipo_verificacion}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Estado Filtro</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getEstadoFiltroIcon(record.estado_filtro)}
                    <span className="text-lg font-semibold">
                      {record.estado_filtro === 1 ? 'Aprobado' : record.estado_filtro === 0 ? 'Rechazado' : 'No verificado'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Elementos Extranos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Elementos Extranos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Presencia de Elementos Extranos</p>
                  <p className="text-lg font-semibold">
                    {record.presencia_elementos_extranos || 'No registrado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Detalle de Elementos</p>
                  <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">
                    {record.detalle_elementos_extranos || 'Sin detalles'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pruebas ATP */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Pruebas ATP
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Resultado RI</p>
                  <p className="text-lg font-semibold">{record.resultados_atp_ri || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Resultado AC</p>
                  <p className="text-lg font-semibold">{record.resultados_atp_ac || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Resultado RF</p>
                  <p className="text-lg font-semibold">{record.resultados_atp_rf || 'N/A'}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Lote Hisopo</p>
                  <p className="text-sm text-gray-600">{record.lote_hisopo || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Observación ATP</p>
                  <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">
                    {record.observacion_atp || 'Sin observaciones'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detección de Alérgenos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Detección de Alérgenos</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Detección RI</p>
                  <p className="text-lg font-semibold">{record.deteccion_alergenos_ri || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Detección AC</p>
                  <p className="text-lg font-semibold">{record.deteccion_alergenos_ac || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Detección RF</p>
                  <p className="text-lg font-semibold">{record.deteccion_alergenos_rf || 'N/A'}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Lote Hisopo</p>
                  <p className="text-sm text-gray-600">{record.lote_hisopo2 || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Observación Alérgenos</p>
                  <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">
                    {record.observacion_alergenos || 'Sin observaciones'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos de Limpieza */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Productos de Limpieza</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Detergente</p>
                  <p className="text-lg font-semibold">{record.detergente || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Desinfectante</p>
                  <p className="text-lg font-semibold">{record.desinfectante || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verificación Visual */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Verificación Visual</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Estado Verificación</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getVerificacionVisualIcon(record.verificacion_visual)}
                    <span className="text-lg font-semibold">
                      {record.verificacion_visual === 1 ? 'Aprobada' : record.verificacion_visual === 0 ? 'Rechazada' : 'No verificada'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Observación Visual</p>
                  <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">
                    {record.observacion_visual || 'Sin observaciones'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsables */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Responsables</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Responsable Producción</p>
                  <p className="text-lg font-semibold">{record.responsable_produccion || 'No asignado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Responsable Mantenimiento</p>
                  <p className="text-lg font-semibold">{record.responsable_mantenimiento || 'No asignado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Creado por</p>
                  <p className="text-lg font-semibold">{getUserDisplayName(record.created_by)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Sistema */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Información de Sistema</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Fecha Creación</p>
                  <p className="text-sm text-gray-600">
                    {new Date(record.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Última Actualización</p>
                  <p className="text-sm text-gray-600">
                    {new Date(record.updated_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
