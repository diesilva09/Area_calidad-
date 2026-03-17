"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

interface ChartPreviewProps {
  records: any[];
  onOpenAnalysis?: () => void;
  showButton?: boolean;
}

export function ChartPreview({ records, onOpenAnalysis, showButton = true }: ChartPreviewProps) {
  // Calcular estadísticas básicas
  const stats = React.useMemo(() => {
    if (records.length === 0) return null;

    const validTempRecords = records.filter(record => 
      record.tempam1 || record.tempam2 || record.temppm1 || record.temppm2
    );

    const avgTemp = validTempRecords.length > 0 
      ? validTempRecords.reduce((sum, record) => {
          const temps = [
            parseFloat(record.tempam1) || 0,
            parseFloat(record.tempam2) || 0,
            parseFloat(record.temppm1) || 0,
            parseFloat(record.temppm2) || 0
          ];
          return sum + (temps.reduce((a, b) => a + b, 0) / 4);
        }, 0) / validTempRecords.length
      : 0;

    const validWeightRecords = records.filter(record => 
      record.pesos_drenados || record.pesos_netos
    );

    const avgComplianceDrenado = validWeightRecords.reduce((sum, record) => {
      const cumplimiento = record.porcentaje_incumplen_rango_drenado 
        ? 100 - parseFloat(record.porcentaje_incumplen_rango_drenado)
        : 0;
      return sum + cumplimiento;
    }, 0) / (validWeightRecords.length || 1);

    const avgComplianceNeto = validWeightRecords.reduce((sum, record) => {
      const cumplimiento = record.porcentaje_incumplen_rango_neto 
        ? 100 - parseFloat(record.porcentaje_incumplen_rango_neto)
        : 0;
      return sum + cumplimiento;
    }, 0) / (validWeightRecords.length || 1);

    return {
      totalRecords: records.length,
      tempRecords: validTempRecords.length,
      weightRecords: validWeightRecords.length,
      avgTemp,
      avgComplianceDrenado,
      avgComplianceNeto,
      hasData: validTempRecords.length > 0 || validWeightRecords.length > 0
    };
  }, [records]);

  // Datos para mini gráfica de temperaturas (últimos 5 registros)
  const miniChartData = React.useMemo(() => {
    return records
      .filter(record => record.tempam1 || record.tempam2 || record.temppm1 || record.temppm2)
      .slice(-5)
      .map((record, index) => ({
        name: `R${index + 1}`,
        temp: (
          (parseFloat(record.tempam1) || 0) +
          (parseFloat(record.tempam2) || 0) +
          (parseFloat(record.temppm1) || 0) +
          (parseFloat(record.temppm2) || 0)
        ) / 4
      }));
  }, [records]);

  if (!stats || !stats.hasData) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumen de Producción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Sin Datos para Análisis</h3>
            <p className="text-sm">
              No hay registros de producción con datos de temperatura o peso para analizar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumen de Producción
          </div>
          {showButton && onOpenAnalysis && (
            <Button onClick={onOpenAnalysis} size="sm">
              Ver Análisis Completo
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-600 text-sm">Registros Totales</div>
            <div className="text-2xl font-bold text-blue-800">{stats.totalRecords}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-green-600 text-sm">Con Temperaturas</div>
            <div className="text-2xl font-bold text-green-800">{stats.tempRecords}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-orange-600 text-sm">Con Pesos</div>
            <div className="text-2xl font-bold text-orange-800">{stats.weightRecords}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-purple-600 text-sm">Temp. Promedio</div>
            <div className="text-2xl font-bold text-purple-800">{stats.avgTemp.toFixed(1)}°C</div>
          </div>
        </div>

        {/* Mini Gráfica de Temperaturas */}
        {miniChartData.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              🌡️ Últimas Temperaturas Registradas
            </h4>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={miniChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperatura']}
                />
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Indicadores de Cumplimiento */}
        {(stats.avgComplianceDrenado > 0 || stats.avgComplianceNeto > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.avgComplianceDrenado > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cumplimiento Peso Drenado</span>
                  <span className={`font-bold ${
                    stats.avgComplianceDrenado >= 90 ? 'text-green-600' :
                    stats.avgComplianceDrenado >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {stats.avgComplianceDrenado.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      stats.avgComplianceDrenado >= 90 ? 'bg-green-500' :
                      stats.avgComplianceDrenado >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(stats.avgComplianceDrenado, 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {stats.avgComplianceNeto > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cumplimiento Peso Neto</span>
                  <span className={`font-bold ${
                    stats.avgComplianceNeto >= 90 ? 'text-green-600' :
                    stats.avgComplianceNeto >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {stats.avgComplianceNeto.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      stats.avgComplianceNeto >= 90 ? 'bg-green-500' :
                      stats.avgComplianceNeto >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(stats.avgComplianceNeto, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje si no hay datos de temperatura */}
        {stats.tempRecords === 0 && stats.weightRecords > 0 && (
          <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Hay registros con datos de peso pero sin temperaturas. 
              Las gráficas de temperatura estarán disponibles cuando se registren temperaturas en la producción.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
