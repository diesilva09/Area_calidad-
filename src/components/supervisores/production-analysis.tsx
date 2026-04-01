"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { productionRecordsService, productService } from '@/lib/supervisores-data';
import { TemperaturaEnvasadoService } from '@/lib/temperatura-envasado-service';
import { EnvasesService } from '@/lib/envases-config';

interface ProductionAnalysisProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productId: string;
}

export function ProductionAnalysis({ isOpen, onOpenChange, productId }: ProductionAnalysisProps) {
  const debug = (..._args: any[]) => {};
  const debugError = (..._args: any[]) => {};

  const console = {
    log: (..._args: any[]) => {},
    error: (..._args: any[]) => {},
  } as const;

  debug('🔄🔄 ProductionAnalysis renderizado - productId:', productId, 'isOpen:', isOpen);
  debug('📦📦 Archivo production-analysis.tsx cargado - versión actual');
  
  const [records, setRecords] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [temperaturaRango, setTemperaturaRango] = React.useState<{min: number, max: number} | null>(null);
  const [envaseSeleccionado, setEnvaseSeleccionado] = React.useState<string>('sin_seleccionar');
  const [envasesDisponibles, setEnvasesDisponibles] = React.useState<any[]>([]);
  const [isLoadingEnvases, setIsLoadingEnvases] = React.useState(false);
  const [vacioMinThreshold, setVacioMinThreshold] = React.useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');

  const availableMonths = React.useMemo(() => {
    const now = new Date();
    const startYear = 2024;
    const startMonth = 0; // January
    const months: string[] = [];
    for (let y = now.getFullYear(); y >= startYear; y--) {
      const endMonth = y === now.getFullYear() ? now.getMonth() + 1 : 12;
      const startM = y === startYear ? startMonth : 1;
      for (let m = endMonth; m >= startM; m--) {
        months.push(`${y}-${String(m).padStart(2, '0')}`);
      }
    }
    return months;
  }, []);

  const monthFilteredRecords = React.useMemo(() => {
    if (selectedMonth === 'all') return records;
    return records.filter(r => String(r?.fechaproduccion ?? '').slice(0, 7) === selectedMonth);
  }, [records, selectedMonth]);

  debug('🔍🔍 Estados inicializados - records.length:', records.length);
  
  React.useEffect(() => {
    debug('🔍 useEffect principal - isOpen:', isOpen, 'productId:', productId);
    if (isOpen && productId) {
      debug('✅ Condiciones cumplidas, llamando a loadRecords...');
      loadRecords();
      loadEnvases();
      loadVacioConfig();
    } else {
      debug('❌ Condiciones no cumplidas - isOpen:', isOpen, 'productId:', productId);
    }
  }, [isOpen, productId]);

  React.useEffect(() => {
    if (envaseSeleccionado && envaseSeleccionado !== 'sin_seleccionar' && productId && isOpen) {
      loadTemperaturaRango();
    } else if (envaseSeleccionado === 'sin_seleccionar') {
      setTemperaturaRango(null);
    }
  }, [envaseSeleccionado, productId, isOpen]);

  // Cleanup ya no es necesario ya que no usamos timeouts

  const loadRecords = async () => {
    debug('🚀 loadRecords llamado - productId:', productId, 'isOpen:', isOpen);
    setIsLoading(true);
    try {
      debug('🔄 Cargando registros para productId:', productId);
      // Temporalmente usar getByProduct hasta que se solucione el problema de la API
      const data = await productionRecordsService.getByProduct(productId);
      debug('📥 Datos recibidos del servicio:', data);
      debug('📊 Número de registros:', data?.length || 0);
      
      if (data && data.length > 0) {
        debug('🔍 Primer registro completo:', data[0]);
        debug('🌡️ Campos de temperatura del primer registro:', {
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
          
          debug(`🌡️ Registro ${index}: tiene ${temps.length} temperaturas válidas`);
          if (temps.length > 0) {
            debug(`  📊 Temperaturas: ${temps.join(', ')}`);
          }
        });
        debug(`📈 Total de registros con temperaturas válidas: ${tempsValidas}/${data.length}`);
        debug(`🌡️ Total de temperaturas encontradas: ${totalTempsEncontradas}`);
        
        debug('🔍 Estructura completa del primer registro para depuración');
        debug('🔍 Estructura completa del primer registro:');
        const firstRecord: any = Array.isArray(data) ? data[0] : null;
        Object.keys(firstRecord ?? {}).forEach(key => {
          debug(`  ${key}: ${firstRecord?.[key]} (${typeof firstRecord?.[key]})`);
        });
      } else {
        debug('❌ No se recibieron datos o el array está vacío');
      }
      
      // Solo actualizar estado si el componente sigue abierto
      if (isOpen) {
        setRecords(data || []);
        setIsLoading(false);
      }
    } catch (error) {
      debugError('❌ Error al cargar registros:', error);
      if (isOpen) {
        setIsLoading(false);
      }
    }
  };

  const loadEnvases = async () => {
    setIsLoadingEnvases(true);
    try {
      debug('📦 Cargando envases configurados para temperaturas del producto:', productId);
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
        debug('✅ Envases de temperatura cargados:', envasesFormateados.length, 'envases');
        debug('📦 Lista de envases de temperatura:', envasesFormateados);
      }
    } catch (error) {
      debugError('❌ Error al cargar envases de temperatura:', error);
      if (isOpen) {
        setEnvasesDisponibles([]);
      }
    } finally {
      if (isOpen) {
        setIsLoadingEnvases(false);
      }
    }
  };

  const loadVacioConfig = async () => {
    try {
      const product = await productService.getById(productId);
      const configs = product?.calidad_rangos_config;
      if (configs && configs.length > 0) {
        const cfg = configs[0];
        const rawVacios = cfg?.vacios;
        if (rawVacios) {
          const matches = String(rawVacios).match(/\d+(?:[.,]\d+)?/g);
          if (matches && matches.length > 0) {
            const num = parseFloat(String(matches[0]).replace(',', '.'));
            if (Number.isFinite(num)) {
              if (isOpen) setVacioMinThreshold(num);
              return;
            }
          }
        }
      }
      if (isOpen) setVacioMinThreshold(null);
    } catch {
      if (isOpen) setVacioMinThreshold(null);
    }
  };

  // Función para determinar si un producto tiene rango de temperatura usando la API real
  const determinarSiProductoTieneRango = async (productoId: string) => {
    try {
      debug(`📋 Verificando si producto ${productoId} tiene configuración de temperatura via API`);
      
      // Usar el servicio real para verificar si el producto está configurado
      const tieneConfiguracion = await TemperaturaEnvasadoService.productoConfigurado(productoId);
      
      const productoInfo = {
        categoria: tieneConfiguracion ? 'salsa' : 'desconocido',
        tieneRango: tieneConfiguracion,
        nombre: `Producto ${productoId}`
      };
      
      debug(`📋 Producto ${productoId} clasificado como:`, productoInfo);
      debug(`🔍 ¿Producto tiene rango? ${tieneConfiguracion ? 'SÍ' : 'NO'}`);
      
      return productoInfo;
    } catch (error) {
      debugError('❌ Error al verificar configuración de temperatura:', error);
      
      // En caso de error, asumir que no tiene configuración
      const productoInfo = {
        categoria: 'desconocido',
        tieneRango: false,
        nombre: `Producto ${productoId}`
      };
      
      debug(`📋 Producto ${productoId} clasificado como (fallback):`, productoInfo);
      
      return productoInfo;
    }
  };

  const loadTemperaturaRango = async () => {
    try {
      debug('🌡️ Cargando rango de temperatura para producto:', productId, 'envase:', envaseSeleccionado);
      
      // Primero determinar si el producto tiene rango de temperatura por su ID
      const productoConRango = await determinarSiProductoTieneRango(productId);
      debug('🔍 ¿Producto tiene rango?', JSON.stringify(productoConRango, null, 2));
      
      if (!productoConRango || !productoConRango.tieneRango) {
        debug('ℹ️ Este producto no tiene configuración de rango de temperatura');
        setTemperaturaRango(null);
        return;
      }
      
      debug('✅ Producto SÍ tiene configuración de temperatura, buscando rangos...');
      let rangoEncontrado = null;
      
      if (envaseSeleccionado === 'todos') {
        // Si es "todos", intentar obtener rango para diferentes tipos de envase
        const envases = ['Vidrio', 'PET', 'Doypack', 'Bolsa', 'Lata'];
        
        for (const envase of envases) {
          debug(`🔍 Buscando rango para envase: ${envase}`);
          const rango = await TemperaturaEnvasadoService.obtenerRangoTemperatura(productId, envase);
          debug(`📊 Resultado para ${envase}:`, rango);
          if (rango) {
            rangoEncontrado = rango;
            break;
          }
        }
      } else {
        // Usar el envase específico seleccionado
        debug(`🔍 Buscando rango para envase específico: ${envaseSeleccionado}`);
        rangoEncontrado = await TemperaturaEnvasadoService.obtenerRangoTemperatura(productId, envaseSeleccionado);
        if (rangoEncontrado) {
          debug('✅ Rango encontrado para envase seleccionado', envaseSeleccionado, ':', rangoEncontrado);
        } else {
          debug('❌ No se encontró rango para el envase seleccionado:', envaseSeleccionado);
        }
      }
      
      // Solo actualizar estado si el componente sigue abierto
      if (isOpen) {
        setTemperaturaRango(rangoEncontrado);
        debug('🌡️ Rango de temperatura final:', rangoEncontrado);
      }
    } catch (error) {
      debugError('❌ Error al cargar rango de temperatura:', error);
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
    if (monthFilteredRecords.length === 0) return null;

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
      totalRecords: monthFilteredRecords.length,
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

    monthFilteredRecords.forEach(record => {
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
      const countAM1 = monthFilteredRecords.filter(r => {
        const temp = getValidTemp(r, 'tempam1') || getValidTemp(r, 'tempAM1');
        return temp !== null;
      }).length;
      const countAM2 = monthFilteredRecords.filter(r => {
        const temp = getValidTemp(r, 'tempam2') || getValidTemp(r, 'tempAM2');
        return temp !== null;
      }).length;
      const countPM1 = monthFilteredRecords.filter(r => {
        const temp = getValidTemp(r, 'temppm1') || getValidTemp(r, 'tempPM1');
        return temp !== null;
      }).length;
      const countPM2 = monthFilteredRecords.filter(r => {
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

  const getEnvaseTipoFromRecord = React.useCallback((record: any): string => {
    const raw = record?.envase ?? record?.envase_tipo ?? record?.envaseTipo ?? '';
    const s = String(raw ?? '').trim();
    if (!s) return '';
    const cfg = EnvasesService.getEnvasePorId(s);
    if (cfg?.tipo) return String(cfg.tipo).trim();
    // Si viene como "Vidrio_36" u otro formato, intentar tomar el prefijo
    const prefix = s.split('_')[0];
    return String(prefix || s).trim();
  }, []);

  const filteredRecords = React.useMemo(() => {
    if (envaseSeleccionado === 'sin_seleccionar') return [];
    const selected = String(envaseSeleccionado).trim().toLowerCase();
    return monthFilteredRecords.filter((r) => {
      const tipo = getEnvaseTipoFromRecord(r).toLowerCase();
      return tipo !== '' && tipo === selected;
    });
  }, [monthFilteredRecords, envaseSeleccionado, getEnvaseTipoFromRecord]);

  const netoRecords = React.useMemo(() => monthFilteredRecords, [monthFilteredRecords]);

  const getPesoNetoDeclarado = React.useCallback((record: any): number | null => {
    const v = record?.peso_neto_declarado ?? record?.pesoNeto ?? record?.peso_neto ?? record?.pesoNetoDeclarado;
    if (v === null || v === undefined || v === '' || v === 'Pendiente') return null;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  }, []);

  const getPesoDrenadoDeclarado = React.useCallback((record: any): number | null => {
    const v = record?.peso_drenado_declarado ?? record?.pesoDrenado ?? record?.peso_drenado ?? record?.pesoDrenadoDeclarado;
    if (v === null || v === undefined || v === '' || v === 'Pendiente') return null;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  }, []);

  const drenadoMinMax = React.useMemo(() => {
    for (const r of filteredRecords) {
      const minRaw = r?.rango_peso_drenado_min;
      const maxRaw = r?.rango_peso_drenado_max;
      const min = minRaw === null || minRaw === undefined || minRaw === '' ? null : parseFloat(String(minRaw));
      const max = maxRaw === null || maxRaw === undefined || maxRaw === '' ? null : parseFloat(String(maxRaw));
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return { min: min as number, max: max as number };
      }
    }
    return null;
  }, [filteredRecords]);

  const netoMin = React.useMemo(() => {
    for (const r of netoRecords) {
      const n = getPesoNetoDeclarado(r);
      if (n != null) return n;
    }
    return null;
  }, [netoRecords, getPesoNetoDeclarado]);

  const netoSeries = React.useMemo(() => {
    return netoRecords
      .map((r, idx) => {
        const y = getPesoNetoDeclarado(r);
        if (y == null) return null;
        const fecha = r?.fechaproduccion ? new Date(r.fechaproduccion).toLocaleDateString() : '';
        const lote = r?.lote ? String(r.lote) : String(idx + 1);
        return {
          x: fecha ? `${fecha} - ${lote}` : `Reg ${idx + 1} - ${lote}`,
          y,
          lote,
          fecha,
        };
      })
      .filter(Boolean) as Array<{ x: string; y: number; lote: string; fecha: string }>;
  }, [netoRecords, getPesoNetoDeclarado]);

  const netoCumplimientoPromedio = React.useMemo(() => {
    let sum = 0;
    let count = 0;
    for (const r of netoRecords) {
      const v = r?.porcentaje_incumplen_rango_neto;
      if (v === null || v === undefined || v === '' || v === 'Pendiente') continue;
      const n = parseFloat(String(v));
      if (!Number.isFinite(n)) continue;
      sum += 100 - n;
      count += 1;
    }
    if (count === 0) return null;
    return sum / count;
  }, [netoRecords]);

  const drenadoSeries = React.useMemo(() => {
    return filteredRecords
      .map((r, idx) => {
        const y = getPesoDrenadoDeclarado(r);
        if (y == null) return null;
        const fecha = r?.fechaproduccion ? new Date(r.fechaproduccion).toLocaleDateString() : '';
        const lote = r?.lote ? String(r.lote) : String(idx + 1);
        return {
          x: fecha ? `${fecha} - ${lote}` : `Reg ${idx + 1} - ${lote}`,
          y,
          lote,
          fecha,
        };
      })
      .filter(Boolean) as Array<{ x: string; y: number; lote: string; fecha: string }>;
  }, [filteredRecords, getPesoDrenadoDeclarado]);

  const temperaturasSeries = React.useMemo(() => {
    const toNum = (v: any): number | null => {
      if (v === null || v === undefined || v === '' || v === 'Pendiente') return null;
      const n = parseFloat(String(v));
      if (!Number.isFinite(n)) return null;
      return n;
    };

    return filteredRecords.map((r, idx) => {
      const fecha = r?.fechaproduccion ? new Date(r.fechaproduccion).toLocaleDateString() : '';
      const lote = r?.lote ? String(r.lote) : String(idx + 1);
      return {
        x: fecha ? `${fecha} - ${lote}` : `Reg ${idx + 1} - ${lote}`,
        AM1: toNum(r?.tempam1 ?? r?.tempAM1),
        AM2: toNum(r?.tempam2 ?? r?.tempAM2),
        PM1: toNum(r?.temppm1 ?? r?.tempPM1),
        PM2: toNum(r?.temppm2 ?? r?.tempPM2),
      };
    });
  }, [filteredRecords]);

  const vacioSeries = React.useMemo(() => {
    return monthFilteredRecords.map((r, idx) => {
      const rawVacios = r?.pruebas_vacio ?? r?.pruebasVacio ?? '';
      const vals = String(rawVacios ?? '').split(',').map((v: string) => {
        const n = parseFloat(v.trim().replace(',', '.'));
        return Number.isFinite(n) ? n : null;
      });
      const fecha = r?.fechaproduccion ? new Date(r.fechaproduccion).toLocaleDateString() : '';
      const lote = r?.lote ? String(r.lote) : String(idx + 1);
      return {
        x: fecha ? (fecha + ' - ' + lote) : ('Reg ' + String(idx + 1) + ' - ' + lote),
        m1: vals[0] ?? null,
        m2: vals[1] ?? null,
        m3: vals[2] ?? null,
        m4: vals[3] ?? null,
        m5: vals[4] ?? null,
      };
    });
  }, [monthFilteredRecords]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[98vw] sm:max-w-2xl md:max-w-4xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle>Análisis de Producción</DialogTitle>
          <DialogDescription>
            Visualiza peso neto (general) y peso drenado / temperaturas por envase.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-xs text-muted-foreground">Registros analizados</div>
                  <div className="text-lg font-semibold text-gray-900">{filteredRecords.length}</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-xs text-muted-foreground">Temp promedio</div>
                  <div className="text-lg font-semibold text-gray-900">{stats.avgTempGeneral.toFixed(1)}°C</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-xs text-muted-foreground">Cumplimiento drenado</div>
                  <div className="text-lg font-semibold text-gray-900">{stats.avgCumplimientoDrenado.toFixed(1)}%</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-xs text-muted-foreground">Cumplimiento neto</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {netoCumplimientoPromedio != null ? `${netoCumplimientoPromedio.toFixed(1)}%` : '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Filtros */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-full sm:flex-1 sm:max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Mes
                  </label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los meses</SelectItem>
                      {availableMonths.map(m => (
                        <SelectItem key={m} value={m}>
                          {new Date(m + '-02').toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:flex-1 sm:max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Filtrar por Envase
                  </label>
                  <Select value={envaseSeleccionado} onValueChange={setEnvaseSeleccionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar envase..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin_seleccionar">Seleccionar envase...</SelectItem>
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
                        {envaseSeleccionado === 'sin_seleccionar' ? 'Seleccione un envase' : `Envase: ${envaseSeleccionado}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Análisis de Pesos</CardTitle>
              <CardDescription>
                Peso neto (general) y peso drenado (por envase)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="neto" className="w-full">
                <TabsList>
                  <TabsTrigger value="neto">Peso neto</TabsTrigger>
                  <TabsTrigger value="drenado">Peso drenado</TabsTrigger>
                </TabsList>

                <TabsContent value="neto" className="pt-4">
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={netoSeries} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="x" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} label={{ value: 'g', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="y"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={(props: any) => {
                            const { cx, cy, payload, index } = props;
                            const below = netoMin != null && payload?.y < netoMin;
                            return (
                              <circle
                                key={index}
                                cx={cx}
                                cy={cy}
                                r={4}
                                fill={below ? '#dc2626' : '#2563eb'}
                                stroke="white"
                                strokeWidth={1}
                              />
                            );
                          }}
                          name="Peso neto"
                          connectNulls
                        />
                        {netoMin != null && (
                          <ReferenceLine
                            y={netoMin}
                            stroke="#dc2626"
                            strokeDasharray="5 5"
                            label={{ value: `Mínimo: ${netoMin}g`, position: 'insideTopLeft' }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="drenado" className="pt-4">
                  {envaseSeleccionado === 'sin_seleccionar' ? (
                    <div className="h-64 sm:h-80 flex items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                      Selecciona un envase para ver el análisis de peso drenado.
                    </div>
                  ) : (
                    <div className="h-64 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={drenadoSeries} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="x" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'g', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="y"
                            stroke="#059669"
                            strokeWidth={2}
                            dot={(props: any) => {
                              const { cx, cy, payload } = props;
                              const out =
                                drenadoMinMax != null &&
                                (payload?.y < drenadoMinMax.min || payload?.y > drenadoMinMax.max);
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={4}
                                  fill={out ? '#dc2626' : '#059669'}
                                  stroke="white"
                                  strokeWidth={1}
                                />
                              );
                            }}
                            name="Peso drenado"
                            connectNulls
                          />
                          {drenadoMinMax != null && (
                            <>
                              <ReferenceLine
                                y={drenadoMinMax.min}
                                stroke="#dc2626"
                                strokeDasharray="5 5"
                                label={{ value: `Mín: ${drenadoMinMax.min}g`, position: 'insideTopLeft' }}
                              />
                              <ReferenceLine
                                y={drenadoMinMax.max}
                                stroke="#dc2626"
                                strokeDasharray="5 5"
                                label={{ value: `Máx: ${drenadoMinMax.max}g`, position: 'insideBottomLeft' }}
                              />
                              <ReferenceArea
                                y1={drenadoMinMax.min}
                                y2={drenadoMinMax.max}
                                stroke="none"
                                fill="#059669"
                                fillOpacity={0.08}
                              />
                            </>
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Temperaturas</CardTitle>
              <CardDescription>
                {temperaturaRango
                  ? `Rango: ${temperaturaRango.min}°C - ${temperaturaRango.max}°C`
                  : 'Sin rango configurado'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {envaseSeleccionado === 'sin_seleccionar' ? (
                <div className="h-72 sm:h-96 flex items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  Selecciona un envase para ver el análisis de temperaturas.
                </div>
              ) : (
                <div className="h-72 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={temperaturasSeries} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="x" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="AM1" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls name="AM1" />
                      <Line type="monotone" dataKey="AM2" stroke="#60a5fa" strokeWidth={2} dot={false} connectNulls name="AM2" />
                      <Line type="monotone" dataKey="PM1" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls name="PM1" />
                      <Line type="monotone" dataKey="PM2" stroke="#fb923c" strokeWidth={2} dot={false} connectNulls name="PM2" />
                      {temperaturaRango && (
                        <>
                          <ReferenceLine y={temperaturaRango.min} stroke="#dc2626" strokeDasharray="5 5" />
                          <ReferenceLine y={temperaturaRango.max} stroke="#dc2626" strokeDasharray="5 5" />
                          <ReferenceArea
                            y1={temperaturaRango.min}
                            y2={temperaturaRango.max}
                            stroke="none"
                            fill="#059669"
                            fillOpacity={0.08}
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Pruebas de Vacío</CardTitle>
              <CardDescription>
                {vacioMinThreshold !== null ? `Mínimo aceptable: ${vacioMinThreshold}` : 'Muestras de vacío por registro'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vacioSeries.filter(d => d.m1 !== null || d.m2 !== null || d.m3 !== null || d.m4 !== null || d.m5 !== null).length === 0 ? (
                <div className="h-64 sm:h-80 flex items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  No hay datos de pruebas de vacío disponibles.
                </div>
              ) : (
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vacioSeries} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="x" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {(['m1','m2','m3','m4','m5'] as const).map((key, ki) => {
                        const colors = ['#2563eb','#7c3aed','#059669','#f59e0b','#0891b2'];
                        const names = ['Muestra 1','Muestra 2','Muestra 3','Muestra 4','Muestra 5'];
                        return (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[ki]}
                            strokeWidth={2}
                            dot={(props: any) => {
                              const { cx, cy, payload, index } = props;
                              const val = payload?.[key];
                              const out = vacioMinThreshold !== null && val !== null && val < vacioMinThreshold;
                              return (
                                <circle
                                  key={key + '-' + index}
                                  cx={cx}
                                  cy={cy}
                                  r={4}
                                  fill={out ? '#dc2626' : colors[ki]}
                                  stroke="white"
                                  strokeWidth={1}
                                />
                              );
                            }}
                            name={names[ki]}
                            connectNulls
                          />
                        );
                      })}
                      {vacioMinThreshold !== null && (
                        <ReferenceLine
                          y={vacioMinThreshold}
                          stroke="#dc2626"
                          strokeDasharray="5 5"
                          label={{ value: `Mín: ${vacioMinThreshold}`, position: 'insideTopLeft' }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
