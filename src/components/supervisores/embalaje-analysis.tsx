'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmbalajeRecord } from '@/lib/embalaje-records-service';

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
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function EmbalajeAnalysis({ records, onClose }: EmbalajeAnalysisProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // Análisis por producto
  const productAnalysis = useMemo(() => {
    const groupedRecords = records.reduce((acc, record) => {
      if (!acc[record.producto]) {
        acc[record.producto] = {
          productId: record.producto,
          productName: record.producto || `Producto ${record.producto}`,
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

      return {
        productId: group.productId,
        productName: group.productName,
        totalRecords,
        avgFaltantes: Number(avgFaltantes.toFixed(2)),
        avgEtiquetaNoConforme: Number(avgEtiquetaNoConforme.toFixed(2)),
        avgMarcacionNoConforme: Number(avgMarcacionNoConforme.toFixed(2)),
        avgPresentacionNoConforme: Number(avgPresentacionNoConforme.toFixed(2)),
        avgCajasNoConformes: Number(avgCajasNoConformes.toFixed(2)),
      } as ProductAnalysis;
    }).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [records]);

  // Datos para el gráfico de barras
  const barChartData = useMemo(() => {
    const filteredData = selectedProduct === 'all' 
      ? productAnalysis 
      : productAnalysis.filter(p => p.productId === selectedProduct);

    return filteredData.map(product => ({
      name: product.productName,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        
        
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
        
       
      </div>

     

      {/* Gráficos Separados por Tipo de No Conformidad */}
      <div className="space-y-6">
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
