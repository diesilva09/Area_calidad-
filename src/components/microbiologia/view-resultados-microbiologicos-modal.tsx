'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, FileText, Beaker, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ResultadosMicrobiologicos } from '@/lib/resultados-microbiologicos-service';

interface ViewResultadosMicrobiologicosModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  registro: ResultadosMicrobiologicos | null;
}

export function ViewResultadosMicrobiologicosModal({
  isOpen,
  onOpenChange,
  registro,
}: ViewResultadosMicrobiologicosModalProps) {
  if (!registro) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  const cumpleBadge = (value: boolean | null | undefined, label: string) => {
    if (value === true) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          CUMPLE
        </Badge>
      );
    }
    if (value === false) {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" />
          NO CUMPLE
        </Badge>
      );
    }
    return <Badge variant="secondary">{label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            RE-CAL-046 RESULTADOS MICROBIOLÓGICOS
          </DialogTitle>
          <DialogDescription className="text-gray-600" asChild>
            <span className="mt-2 block">
              <strong>Código:</strong> RE-CAL-046 | <strong>Versión:</strong> 2 | <strong>Aprobación:</strong> 03/05/2021
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Header con estado */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">ID Registro:</span>
              <span className="font-mono font-medium">#{registro.id}</span>
            </div>
            <div className="flex items-center gap-2">
              {registro.cumple && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  CUMPLE
                </Badge>
              )}
              {registro.no_cumple && (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-sm px-3 py-1">
                  <XCircle className="w-4 h-4 mr-1" />
                  NO CUMPLE
                </Badge>
              )}
              {!registro.cumple && !registro.no_cumple && (
                <Badge variant="secondary" className="text-sm px-3 py-1">Sin evaluar</Badge>
              )}
            </div>
          </div>

          {/* Información General */}
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-gray-500 block">Fecha</span>
                  <span className="text-sm font-medium">{formatDate(registro.fecha)}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Mes Muestreo</span>
                  <span className="text-sm font-medium">{registro.mes_muestreo}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Hora</span>
                  <span className="text-sm font-medium">{registro.hora_muestreo}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Interno/Externo</span>
                  <span className="text-sm font-medium">{registro.interno_externo}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Tipo</span>
                  <span className="text-sm font-medium">{registro.tipo}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Área</span>
                  <span className="text-sm font-medium">{registro.area}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Muestra</span>
                  <span className="text-sm font-medium">{registro.muestra}</span>
                </div>
                {registro.tipo_muestra && (
                  <div>
                    <span className="text-xs text-gray-500 block">Tipo de Muestra</span>
                    <span className="text-sm font-medium">
                      {registro.tipo_muestra === 'nombre' ? 'Nombre' :
                       registro.tipo_muestra === 'linea' ? 'Línea' :
                       registro.tipo_muestra === 'producto' ? 'Producto' :
                       registro.tipo_muestra === 'lote' ? 'Lote' :
                       registro.tipo_muestra === 'envase' ? 'Envase' :
                       registro.tipo_muestra === 'otro' ? 'Otro' : registro.tipo_muestra}
                    </span>
                  </div>
                )}
                {registro.valor_muestra && (
                  <div>
                    <span className="text-xs text-gray-500 block">
                      {registro.tipo_muestra === 'nombre' ? 'Nombre' :
                       registro.tipo_muestra === 'linea' ? 'Línea' :
                       registro.tipo_muestra === 'producto' ? 'Producto' :
                       registro.tipo_muestra === 'lote' ? 'Lote' :
                       registro.tipo_muestra === 'envase' ? 'Envase' :
                       registro.tipo_muestra === 'otro' ? 'Otro' : 'Valor'}
                    </span>
                    <span className="text-sm font-medium">{registro.valor_muestra}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-500 block">Código</span>
                  <span className="text-sm font-medium">{registro.codigo}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Responsable</span>
                  <span className="text-sm font-medium">{registro.responsable}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas del Producto */}
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg">Fechas del Producto</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 block">Producción</span>
                  <span className="text-sm font-medium">{formatDate(registro.fecha_produccion)}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Vencimiento</span>
                  <span className="text-sm font-medium">{formatDate(registro.fecha_vencimiento)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados Microbiológicos */}
          {(registro.mesofilos || registro.coliformes_totales || registro.coliformes_fecales || 
            registro.e_coli || registro.mohos || registro.levaduras || registro.staphylococcus_aureus ||
            registro.bacillus_cereus || registro.listeria || registro.salmonella || registro.enterobacterias ||
            registro.clostridium || registro.esterilidad_comercial || registro.anaerobias) && (
            <Card>
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Beaker className="w-5 h-5 text-gray-600" />
                  Resultados Microbiológicos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {registro.mesofilos && (
                    <div>
                      <span className="text-xs text-gray-500 block">Mesófilos</span>
                      <span className="text-sm font-medium">{registro.mesofilos}</span>
                    </div>
                  )}
                  {registro.coliformes_totales && (
                    <div>
                      <span className="text-xs text-gray-500 block">Coliformes Totales</span>
                      <span className="text-sm font-medium">{registro.coliformes_totales}</span>
                    </div>
                  )}
                  {registro.coliformes_fecales && (
                    <div>
                      <span className="text-xs text-gray-500 block">Coliformes Fecales</span>
                      <span className="text-sm font-medium">{registro.coliformes_fecales}</span>
                    </div>
                  )}
                  {registro.e_coli && (
                    <div>
                      <span className="text-xs text-gray-500 block">E. Coli</span>
                      <span className="text-sm font-medium">{registro.e_coli}</span>
                    </div>
                  )}
                  {registro.mohos && (
                    <div>
                      <span className="text-xs text-gray-500 block">Mohos</span>
                      <span className="text-sm font-medium">{registro.mohos}</span>
                    </div>
                  )}
                  {registro.levaduras && (
                    <div>
                      <span className="text-xs text-gray-500 block">Levaduras</span>
                      <span className="text-sm font-medium">{registro.levaduras}</span>
                    </div>
                  )}
                  {registro.staphylococcus_aureus && (
                    <div>
                      <span className="text-xs text-gray-500 block">Staph. Aureus</span>
                      <span className="text-sm font-medium">{registro.staphylococcus_aureus}</span>
                    </div>
                  )}
                  {registro.bacillus_cereus && (
                    <div>
                      <span className="text-xs text-gray-500 block">Bacillus Cereus</span>
                      <span className="text-sm font-medium">{registro.bacillus_cereus}</span>
                    </div>
                  )}
                  {registro.listeria && (
                    <div>
                      <span className="text-xs text-gray-500 block">Listeria</span>
                      <span className="text-sm font-medium">{registro.listeria}</span>
                    </div>
                  )}
                  {registro.salmonella && (
                    <div>
                      <span className="text-xs text-gray-500 block">Salmonella</span>
                      <span className="text-sm font-medium">{registro.salmonella}</span>
                    </div>
                  )}
                  {registro.enterobacterias && (
                    <div>
                      <span className="text-xs text-gray-500 block">Enterobacterias</span>
                      <span className="text-sm font-medium">{registro.enterobacterias}</span>
                    </div>
                  )}
                  {registro.clostridium && (
                    <div>
                      <span className="text-xs text-gray-500 block">Clostridium</span>
                      <span className="text-sm font-medium">{registro.clostridium}</span>
                    </div>
                  )}
                  {registro.esterilidad_comercial && (
                    <div>
                      <span className="text-xs text-gray-500 block">Esterilidad</span>
                      <span className="text-sm font-medium">{registro.esterilidad_comercial}</span>
                    </div>
                  )}
                  {registro.anaerobias && (
                    <div>
                      <span className="text-xs text-gray-500 block">Anaerobias</span>
                      <span className="text-sm font-medium">{registro.anaerobias}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información del Muestreo */}
          {(registro.medio_diluyente || registro.factor_dilucion || registro.parametros_referencia) && (
            <Card>
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg">Información del Muestreo</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-4">
                <div className="grid grid-cols-2 gap-4">
                  {registro.medio_diluyente && (
                    <div>
                      <span className="text-xs text-gray-500 block">Medio Diluyente</span>
                      <span className="text-sm font-medium">{registro.medio_diluyente}</span>
                    </div>
                  )}
                  {registro.factor_dilucion && (
                    <div>
                      <span className="text-xs text-gray-500 block">Factor Dilución</span>
                      <span className="text-sm font-medium">{registro.factor_dilucion}</span>
                    </div>
                  )}
                </div>
                {registro.parametros_referencia && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-xs text-gray-500 block mb-1">Parámetros de Referencia</span>
                    <p className="text-sm font-medium break-all" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                      {registro.parametros_referencia}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observaciones */}
          {registro.observaciones && (
            <Card>
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg">Observaciones</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-4">
                <p className="text-sm break-all" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  {registro.observaciones}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
