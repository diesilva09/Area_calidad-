'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, FileText, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CronogramaProductoTerminado } from '@/components/producto-terminado/cronograma-producto-terminado';

export default function ProductoTerminadoPage() {
  const [isCronogramaModalOpen, setIsCronogramaModalOpen] = useState(false);
  const [cronogramaSeleccionado, setCronogramaSeleccionado] = useState<{
    codigo: string;
    titulo: string;
    version: string;
    fechaAprobacion: string;
    tipoCronograma?: 'producto-terminado' | 'pt-externo';
  } | null>(null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Producto Terminado</h1>
        <p className="text-gray-600">Gestión de cronogramas y registros de producto terminado</p>
      </div>

      {/* Vista de Cronogramas */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Cronogramas Disponibles</h2>
        <p className="text-gray-600">Planificación y seguimiento de actividades de producto terminado</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* PL-CAL-009 - Plan de Muestreo Producto Terminado (Interno) */}
        <Card
          className="group border-emerald-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          onClick={() => {
            setCronogramaSeleccionado({
              codigo: 'PL-CAL-009',
              titulo: 'Plan de Muestreo Producto Terminado (Interno) - Cronograma Toma de Muestras',
              version: '4',
              fechaAprobacion: '16 de diciembre de 2022',
              tipoCronograma: 'producto-terminado',
            });
            setIsCronogramaModalOpen(true);
          }}
        >
          <CardHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">PL-CAL-009 (Int)</CardTitle>
                <CardDescription className="text-xs">
                  Plan de Muestreo Producto Terminado (Interno)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 line-clamp-2">
                Cronograma Toma de Muestras Producto Terminado - Interno
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Versión:</strong> 4</p>
                <p><strong>Aprobación:</strong> 16 dic 2022</p>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                  Interno
                </span>
                <Button size="sm" variant="ghost" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  Ver
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PL-CAL-009-AP - Plan de Muestreo Producto Terminado (Externo) */}
        <Card
          className="group border-blue-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          onClick={() => {
            setCronogramaSeleccionado({
              codigo: 'PL-CAL-009-AP',
              titulo: 'Plan de Muestreo Producto Terminado (Externo) - Cronograma Toma de Muestras',
              version: '4',
              fechaAprobacion: '16 de diciembre de 2022',
              tipoCronograma: 'pt-externo',
            });
            setIsCronogramaModalOpen(true);
          }}
        >
          <CardHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">PL-CAL-009-AP (Ext)</CardTitle>
                <CardDescription className="text-xs">
                  Plan de Muestreo Producto Terminado (Externo)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 line-clamp-2">
                Cronograma Toma de Muestras Producto Terminado - Externo
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Versión:</strong> 4</p>
                <p><strong>Aprobación:</strong> 16 dic 2022</p>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                  Externo
                </span>
                <Button size="sm" variant="ghost" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  Ver
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal del Cronograma con Calendario */}
      <Dialog open={isCronogramaModalOpen} onOpenChange={setIsCronogramaModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              {cronogramaSeleccionado?.codigo} - {cronogramaSeleccionado?.titulo}
            </DialogTitle>
            <DialogDescription>
              Versión {cronogramaSeleccionado?.version} | Aprobado: {cronogramaSeleccionado?.fechaAprobacion}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <CronogramaProductoTerminado
              tipoCronograma={cronogramaSeleccionado?.tipoCronograma}
              onViewTask={async (task) => {
                console.log('Ver tarea:', task);
              }}
              onCompleteTask={async (task) => {
                console.log('Completar tarea:', task);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
