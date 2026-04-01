'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmbalajeRecord } from '@/lib/embalaje-records-service';
import { getProductCategories, type ProductCategory } from '@/lib/supervisores-data';

interface EmbalajeAnalysisProps {
  records: EmbalajeRecord[];
  onClose: () => void;
}

interface ProductAnalysis {
  productId: string;
  productName: string;
  totalRecords: number;
  avgFaltantes: number;
  avgEtiquetaNoConforme: number;
  avgMarcacionNoConforme: number;
  avgPresentacionNoConforme: number;
  avgCajasNoConformes: number;
  indicadorIncumplimiento: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const parseNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const normalized = trimmed.replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatPercent = (value: unknown): string => {
  const n = parseNumber(value);
  return `${n.toFixed(2)}%`;
};

export function EmbalajeAnalysis({ records, onClose }: EmbalajeAnalysisProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [grouping, setGrouping] = useState<'daily' | 'monthly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const availableMonths = useMemo(() => {
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

  const monthFilteredRecords = useMemo(() => {
    if (selectedMonth === 'all') return records;
    return records.filter(r => String(r?.fecha ?? '').slice(0, 7) === selectedMonth);
  }, [records, selectedMonth]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const loaded = await getProductCategories();
        setCategories(loaded);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      for (const product of category.products) {
        if (product?.id) map.set(String(product.id), String(product.name ?? product.id));
      }
    }
    return map;
  }, [categories]);

  const resolveProductName = (productId: string): string => {
    const key = String(productId);
    return productNameById.get(key) ?? key;
  };

  // Análisis por producto
  const productAnalysis = useMemo(() => {
    const groupedRecords = monthFilteredRecords.reduce((acc, record) => {
      if (!acc[record.producto]) {
        acc[record.producto] = {
          productId: record.producto,
          productName: resolveProductName(record.producto) || `Producto ${record.producto}`,
          records: [],
        };
      }
      acc[record.producto].records.push(record);
      return acc;
    }, {} as Record<string, { productId: string; productName: string; records: EmbalajeRecord[] }>);

    return Object.values(groupedRecords).map(group => {
      const totalRecords = group.records.length;
      
      // Calcular promedios - convertir strings a números
      const avgFaltantes = group.records.reduce((sum, record) => 
        sum + parseFloat(record.porcentaje_faltantes || '0'), 0) / totalRecords;
      const avgEtiquetaNoConforme = group.records.reduce((sum, record) => 
        sum + parseFloat(record.porcentaje_etiqueta_no_conforme || '0'), 0) / totalRecords;
      const avgMarcacionNoConforme = group.records.reduce((sum, record) => 
        sum + parseFloat(record.porcentaje_marcacion_no_conforme || '0'), 0) / totalRecords;
      const avgPresentacionNoConforme = group.records.reduce((sum, record) => 
        sum + parseFloat(record.porcentaje_presentacion_no_conforme || '0'), 0) / totalRecords;
      const avgCajasNoConformes = group.records.reduce((sum, record) => 
        sum + parseFloat(record.porcentaje_cajas_no_conformes || '0'), 0) / totalRecords;

      const totalUnidadesRevisadas = group.records.reduce(
        (sum, record) => sum + parseNumber(record.total_unidades_revisadas),
        0
      );
      const unidadesNoConformes = group.records.reduce(
        (sum, record) => sum + parseNumber(record.unidades_no_conformes),
        0
      );
      const indicadorIncumplimiento =
        totalUnidadesRevisadas > 0 ? (unidadesNoConformes / totalUnidadesRevisadas) * 100 : 0;

      return {
        productId: group.productId,
        productName: group.productName,
        totalRecords,
        avgFaltantes: Number(avgFaltantes.toFixed(2)),
        avgEtiquetaNoConforme: Number(avgEtiquetaNoConforme.toFixed(2)),
        avgMarcacionNoConforme: Number(avgMarcacionNoConforme.toFixed(2)),
        avgPresentacionNoConforme: Number(avgPresentacionNoConforme.toFixed(2)),
        avgCajasNoConformes: Number(avgCajasNoConformes.toFixed(2)),
        indicadorIncumplimiento: Number(indicadorIncumplimiento.toFixed(2)),
      } as ProductAnalysis;
    }).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [monthFilteredRecords, productNameById]);

  // Datos para el gráfico de barras
  const barChartData = useMemo(() => {
    const filteredData = selectedProduct === 'all' 
      ? productAnalysis 
      : productAnalysis.filter(p => p.productId === selectedProduct);

    return filteredData.map(product => ({
      name: product.productName,
      '% Incumplimiento': product.indicadorIncumplimiento,
      '% Faltantes': product.avgFaltantes,
      '% Etiqueta No Conforme': product.avgEtiquetaNoConforme,
      '% Marcación No Conforme': product.avgMarcacionNoConforme,
      '% Presentación No Conforme': product.avgPresentacionNoConforme,
      '% Cajas No Conformes': product.avgCajasNoConformes,
    }));
  }, [productAnalysis, selectedProduct]);

  // Datos para el gráfico de pie (promedio general)
  const pieChartData = useMemo(() => {
    const allProducts = selectedProduct === 'all' 
      ? productAnalysis 
      : productAnalysis.filter(p => p.productId === selectedProduct);

    if (allProducts.length === 0) return [];

    const totals = allProducts.reduce(
      (acc, product) => ({
        faltantes: acc.faltantes + product.avgFaltantes,
        etiqueta: acc.etiqueta + product.avgEtiquetaNoConforme,
        marcacion: acc.marcacion + product.avgMarcacionNoConforme,
        presentacion: acc.presentacion + product.avgPresentacionNoConforme,
        cajas: acc.cajas + product.avgCajasNoConformes,
      }),
      { faltantes: 0, etiqueta: 0, marcacion: 0, presentacion: 0, cajas: 0 }
    );

    const count = allProducts.length;
    return [
      { name: '% Faltantes', value: Number((totals.faltantes / count).toFixed(2)) },
      { name: '% Etiqueta No Conforme', value: Number((totals.etiqueta / count).toFixed(2)) },
      { name: '% Marcación No Conforme', value: Number((totals.marcacion / count).toFixed(2)) },
      { name: '% Presentación No Conforme', value: Number((totals.presentacion / count).toFixed(2)) },
      { name: '% Cajas No Conformes', value: Number((totals.cajas / count).toFixed(2)) },
    ].filter(item => item.value > 0);
  }, [productAnalysis, selectedProduct]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const filteredRecords = useMemo(() => {
    return selectedProduct === 'all'
      ? monthFilteredRecords
      : monthFilteredRecords.filter(r => String(r.producto) === String(selectedProduct));
  }, [monthFilteredRecords, selectedProduct]);

  const indicadorIncumplimientoPorFecha = useMemo(() => {
    const groups = filteredRecords.reduce((acc, record) => {
      const fechaRaw = String(record.fecha || '').slice(0, 10);
      if (!fechaRaw) return acc;

      const groupKey = grouping === 'monthly' ? fechaRaw.slice(0, 7) : fechaRaw;
      if (!acc[groupKey]) {
        acc[groupKey] = {
          fecha: groupKey,
          total_unidades_revisadas: 0,
          unidades_no_conformes: 0,
        };
      }

      acc[groupKey].total_unidades_revisadas += parseNumber(record.total_unidades_revisadas);
      acc[groupKey].unidades_no_conformes += parseNumber(record.unidades_no_conformes);
      return acc;
    }, {} as Record<string, { fecha: string; total_unidades_revisadas: number; unidades_no_conformes: number }>);

    return Object.values(groups)
      .map(g => {
        const denom = g.total_unidades_revisadas;
        const num = g.unidades_no_conformes;
        const indicador = denom > 0 ? (num / denom) * 100 : 0;

        return {
          fecha: g.fecha,
          indicador: Number(indicador.toFixed(2)),
          total_unidades_revisadas: denom,
          unidades_no_conformes: num,
          objetivo: 0.03,
        };
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [filteredRecords, grouping]);

  const IndicadorTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const p = payload[0]?.payload;
    if (!p) return null;

    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold">{label}</p>
        <p>Indicador: {formatPercent(p.indicador)}</p>
        <p>Total revisadas: {p.total_unidades_revisadas}</p>
        <p>No conformes: {p.unidades_no_conformes}</p>
        <p>Meta: {formatPercent(0.03)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-full sm:flex-1 sm:max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Mes</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            <option value="all">Todos los meses</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {new Date(m + '-02').toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
        
       
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Indicador de Incumplimiento de Embalaje
            {selectedProduct !== 'all' && ` - ${productAnalysis.find(p => p.productId === selectedProduct)?.productName}`}
          </CardTitle>
          <CardDescription>
            Meta objetivo: 0.03%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 pb-4">
            <Button
              type="button"
              variant={grouping === 'daily' ? 'default' : 'outline'}
              onClick={() => setGrouping('daily')}
            >
              Diario
            </Button>
            <Button
              type="button"
              variant={grouping === 'monthly' ? 'default' : 'outline'}
              onClick={() => setGrouping('monthly')}
            >
              Mensual
            </Button>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={indicadorIncumplimientoPorFecha} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis tickFormatter={(v: any) => formatPercent(v)} />
              <Tooltip content={<IndicadorTooltip />} />
              <ReferenceLine y={0.03} stroke="#ef4444" strokeDasharray="6 6" />
              <Line
                type="monotone"
                dataKey="indicador"
                name="Incumplimiento"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

     

      {/* Gráficos Separados por Tipo de No Conformidad */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              % Incumplimiento
              {selectedProduct !== 'all' && ` - ${productAnalysis.find(p => p.productId === selectedProduct)?.productName}`}
            </CardTitle>
            <CardDescription>
              Indicador (unidades no conformes / total unidades revisadas) * 100 por producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData.map(item => ({ name: item.name, value: item['% Incumplimiento'] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(v: any) => formatPercent(v)} />
                <Tooltip formatter={(v: any) => formatPercent(v)} />
                <ReferenceLine y={0.03} stroke="#ef4444" strokeDasharray="6 6" />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              % Faltantes
              {selectedProduct !== 'all' && ` - ${productAnalysis.find(p => p.productId === selectedProduct)?.productName}`}
            </CardTitle>
            <CardDescription>
              Porcentaje de faltantes por producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData.map(item => ({ name: item.name, value: item['% Faltantes'] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      
        <Card>
          <CardHeader>
            <CardTitle>
              % Etiqueta No Conforme
              {selectedProduct !== 'all' && ` - ${productAnalysis.find(p => p.productId === selectedProduct)?.productName}`}
            </CardTitle>
            <CardDescription>
              Porcentaje de etiquetas no conformes por producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData.map(item => ({ name: item.name, value: item['% Etiqueta No Conforme'] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              % Marcación No Conforme
              {selectedProduct !== 'all' && ` - ${productAnalysis.find(p => p.productId === selectedProduct)?.productName}`}
            </CardTitle>
            <CardDescription>
              Porcentaje de marcación no conforme por producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData.map(item => ({ name: item.name, value: item['% Marcación No Conforme'] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              % Presentación No Conforme
              {selectedProduct !== 'all' && ` - ${productAnalysis.find(p => p.productId === selectedProduct)?.productName}`}
            </CardTitle>
            <CardDescription>
              Porcentaje de presentación no conforme por producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData.map(item => ({ name: item.name, value: item['% Presentación No Conforme'] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ff7c7c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              % Cajas No Conformes
              {selectedProduct !== 'all' && ` - ${productAnalysis.find(p => p.productId === selectedProduct)?.productName}`}
            </CardTitle>
            <CardDescription>
              Porcentaje de cajas no conformes por producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData.map(item => ({ name: item.name, value: item['% Cajas No Conformes'] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8dd1e1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Detalles */}
     
    </div>
  );
}
