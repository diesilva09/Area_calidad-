'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Package, User, Thermometer, CheckCircle, AlertCircle, Scale, Beaker, FlaskRound, TestTube, ClipboardList, Eye, Droplet, Ruler, Gauge, Factory, Box, Hash, Tag, Layers, Clock, FileText, ShieldCheck, Award, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { productionRecordsService } from '@/lib/supervisores-data';
import { productService } from '@/lib/supervisores-data';
import { getProductCategories } from '@/lib/supervisores-data';
import { productoEnvaseService } from '@/lib/producto-envase-service';
import { AreasEquiposService } from '@/lib/areas-equipos-config';
// Tipo para los registros de producción (coincidente con la base de datos)
interface ProductionRecord {
  id: string;
  fechaproduccion: string;
  fechavencimiento: string;
  mescorte: string;
  producto: string;
  producto_nombre?: string;
  envase?: string;
  envase_temperatura?: string;
  lote: string;
  tamano_lote: string;
  letratamano_muestra: string;
  area: string;
  equipo: string;
  liberacion_inicial: string;
  verificacion_aleatoria: string;
  observaciones?: string;
  tempam1: string;
  tempam2: string;
  temppm1: string;
  temppm2: string;
  analisis_sensorial: string;
  prueba_hermeticidad: string;
  inspeccion_micropesaje_mezcla: string;
  inspeccion_micropesaje_resultado: string;
  total_unidades_revisar_drenado: string;
  peso_drenado_declarado: string;
  rango_peso_drenado_min: string;
  rango_peso_drenado_max: string;
  pesos_drenados: string;
  promedio_peso_drenado: string;
  encima_peso_drenado: string;
  debajo_peso_drenado: string;
  und_incumplen_rango_drenado: string;
  porcentaje_incumplen_rango_drenado: string;
  total_unidades_revisar_neto: string;
  peso_neto_declarado: string;
  pesos_netos: string;
  promedio_peso_neto: string;
  encima_peso_neto: string;
  debajo_peso_neto: string;
  und_incumplen_rango_neto: string;
  porcentaje_incumplen_rango_neto: string;
  pruebas_vacio: string;
  novedades_proceso?: string;
  observaciones_acciones_correctivas?: string;
  supervisor_calidad: string;
  responsable_produccion?: string;
  fechaanalisispt: string;
  no_mezcla_pt: string;
  vacio_pt: string;
  peso_neto_real_pt: string;
  peso_drenado_real_pt: string;
  brix_pt: string;
  ph_pt: string;
  acidez_pt: string;
  ppm_so2_pt: string;
  consistencia_pt: string;
  sensorial_pt: string;
  tapado_cierre_pt: string;
  etiqueta_pt: string;
  presentacion_final_pt: string;
  ubicacion_muestra_pt: string;
  estado_pt: string;
  observaciones_pt?: string;
  responsable_analisis_pt: string;
  created_at: string;
  created_by?: string;
}
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ProductionRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<ProductionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equiposNombres, setEquiposNombres] = useState<Record<string, string>>({});
  const [calidadRangoActual, setCalidadRangoActual] = useState<any>(null);
  const [temperaturaRangoActual, setTemperaturaRangoActual] = useState<{ min: number | null; max: number | null } | null>(null);
  const [envaseTipoTexto, setEnvaseTipoTexto] = useState<string | null>(null);

  const returnTo = searchParams?.get('returnTo') || '/dashboard/supervisores/records';

  const cargarNombresEquipos = async (equipoId: string) => {
    if (!equipoId || equiposNombres[equipoId]) return;

    try {
      const equipo = await AreasEquiposService.getEquipoPorId(equipoId);
      if (equipo && equipo.nombre) {
        setEquiposNombres((prev) => ({
          ...prev,
          [equipoId]: equipo.nombre,
        }));
      }
    } catch (error) {
      console.error(`Error cargando nombre del equipo ${equipoId}:`, error);
      const equipoMapeoDirecto: Record<string, string> = {
        'ENV-001': 'Envasadora 1',
        'ENV-002': 'Envasadora 2',
        'ENV-003': 'Envasadora 3',
        'LAV-001': 'Lavadora 1',
        'LAV-002': 'Lavadora 2',
        'COC-001': 'Cocina 1',
        'COC-002': 'Cocina 2',
        'LLN-001': 'Llenadora 1',
        'LLN-002': 'Llenadora 2',
        'ETQ-001': 'Etiquetadora 1',
        'ETQ-002': 'Etiquetadora 2',
        'EMP-001': 'Empacadora 1',
        'EMP-002': 'Empacadora 2',
        'PES-001': 'Pesadora 1',
        'PES-002': 'Pesadora 2',
      };

      const nombreDirecto = equipoMapeoDirecto[equipoId];
      setEquiposNombres((prev) => ({
        ...prev,
        [equipoId]: nombreDirecto || `Equipo ${equipoId}`,
      }));
    }
  };

  const loadRecord = async () => {
    try {
      const records = await productionRecordsService.getAll();
      const foundRecord = records.find((r: ProductionRecord) => r.id === resolvedParams.id);

      if (!foundRecord) {
        setError('Registro no encontrado');
        return;
      }

      setRecord(foundRecord);
      if (foundRecord.equipo) {
        await cargarNombresEquipos(foundRecord.equipo);
      }

      try {
        const resolveProductId = async () => {
          const maybeId = String(foundRecord.producto ?? '').trim();
          if (!maybeId) return null;

          // 1) Intentar directamente (nuevo formato: producto = ID)
          const direct = await productService.getById(maybeId);
          if (direct) return { productId: maybeId, product: direct };

          // 2) Compatibilidad: registros antiguos guardaban producto = nombre
          const name = maybeId;
          const categories = await getProductCategories();
          for (const cat of categories) {
            const match = cat.products.find((p: any) => String(p?.name || '').trim().toLowerCase() === name.toLowerCase());
            if (match?.id) {
              const byId = await productService.getById(match.id, cat.id);
              if (byId) return { productId: match.id, product: byId };
            }
          }
          return null;
        };

        const resolved = await resolveProductId();
        const detailedProduct = resolved?.product;
        if (!detailedProduct) {
          setCalidadRangoActual(null);
          setTemperaturaRangoActual(null);
          return;
        }

        setRecord((prev) => {
          if (!prev) return prev;
          if (prev.producto_nombre && String(prev.producto_nombre).trim() !== '') return prev;
          return { ...prev, producto_nombre: detailedProduct.name };
        });

        const envaseRawOriginal =
          String(
            (foundRecord as any).envase_temperatura ??
              (foundRecord as any).envaseTemperatura ??
              foundRecord.envase ??
              'general'
          ).trim() || 'general';

        let envaseRaw = envaseRawOriginal;

        // Si el envase viene como ID numérico (producto_envase.id), resolver a envase_tipo (texto)
        if (/^\d+$/.test(envaseRawOriginal)) {
          try {
            const envases = await productoEnvaseService.getEnvasesByProducto(String(resolved?.productId || detailedProduct.id));
            const match = envases.find((e: any) => String(e?.id) === envaseRawOriginal);
            if (match?.envase_tipo) {
              envaseRaw = String(match.envase_tipo).trim() || envaseRawOriginal;
              setEnvaseTipoTexto(envaseRaw);
            } else {
              setEnvaseTipoTexto(null);
            }
          } catch (err) {
            setEnvaseTipoTexto(null);
          }
        } else {
          setEnvaseTipoTexto(null);
        }
        const envaseShort = formatEnvase(envaseRaw);
        const envaseOriginalNormalized = String(envaseRaw || '').trim().toLowerCase();
        const envaseShortNormalized = String(envaseShort || '').trim().toLowerCase();

        const findConfigByEnvase = (list: any[]) => {
          if (!Array.isArray(list) || list.length === 0) return null;
          const match = list.find((c: any) => {
            const key = String(c?.envase_tipo || '').trim().toLowerCase();
            if (!key) return false;
            return key === envaseOriginalNormalized || (envaseShortNormalized ? key === envaseShortNormalized : false);
          });
          if (match) return match;

          const general = list.find((c: any) => String(c?.envase_tipo || '').trim().toLowerCase() === 'general');
          if (general) return general;

          return list[0] || null;
        };

        const list = Array.isArray((detailedProduct as any)?.calidad_rangos_config)
          ? (detailedProduct as any).calidad_rangos_config
          : [];

        const normalizedEnvase = envaseOriginalNormalized || envaseShortNormalized || 'general';
        let cfg = findConfigByEnvase(list);
        if (!cfg && normalizedEnvase === 'general' && list.length >= 1) cfg = list[0];
        setCalidadRangoActual(cfg || null);

        const tempList = Array.isArray((detailedProduct as any)?.temperaturas_config)
          ? (detailedProduct as any).temperaturas_config
          : [];
        const tempCfg = findConfigByEnvase(tempList);
        const minT = tempCfg?.temperatura_min;
        const maxT = tempCfg?.temperatura_max;
        const minN = parseNumberValue(minT);
        const maxN = parseNumberValue(maxT);
        // Permitir rangos parciales: max=null => sin límite superior, min=null => sin límite inferior
        if (
          (minN !== null && !Number.isNaN(minN)) ||
          (maxN !== null && !Number.isNaN(maxN))
        ) {
          setTemperaturaRangoActual({
            min: minN !== null && !Number.isNaN(minN) ? minN : null,
            max: maxN !== null && !Number.isNaN(maxN) ? maxN : null,
          });
        } else {
          setTemperaturaRangoActual(null);
        }
      } catch {
        setCalidadRangoActual(null);
        setTemperaturaRangoActual(null);
      }
    } catch (error) {
      console.error('Error al cargar registro:', error);
      setError('Error al cargar el registro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'jefe' && user.role !== 'tecnico')) {
      router.push('/dashboard');
      return;
    }
    loadRecord();
  }, [user, router, resolvedParams.id]);

  if (!user) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando detalle del registro...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md text-center shadow-lg border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Error
            </CardTitle>
            <CardDescription>{error || 'Registro no encontrado'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="mt-2">
              <Link href={returnTo}>Volver a Registros</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (rawStatus: unknown) => {
    const normalized = String(rawStatus ?? '').trim().toLowerCase();
    const normalizedStatus =
      normalized === '1' || normalized === 'true' || normalized === 'ok' || normalized === 'aprobado'
        ? 'cumple'
        : normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'rechazado'
          ? 'no cumple'
          : normalized === '2' || normalized === 'no aplica' || normalized === 'n/a'
            ? 'no aplica'
          : normalized === 'pendiente'
            ? 'pendiente'
            : normalized;

    const statusColors: Record<string, string> = {
      'cumple': 'bg-green-100 text-green-800 border-green-200',
      'no cumple': 'bg-red-100 text-red-800 border-red-200',
      'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'no aplica': 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const color = statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800 border-gray-200';
    const label = normalizedStatus ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1) : 'N/A';
    return <Badge className={`${color} border px-2 py-0.5 text-xs font-medium`}>{label}</Badge>;
  };

  const getConformidad = (rawStatus: unknown): 'conforme' | 'no_conforme' | 'pendiente' | 'desconocido' => {
    const normalized = String(rawStatus ?? '').trim().toLowerCase();
    if (!normalized) return 'desconocido';
    if (normalized === 'pendiente') return 'pendiente';

    // Tratar "2" como neutral (no aplica)
    if (normalized === '2' || normalized === 'no aplica' || normalized === 'n/a') return 'desconocido';

    if (
      normalized === '1' ||
      normalized === 'true' ||
      normalized === 'ok' ||
      normalized === 'aprobado' ||
      normalized === 'conforme' ||
      normalized === 'cumple'
    ) {
      return 'conforme';
    }

    if (
      normalized === '0' ||
      normalized === 'false' ||
      normalized === 'no' ||
      normalized === 'rechazado' ||
      normalized === 'no conforme' ||
      normalized === 'no cumple'
    ) {
      return 'no_conforme';
    }

    return 'desconocido';
  };

  const getHighlightClass = (state: ReturnType<typeof getConformidad>) => {
    if (state === 'conforme') return 'border-green-200 bg-green-50/50';
    if (state === 'no_conforme') return 'border-red-200 bg-red-50/50';
    if (state === 'pendiente') return 'border-yellow-200 bg-yellow-50/50';
    return 'border-gray-200 bg-gray-50';
  };

  const highlightFromStatus = (rawStatus: unknown) => {
    return `rounded-lg border p-3 ${getHighlightClass(getConformidad(rawStatus))}`;
  };

  const highlightFromNumber = (rawValue: unknown) => {
    const n = Number(String(rawValue ?? '').trim());
    if (Number.isNaN(n)) return 'rounded-lg border border-gray-200 bg-gray-50 p-2';
    if (n > 0) return 'rounded-lg border border-red-200 bg-red-50/50 p-2';
    return 'rounded-lg border border-green-200 bg-green-50/50 p-2';
  };

  const buildNoCumplePayload = (label: string, obs: string, corr: string) => {
    const obsFinal = String(obs || '').trim() || '-';
    const corrFinal = String(corr || '').trim() || '-';
    return [`No cumple - ${label}`, `Observaciones: ${obsFinal}`, `Corrección: ${corrFinal}`].join('\n');
  };

  const extractLineTestDetails = (rawAccionesCorrectivas: unknown, label: string): { obs: string; corr: string } => {
    const s = String(rawAccionesCorrectivas ?? '').trim();
    if (!s) return { obs: '', corr: '' };

    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `${escaped}\\s*:\\s*Observaciones\\s*:\\s*([^|\\n]*)\\s*\\|\\s*Correcciones\\s*:\\s*([^\\n]*)`,
      'i'
    );
    const m = s.match(re);
    if (!m) return { obs: '', corr: '' };
    return {
      obs: String(m[1] ?? '').trim(),
      corr: String(m[2] ?? '').trim(),
    };
  };

  const normalizeLineTestValue = (rawValue: unknown, label: string, rawAccionesCorrectivas: unknown) => {
    const s = String(rawValue ?? '').trim();
    const lower = s.toLowerCase();

    // Si ya viene con texto parseable, no tocar.
    if (
      s.includes('Observaciones:') ||
      s.includes('Corrección:') ||
      s.includes('Correcciones:') ||
      s.includes('Novedades:')
    ) {
      return rawValue;
    }

    // Si está en formato simple (0/1), intentar leer detalles del bloque de acciones correctivas
    if (lower === '0' || lower === 'no cumple' || lower === 'no conforme') {
      const d = extractLineTestDetails(rawAccionesCorrectivas, label);
      if (d.obs || d.corr) {
        return buildNoCumplePayload(label, d.obs, d.corr);
      }
    }

    return rawValue;
  };

  const normalizeObsFieldValue = (rawValue: unknown, label: string, rawObsField: unknown) => {
    const s = String(rawValue ?? '').trim();
    const lower = s.toLowerCase();
    const obsField = String(rawObsField ?? '').trim();

    if (
      s.includes('Observaciones:') ||
      s.includes('Corrección:') ||
      s.includes('Correcciones:') ||
      s.includes('Novedades:')
    ) {
      return rawValue;
    }

    if (!obsField) return rawValue;

    if (lower === '0' || lower === 'no cumple' || lower === 'no conforme') {
      const parsed = parseCumpleNoCumpleWithDetails(obsField);
      if (parsed.obs || parsed.corr) {
        return buildNoCumplePayload(label, parsed.obs, parsed.corr);
      }
    }

    return rawValue;
  };

  const parseCsvValues = (raw: unknown) => {
    const s = String(raw ?? '').trim();
    if (!s) return [] as string[];
    return s
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  };

  const parseVaciosRangeConfig = (raw: unknown) => {
    const s = String(raw ?? '').trim();
    if (!s) return null as null | { min: number; max: number | null };
    const matches = s.match(/\d+(?:[\.,]\d+)?/g);
    if (!matches || matches.length === 0) return null;
    const nums = matches
      .map((m) => Number(m.replace(',', '.')))
      .filter((n) => !Number.isNaN(n));
    if (!nums.length) return null;

    const min = Math.min(...nums);
    const max = nums.length >= 2 ? Math.max(...nums) : null;
    return { min, max };
  };

  function formatEnvase(raw: unknown) {
    const s = String(raw ?? '').trim();
    if (!s) return '';
    // Muchos envases vienen como "Tipo_XX" o "Tipo-XX". Mostrar solo el tipo.
    return s.split(/[_-]/)[0].trim();
  }

  function parseNumberValue(raw: unknown) {
    const s = String(raw ?? '').trim();
    if (!s) return null;
    const normalized = s.replace(',', '.');
    const n = Number(normalized);
    return Number.isNaN(n) ? null : n;
  }

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const seccionToRegexSource = (seccion: string) => {
    const normalized = String(seccion || '').trim().toLowerCase();
    // Aceptar variante sin tilde (Vacio) y con tilde (Vacío)
    if (normalized === 'pruebas de vacío' || normalized === 'pruebas de vacio') {
      return 'Pruebas de Vac[ií]o';
    }
    return escapeRegExp(seccion);
  };

  const extractSeccionCampo = (raw: unknown, seccion: string, campo: string) => {
    const s = String(raw ?? '').trim();
    if (!s) return '';

    const seccionEsc = seccionToRegexSource(seccion);
    const campoEsc = escapeRegExp(campo);

    // Soportar encabezados de sección en formato:
    // - Temperatura:
    // - [Temperatura]
    // - Pruebas de Vacio:
    // - [Pruebas de Vacío]
    const seccionHeader = `\\[?${seccionEsc}\\]?\\s*:?`;
    const nextSectionHeader = `\\[?(?:Temperatura|Pruebas de Vac[ií]o)\\]?\\s*:?`;

    // Ejemplo esperado:
    // Temperatura:
    // Novedades:
    // ...
    // Correcciones:
    // ...
    const re = new RegExp(
      `${seccionHeader}\\s*[\\r\\n]+${campoEsc}\\s*:\\s*[\\r\\n]*([\\s\\S]*?)(?=(?:\\r?\\n)+${nextSectionHeader}|(?:\\r?\\n)+(?:Novedades|Correcciones)\\s*:|$)`,
      'i'
    );

    const m = s.match(re);
    if (!m) return '';
    return String(m[1] ?? '').trim();
  };

  const parseNovCorrPorSeccion = (rawNov: unknown, rawCorr: unknown) => {
    const novedadesRaw = String(rawNov ?? '').trim();
    const correccionesRaw = String(rawCorr ?? '').trim();

    const tempNovedades = extractSeccionCampo(novedadesRaw, 'Temperatura', 'Novedades');
    const vacioNovedades = extractSeccionCampo(novedadesRaw, 'Pruebas de Vacío', 'Novedades');
    const tempCorrecciones = extractSeccionCampo(correccionesRaw, 'Temperatura', 'Correcciones');
    const vacioCorrecciones = extractSeccionCampo(correccionesRaw, 'Pruebas de Vacío', 'Correcciones');

    // Fallback para registros antiguos/no estructurados:
    // mantener todo en Temperatura para evitar duplicación/mezcla.
    const hasStructured = Boolean(tempNovedades || vacioNovedades || tempCorrecciones || vacioCorrecciones);
    if (!hasStructured) {
      return {
        temperatura: {
          novedades: novedadesRaw,
          correcciones: correccionesRaw,
        },
        vacio: {
          novedades: '',
          correcciones: '',
        },
      };
    }

    return {
      temperatura: {
        novedades: tempNovedades,
        correcciones: tempCorrecciones,
      },
      vacio: {
        novedades: vacioNovedades,
        correcciones: vacioCorrecciones,
      },
    };
  };

  const temperatureClass = (rawValue: unknown) => {
    const v = parseNumberValue(rawValue);
    const base = 'mt-1 w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold shadow-sm';
    if (v === null) return `${base} border-gray-200 bg-gray-50 text-gray-700`;
    if (!temperaturaRangoActual) return `${base} border-gray-200 bg-gray-50 text-gray-700`;
    const min = temperaturaRangoActual.min;
    const max = temperaturaRangoActual.max;
    const belowMin = typeof min === 'number' ? v < min : false;
    const aboveMax = typeof max === 'number' ? v > max : false;
    if (belowMin || aboveMax) {
      return `${base} border-red-300 bg-red-50 text-red-700`;
    }
    return `${base} border-blue-300 bg-blue-50 text-blue-700`;
  };

  const rangeClass = (rawValue: unknown, min: unknown, max: unknown) => {
    const v = parseNumberValue(rawValue);
    const minN = parseNumberValue(min);
    const maxN = parseNumberValue(max);

    if (v === null) return 'text-lg font-semibold text-gray-600';
    if ((minN !== null && v < minN) || (maxN !== null && v > maxN)) {
      return 'text-lg font-semibold text-red-600';
    }
    // Solo marcar verde si existe un rango definido y el valor está dentro
    if (minN !== null || maxN !== null) {
      return 'text-lg font-semibold text-green-600';
    }
    return 'text-lg font-semibold text-gray-900';
  };

  const SamplesGrid = ({ values }: { values: string[] }) => {
    if (!values.length) {
      return <div className="text-sm text-gray-500 italic">Sin muestras registradas</div>;
    }

    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {values.map((v, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm shadow-sm hover:shadow-md transition-shadow"
            title={`Muestra ${idx + 1}`}
          >
            {v}
          </div>
        ))}
      </div>
    );
  };

  const VacioSamplesGrid = ({
    values,
    range,
  }: {
    values: string[];
    range: { min: number; max: number | null } | null;
  }) => {
    if (!values.length) {
      return <div className="text-sm text-gray-500 italic">Sin muestras registradas</div>;
    }

    const getCellClass = (raw: unknown) => {
      const s = String(raw ?? '').trim();
      if (!s) return 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm text-gray-600';
      if (range === null) return 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm text-gray-700 shadow-sm';

      const n = Number(s.replace(',', '.'));
      if (Number.isNaN(n)) return 'rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm text-gray-700 shadow-sm';
      const outOfRange = n < range.min || (typeof range.max === 'number' && n > range.max);
      if (outOfRange) return 'rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-800 shadow-sm';
      return 'rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-center text-sm text-green-800 shadow-sm';
    };

    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {values.map((v, idx) => (
          <div key={idx} className={getCellClass(v)} title={`Muestra ${idx + 1}`}>
            {v}
          </div>
        ))}
      </div>
    );
  };

  const CumpleField = ({
    label,
    rawValue,
    containerClass,
  }: {
    label: string;
    rawValue: unknown;
    containerClass?: string;
  }) => {
    const parsed = parseCumpleNoCumpleWithDetails(rawValue);
    const hasDetails = Boolean(parsed.obs) || Boolean(parsed.corr);
    const hasCorrection = Boolean(parsed.corr) && parsed.corr !== '-';

    const correctedContainerClass = hasCorrection
      ? 'rounded-lg border border-blue-200 bg-blue-50/50 p-2'
      : undefined;

    const badgeClass = (() => {
      if (parsed.modo === 'cumple') return 'bg-green-100 text-green-800 border-green-200';
      if (parsed.modo === 'no_cumple') return 'bg-red-100 text-red-800 border-red-200';
      if (parsed.modo === 'pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-gray-100 text-gray-800 border-gray-200';
    })();

    const badgeLabel = (() => {
      if (parsed.modo === 'cumple') return 'Cumple';
      if (parsed.modo === 'no_cumple') return 'No cumple';
      if (parsed.modo === 'pendiente') return 'Pendiente';
      if (parsed.modo === 'no_aplica') return 'No aplica';
      return String(rawValue ?? '').trim() || 'N/A';
    })();

    const valueNode = hasDetails ? (
      <details className="group">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center gap-2">
            <Badge className={`${badgeClass} border px-2 py-0.5 text-xs font-medium`}>{badgeLabel}</Badge>
            {hasCorrection && <Badge className="bg-blue-100 text-blue-800 border-blue-200 border px-2 py-0.5 text-xs font-medium">Corregido</Badge>}
            <span className="text-xs text-gray-500 group-open:hidden">▼ Ver detalles</span>
            <span className="text-xs text-gray-500 hidden group-open:inline">▲ Ocultar detalles</span>
          </div>
        </summary>
        <div className="mt-3 space-y-2">
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1">
              <FileText className="h-3 w-3" /> Observaciones
            </div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {parsed.obs ? parsed.obs : 'N/A'}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1">
              <ShieldCheck className="h-3 w-3" /> Corrección
            </div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {parsed.corr ? parsed.corr : 'N/A'}
            </div>
          </div>
        </div>
      </details>
    ) : (
      <div className="flex items-center gap-2">
        <Badge className={`${badgeClass} border px-2 py-0.5 text-xs font-medium`}>{badgeLabel}</Badge>
        {hasCorrection && <Badge className="bg-blue-100 text-blue-800 border-blue-200 border px-2 py-0.5 text-xs font-medium">Corregido</Badge>}
      </div>
    );

    return (
      <div>
        {label ? <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label> : null}
        <div className={correctedContainerClass ?? containerClass ?? 'mt-1'}>{valueNode}</div>
      </div>
    );
  };

  const parseCumpleNoCumpleWithDetails = (rawValue: unknown) => {
    const s = String(rawValue ?? '').trim();
    if (!s) {
      return {
        modo: '' as '' | 'cumple' | 'no_cumple' | 'pendiente' | 'no_aplica',
        obs: '',
        corr: '',
      };
    }

    const lower = s.toLowerCase();
    if (lower === 'pendiente') {
      return { modo: 'pendiente' as const, obs: '', corr: '' };
    }
    if (lower === 'no aplica' || lower === 'n/a' || lower === '2') {
      return { modo: 'no_aplica' as const, obs: '', corr: '' };
    }

    const obsMatch = s.match(/Observaciones\s*:\s*([\s\S]*?)(?:\n|$)/i);
    const novMatch = s.match(/Novedades\s*:\s*([\s\S]*?)(?:\n|$)/i);
    const corrMatch = s.match(/Correcci[oó]n\s*:\s*([\s\S]*?)(?:\n|$)/i);
    const corrPluralMatch = s.match(/Correcciones\s*:\s*([\s\S]*?)(?:\n|$)/i);
    const obs = String(obsMatch?.[1] ?? novMatch?.[1] ?? '').trim();
    const corr = String(corrMatch?.[1] ?? corrPluralMatch?.[1] ?? '').trim();

    if (lower.startsWith('no cumple')) {
      return {
        modo: 'no_cumple' as const,
        obs,
        corr,
      };
    }

    if (
      lower === 'cumple' ||
      lower.startsWith('cumple') ||
      lower === '1' ||
      lower === 'true' ||
      lower === 'ok' ||
      lower === 'aprobado'
    ) {
      return { modo: 'cumple' as const, obs, corr };
    }

    return { modo: '' as const, obs: '', corr: '' };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4 hover:bg-gray-100 transition-colors">
            <Link href={returnTo}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Registros
            </Link>
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">Detalle de Registro de Producción</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                {record.producto_nombre || record.producto}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white px-3 py-1 text-sm border-gray-300 shadow-sm">
                <Calendar className="mr-1 h-3 w-3" />
                {formatDate(record.fechaproduccion)}
              </Badge>
              <Badge variant="outline" className="bg-white px-3 py-1 text-sm border-gray-300 shadow-sm">
                <Hash className="mr-1 h-3 w-3" />
                Lote: {record.lote}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-md border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                  <Package className="mr-2 h-5 w-5 text-blue-600" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Producto
                    </label>
                    <p className="text-base font-semibold text-gray-800">{record.producto_nombre || record.producto}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Box className="h-3 w-3" /> Tipo de Envase
                    </label>
                    <p className="text-sm text-gray-700">{envaseTipoTexto ? formatEnvase(envaseTipoTexto) : (record.envase ? formatEnvase(record.envase) : 'No especificado')}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Hash className="h-3 w-3" /> Lote
                    </label>
                    <p className="text-base font-mono">{record.lote}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Tamaño Lote
                    </label>
                    <p className="text-sm text-gray-700">{record.tamano_lote}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <ClipboardList className="h-3 w-3" /> Letra Tamaño de Muestra
                    </label>
                    <p className="uppercase text-sm text-gray-700 font-mono">{record.letratamano_muestra}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Factory className="h-3 w-3" /> Área
                    </label>
                    <p className="text-sm text-gray-700">{record.area}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Gauge className="h-3 w-3" /> Equipo
                    </label>
                    <p className="text-sm text-gray-700">{record.equipo ? (equiposNombres[record.equipo] || `Equipo ${record.equipo}`) : 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> Responsable de Calidad
                    </label>
                    <p className="text-sm text-gray-700 mt-1">{String((record as any).responsable_produccion || '').trim() ? (record as any).responsable_produccion : 'No especificado'}</p>
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Producción</label>
                    <p className="flex items-center text-sm mt-1">
                      <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                      {formatDate(record.fechaproduccion)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Vencimiento</label>
                    <p className="flex items-center text-sm mt-1">
                      <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                      {formatDate(record.fechavencimiento)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mes de Corte</label>
                  <p className="text-sm text-gray-700 mt-1">{record.mescorte}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalles del Registro */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verificaciones y Temperatura */}
            <Card className="shadow-md border-gray-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Verificaciones y Temperatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Droplet className="h-3 w-3" /> Liberación Inicial Solución Desinfectante Envases
                    </label>

                    <div className="mt-1">
                      <CumpleField label="" rawValue={record.liberacion_inicial} containerClass={highlightFromStatus(record.liberacion_inicial)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Verificación Aleatoria Solución Desinfectante
                    </label>
                    <div className="mt-1">
                      <CumpleField label="" rawValue={record.verificacion_aleatoria} containerClass={highlightFromStatus(record.verificacion_aleatoria)} />
                    </div>
                  </div>
                </div>

                {temperaturaRangoActual && (
                  <div className="mb-4 text-sm text-gray-600 bg-blue-50/50 p-2 rounded-lg border border-blue-200">
                    <Thermometer className="inline h-4 w-4 mr-1 text-blue-600" />
                    Rango permitido del producto:{' '}
                    {typeof temperaturaRangoActual.min === 'number' ? `${temperaturaRangoActual.min}°C` : 'Sin mínimo'}
                    {' - '}
                    {typeof temperaturaRangoActual.max === 'number' ? `${temperaturaRangoActual.max}°C` : 'Sin máximo'}
                  </div>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="text-center">
                    <label className="text-xs font-medium text-gray-500">T AM 1 Envasado (°C)</label>
                    <p className={temperatureClass(record.tempam1)}>{record.tempam1}</p>
                  </div>
                  <div className="text-center">
                    <label className="text-xs font-medium text-gray-500">T AM 2 Envasado (°C)</label>
                    <p className={temperatureClass(record.tempam2)}>{record.tempam2}</p>
                  </div>
                  <div className="text-center">
                    <label className="text-xs font-medium text-gray-500">T PM 1 Envasado (°C)</label>
                    <p className={temperatureClass(record.temppm1)}>{record.temppm1}</p>
                  </div>
                  <div className="text-center">
                    <label className="text-xs font-medium text-gray-500">T PM 2 Envasado (°C)</label>
                    <p className={temperatureClass(record.temppm2)}>{record.temppm2}</p>
                  </div>
                </div>

                {(() => {
                  const parsed = parseNovCorrPorSeccion(record.novedades_proceso, record.observaciones_acciones_correctivas);
                  const novedades = String(parsed.temperatura.novedades || '').trim();
                  const correcciones = String(parsed.temperatura.correcciones || '').trim();
                  return (
                    (novedades || correcciones) && (
                      <div className="space-y-4">
                        {novedades && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-600" /> Novedades (Temperatura)
                            </label>
                            <p className="mt-1 text-sm bg-amber-50 border border-amber-200 p-3 rounded-lg whitespace-pre-wrap break-words shadow-sm">
                              {novedades}
                            </p>
                          </div>
                        )}
                        {correcciones && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Correcciones (Temperatura)
                            </label>
                            <p className="mt-1 text-sm bg-blue-50 border border-blue-200 p-3 rounded-lg whitespace-pre-wrap break-words shadow-sm">
                              {correcciones}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  );
                })()}
              </CardContent>
            </Card>

            {/* Análisis y Pruebas en Línea */}
            <Card className="shadow-md border-gray-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b border-gray-200">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                  <Beaker className="mr-2 h-5 w-5 text-purple-600" />
                  Análisis y Pruebas en Línea
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-5">
                <div>
                  <CumpleField
                    label="Análisis Sensorial (1) C - (0) NC"
                    rawValue={normalizeLineTestValue(
                      record.analisis_sensorial,
                      'Análisis Sensorial',
                      record.observaciones_acciones_correctivas
                    )}
                    containerClass={highlightFromStatus(record.analisis_sensorial)}
                  />
                </div>

                <div>
                  <CumpleField
                    label="Prueba de Hermeticidad (1) C - (0) NC"
                    rawValue={normalizeLineTestValue(
                      record.prueba_hermeticidad,
                      'Prueba de Hermeticidad',
                      record.observaciones_acciones_correctivas
                    )}
                    containerClass={highlightFromStatus(record.prueba_hermeticidad)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <CumpleField
                      label="Inspección Micropesaje No. Mezcla"
                      rawValue={normalizeLineTestValue(
                        record.inspeccion_micropesaje_mezcla,
                        'Inspección Micropesaje No. Mezcla',
                        record.observaciones_acciones_correctivas
                      )}
                      containerClass={highlightFromStatus(record.inspeccion_micropesaje_mezcla)}
                    />
                  </div>
                  <div>
                    <CumpleField
                      label="Inspección Micropesaje Resultado"
                      rawValue={normalizeLineTestValue(
                        record.inspeccion_micropesaje_resultado,
                        'Inspección Micropesaje Resultado',
                        record.observaciones_acciones_correctivas
                      )}
                      containerClass={highlightFromStatus(record.inspeccion_micropesaje_resultado)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Control de Peso Drenado */}
            <Card className="shadow-md border-gray-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                  <Scale className="mr-2 h-5 w-5 text-orange-600" />
                  Control de Peso Drenado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Nº Unidades a Revisar:</span> <span className="font-semibold">{record.total_unidades_revisar_drenado}</span></div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Peso Drenado Declarado:</span> <span className="font-semibold">{record.peso_drenado_declarado}</span></div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Rango Peso (Mín):</span> <span className="font-semibold">{record.rango_peso_drenado_min}</span></div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Rango Peso (Max):</span> <span className="font-semibold">{record.rango_peso_drenado_max}</span></div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Promedio de Peso:</span> <span className="font-semibold">{record.promedio_peso_drenado}</span></div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Pesos por Encima:</span> <span className="font-semibold">{record.encima_peso_drenado}</span></div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Pesos por Debajo:</span> <span className="font-semibold">{record.debajo_peso_drenado}</span></div>
                  <div className={highlightFromNumber(record.und_incumplen_rango_drenado)}>
                    <span className="text-gray-500 font-medium"># Und. Incumplen:</span> <span className="font-semibold">{record.und_incumplen_rango_drenado}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">% Und. Incumplen:</span> <span className="font-semibold">{record.porcentaje_incumplen_rango_drenado}%</span></div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" /> Pesos Drenados
                  </label>
                  <div className="mt-2">
                    <SamplesGrid values={parseCsvValues(record.pesos_drenados)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Control de Peso Neto */}
            <Card className="shadow-md border-gray-200">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                  <Scale className="mr-2 h-5 w-5 text-teal-600" />
                  Control de Peso Neto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Nº Unidades a Revisar:</span> <span className="font-semibold">{record.total_unidades_revisar_neto}</span></div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Peso Neto Declarado:</span> <span className="font-semibold">{record.peso_neto_declarado}</span></div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Promedio de Peso:</span> <span className="font-semibold">{record.promedio_peso_neto}</span></div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Pesos por Encima:</span> <span className="font-semibold">{record.encima_peso_neto}</span></div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">Pesos por Debajo:</span> <span className="font-semibold">{record.debajo_peso_neto}</span></div>
                  <div className={highlightFromNumber(record.und_incumplen_rango_neto)}>
                    <span className="text-gray-500 font-medium"># Und. Incumplen:</span> <span className="font-semibold">{record.und_incumplen_rango_neto}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="text-gray-500 font-medium">% Und. Incumplen:</span> <span className="font-semibold">{record.porcentaje_incumplen_rango_neto}%</span></div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" /> Pesos Netos
                  </label>
                  <div className="mt-2">
                    <SamplesGrid values={parseCsvValues(record.pesos_netos)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pruebas de Vacío */}
            <Card className="shadow-md border-gray-200">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                  <Gauge className="mr-2 h-5 w-5 text-slate-600" />
                  Pruebas de Vacío
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <TestTube className="h-3 w-3" /> Pruebas de Vacío en proceso
                  </label>
                  <div className="mt-2">
                    <VacioSamplesGrid
                      values={parseCsvValues(record.pruebas_vacio)}
                      range={parseVaciosRangeConfig(calidadRangoActual?.vacios)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3 w-3" /> Supervisor de Calidad
                  </label>
                  <p className="mt-1 text-sm font-medium text-gray-800">{record.supervisor_calidad}</p>
                </div>
                {(() => {
                  const parsed = parseNovCorrPorSeccion(record.novedades_proceso, record.observaciones_acciones_correctivas);
                  const novedades = String(parsed.vacio.novedades || '').trim();
                  const correcciones = String(parsed.vacio.correcciones || '').trim();
                  return (
                    (novedades || correcciones) && (
                      <div className="space-y-4">
                        {novedades && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-amber-600" /> Novedades (Pruebas de Vacío)
                            </label>
                            <p className="mt-1 text-sm bg-amber-50 border border-amber-200 p-3 rounded-lg whitespace-pre-wrap break-words shadow-sm">
                              {novedades}
                            </p>
                          </div>
                        )}
                        {correcciones && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Correcciones (Pruebas de Vacío)
                            </label>
                            <p className="mt-1 text-sm bg-blue-50 border border-blue-200 p-3 rounded-lg whitespace-pre-wrap break-words shadow-sm">
                              {correcciones}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  );
                })()}
              </CardContent>
            </Card>

            {/* Análisis PT */}
            <Card className="shadow-md border-gray-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                  <FlaskRound className="mr-2 h-5 w-5 text-indigo-600" />
                  Análisis de Producto Terminado (PT)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Análisis PT</label>
                  <p className="mt-1 text-sm font-medium text-gray-800">{formatDate(record.fechaanalisispt)}</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Hash className="h-3 w-3" /> No. Mezcla
                    </label>
                    <div className="mt-1">
                      <CumpleField label="" rawValue={record.no_mezcla_pt} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Gauge className="h-3 w-3" /> Vacío
                    </label>
                    <div className="mt-1">
                      <CumpleField label="" rawValue={record.vacio_pt} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Ruler className="h-3 w-3" /> °Brix
                    </label>
                    <p className={rangeClass(record.brix_pt, calidadRangoActual?.brix_min, calidadRangoActual?.brix_max)}>
                      {record.brix_pt}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <TestTube className="h-3 w-3" /> pH
                    </label>
                    <p className={rangeClass(record.ph_pt, calidadRangoActual?.ph_min, calidadRangoActual?.ph_max)}>
                      {record.ph_pt}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Droplet className="h-3 w-3" /> Acidez
                    </label>
                    <p className={rangeClass(record.acidez_pt, calidadRangoActual?.acidez_min, calidadRangoActual?.acidez_max)}>
                      {record.acidez_pt}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Beaker className="h-3 w-3" /> PPM-SO2
                    </label>
                    <p className={rangeClass(record.ppm_so2_pt, calidadRangoActual?.ppm_so2_min, calidadRangoActual?.ppm_so2_max)}>
                      {record.ppm_so2_pt}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Scale className="h-3 w-3" /> Peso Neto Real PT
                    </label>
                    <p className="text-lg font-semibold text-gray-800">{record.peso_neto_real_pt}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Scale className="h-3 w-3" /> Peso Drenado Real PT
                    </label>
                    <p className="text-lg font-semibold text-gray-800">{record.peso_drenado_real_pt}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Gauge className="h-3 w-3" /> Consistencia
                    </label>
                    <p
                      className={rangeClass(
                        record.consistencia_pt,
                        calidadRangoActual?.consistencia_min,
                        calidadRangoActual?.consistencia_max
                      )}
                    >
                      {record.consistencia_pt}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Sensorial
                    </label>
                    <CumpleField label="" rawValue={record.sensorial_pt} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Package className="h-3 w-3" /> Tapado/Cierre
                    </label>
                    <div className="mt-1">
                      <CumpleField label="" rawValue={record.tapado_cierre_pt} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Etiqueta
                    </label>
                    <div className="mt-1">
                      <CumpleField label="" rawValue={record.etiqueta_pt} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Award className="h-3 w-3" /> Presentación Final
                    </label>
                    <CumpleField label="" rawValue={record.presentacion_final_pt} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Ubicación Muestra
                    </label>
                    <p className="text-sm whitespace-pre-wrap break-words mt-1">{record.ubicacion_muestra_pt}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Estado
                    </label>
                    <div className="mt-1">
                      <CumpleField label="" rawValue={record.estado_pt} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Observaciones PT
                  </label>
                  <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap break-words shadow-sm">
                    {String(record.observaciones_pt || '').trim() ? record.observaciones_pt : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3 w-3" /> Responsable Análisis PT
                  </label>
                  <p className="whitespace-pre-wrap break-words mt-1 font-medium text-gray-800">{record.responsable_analisis_pt}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}