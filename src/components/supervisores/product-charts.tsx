"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ProductChartsProps {
  data: {
    temperatures?: {
      tempAM1: string;
      tempAM2: string;
      tempPM1: string;
      tempPM2: string;
    };
    temperaturaRango?: {
      min: number;
      max: number;
    };
    pesoDrenado?: {
      declarado: string;
      min: string;
      max: string;
      pesos: string[];
      encima: number;
      debajo: number;
      promedio: string;
      porcentajeIncumplen: string;
    };
    pesoNeto?: {
      declarado: string;
      pesos: string[];
      encima: number;
      debajo: number;
      promedio: string;
      porcentajeIncumplen: string;
    };
  };
}

export function ProductCharts({ data }: ProductChartsProps) {
  // Datos para gráfica de temperaturas
  const temperatureData = data.temperatures ? [
    { 
      name: 'AM1', 
      temperatura: parseFloat(data.temperatures.tempAM1) || 0,
      rangoMin: data.temperaturaRango?.min || 0,
      rangoMax: data.temperaturaRango?.max || 0,
    },
    { 
      name: 'AM2', 
      temperatura: parseFloat(data.temperatures.tempAM2) || 0,
      rangoMin: data.temperaturaRango?.min || 0,
      rangoMax: data.temperaturaRango?.max || 0,
    },
    { 
      name: 'PM1', 
      temperatura: parseFloat(data.temperatures.tempPM1) || 0,
      rangoMin: data.temperaturaRango?.min || 0,
      rangoMax: data.temperaturaRango?.max || 0,
    },
    { 
      name: 'PM2', 
      temperatura: parseFloat(data.temperatures.tempPM2) || 0,
      rangoMin: data.temperaturaRango?.min || 0,
      rangoMax: data.temperaturaRango?.max || 0,
    },
  ] : [];

  // Datos para gráfica de pesos drenados - Siempre mostrar
  const pesoDrenadoData = {
    pesos: (data.pesoDrenado?.pesos || []).map((peso, index) => ({
      muestra: `M${index + 1}`,
      peso: parseFloat(peso) || 0,
      min: parseFloat(data.pesoDrenado?.min || '0') || 0,
      max: parseFloat(data.pesoDrenado?.max || '0') || 0,
      declarado: parseFloat(data.pesoDrenado?.declarado || '0') || 0,
    })),
    cumplimiento: [
      { name: 'Cumplen', value: Math.max(0, (data.pesoDrenado?.pesos?.length || 0) - (data.pesoDrenado?.encima || 0) - (data.pesoDrenado?.debajo || 0)), color: '#10b981' },
      { name: 'Por Encima', value: data.pesoDrenado?.encima || 0, color: '#f59e0b' },
      { name: 'Por Debajo', value: data.pesoDrenado?.debajo || 0, color: '#ef4444' },
    ]
  };

  // Datos para gráfica de pesos netos - Siempre mostrar
  const pesoNetoData = {
    pesos: (data.pesoNeto?.pesos || []).map((peso, index) => ({
      muestra: `M${index + 1}`,
      peso: parseFloat(peso) || 0,
      declarado: parseFloat(data.pesoNeto?.declarado || '0') || 0,
    })),
    cumplimiento: [
      { name: 'Cumplen', value: Math.max(0, (data.pesoNeto?.pesos?.length || 0) - (data.pesoNeto?.encima || 0) - (data.pesoNeto?.debajo || 0)), color: '#10b981' },
      { name: 'Por Encima', value: data.pesoNeto?.encima || 0, color: '#f59e0b' },
      { name: 'Por Debajo', value: data.pesoNeto?.debajo || 0, color: '#ef4444' },
    ]
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Análisis de Producto</h3>
      
      {/* Gráfica de Temperaturas - Siempre mostrar si hay datos de temperaturas */}
      {data.temperatures && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-700 mb-3">
            🌡️ Temperaturas de Envasado
            {data.temperaturaRango ? (
              <span className="ml-2 text-sm text-blue-600">
                (Rango: {data.temperaturaRango.min}°C - {data.temperaturaRango.max}°C)
              </span>
            ) : (
              <span className="ml-2 text-sm text-gray-500">
                (Sin rango de temperatura definido para este producto)
              </span>
            )}
          </h4>
          
          {/* Verificar si todas las temperaturas son cero */}
          {temperatureData.every(t => t.temperatura === 0) ? (
            <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 mb-2">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h5 className="text-lg font-medium text-yellow-800 mb-2">Sin Datos de Temperatura</h5>
              <p className="text-sm text-yellow-700">
                No se registraron temperaturas para este lote. 
                Las temperaturas muestran 0°C porque no se capturaron los datos durante la producción.
              </p>
              <div className="mt-3 text-xs text-yellow-600">
                <strong>Nota:</strong> Es importante registrar las temperaturas de envasado para garantizar la calidad del producto.
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperatura']}
                    labelFormatter={(label) => `Medición: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="temperatura" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                    name="Temperatura Real"
                  />
                  {data.temperaturaRango && (
                    <>
                      <Line 
                        type="monotone" 
                        dataKey="rangoMin" 
                        stroke="#ef4444" 
                        strokeDasharray="5 5"
                        dot={false}
                        name="Temperatura Mínima"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rangoMax" 
                        stroke="#f59e0b" 
                        strokeDasharray="5 5"
                        dot={false}
                        name="Temperatura Máxima"
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
              
              {/* Estadísticas de Temperaturas - Mejoradas */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-2 rounded border">
                  <span className="text-gray-600">Promedio Real:</span>
                  <span className="font-medium ml-2 text-blue-600">
                    {(
                      (parseFloat(data.temperatures?.tempAM1 || '0') + 
                       parseFloat(data.temperatures?.tempAM2 || '0') + 
                       parseFloat(data.temperatures?.tempPM1 || '0') + 
                       parseFloat(data.temperatures?.tempPM2 || '0')) / 4
                    ).toFixed(1)}°C
                  </span>
                </div>
                
                {data.temperaturaRango ? (
                  <>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-gray-600">Rango Permitido:</span>
                      <span className="font-medium ml-2">
                        {data.temperaturaRango.min}°C - {data.temperaturaRango.max}°C
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-gray-600">Temperaturas en Rango:</span>
                      <span className="font-medium ml-2 text-green-600">
                        {
                          temperatureData.filter(t => 
                            t.temperatura >= data.temperaturaRango!.min && 
                            t.temperatura <= data.temperaturaRango!.max
                          ).length
                        }/4
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-gray-600">% Cumplimiento:</span>
                      <span className={`font-medium ml-2 ${
                        (
                          (temperatureData.filter(t => 
                            t.temperatura >= data.temperaturaRango!.min && 
                            t.temperatura <= data.temperaturaRango!.max
                          ).length / 4) * 100
                        ) >= 90 ? 'text-green-600' : 
                        (
                          (temperatureData.filter(t => 
                            t.temperatura >= data.temperaturaRango!.min && 
                            t.temperatura <= data.temperaturaRango!.max
                          ).length / 4) * 100
                        ) >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {
                          (
                            (temperatureData.filter(t => 
                              t.temperatura >= data.temperaturaRango!.min && 
                              t.temperatura <= data.temperaturaRango!.max
                            ).length / 4) * 100
                          ).toFixed(0)
                        }%
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-gray-600">Temperatura Máxima:</span>
                      <span className="font-medium ml-2 text-red-600">
                        {Math.max(...temperatureData.map(t => t.temperatura)).toFixed(1)}°C
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-gray-600">Temperatura Mínima:</span>
                      <span className="font-medium ml-2 text-blue-600">
                        {Math.min(...temperatureData.map(t => t.temperatura)).toFixed(1)}°C
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-gray-600">Variación:</span>
                      <span className="font-medium ml-2 text-orange-600">
                        {(Math.max(...temperatureData.map(t => t.temperatura)) - Math.min(...temperatureData.map(t => t.temperatura))).toFixed(1)}°C
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Alerta si no hay rango definido */}
              {!data.temperaturaRango && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Sin rango de temperatura definido</strong> - Este producto no tiene un rango de temperatura configurado. 
                        Considera definir un rango para evaluar el cumplimiento de las especificaciones.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Gráfica de Pesos Drenados - Siempre mostrar */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-700 mb-3">
          ⚖️ Control de Peso Drenado
        </h4>
        
        {pesoDrenadoData.pesos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfica de línea con rangos */}
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={pesoDrenadoData.pesos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="muestra" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={2} name="Peso Real" />
                  <Line type="monotone" dataKey="min" stroke="#ef4444" strokeDasharray="5 5" name="Mínimo" />
                  <Line type="monotone" dataKey="max" stroke="#f59e0b" strokeDasharray="5 5" name="Máximo" />
                  <Line type="monotone" dataKey="declarado" stroke="#10b981" strokeDasharray="3 3" name="Declarado" />
                </LineChart>
              </ResponsiveContainer>

              {/* Gráfica de pastel de cumplimiento */}
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pesoDrenadoData.cumplimiento}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pesoDrenadoData.cumplimiento.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Estadísticas */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-2 rounded border">
                <span className="text-gray-600">Promedio:</span>
                <span className="font-medium ml-2">{data.pesoDrenado?.promedio}g</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="text-gray-600">Declarado:</span>
                <span className="font-medium ml-2">{data.pesoDrenado?.declarado}g</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="text-gray-600">Por Encima:</span>
                <span className="font-medium ml-2 text-orange-600">{data.pesoDrenado?.encima}</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="text-gray-600">Por Debajo:</span>
                <span className="font-medium ml-2 text-red-600">{data.pesoDrenado?.debajo}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 mb-2">
              <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h5 className="text-lg font-medium text-yellow-800 mb-2">Sin Datos de Peso Drenado</h5>
            <p className="text-sm text-yellow-700">
              No se registraron pesos drenados para este lote. 
              Los datos de peso son importantes para el control de calidad del producto.
            </p>
          </div>
        )}
      </div>

      {/* Gráfica de Pesos Netos - Siempre mostrar */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-700 mb-3">
          📦 Control de Peso Neto
        </h4>
        
        {pesoNetoData.pesos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfica de línea con peso declarado */}
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={pesoNetoData.pesos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="muestra" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={2} name="Peso Real" />
                  <Line type="monotone" dataKey="declarado" stroke="#10b981" strokeDasharray="3 3" name="Declarado" />
                </LineChart>
              </ResponsiveContainer>

              {/* Gráfica de pastel de cumplimiento */}
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pesoNetoData.cumplimiento}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pesoNetoData.cumplimiento.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Estadísticas */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-2 rounded border">
                <span className="text-gray-600">Promedio:</span>
                <span className="font-medium ml-2">{data.pesoNeto?.promedio}g</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="text-gray-600">Declarado:</span>
                <span className="font-medium ml-2">{data.pesoNeto?.declarado}g</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="text-gray-600">Por Encima:</span>
                <span className="font-medium ml-2 text-orange-600">{data.pesoNeto?.encima}</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="text-gray-600">Por Debajo:</span>
                <span className="font-medium ml-2 text-red-600">{data.pesoNeto?.debajo}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 mb-2">
              <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h5 className="text-lg font-medium text-yellow-800 mb-2">Sin Datos de Peso Neto</h5>
            <p className="text-sm text-yellow-700">
              No se registraron pesos netos para este lote. 
              El control de peso neto es fundamental para el cumplimiento de las especificaciones del producto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
