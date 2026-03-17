"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { productionRecordsService } from '@/lib/supervisores-data';
import { TemperaturaEnvasadoService } from '@/lib/temperatura-envasado-service';

interface ProductionAnalysisProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productId: string;
}

export function ProductionAnalysis({ isOpen, onOpenChange, productId }: ProductionAnalysisProps) {
  console.log('🔄🔄 ProductionAnalysis renderizado - productId:', productId, 'isOpen:', isOpen);
  console.log('📦📦 Archivo production-analysis.tsx cargado - versión actual');
  
  const [records, setRecords] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [temperaturaRango, setTemperaturaRango] = React.useState<{min: number, max: number} | null>(null);
  const [envaseSeleccionado, setEnvaseSeleccionado] = React.useState<string>('todos');
  const [envasesDisponibles, setEnvasesDisponibles] = React.useState<any[]>([]);
  const [isLoadingEnvases, setIsLoadingEnvases] = React.useState(false);
  
  console.log('🔍🔍 Estados inicializados - records.length:', records.length);
  
  React.useEffect(() => {
    console.log('🔍 useEffect principal - isOpen:', isOpen, 'productId:', productId);
    if (isOpen && productId) {
      console.log('✅ Condiciones cumplidas, llamando a loadRecords...');
      loadRecords();
      loadEnvases();
      loadTemperaturaRango();
    } else {
      console.log('❌ Condiciones no cumplidas - isOpen:', isOpen, 'productId:', productId);
    }
  }, [isOpen, productId]);

  React.useEffect(() => {
    if (envaseSeleccionado && productId && isOpen) {
      loadTemperaturaRango();
    }
  }, [envaseSeleccionado, productId, isOpen]);

  // Cleanup ya no es necesario ya que no usamos timeouts

  const loadRecords = async () => {
    console.log('🚀 loadRecords llamado - productId:', productId, 'isOpen:', isOpen);
    setIsLoading(true);
    try {
      console.log('🔄 Cargando registros para productId:', productId);
      // Temporalmente usar getByProduct hasta que se solucione el problema de la API
      const data = await productionRecordsService.getByProduct(productId);
      console.log('📥 Datos recibidos del servicio:', data);
      console.log('📊 Número de registros:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('🔍 Primer registro completo:', data[0]);
        console.log('🌡️ Campos de temperatura del primer registro:', {
          tempam1: data[0].tempam1,
          tempam2: data[0].tempam2,
          temppm1: data[0].temppm1,
          temppm2: data[0].temppm2,
          tempAM1: data[0].tempAM1,
          tempAM2: data[0].tempAM2,
          tempPM1: data[0].tempPM1,
          tempPM2: data[0].tempPM2
        });
        
        // Verificar si hay temperaturas válidas
        let tempsValidas = 0;
        let totalTempsEncontradas = 0;
        data.forEach((record: any, index: any) => {
          const temps = [
            record.tempam1, record.tempam2, record.temppm1, record.temppm2,
            record.tempAM1, record.tempAM2, record.tempPM1, record.tempPM2
          ].filter(t => t !== null && t !== undefined && t !== '' && t !== 'Pendiente');
          
          if (temps.length > 0) {
            tempsValidas++;
            totalTempsEncontradas += temps.length;
          }
          
          console.log(`🌡️ Registro ${index}: tiene ${temps.length} temperaturas válidas`);
          if (temps.length > 0) {
            console.log(`  📊 Temperaturas: ${temps.join(', ')}`);
          }
        });
        console.log(`📈 Total de registros con temperaturas válidas: ${tempsValidas}/${data.length}`);
        console.log(`🌡️ Total de temperaturas encontradas: ${totalTempsEncontradas}`);
        
        console.log('🔍 Estructura completa del primer registro para depuración');
        console.log('🔍 Estructura completa del primer registro:');
        const firstRecord: any = Array.isArray(data) ? data[0] : null;
        Object.keys(firstRecord ?? {}).forEach(key => {
          console.log(`  ${key}: ${firstRecord?.[key]} (${typeof firstRecord?.[key]})`);
        });
      } else {
        console.log('❌ No se recibieron datos o el array está vacío');
      }
      
      // Solo actualizar estado si el componente sigue abierto
      if (isOpen) {
        setRecords(data || []);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Error al cargar registros:', error);
      if (isOpen) {
        setIsLoading(false);
      }
    }
  };

  const loadEnvases = async () => {
    setIsLoadingEnvases(true);
    try {
      console.log('📦 Cargando envases configurados para temperaturas del producto:', productId);
      const envases = await TemperaturaEnvasadoService.obtenerEnvasesProducto(productId);
      
      // Convertir array de strings a formato de objetos para compatibilidad
      const envasesFormateados = envases.map((envaseTipo, index) => ({
        id: envaseTipo,
        tipo: envaseTipo,
        mesesVencimiento: 0 // No relevante para temperaturas
      }));
      
      // Solo actualizar estado si el componente sigue abierto
      if (isOpen) {
        setEnvasesDisponibles(envasesFormateados);
        console.log('✅ Envases de temperatura cargados:', envasesFormateados.length, 'envases');
        console.log('📦 Lista de envases de temperatura:', envasesFormateados);
      }
    } catch (error) {
      console.error('❌ Error al cargar envases de temperatura:', error);
      if (isOpen) {
        setEnvasesDisponibles([]);
      }
    } finally {
      if (isOpen) {
        setIsLoadingEnvases(false);
      }
    }
  };

  // Función para determinar si un producto tiene rango de temperatura usando la API real
  const determinarSiProductoTieneRango = async (productoId: string) => {
    try {
      console.log(`📋 Verificando si producto ${productoId} tiene configuración de temperatura via API`);
      
      // Usar el servicio real para verificar si el producto está configurado
      const tieneConfiguracion = await TemperaturaEnvasadoService.productoConfigurado(productoId);
      
      const productoInfo = {
        categoria: tieneConfiguracion ? 'salsa' : 'desconocido',
        tieneRango: tieneConfiguracion,
        nombre: `Producto ${productoId}`
      };
      
      console.log(`📋 Producto ${productoId} clasificado como:`, productoInfo);
      console.log(`🔍 ¿Producto tiene rango? ${tieneConfiguracion ? 'SÍ' : 'NO'}`);
      
      return productoInfo;
    } catch (error) {
      console.error('❌ Error al verificar configuración de temperatura:', error);
      
      // En caso de error, asumir que no tiene configuración
      const productoInfo = {
        categoria: 'desconocido',
        tieneRango: false,
        nombre: `Producto ${productoId}`
      };
      
      console.log(`📋 Producto ${productoId} clasificado como (fallback):`, productoInfo);
      
      return productoInfo;
    }
  };

  const loadTemperaturaRango = async () => {
    try {
      console.log('🌡️ Cargando rango de temperatura para producto:', productId, 'envase:', envaseSeleccionado);
      
      // Primero determinar si el producto tiene rango de temperatura por su ID
      const productoConRango = await determinarSiProductoTieneRango(productId);
      console.log('🔍 ¿Producto tiene rango?', JSON.stringify(productoConRango, null, 2));
      console.log('🔍 ¿tieneRango?', productoConRango?.tieneRango);
      console.log('🔍 Tipo de tieneRango:', typeof productoConRango?.tieneRango);
      
      if (!productoConRango || !productoConRango.tieneRango) {
        console.log('ℹ️ Este producto no tiene configuración de rango de temperatura');
        setTemperaturaRango(null);
        return;
      }
      
      console.log('✅ Producto SÍ tiene configuración de temperatura, buscando rangos...');
      let rangoEncontrado = null;
      
      if (envaseSeleccionado === 'todos') {
        // Si es "todos", intentar obtener rango para diferentes tipos de envase
        const envases = ['Vidrio', 'PET', 'Doypack', 'Bolsa', 'Lata'];
        
        for (const envase of envases) {
          console.log(`🔍 Buscando rango para envase: ${envase}`);
          const rango = await TemperaturaEnvasadoService.obtenerRangoTemperatura(productId, envase);
          console.log(`📊 Resultado para ${envase}:`, rango);
          if (rango) {
            rangoEncontrado = rango;
            console.log('✅ Rango encontrado para envase', envase, ':', rango);
            break;
          }
        }
      } else {
        // Usar el envase específico seleccionado
        console.log(`🔍 Buscando rango para envase específico: ${envaseSeleccionado}`);
        rangoEncontrado = await TemperaturaEnvasadoService.obtenerRangoTemperatura(productId, envaseSeleccionado);
        if (rangoEncontrado) {
          console.log('✅ Rango encontrado para envase seleccionado', envaseSeleccionado, ':', rangoEncontrado);
        } else {
          console.log('❌ No se encontró rango para el envase seleccionado:', envaseSeleccionado);
        }
      }
      
      // Solo actualizar estado si el componente sigue abierto
      if (isOpen) {
        setTemperaturaRango(rangoEncontrado);
        console.log('🌡️ Rango de temperatura final:', rangoEncontrado);
      }
    } catch (error) {
      console.error('❌ Error al cargar rango de temperatura:', error);
      if (isOpen) {
        setTemperaturaRango(null);
      }
    }
  };

  const getChartData = (record: any) => {
    // Función helper para extraer valores numéricos de temperatura
    const extractTemp = (value: any): number => {
      if (value === null || value === undefined || value === '' || value === 'Pendiente') {
        return 0;
      }
      const numValue = parseFloat(value);
      return isNaN(numValue) ? 0 : numValue;
    };

    return {
      // Extraer datos de temperatura con conversión robusta
      temperatures: {
        tempAM1: extractTemp(record.tempam1 || record.tempAM1),
        tempAM2: extractTemp(record.tempam2 || record.tempAM2),
        tempPM1: extractTemp(record.temppm1 || record.tempPM1),
        tempPM2: extractTemp(record.temppm2 || record.tempPM2),
      },
      temperaturaRango: temperaturaRango || undefined,
      // Datos de pesos (manteniendo lógica existente)
      pesoDrenado: {
        declarado: record.peso_drenado_declarado || '0',
        min: record.rango_peso_drenado_min || '0',
        max: record.rango_peso_drenado_max || '0',
        pesos: record.pesos_drenados ? record.pesos_drenados.split(/[\s,;]+/).filter((p: string) => p.trim() !== '') : [],
        encima: parseInt(record.encima_peso_drenado || '0'),
        debajo: parseInt(record.debajo_peso_drenado || '0'),
        promedio: record.promedio_peso_drenado || '0',
        porcentajeIncumplen: record.porcentaje_incumplen_rango_drenado || '0',
      },
      pesoNeto: {
        declarado: record.peso_neto_declarado || '0',
        pesos: record.pesos_netos ? record.pesos_netos.split(/[\s,;]+/).filter((p: string) => p.trim() !== '') : [],
        encima: parseInt(record.encima_peso_neto || '0'),
        debajo: parseInt(record.debajo_peso_neto || '0'),
        promedio: record.promedio_peso_neto || '0',
        porcentajeIncumplen: record.porcentaje_incumplen_rango_neto || '0',
      },
    };
  };

  // Función para calcular temperatura validada según el tipo de envase
  const calcularTemperaturaValidada = (envase: string, temperaturas: number[]) => {
    if (!temperaturaRango || temperaturas.length === 0) {
      return {
        temperatura: null,
        estado: 'sin_datos',
        mensaje: 'Sin datos de temperatura'
      };
    }

    // Filtrar temperaturas que están dentro del rango válido
    const temperaturasValidas = temperaturas.filter(t => 
      t >= temperaturaRango.min && t <= temperaturaRango.max
    );

    if (temperaturasValidas.length === 0) {
      return {
        temperatura: Math.round(temperaturas.reduce((sum, t) => sum + t, 0) / temperaturas.length * 10) / 10,
        estado: 'fuera_rango',
        mensaje: `Todas las temperaturas fuera del rango (${temperaturaRango.min}°C - ${temperaturaRango.max}°C)`
      };
    }

    // Calcular promedio de temperaturas válidas
    const temperaturaValidada = Math.round(temperaturasValidas.reduce((sum, t) => sum + t, 0) / temperaturasValidas.length * 10) / 10;
    
    return {
      temperatura: temperaturaValidada,
      estado: 'validado',
      mensaje: `Temperatura validada para ${envase}`,
      detalles: {
        totalMediciones: temperaturas.length,
        medicionesValidas: temperaturasValidas.length,
        porcentajeValidas: Math.round((temperaturasValidas.length / temperaturas.length) * 100)
      }
    };
  };

  const getOverallStats = () => {
    if (records.length === 0) return null;

    // Función helper para validar y extraer temperaturas (definida fuera del bucle)
    const getValidTemp = (record: any, tempField: string): number | null => {
      const value = record[tempField];
      if (value === null || value === undefined || value === '' || value === 'Pendiente') {
        return null;
      }
      const numValue = parseFloat(value);
      return isNaN(numValue) || numValue <= 0 ? null : numValue;
    };

    // Función para obtener todas las temperaturas válidas de un registro
    const getAllValidTemps = (record: any): number[] => {
      const temps = [
        getValidTemp(record, 'tempam1') || getValidTemp(record, 'tempAM1'),
        getValidTemp(record, 'tempam2') || getValidTemp(record, 'tempAM2'),
        getValidTemp(record, 'temppm1') || getValidTemp(record, 'tempPM1'),
        getValidTemp(record, 'temppm2') || getValidTemp(record, 'tempPM2')
      ].filter(t => t !== null) as number[];
      return temps;
    };

    const stats = {
      totalRecords: records.length,
      recordsWithTemperaturas: 0,
      totalTemperaturas: 0,
      avgTempAM1: 0,
      avgTempAM2: 0,
      avgTempPM1: 0,
      avgTempPM2: 0,
      avgTempGeneral: 0,
      tempMinima: Infinity,
      tempMaxima: -Infinity,
      temperaturasDentroRango: 0,
      temperaturasFueraRango: 0,
      avgCumplimientoDrenado: 0,
      avgCumplimientoNeto: 0,
    };

    let validTempRecords = 0;
    let validDrenadoRecords = 0;
    let validNetoRecords = 0;
    let allTemperatures: number[] = [];

    records.forEach(record => {
      // Temperaturas - soporta múltiples formatos de nombres de campo
      const tempAM1 = getValidTemp(record, 'tempam1') || getValidTemp(record, 'tempAM1');
      const tempAM2 = getValidTemp(record, 'tempam2') || getValidTemp(record, 'tempAM2');
      const tempPM1 = getValidTemp(record, 'temppm1') || getValidTemp(record, 'tempPM1');
      const tempPM2 = getValidTemp(record, 'temppm2') || getValidTemp(record, 'tempPM2');
      
      const recordTemps = getAllValidTemps(record);
      
      // Si al menos una temperatura es válida, contar como registro válido
      if (recordTemps.length > 0) {
        validTempRecords++;
        stats.recordsWithTemperaturas++;
        stats.totalTemperaturas += recordTemps.length;
        allTemperatures = allTemperatures.concat(recordTemps);
        
        // Actualizar temperaturas mínimas y máximas
        const minInRecord = Math.min(...recordTemps);
        const maxInRecord = Math.max(...recordTemps);
        stats.tempMinima = Math.min(stats.tempMinima, minInRecord);
        stats.tempMaxima = Math.max(stats.tempMaxima, maxInRecord);
        
        // Acumular temperaturas por tipo
        if (tempAM1 !== null) stats.avgTempAM1 += tempAM1;
        if (tempAM2 !== null) stats.avgTempAM2 += tempAM2;
        if (tempPM1 !== null) stats.avgTempPM1 += tempPM1;
        if (tempPM2 !== null) stats.avgTempPM2 += tempPM2;
        
        // Verificar rangos si está configurado
        if (temperaturaRango) {
          const tempsDentroRango = recordTemps.filter(t => 
            t >= temperaturaRango.min && t <= temperaturaRango.max
          ).length;
          const tempsFueraRango = recordTemps.length - tempsDentroRango;
          
          stats.temperaturasDentroRango += tempsDentroRango;
          stats.temperaturasFueraRango += tempsFueraRango;
        }
        
        console.log(`📊 Registro con temperaturas válidas: AM1=${tempAM1}, AM2=${tempAM2}, PM1=${tempPM1}, PM2=${tempPM2}`);
      }

      // Peso Drenado
      if (record.porcentaje_incumplen_rango_drenado) {
        const cumplimiento = 100 - parseFloat(record.porcentaje_incumplen_rango_drenado);
        stats.avgCumplimientoDrenado += cumplimiento;
        validDrenadoRecords++;
      }

      // Peso Neto
      if (record.porcentaje_incumplen_rango_neto) {
        const cumplimiento = 100 - parseFloat(record.porcentaje_incumplen_rango_neto);
        stats.avgCumplimientoNeto += cumplimiento;
        validNetoRecords++;
      }
    });

    // Calcular promedios solo con registros válidos
    if (validTempRecords > 0) {
      const countAM1 = records.filter(r => {
        const temp = getValidTemp(r, 'tempam1') || getValidTemp(r, 'tempAM1');
        return temp !== null;
      }).length;
      const countAM2 = records.filter(r => {
        const temp = getValidTemp(r, 'tempam2') || getValidTemp(r, 'tempAM2');
        return temp !== null;
      }).length;
      const countPM1 = records.filter(r => {
        const temp = getValidTemp(r, 'temppm1') || getValidTemp(r, 'tempPM1');
        return temp !== null;
      }).length;
      const countPM2 = records.filter(r => {
        const temp = getValidTemp(r, 'temppm2') || getValidTemp(r, 'tempPM2');
        return temp !== null;
      }).length;
      
      if (countAM1 > 0) stats.avgTempAM1 /= countAM1;
      if (countAM2 > 0) stats.avgTempAM2 /= countAM2;
      if (countPM1 > 0) stats.avgTempPM1 /= countPM1;
      if (countPM2 > 0) stats.avgTempPM2 /= countPM2;
      
      // Calcular temperatura general promedio
      if (allTemperatures.length > 0) {
        stats.avgTempGeneral = allTemperatures.reduce((sum, temp) => sum + temp, 0) / allTemperatures.length;
      }
      
      console.log(`📈 Estadísticas calculadas - Registros válidos: ${validTempRecords}/${records.length}`);
      console.log(`🌡️ Temperatura general promedio: ${stats.avgTempGeneral.toFixed(2)}°C`);
      console.log(`📊 Rango de temperaturas: ${stats.tempMinima.toFixed(2)}°C - ${stats.tempMaxima.toFixed(2)}°C`);
    }

    if (validDrenadoRecords > 0) {
      stats.avgCumplimientoDrenado /= validDrenadoRecords;
    }

    if (validNetoRecords > 0) {
      stats.avgCumplimientoNeto /= validNetoRecords;
    }

    // Resetear valores infinitos si no hay temperaturas
    if (stats.tempMinima === Infinity) stats.tempMinima = 0;
    if (stats.tempMaxima === -Infinity) stats.tempMaxima = 0;

    return stats;
  };

  const stats = getOverallStats();

  // Debug: Verificar estado del componente
  console.log('🔍 Estado actual del componente:', {
    isLoading,
    recordsCount: records.length,
    productId,
    isOpen,
    temperaturaRango,
    envaseSeleccionado
  });

  // Debug: Verificar datos de registros
  if (records.length > 0) {
    console.log('📊 Análisis de registros:');
    records.forEach((record: any, index) => {
      const temps = {
        tempam1: record.tempam1,
        tempam2: record.tempam2,
        temppm1: record.temppm1,
        temppm2: record.temppm2,
        tempAM1: record.tempAM1,
        tempAM2: record.tempAM2,
        tempPM1: record.tempPM1,
        tempPM2: record.tempPM2
      };
      const validTemps = Object.values(temps).filter(t => 
        t !== null && t !== undefined && t !== '' && t !== 'Pendiente'
      );
      console.log(`  Registro ${index}: ${validTemps.length} temperaturas válidas`);
      if (validTemps.length > 0) {
        console.log(`    Valores: ${validTemps.join(', ')}`);
      }
    });
  } else {
    console.log('❌ No hay registros para procesar');
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Análisis de Producción</DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
            {/* Estadísticas Generales Mejoradas */}
            {stats && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Estadísticas Generales de Temperaturas</h2>
                
                {/* Estadísticas Principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">Temp AM 1 Promedio</div>
                    <div className="text-2xl font-bold text-blue-800">{stats.avgTempAM1.toFixed(1)}°C</div>
                    <div className="text-xs text-blue-600 mt-1">Mañana 1</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">Temp AM 2 Promedio</div>
                    <div className="text-2xl font-bold text-blue-800">{stats.avgTempAM2.toFixed(1)}°C</div>
                    <div className="text-xs text-blue-600 mt-1">Mañana 2</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-600 font-medium">Temp PM 1 Promedio</div>
                    <div className="text-2xl font-bold text-orange-800">{stats.avgTempPM1.toFixed(1)}°C</div>
                    <div className="text-xs text-orange-600 mt-1">Tarde 1</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-600 font-medium">Temp PM 2 Promedio</div>
                    <div className="text-2xl font-bold text-orange-800">{stats.avgTempPM2.toFixed(1)}°C</div>
                    <div className="text-xs text-orange-600 mt-1">Tarde 2</div>
                  </div>
                </div>

                {/* Estadísticas Generales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium">Temperatura General</div>
                    <div className="text-2xl font-bold text-purple-800">{stats.avgTempGeneral.toFixed(1)}°C</div>
                    <div className="text-xs text-purple-600 mt-1">Promedio total</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 font-medium">Rango de Temperaturas</div>
                    <div className="text-lg font-bold text-green-800">
                      {stats.tempMinima.toFixed(1)}°C - {stats.tempMaxima.toFixed(1)}°C
                    </div>
                    <div className="text-xs text-green-600 mt-1">Mínima - Máxima</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-600 font-medium">Registros con Datos</div>
                    <div className="text-2xl font-bold text-yellow-800">
                      {stats.recordsWithTemperaturas}/{stats.totalRecords}
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      {((stats.recordsWithTemperaturas / stats.totalRecords) * 100).toFixed(1)}% completos
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div className="text-sm text-indigo-600 font-medium">Total Mediciones</div>
                    <div className="text-2xl font-bold text-indigo-800">{stats.totalTemperaturas}</div>
                    <div className="text-xs text-indigo-600 mt-1">
                      {stats.recordsWithTemperaturas > 0 ? (stats.totalTemperaturas / stats.recordsWithTemperaturas).toFixed(1) : '0'} por registro
                    </div>
                  </div>
                </div>

                {/* Estadísticas de Cumplimiento de Rango */}
                {temperaturaRango && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-sm text-green-600 font-medium">Dentro de Rango</div>
                      <div className="text-2xl font-bold text-green-800">{stats.temperaturasDentroRango}</div>
                      <div className="text-xs text-green-600 mt-1">
                        {stats.totalTemperaturas > 0 ? ((stats.temperaturasDentroRango / stats.totalTemperaturas) * 100).toFixed(1) : '0'}% del total
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="text-sm text-red-600 font-medium">Fuera de Rango</div>
                      <div className="text-2xl font-bold text-red-800">{stats.temperaturasFueraRango}</div>
                      <div className="text-xs text-red-600 mt-1">
                        {stats.totalTemperaturas > 0 ? ((stats.temperaturasFueraRango / stats.totalTemperaturas) * 100).toFixed(1) : '0'}% del total
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-600 font-medium">Rango Configurado</div>
                      <div className="text-lg font-bold text-blue-800">
                        {temperaturaRango.min}°C - {temperaturaRango.max}°C
                      </div>
                      <div className="text-xs text-blue-600 mt-1">Límites establecidos</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-600 font-medium">Amplitud de Rango</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {(temperaturaRango.max - temperaturaRango.min).toFixed(1)}°C
                      </div>
                      <div className="text-xs text-purple-600 mt-1">Variación permitida</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filtro de Envases */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Filtrar por Envase
                  </label>
                  <Select value={envaseSeleccionado} onValueChange={setEnvaseSeleccionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar envase..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos"> Todos los Envases</SelectItem>
                      {envasesDisponibles.map((envase) => (
                        <SelectItem key={envase.id} value={envase.tipo}>
                           {envase.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {temperaturaRango && (
                  <div className="flex-1">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-900">
                        🌡️ Rango de Temperatura
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {temperaturaRango.min}°C - {temperaturaRango.max}°C
                      </div>
                      <div className="text-xs text-blue-600">
                        {envaseSeleccionado === 'todos' ? 'Todos los envases' : `Envase: ${envaseSeleccionado}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Gráfica de Temperaturas - Siempre visible */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                 Control de Temperaturas de Producción
              </h2>
              
              
             
              
              {/* Gráfica siempre visible */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    
                    {temperaturaRango && (
                      <span className="ml-3 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        Rango: {temperaturaRango.min}°C - {temperaturaRango.max}°C
                      </span>
                    )}
                  </h3>
                  
                </div>
                
                {/* Preparar datos para la gráfica */}
                {(() => {
                  console.log('🔍 Datos de registros:', records);
                  console.log('🔍 Rango de temperatura:', temperaturaRango);
                  console.log('📊 Total de registros a procesar:', records.length);
                  console.log('📦 Envase seleccionado:', envaseSeleccionado);
                  
                  // Filtrar registros por envase si es necesario
                  let registrosFiltrados = records;
                  if (envaseSeleccionado !== 'todos') {
                    registrosFiltrados = records.filter(record => {
                      const envaseRegistro = record.envase;
                      console.log(`🔍 Comparando envase registro "${envaseRegistro}" con seleccionado "${envaseSeleccionado}"`);
                      return envaseRegistro === envaseSeleccionado;
                    });
                    console.log(`📊 Registros filtrados por envase ${envaseSeleccionado}:`, registrosFiltrados.length);
                  }
                  
                  // Función mejorada para extraer temperaturas válidas
                  const extractValidTemperatures = (record: any) => {
                    const getTemp = (...fieldNames: string[]) => {
                      for (const fieldName of fieldNames) {
                        const value = record[fieldName];
                        if (value !== null && value !== undefined && value !== '' && value !== 'Pendiente') {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue) && numValue >= -50 && numValue <= 150) {
                            return numValue;
                          }
                        }
                      }
                      return null;
                    };
                    
                    const temps = {
                      AM1: getTemp('tempam1', 'tempAM1'),
                      AM2: getTemp('tempam2', 'tempAM2'),
                      PM1: getTemp('temppm1', 'tempPM1'),
                      PM2: getTemp('temppm2', 'tempPM2')
                    };
                    
                    return temps;
                  };
                  
                  // Crear array con todas las temperaturas de todos los registros
                  const allTemperatures: Array<{x: string, y: number, tipo: string, registro: string, lote: string, temp: number}> = [];
                  
                  console.log(`📊 Procesando ${registrosFiltrados.length} registros para la gráfica`);
                  
                  registrosFiltrados.forEach((record: any, recordIndex: number) => {
                    console.log(`🔍 Registro ${recordIndex}:`, {
                      id: record.id,
                      fechaproduccion: record.fechaproduccion,
                      lote: record.lote,
                      tempam1: record.tempam1,
                      tempam2: record.tempam2,
                      temppm1: record.temppm1,
                      temppm2: record.temppm2
                    });
                    
                    const temps = extractValidTemperatures(record);
                    const fecha = record.fechaproduccion ? new Date(record.fechaproduccion).toLocaleDateString() : `Registro ${recordIndex + 1}`;
                    const lote = record.lote || `Lote ${recordIndex + 1}`;
                    
                    console.log(`🎯 Temperaturas válidas para ${lote}:`, temps);
                    
                    // Agregar cada temperatura válida como un punto en la gráfica
                    Object.entries(temps).forEach(([tipo, temp]) => {
                      if (temp !== null && !isNaN(temp)) {
                        allTemperatures.push({
                          x: `${fecha} - ${lote}`,
                          y: temp,
                          tipo: tipo,
                          registro: fecha,
                          lote: lote,
                          temp: temp
                        });
                        console.log(`✅ Agregado punto: ${tipo} = ${temp}°C para ${lote}`);
                      }
                    });
                  });

                  console.log(`📈 Total de puntos para la gráfica: ${allTemperatures.length}`);
                  console.log('📊 Datos para graficar:', allTemperatures);
                  
                  
                  // Renderizado de la gráfica
                  console.log('🔄 Iniciando renderizado de la gráfica de temperaturas');
                  console.log('📊 Estado actual:', {
                    isLoading,
                    records: records.length,
                    envaseSeleccionado,
                    temperaturaRango,
                    allTemperatures: allTemperatures.length
                  });

                  // Verificar si hay datos de temperatura para mostrar (después de agregar ejemplos si es necesario)
                  const tieneDatosReales = allTemperatures.length > 0;
                  const tieneRangoConfigurado = temperaturaRango !== null;

                  console.log('🔍 DIAGNÓSTICO FINAL:');
                  console.log('  - allTemperatures.length:', allTemperatures.length);
                  console.log('  - tieneDatosReales:', tieneDatosReales);
                  console.log('  - tieneRangoConfigurado:', tieneRangoConfigurado);
                  
                  if (tieneDatosReales) {
                    console.log('✅ Mostrando gráfica con', allTemperatures.length, 'puntos de datos reales');
                    console.log('🌡️ Ejemplo de punto:', allTemperatures[0]);
                  } else {
                    console.log('⚠️ No hay datos de temperatura para mostrar');
                  }

                  // Siempre mostrar la gráfica, con o sin datos
                  if (allTemperatures.length === 0) {
                    return (
                      <div className="space-y-6">
                       
                        
                        {/* Gráfica vacía con líneas de rango si están configuradas */}
                        <div className="h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[]} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                              <XAxis 
                                dataKey="x" 
                                tick={{ fontSize: 10 }}
                              />
                              <YAxis 
                                label={{ value: 'Temperatura (°C)', angle: -90, position: 'insideLeft' }}
                                domain={temperaturaRango 
                                  ? [temperaturaRango.min - 5, temperaturaRango.max + 5]
                                  : [20, 30]
                                }
                              />
                              <Tooltip />
                              <Legend />
                              
                              {/* Líneas de rango - Mostrar siempre si hay rango configurado */}
                              {temperaturaRango && (
                                <>
                                  <ReferenceLine 
                                    y={temperaturaRango.min} 
                                    stroke="#ef4444" 
                                    strokeDasharray="5 5" 
                                    strokeWidth={2}
                                    label={{ value: `Mínimo: ${temperaturaRango.min}°C`, position: "left" }}
                                  />
                                  <ReferenceLine 
                                    y={temperaturaRango.max} 
                                    stroke="#f59e0b" 
                                    strokeDasharray="5 5" 
                                    strokeWidth={2}
                                    label={{ value: `Máximo: ${temperaturaRango.max}°C`, position: "left" }}
                                  />
                                  <ReferenceArea 
                                    y1={temperaturaRango.min} 
                                    y2={temperaturaRango.max}
                                    stroke="none"
                                    fill="#10b981" 
                                    fillOpacity={0.1}
                                  />
                                </>
                              )}
                              
                              {/* Línea de ejemplo cuando no hay datos */}
                              <Line 
                                type="monotone" 
                                dataKey="y" 
                                stroke="#94a3b8"
                                strokeWidth={2}
                                dot={{ fill: "#94a3b8", strokeWidth: 2, r: 4 }}
                                name="Sin datos de temperatura"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  }

                  // Usar datos reales si existen, si no usar array vacío para mostrar solo las líneas de rango
                  const datosParaGrafica = tieneDatosReales ? allTemperatures : [];

                  return (
                    <div className="space-y-6">
                      {/* Tabla de datos de temperatura validados por envase */}
                      <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-blue-800">
                            🌡️ Validación de Temperaturas - {envaseSeleccionado === 'todos' ? 'Todos los Envases' : envaseSeleccionado}
                          </CardTitle>
                          <CardDescription className="text-xs text-blue-600">
                            {temperaturaRango 
                              ? `Rango configurado: ${temperaturaRango.min}°C - ${temperaturaRango.max}°C`
                              : 'Sin rango de temperatura configurado para este producto'
                            }
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {temperaturaRango ? (
                            <>
                              {/* Cuadro destacado de temperatura validada por envase */}
                              <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">🎯 Temperatura Validada por Envase</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {(() => {
                                    // Agrupar temperaturas por envase
                                    const temperaturasPorEnvase: Record<string, number[]> = {};
                                    
                                    registrosFiltrados.forEach(record => {
                                      const envase = record.envase || 'Sin especificar';
                                      if (!temperaturasPorEnvase[envase]) {
                                        temperaturasPorEnvase[envase] = [];
                                      }
                                      
                                      // Extraer todas las temperaturas válidas del registro
                                      const temps = [
                                        record.tempam1 || record.tempAM1,
                                        record.tempam2 || record.tempAM2,
                                        record.temppm1 || record.tempPM1,
                                        record.temppm2 || record.tempPM2
                                      ].filter(t => t !== null && t !== undefined && t !== '' && t !== 'Pendiente')
                                       .map(t => parseFloat(t))
                                       .filter(t => !isNaN(t) && t > 0);
                                      
                                      temperaturasPorEnvase[envase].push(...temps);
                                    });
                                    
                                    return Object.entries(temperaturasPorEnvase).map(([envase, temps]) => {
                                      const validacion = calcularTemperaturaValidada(envase, temps);
                                      
                                      return (
                                        <div key={envase} className={`
                                          p-4 rounded-lg border-2 transition-all
                                          ${validacion.estado === 'validado' 
                                            ? 'bg-green-50 border-green-300 shadow-green-100' 
                                            : validacion.estado === 'fuera_rango'
                                            ? 'bg-red-50 border-red-300 shadow-red-100'
                                            : 'bg-gray-50 border-gray-300'
                                          }
                                        `}>
                                          <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-semibold text-sm text-gray-800">📦 {envase}</h5>
                                            {validacion.estado === 'validado' && (
                                              <span className="text-green-600 text-xs font-medium">✅ Validado</span>
                                            )}
                                            {validacion.estado === 'fuera_rango' && (
                                              <span className="text-red-600 text-xs font-medium">⚠️ Fuera de Rango</span>
                                            )}
                                          </div>
                                          
                                          {validacion.temperatura !== null ? (
                                            <div className="text-center">
                                              <div className={`
                                                text-3xl font-bold mb-1
                                                ${validacion.estado === 'validado' ? 'text-green-700' : 'text-red-700'}
                                              `}>
                                                {validacion.temperatura}°C
                                              </div>
                                              <div className="text-xs text-gray-600">
                                                {validacion.mensaje}
                                              </div>
                                              
                                              {validacion.detalles && (
                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                  <div className="text-xs text-gray-500">
                                                    <div>📊 {validacion.detalles.medicionesValidas}/{validacion.detalles.totalMediciones} mediciones válidas</div>
                                                    <div>📈 {validacion.detalles.porcentajeValidas}% dentro de rango</div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="text-center text-gray-500 py-2">
                                              <div className="text-lg mb-1">📊</div>
                                              <div className="text-xs">{validacion.mensaje}</div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                              
                              {/* Resumen de temperaturas por tipo */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {['tempam1', 'tempam2', 'temppm1', 'temppm2'].map((tipo, index) => {
                                  const temps = allTemperatures.filter(t => t.tipo === tipo);
                                  const validas = temps.filter(t => 
                                    t.temp >= temperaturaRango.min && t.temp <= temperaturaRango.max
                                  );
                                  const invalidas = temps.length - validas.length;
                                  
                                  return (
                                    <div key={tipo} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <div className="text-xs font-medium text-gray-600 mb-1">
                                        {tipo === 'tempam1' ? 'Temp AM 1' :
                                         tipo === 'tempam2' ? 'Temp AM 2' :
                                         tipo === 'temppm1' ? 'Temp PM 1' : 'Temp PM 2'}
                                      </div>
                                      <div className="text-lg font-bold text-gray-900">
                                        {temps.length > 0 ? Math.round(temps.reduce((sum, t) => sum + t.temp, 0) / temps.length) : '-'}°C
                                      </div>
                                      <div className="flex justify-between text-xs mt-2">
                                        <span className="text-green-600">✅ {validas.length}</span>
                                        {invalidas > 0 && (
                                          <span className="text-red-600">⚠️ {invalidas}</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* Tabla detallada de temperaturas */}
                              {allTemperatures.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Registro Detallado</h4>
                                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                                    <table className="w-full text-xs">
                                      <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                          <th className="px-2 py-1 text-left">Lote</th>
                                          <th className="px-2 py-1 text-left">Tipo</th>
                                          <th className="px-2 py-1 text-left">Temperatura</th>
                                          <th className="px-2 py-1 text-left">Estado</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {allTemperatures.map((temp, index) => (
                                          <tr key={index} className="border-t border-gray-100">
                                            <td className="px-2 py-1">{temp.lote}</td>
                                            <td className="px-2 py-1">
                                              {temp.tipo === 'tempam1' ? 'AM 1' :
                                               temp.tipo === 'tempam2' ? 'AM 2' :
                                               temp.tipo === 'temppm1' ? 'PM 1' : 'PM 2'}
                                            </td>
                                            <td className={`px-2 py-1 font-medium ${
                                              temp.temp >= temperaturaRango.min && temp.temp <= temperaturaRango.max
                                                ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                              {temp.temp}°C
                                            </td>
                                            <td className="px-2 py-1">
                                              {temp.temp >= temperaturaRango.min && temp.temp <= temperaturaRango.max ? (
                                                <span className="text-green-600">✅ OK</span>
                                              ) : (
                                                <span className="text-red-600">⚠️ Fuera</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-gray-500">
                                <svg className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-sm">Este producto no tiene configuración de rango de temperatura</p>
                                <p className="text-xs text-gray-400 mt-1">Solo las salsas tienen rangos de temperatura configurados</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Gráfica de temperaturas */}
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={datosParaGrafica} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis 
                              dataKey="x" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis 
                              label={{ value: 'Temperatura (°C)', angle: -90, position: 'insideLeft' }}
                              domain={allTemperatures.length > 0 
                                ? ['dataMin - 2', 'dataMax + 2'] 
                                : temperaturaRango 
                                  ? [temperaturaRango.min - 5, temperaturaRango.max + 5]
                                  : [20, 30]
                              }
                            />
                
                              
              
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                                      <p className="font-semibold text-sm">{data.registro}</p>
                                      <p className="text-xs text-gray-600">{data.lote}</p>
                                      <p className="text-sm mt-1">
                                        <span className="font-medium">{data.tipo}:</span>{' '}
                                        <span className={`font-bold ${
                                          temperaturaRango && (data.temp < temperaturaRango.min || data.temp > temperaturaRango.max)
                                            ? 'text-red-600' 
                                            : 'text-green-600'
                                        }`}>
                                          {data.temp}°C
                                        </span>
                                      </p>
                                      {temperaturaRango && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                          <p className="text-xs">
                                            Rango: {temperaturaRango.min}°C - {temperaturaRango.max}°C
                                          </p>
                                          <p className={`text-xs font-medium ${
                                            data.temp >= temperaturaRango.min && data.temp <= temperaturaRango.max
                                              ? 'text-green-600' 
                                              : 'text-red-600'
                                          }`}>
                                            {data.temp >= temperaturaRango.min && data.temp <= temperaturaRango.max ? '✅ DENTRO DE RANGO' : '⚠️ FUERA DE RANGO'}
                                          </p>
                                        </div>
                                      )}
                                      {allTemperatures.length === 0 && (
                                        <p className="text-xs mt-1 text-gray-500 italic">
                                          *Dato de ejemplo
                                        </p>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend />
                            
                            {/* Líneas de rango de temperatura - Siempre mostrar cuando hay rango configurado */}
                            {console.log('🔍 Renderizando líneas de referencia - temperaturaRango:', temperaturaRango)}
                            {console.log('🔍 allTemperatures.length:', allTemperatures.length)}
                            {console.log('🔍 productId:', productId)}
                            {console.log('🔍 envaseSeleccionado:', envaseSeleccionado)}
                            
                            {/* Mostrar líneas SIEMPRE que hay rango configurado, independientemente de si hay datos */}
                            {temperaturaRango && (
                              <>
                                {console.log('✅ Dibujando línea de mínimo:', temperaturaRango.min)}
                                <ReferenceLine 
                                  y={temperaturaRango.min} 
                                  stroke="#ef4444" 
                                  strokeDasharray="5 5" 
                                  strokeWidth={2}
                                  label={{ value: `Mínimo: ${temperaturaRango.min}°C`, position: "left" }}
                                />
                                {console.log('✅ Dibujando línea de máximo:', temperaturaRango.max)}
                                <ReferenceLine 
                                  y={temperaturaRango.max} 
                                  stroke="#f59e0b" 
                                  strokeDasharray="5 5" 
                                  strokeWidth={2}
                                  label={{ value: `Máximo: ${temperaturaRango.max}°C`, position: "left" }}
                                />
                                {/* Área sombreada entre rango */}
                                {console.log('✅ Dibujando área sombreada entre:', temperaturaRango.min, 'y', temperaturaRango.max)}
                                <ReferenceArea 
                                  y1={temperaturaRango.min} 
                                  y2={temperaturaRango.max}
                                  stroke="none"
                                  fill="#10b981" 
                                  fillOpacity={0.1}
                                />
                              </>
                            )}
                            
                            {/* Si no hay rango pero hay datos, mostrar líneas de ejemplo para debug */}
                            {!temperaturaRango && allTemperatures.length > 0 && (
                              <>
                                <ReferenceLine 
                                  y={25} 
                                  stroke="#6b7280" 
                                  strokeDasharray="3 3" 
                                  strokeWidth={1}
                                  label={{ value: `Ejemplo: 25°C`, position: "left" }}
                                />
                                <ReferenceLine 
                                  y={30} 
                                  stroke="#6b7280" 
                                  strokeDasharray="3 3" 
                                  strokeWidth={1}
                                  label={{ value: `Ejemplo: 30°C`, position: "left" }}
                                />
                              </>
                            )}
                            
                            {/* Líneas de temperaturas con colores diferenciados por tipo */}
                            {allTemperatures.length > 0 ? (
                              <>
                                <Line 
                                  type="monotone" 
                                  dataKey="y" 
                                  stroke="#3b82f6"
                                  strokeWidth={2}
                                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6 }}
                                  name="Temperatura Individual"
                                />
                              </>
                            ) : (
                              <Line 
                                type="monotone" 
                                dataKey="y" 
                                stroke="#94a3b8"
                                strokeWidth={2}
                                dot={{ fill: "#94a3b8", strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Temperatura (Ejemplo)"
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Gráfica adicional: Agrupada por tipo de medición */}
                      {allTemperatures.length > 0 && (
                        <div className="mt-8">
                          <h4 className="font-semibold text-gray-700 mb-4">📈 Tendencias por Tipo de Medición</h4>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={(() => {
                                // Agrupar datos por tipo de medición
                                const groupedData: any = {};
                                records.forEach((record, index) => {
                                  const key = `Registro ${index + 1}`;
                                  groupedData[key] = {
                                    name: key,
                                    fecha: record.fechaproduccion ? new Date(record.fechaproduccion).toLocaleDateString() : `R${index + 1}`,
                                    lote: record.lote || `L${index + 1}`
                                  };
                                  
                                  if (record.tempam1) groupedData[key].AM1 = parseFloat(record.tempam1);
                                  if (record.tempam2) groupedData[key].AM2 = parseFloat(record.tempam2);
                                  if (record.temppm1) groupedData[key].PM1 = parseFloat(record.temppm1);
                                  if (record.temppm2) groupedData[key].PM2 = parseFloat(record.temppm2);
                                });
                                return Object.values(groupedData);
                              })()} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis 
                                  dataKey="name" 
                                  angle={-45}
                                  textAnchor="end"
                                  height={100}
                                  tick={{ fontSize: 10 }}
                                />
                                <YAxis 
                                  label={{ value: 'Temperatura (°C)', angle: -90, position: 'insideLeft' }}
                                  domain={['dataMin - 2', 'dataMax + 2']}
                                />
                                <Tooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      return (
                                        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                                          <p className="font-semibold text-sm">{payload[0].payload.fecha}</p>
                                          <p className="text-xs text-gray-600">{payload[0].payload.lote}</p>
                                          {payload.map((entry: any, index: number) => (
                                            <p key={index} className="text-sm mt-1">
                                              <span className="font-medium" style={{ color: entry.color }}>{entry.name}:</span>{' '}
                                              <span className="font-bold">{entry.value}°C</span>
                                            </p>
                                          ))}
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Legend />
                                
                                {/* Líneas de rango */}
                                {temperaturaRango && (
                                  <>
                                    <ReferenceLine 
                                      y={temperaturaRango.min} 
                                      stroke="#ef4444" 
                                      strokeDasharray="5 5" 
                                      strokeWidth={2}
                                      label={{ value: "Mínimo", position: "left" }}
                                    />
                                    <ReferenceLine 
                                      y={temperaturaRango.max} 
                                      stroke="#f59e0b" 
                                      strokeDasharray="5 5" 
                                      strokeWidth={2}
                                      label={{ value: "Máximo", position: "left" }}
                                    />
                                  </>
                                )}
                                
                                <Line type="monotone" dataKey="AM1" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="AM2" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="PM1" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="PM2" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* Estadísticas Mejoradas - Siempre visibles */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={`${allTemperatures.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} p-4 rounded-lg border`}>
                          <div className={`text-2xl font-bold ${allTemperatures.length > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                            {allTemperatures.length}
                          </div>
                          <div className="text-sm text-gray-600">Total Mediciones</div>
                          {allTemperatures.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {registrosFiltrados.length > 0 ? (allTemperatures.length / registrosFiltrados.length).toFixed(1) : '0'} por registro
                            </div>
                          )}
                        </div>
                        <div className={`${allTemperatures.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} p-4 rounded-lg border`}>
                          <div className={`text-2xl font-bold ${allTemperatures.length > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {temperaturaRango ? 
                              allTemperatures.filter(t => t.temp >= temperaturaRango.min && t.temp <= temperaturaRango.max).length : 
                              allTemperatures.length > 0 ? 'N/A' : '0'
                            }
                          </div>
                          <div className="text-sm text-gray-600">Dentro de Rango</div>
                          {temperaturaRango && allTemperatures.length > 0 && (
                            <div className="text-xs text-green-600 mt-1">
                              {((allTemperatures.filter(t => t.temp >= temperaturaRango.min && t.temp <= temperaturaRango.max).length / allTemperatures.length) * 100).toFixed(1)}% del total
                            </div>
                          )}
                        </div>
                        <div className={`${allTemperatures.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} p-4 rounded-lg border`}>
                          <div className={`text-2xl font-bold ${allTemperatures.length > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {temperaturaRango ? 
                              allTemperatures.filter(t => t.temp < temperaturaRango.min || t.temp > temperaturaRango.max).length : 
                              allTemperatures.length > 0 ? 'N/A' : '0'
                            }
                          </div>
                          <div className="text-sm text-gray-600">Fuera de Rango</div>
                          {temperaturaRango && allTemperatures.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {((allTemperatures.filter(t => t.temp < temperaturaRango.min || t.temp > temperaturaRango.max).length / allTemperatures.length) * 100).toFixed(1)}% del total
                            </div>
                          )}
                        </div>
                        <div className={`${allTemperatures.length > 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'} p-4 rounded-lg border`}>
                          <div className={`text-2xl font-bold ${allTemperatures.length > 0 ? 'text-purple-600' : 'text-gray-600'}`}>
                            {allTemperatures.length > 0 ? 
                              (allTemperatures.reduce((sum, t) => sum + t.temp, 0) / allTemperatures.length).toFixed(1) : 
                              temperaturaRango ? ((temperaturaRango.min + temperaturaRango.max) / 2).toFixed(1) : '25.0'
                            }°C
                          </div>
                          <div className="text-sm text-gray-600">Temperatura Promedio</div>
                          {allTemperatures.length > 0 && (
                            <div className="text-xs text-purple-600 mt-1">
                              {Math.min(...allTemperatures.map(t => t.temp)).toFixed(1)}°C - {Math.max(...allTemperatures.map(t => t.temp)).toFixed(1)}°C
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tabla de detalles - Siempre visible */}
                      <div className="mt-6">
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                             
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {(() => {
                                // Filtrar registros por envase para la tabla también
                                let registrosParaTabla = records;
                                if (envaseSeleccionado !== 'todos') {
                                  registrosParaTabla = records.filter(record => record.envase === envaseSeleccionado);
                                }
                                
                                if (registrosParaTabla.length === 0) {
                                  return (
                                    <tr>
                                     
                                    </tr>
                                  );
                                }
                                
                                return registrosParaTabla.map((record, index) => {
                                  // Función helper para obtener temperatura (soporta múltiples nombres de campo)
                                  const getTemp = (...fieldNames: string[]) => {
                                    for (const fieldName of fieldNames) {
                                      const value = record[fieldName];
                                      if (value && value !== '' && value !== '0' && value !== 0) {
                                        return parseFloat(value);
                                      }
                                    }
                                    return null;
                                  };
                                  
                                  const temps = [
                                    getTemp('tempam1', 'tempAM1'),
                                    getTemp('tempam2', 'tempAM2'),
                                    getTemp('temppm1', 'tempPM1'),
                                    getTemp('temppm2', 'tempPM2')
                                  ].filter(t => t !== null);
                                  
                                  const allInRange = temps.length > 0 && temps.every(t => 
                                    temperaturaRango && t >= temperaturaRango.min && t <= temperaturaRango.max
                                  );

                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-sm">
                                        {record.fechaproduccion ? new Date(record.fechaproduccion).toLocaleDateString() : 'Sin fecha'}
                                      </td>
                                      <td className="px-4 py-2 text-sm font-medium">{record.lote || `Lote ${index + 1}`}</td>
                                      <td className="px-4 py-2 text-sm text-center">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                          📦 {record.envase || 'No especificado'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-center">
                                        {(() => {
                                          const temp = getTemp('tempam1', 'tempAM1');
                                          return temp ? (
                                            <span className={`font-medium ${
                                              temperaturaRango && (temp < temperaturaRango.min || temp > temperaturaRango.max)
                                                ? 'text-red-600' 
                                                : 'text-green-600'
                                            }`}>
                                              {temp.toFixed(1)}°C
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          );
                                        })()}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-center">
                                        {(() => {
                                          const temp = getTemp('tempam2', 'tempAM2');
                                          return temp ? (
                                            <span className={`font-medium ${
                                              temperaturaRango && (temp < temperaturaRango.min || temp > temperaturaRango.max)
                                                ? 'text-red-600' 
                                                : 'text-green-600'
                                            }`}>
                                              {temp.toFixed(1)}°C
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          );
                                        })()}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-center">
                                        {(() => {
                                          const temp = getTemp('temppm1', 'tempPM1');
                                          return temp ? (
                                            <span className={`font-medium ${
                                              temperaturaRango && (temp < temperaturaRango.min || temp > temperaturaRango.max)
                                                ? 'text-red-600' 
                                                : 'text-green-600'
                                            }`}>
                                              {temp.toFixed(1)}°C
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          );
                                        })()}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-center">
                                        {(() => {
                                          const temp = getTemp('temppm2', 'tempPM2');
                                          return temp ? (
                                            <span className={`font-medium ${
                                              temperaturaRango && (temp < temperaturaRango.min || temp > temperaturaRango.max)
                                                ? 'text-red-600' 
                                                : 'text-green-600'
                                            }`}>
                                              {temp.toFixed(1)}°C
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          );
                                        })()}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        {temps.length > 0 ? (
                                          allInRange ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              ✅ En Rango
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                              ⚠️ Fuera de Rango
                                            </span>
                                          )
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            📊 Sin Datos
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
          </div>

          {/* Espacio para las siguientes gráficas */}
          <div className="text-center py-8">
           
          </div>

          {/* NUEVAS GRÁFICAS DE PESOS */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Análisis de Pesos por Producto
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfica de Pesos Netos */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Pesos Netos por Registro
                  </h3>
                  <div className="text-sm text-gray-600">
                     Evolución del peso neto declarado en cada lote
                  </div>
                </div>
                
                {/* Tarjeta de Validación de Peso Neto */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Validación de Peso Neto</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-xs text-blue-600 font-medium">Peso Neto Actual</div>
                      <div className="text-lg font-bold text-blue-900">
                        {(() => {
                          const pesosNetos = records
                            .filter(record => {
                              const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado;
                              return pesoNeto && pesoNeto !== '0' && pesoNeto !== '';
                            })
                            .map(record => {
                              const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado || 0;
                              return parseFloat(pesoNeto) || 0;
                            });
                          
                          if (pesosNetos.length > 0) {
                            return `${pesosNetos[pesosNetos.length - 1]}g`;
                          }
                          return 'Sin datos';
                        })()}
                      </div>
                      <div className="text-xs text-blue-600">Último registro</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-blue-600 font-medium">Peso Neto Promedio</div>
                      <div className="text-lg font-bold text-blue-900">
                        {(() => {
                          const pesosNetos = records
                            .filter(record => {
                              const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado;
                              return pesoNeto && pesoNeto !== '0' && pesoNeto !== '';
                            })
                            .map(record => {
                              const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado || 0;
                              return parseFloat(pesoNeto) || 0;
                            });
                          
                          if (pesosNetos.length > 0) {
                            const promedio = pesosNetos.reduce((sum, peso) => sum + peso, 0) / pesosNetos.length;
                            return `${promedio.toFixed(1)}g`;
                          }
                          return 'Sin datos';
                        })()}
                      </div>
                      <div className="text-xs text-blue-600">De todos los registros</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-blue-600 font-medium">Total Registros</div>
                      <div className="text-lg font-bold text-blue-900">
                        {(() => {
                          const pesosNetos = records
                            .filter(record => {
                              const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado;
                              return pesoNeto && pesoNeto !== '0' && pesoNeto !== '';
                            });
                          
                          return pesosNetos.length;
                        })()}
                      </div>
                      <div className="text-xs text-blue-600">Con datos válidos</div>
                    </div>
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={(() => {
                        // Debug: Verificar estructura de los registros
                        console.log('🔍 Estructura de registros:', records);
                        console.log('🔍 Campos disponibles en primer registro:', records?.[0] ? Object.keys(records[0] ?? {}) : 'No hay registros');
                        
                        const pesosNetosData = records
                          .filter(record => {
                            // Verificar diferentes nombres de campos posibles
                            const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado;
                            return pesoNeto && pesoNeto !== '0' && pesoNeto !== '';
                          })
                          .map((record, index) => {
                            const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado || 0;
                            return {
                              x: `Lote ${record.lote}`,
                              y: parseFloat(pesoNeto) || 0,
                              lote: record.lote,
                              fecha: record.fechaproduccion,
                              registro: index + 1
                            };
                          });
                        
                        console.log(' Datos para gráfica de pesos netos:', pesosNetosData);
                        return pesosNetosData;
                      })()} 
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="x" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Peso Neto (g)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="font-semibold text-gray-800">{label}</p>
                                <p className="text-blue-600 font-medium">
                                  Peso Neto: {data.y}g
                                </p>
                                <p className="text-sm text-gray-600">
                                  Lote: {data.payload.lote}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Fecha: {data.payload.fecha}
                                </p>
                                {/* Validaciones de pesos netos */}
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Validaciones:</p>
                                  {(() => {
                                    const pesosNetos = records
                                      .filter(record => {
                                        const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado;
                                        return pesoNeto && pesoNeto !== '0' && pesoNeto !== '';
                                      })
                                      .map(record => {
                                        const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado || 0;
                                        return parseFloat(pesoNeto) || 0;
                                      });
                                    
                                    if (pesosNetos.length > 0) {
                                      const promedio = pesosNetos.reduce((sum, peso) => sum + peso, 0) / pesosNetos.length;
                                      const minimo = Math.min(...pesosNetos);
                                      const maximo = Math.max(...pesosNetos);
                                      
                                      return (
                                        <div className="space-y-1">
                                          <p className="text-xs text-green-600">✓ Promedio: {promedio.toFixed(1)}g</p>
                                          <p className="text-xs text-blue-600">✓ Mínimo: {minimo}g</p>
                                          <p className="text-xs text-purple-600">✓ Máximo: {maximo}g</p>
                                        </div>
                                      );
                                    }
                                    return <p className="text-xs text-gray-500">Sin datos para validar</p>;
                                  })()}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }} 
                        name="Peso Neto (g)"
                      />
                      {(() => {
                        const pesosNetos = records
                          .filter(record => {
                            const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado;
                            return pesoNeto && pesoNeto !== '0' && pesoNeto !== '';
                          })
                          .map(record => {
                            const pesoNeto = record.peso_neto_declarado || record.pesoNeto || record.peso_neto || record.pesoNetoDeclarado || 0;
                            return parseFloat(pesoNeto) || 0;
                          });
                        
                        if (pesosNetos.length > 0) {
                          const promedioPesoNeto = pesosNetos.reduce((sum, peso) => sum + peso, 0) / pesosNetos.length;
                          return (
                            <ReferenceLine 
                              y={promedioPesoNeto} 
                              stroke="#ef4444" 
                              strokeDasharray="5 5" 
                              strokeWidth={2}
                              label={{ value: `Promedio: ${promedioPesoNeto.toFixed(1)}g`, position: 'insideTopLeft' }}
                            />
                          );
                        }
                        return null;
                      })()}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfica de Pesos Drenados */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Pesos Drenados por Registro
                  </h3>
                  <div className="text-sm text-gray-600">
                     Evolución del peso drenado declarado en cada lote
                  </div>
                </div>
                
                {/* Tarjeta de Validación de Peso Drenado */}
                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">Validación de Peso Drenado</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-xs text-green-600 font-medium">Peso Drenado Actual</div>
                      <div className="text-lg font-bold text-green-900">
                        {(() => {
                          const pesosDrenados = records
                            .filter(record => {
                              const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado;
                              return pesoDrenado && pesoDrenado !== '0' && pesoDrenado !== '';
                            })
                            .map(record => {
                              const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado || 0;
                              return parseFloat(pesoDrenado) || 0;
                            });
                          
                          if (pesosDrenados.length > 0) {
                            return `${pesosDrenados[pesosDrenados.length - 1]}g`;
                          }
                          return 'Sin datos';
                        })()}
                      </div>
                      <div className="text-xs text-green-600">Último registro</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-green-600 font-medium">Peso Mínimo</div>
                      <div className="text-lg font-bold text-green-900">
                        {(() => {
                          const pesosDrenados = records
                            .filter(record => {
                              const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado;
                              return pesoDrenado && pesoDrenado !== '0' && pesoDrenado !== '';
                            })
                            .map(record => {
                              const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado || 0;
                              return parseFloat(pesoDrenado) || 0;
                            });
                          
                          if (pesosDrenados.length > 0) {
                            const minimo = Math.min(...pesosDrenados);
                            return `${minimo}g`;
                          }
                          return 'Sin datos';
                        })()}
                      </div>
                      <div className="text-xs text-green-600">Registro más bajo</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-green-600 font-medium">Peso Máximo</div>
                      <div className="text-lg font-bold text-green-900">
                        {(() => {
                          const pesosDrenados = records
                            .filter(record => {
                              const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado;
                              return pesoDrenado && pesoDrenado !== '0' && pesoDrenado !== '';
                            })
                            .map(record => {
                              const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado || 0;
                              return parseFloat(pesoDrenado) || 0;
                            });
                          
                          if (pesosDrenados.length > 0) {
                            const maximo = Math.max(...pesosDrenados);
                            return `${maximo}g`;
                          }
                          return 'Sin datos';
                        })()}
                      </div>
                      <div className="text-xs text-green-600">Registro más alto</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-green-600 font-medium">Total Registros</div>
                      <div className="text-lg font-bold text-green-900">
                        {(() => {
                          const pesosDrenados = records
                            .filter(record => {
                              const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado;
                              return pesoDrenado && pesoDrenado !== '0' && pesoDrenado !== '';
                            });
                          
                          return pesosDrenados.length;
                        })()}
                      </div>
                      <div className="text-xs text-green-600">Con datos válidos</div>
                    </div>
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={(() => {
                        // Debug: Verificar estructura de los registros
                        console.log('🥫 Estructura de registros para pesos drenados:', records);
                        
                        const pesosDrenadosData = records
                          .filter(record => {
                            // Verificar diferentes nombres de campos posibles
                            const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado;
                            return pesoDrenado && pesoDrenado !== '0' && pesoDrenado !== '';
                          })
                          .map((record, index) => {
                            const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado || 0;
                            return {
                              x: `Lote ${record.lote}`,
                              y: parseFloat(pesoDrenado) || 0,
                              lote: record.lote,
                              fecha: record.fechaproduccion,
                              registro: index + 1
                            };
                          });
                        
                        console.log('🥫 Datos para gráfica de pesos drenados:', pesosDrenadosData);
                        return pesosDrenadosData;
                      })()} 
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="x" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Peso Drenado (g)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="font-semibold text-gray-800">{label}</p>
                                <p className="text-green-600 font-medium">
                                  Peso Drenado: {data.y}g
                                </p>
                                <p className="text-sm text-gray-600">
                                  Lote: {data.payload.lote}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Fecha: {data.payload.fecha}
                                </p>
                                {/* Validaciones de pesos drenados */}
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Validaciones:</p>
                                  {(() => {
                                    const pesosDrenados = records
                                      .filter(record => {
                                        const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado;
                                        return pesoDrenado && pesoDrenado !== '0' && pesoDrenado !== '';
                                      })
                                      .map(record => {
                                        const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado || 0;
                                        return parseFloat(pesoDrenado) || 0;
                                      });
                                    
                                    if (pesosDrenados.length > 0) {
                                      const promedio = pesosDrenados.reduce((sum, peso) => sum + peso, 0) / pesosDrenados.length;
                                      const minimo = Math.min(...pesosDrenados);
                                      const maximo = Math.max(...pesosDrenados);
                                      
                                      return (
                                        <div className="space-y-1">
                                          <p className="text-xs text-green-600">✓ Promedio: {promedio.toFixed(1)}g</p>
                                          <p className="text-xs text-blue-600">✓ Mínimo: {minimo}g</p>
                                          <p className="text-xs text-purple-600">✓ Máximo: {maximo}g</p>
                                        </div>
                                      );
                                    }
                                    return <p className="text-xs text-gray-500">Sin datos para validar</p>;
                                  })()}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }} 
                        name="Peso Drenado (g)"
                      />
                      {(() => {
                        const pesosDrenados = records
                          .filter(record => {
                            const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado;
                            return pesoDrenado && pesoDrenado !== '0' && pesoDrenado !== '';
                          })
                          .map(record => {
                            const pesoDrenado = record.peso_drenado_declarado || record.pesoDrenado || record.peso_drenado || record.pesoDrenadoDeclarado || 0;
                            return parseFloat(pesoDrenado) || 0;
                          });
                        
                        if (pesosDrenados.length > 0) {
                          const promedioPesoDrenado = pesosDrenados.reduce((sum, peso) => sum + peso, 0) / pesosDrenados.length;
                          return (
                            <ReferenceLine 
                              y={promedioPesoDrenado} 
                              stroke="#ef4444" 
                              strokeDasharray="5 5" 
                              strokeWidth={2}
                              label={{ value: `Promedio: ${promedioPesoDrenado.toFixed(1)}g`, position: 'insideTopLeft' }}
                            />
                          );
                        }
                        return null;
                      })()}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
