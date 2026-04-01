'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmbalajeRecord } from '@/lib/embalaje-records-service';

interface EmbalajeIndicadorGlobalProps {
  records: EmbalajeRecord[];
}

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

const getMonthName = (month: string): string => {
  const monthNames: Record<string, string> = {
    '01': 'Enero',
    '02': 'Febrero',
    '03': 'Marzo',
    '04': 'Abril',
    '05': 'Mayo',
    '06': 'Junio',
    '07': 'Julio',
    '08': 'Agosto',
    '09': 'Septiembre',
    '10': 'Octubre',
    '11': 'Noviembre',
    '12': 'Diciembre',
  };
  return monthNames[month] || month;
};

const formatMonthLabel = (yearMonth: string): string => {
  const [year, month] = yearMonth.split('-');
  return `${getMonthName(month)} ${year}`;
};

// Generar los 12 meses del año actual
const generateCurrentYearMonths = (): string[] => {
  const months: string[] = [];
  const currentYear = new Date().getFullYear();

  for (let i = 1; i <= 12; i++) {
    const month = String(i).padStart(2, '0');
    months.push(`${currentYear}-${month}`);
  }

  return months;
};

export function EmbalajeIndicadorGlobal({ records }: EmbalajeIndicadorGlobalProps) {
  const [grouping, setGrouping] = useState<'daily' | 'monthly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Esperar a que el componente esté montado en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generar los 12 meses del año actual
  const availableMonths = useMemo(() => {
    return generateCurrentYearMonths();
  }, []);

  // Inicializar selectedMonth con 'all' después del mount
  useEffect(() => {
    if (isMounted && selectedMonth === null) {
      setSelectedMonth('all');
    }
  }, [isMounted, selectedMonth]);

  const indicadorIncumplimientoPorFecha = useMemo(() => {
    // Si no está montado o no hay mes seleccionado, no filtrar
    if (!isMounted || selectedMonth === null) {
      return [];
    }

    // Filtrar por mes seleccionado
    const filteredRecords = selectedMonth !== 'all'
      ? records.filter((record) => {
          const fechaRaw = String(record.fecha || '').slice(0, 10);
          return fechaRaw.startsWith(selectedMonth);
        })
      : records;

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
  }, [records, grouping, selectedMonth]);

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
    <Card>
      <CardHeader>
        <CardTitle>Indicador Global de Incumplimiento de Embalaje</CardTitle>
        <CardDescription>Meta objetivo: 0.03%</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 pb-4 items-center">
          <div className="flex gap-2">
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

          <div className="flex-1" />

          <Select value={selectedMonth || 'all'} onValueChange={(value) => setSelectedMonth(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por mes" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[300px]">
              <SelectItem value="all">Todos los meses</SelectItem>
              {availableMonths.map((month) => {
                const [, monthNum] = month.split('-');
                return (
                  <SelectItem key={month} value={month}>
                    {getMonthName(monthNum)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <ResponsiveContainer width="100%" height={320}>
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
  );
}
