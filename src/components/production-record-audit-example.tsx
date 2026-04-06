'use client';

import React, { useState, use } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { AuditedField } from '@/components/audited-field';
import { FieldHistoryPanel } from '@/components/field-history-panel';
import { useFieldAudit, useRecentChanges } from '@/hooks/use-field-audit';
import { getUserDisplayName } from '@/lib/user-display-utils';

// Datos de ejemplo (en una app real, estos vendrían de una API)
const mockRecord = {
  id: '123',
  lote: 'LOTE-456',
  fechaproduccion: '2024-01-15',
  fechavencimiento: '2024-06-15',
  producto: 'Producto Ejemplo',
  responsable_produccion: 'Juan Pérez',
  supervisor_calidad: 'Ana García',
  status: 'completed',
  tempam1: '25°C',
  tempam2: '26°C',
  peso_neto_declarado: '500g',
  observaciones: 'Registro de producción normal'
};

export default function ProductionRecordAuditExample() {
  const params = useParams();
  const recordId = (params?.id as string) || mockRecord.id;
  
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  
  // Usar el hook de auditoría
  const { 
    hasHistory, 
    lastChange, 
    isLoading: auditLoading 
  } = useFieldAudit({
    tableName: 'production_records',
    recordId,
    autoLoad: true
  });

  const { 
    recentChanges, 
    hasRecentChanges 
  } = useRecentChanges('production_records', recordId, 24);

  const record = mockRecord; // En una app real, vendría de una API

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/supervisores">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Supervisores
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Registro de Producción #{recordId}
              </h1>
              <p className="text-gray-600">
                Producto: {record.producto} • Lote: {record.lote}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Indicador de cambios recientes */}
              {hasRecentChanges && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {recentChanges.length} cambio{recentChanges.length !== 1 ? 's' : ''} reciente{recentChanges.length !== 1 ? 's' : ''}
                </Badge>
              )}

              {/* Botón de historial completo */}
              <Button
                variant="outline"
                onClick={() => setIsHistoryPanelOpen(true)}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                Ver Historial Completo
                {hasHistory && (
                  <Badge variant="secondary" className="ml-1">
                    {hasHistory ? '✓' : ''}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Alerta de cambios recientes */}
        {hasRecentChanges && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-orange-900">
                    Este registro tiene cambios recientes
                  </h3>
                  <p className="text-sm text-orange-700">
                    Se detectaron {recentChanges.length} cambio{recentChanges.length !== 1 ? 's' : ''} en las últimas 24 horas.
                    {lastChange && (
                      <> Última modificación por {getUserDisplayName(lastChange.changed_by)}.</>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información del registro con auditoría */}
        <div className="grid gap-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Información Básica
                {auditLoading && (
                  <Badge variant="outline">Cargando auditoría...</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AuditedField
                  label="Lote"
                  value={record.lote}
                  fieldName="lote"
                  recordId={recordId}
                />

                <AuditedField
                  label="Producto"
                  value={record.producto}
                  fieldName="producto"
                  recordId={recordId}
                />

                <AuditedField
                  label="Fecha de Producción"
                  value={record.fechaproduccion}
                  fieldName="fechaproduccion"
                  recordId={recordId}
                />

                <AuditedField
                  label="Fecha de Vencimiento"
                  value={record.fechavencimiento}
                  fieldName="fechavencimiento"
                  recordId={recordId}
                />

                <AuditedField
                  label="Responsable de Producción"
                  value={record.responsable_produccion}
                  fieldName="responsable_produccion"
                  recordId={recordId}
                />

                <AuditedField
                  label="Supervisor de Calidad"
                  value={record.supervisor_calidad}
                  fieldName="supervisor_calidad"
                  recordId={recordId}
                />
              </div>
            </CardContent>
          </Card>

          {/* Control de calidad */}
          <Card>
            <CardHeader>
              <CardTitle>Control de Calidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AuditedField
                  label="Estado"
                  value={record.status}
                  fieldName="status"
                  recordId={recordId}
                />

                <AuditedField
                  label="Temperatura AM 1"
                  value={record.tempam1}
                  fieldName="tempam1"
                  recordId={recordId}
                />

                <AuditedField
                  label="Temperatura AM 2"
                  value={record.tempam2}
                  fieldName="tempam2"
                  recordId={recordId}
                />

                <AuditedField
                  label="Peso Neto Declarado"
                  value={record.peso_neto_declarado}
                  fieldName="peso_neto_declarado"
                  recordId={recordId}
                />
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditedField
                label="Observaciones Generales"
                value={record.observaciones}
                fieldName="observaciones"
                recordId={recordId}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral de historial */}
        <FieldHistoryPanel
          isOpen={isHistoryPanelOpen}
          onClose={() => setIsHistoryPanelOpen(false)}
          tableName="production_records"
          recordId={recordId}
          recordTitle={`${record.producto} - ${record.lote}`}
        />
      </div>
    </div>
  );
}
