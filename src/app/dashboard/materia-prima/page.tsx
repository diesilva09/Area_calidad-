'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FileText, Save, Truck, Package, User, Car, Plus, Eye, Edit, Trash2 } from 'lucide-react';

type FormatoId = 'recal-040' | 'recal-038' | 'recal-062';

interface InspeccionVehiculo {
  formatId: 'recal-040';
  id: string;
  fecha: string;
  proveedor: string;
  producto: string;
  nombreConductor: string;
  placaVehiculo: string;
  loteProveedor: string;
  responsableCalidad: string;
  observaciones: string;
  cumplimiento: string;
  tipoMaterial: string;
  checks: boolean[];
  c: boolean[];
  nc: boolean[];
  na: boolean[];
}

interface AnalisisFisicoquimicoMateriaPrima {
  formatId: 'recal-038';
  id: string;
  materia_prima: string;
  fecha_ingreso: string;
  fecha_analisis: string;
  proveedor: string;
  producto: string;
  fecha_vencimiento: string;
  lote_interno: string;
  lote_proveedor: string;
  unds_analizar: string;
  l: string;
  brix: string;
  indice_refraccion: string;
  ph: string;
  densidad: string;
  acidez: string;
  neto: string;
  drenado: string;
  sulfitos_soppm: string;
  color: string;
  olor: string;
  sabor: string;
  textura: string;
  oxidacion: string;
  abolladura: string;
  filtracion: string;
  etiqueta: string;
  corrugado: string;
  identificacion_lote: string;
  und_analizar_visual: string;
  und_recibidas: string;
  realizado_por: string;
  observaciones: string;
  verificado_por: string;
}

interface AnalisisMaterialesEmpaque {
  formatId: 'recal-062';
  id: string;
  fecha_ingreso: string;
  fecha_analisis: string;
  proveedor: string;
  producto: string;
  lote_interno: string;
  lote_proveedor: string;
  unidades_analizar: string;
  peso: string;
  hermeticidad: string;
  punto_llenado: string;
  choque_termico: string;
  ajuste_etiqueta: string;
  verificacion_visual: string;
  diametro: string;
  largo: string;
  ancho: string;
  alto: string;
  observaciones: string;
  realizado_por: string;
}

type MateriaPrimaRecord = InspeccionVehiculo | AnalisisFisicoquimicoMateriaPrima | AnalisisMaterialesEmpaque;

export default function MateriaPrimaPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MateriaPrimaRecord | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FormatoId | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MateriaPrimaRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MateriaPrimaRecord | null>(null);

  // Estado inicial - sin registros de ejemplo
  const [registros, setRegistros] = useState<MateriaPrimaRecord[]>([]);

  // Cargar registros desde la base de datos al iniciar
  const fetchRegistros = async () => {
    try {
      const response = await fetch('/api/materia-prima');
      if (response.ok) {
        const data = await response.json();
        setRegistros(data);
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  const formatos = [
    {
      id: 'recal-040',
      nombre: 'Inspección de Vehículos para Recepción de Materia Prima',
      codigo: 'RE-CAL-040',
      version: '4',
      fechaAprobacion: 'ENERO 02 DE 2024',
      descripcion: 'Formato para inspección de vehículos que transportan materia prima'
    },
    {
      id: 'recal-038',
      nombre: 'ANALISIS FISICOQUIMICOS MATERIAS PRIMAS',
      codigo: 'RE-CAL-038',
      version: '1',
      fechaAprobacion: '10 de marzo 2025',
      descripcion: 'Formato para análisis fisicoquímico de materias primas'
    },
    {
      id: 'recal-062',
      nombre: 'ANALISIS MATERIALES DE EMPAQUE (ENVASES, TAPAS Y EMBALAJE)',
      codigo: 'RE-CAL-062',
      version: '1',
      fechaAprobacion: '10 de marzo 2025',
      descripcion: 'Formato para análisis de materiales de empaque'
    }
  ];

  const [formData, setFormData] = useState<Omit<InspeccionVehiculo, 'id' | 'formatId'>>({
    fecha: '',
    proveedor: '',
    producto: '',
    nombreConductor: '',
    placaVehiculo: '',
    loteProveedor: '',
    responsableCalidad: '',
    observaciones: '',
    cumplimiento: '',
    tipoMaterial: '',
    checks: Array(14).fill(false),
    c: Array(14).fill(false),
    nc: Array(14).fill(false),
    na: Array(14).fill(false)
  });

  const empty038: AnalisisFisicoquimicoMateriaPrima = {
    formatId: 'recal-038',
    id: '',
    materia_prima: '',
    fecha_ingreso: '',
    fecha_analisis: '',
    proveedor: '',
    producto: '',
    fecha_vencimiento: '',
    lote_interno: '',
    lote_proveedor: '',
    unds_analizar: '',
    l: '',
    brix: '',
    indice_refraccion: '',
    ph: '',
    densidad: '',
    acidez: '',
    neto: '',
    drenado: '',
    sulfitos_soppm: '',
    color: '',
    olor: '',
    sabor: '',
    textura: '',
    oxidacion: '',
    abolladura: '',
    filtracion: '',
    etiqueta: '',
    corrugado: '',
    identificacion_lote: '',
    und_analizar_visual: '',
    und_recibidas: '',
    realizado_por: '',
    observaciones: '',
    verificado_por: ''
  };

  // Helper to get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [formData038, setFormData038] = useState<AnalisisFisicoquimicoMateriaPrima>(empty038);

  const empty062: AnalisisMaterialesEmpaque = {
    formatId: 'recal-062',
    id: '',
    fecha_ingreso: '',
    fecha_analisis: '',
    proveedor: '',
    producto: '',
    lote_interno: '',
    lote_proveedor: '',
    unidades_analizar: '',
    peso: '',
    hermeticidad: '',
    punto_llenado: '',
    choque_termico: '',
    ajuste_etiqueta: '',
    verificacion_visual: '',
    diametro: '',
    largo: '',
    ancho: '',
    alto: '',
    observaciones: '',
    realizado_por: ''
  };

  const [formData062, setFormData062] = useState<AnalisisMaterialesEmpaque>(empty062);

  const [hoveredCheck, setHoveredCheck] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<{[key: number]: 'C' | 'NC' | 'NA' | 'SHOW_MENU' | 'SHOW_TOOLTIP' | null}>({});
  const [canHover, setCanHover] = useState(false);

  // Close dropdown when clicking outside
  const handlePageClick = () => {
    setSelectedOption({});
  };

  // Ensure form data arrays are always properly initialized
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      checks: Array.isArray(prev.checks) ? prev.checks : Array(14).fill(false),
      c: Array.isArray(prev.c) ? prev.c : Array(14).fill(false),
      nc: Array.isArray(prev.nc) ? prev.nc : Array(14).fill(false),
      na: Array.isArray(prev.na) ? prev.na : Array(14).fill(false)
    }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Calculate compliance percentage automatically
  useEffect(() => {
    const cArray = Array.isArray(formData.c) ? formData.c : Array(14).fill(false);
    const ncArray = Array.isArray(formData.nc) ? formData.nc : Array(14).fill(false);
    const naArray = Array.isArray(formData.na) ? formData.na : Array(14).fill(false);
    
    const countC = cArray.filter(item => item).length;
    const countNC = ncArray.filter(item => item).length;
    const countNA = naArray.filter(item => item).length;
    const totalChecked = countC + countNC + countNA;
    
    if (totalChecked > 0) {
      const compliancePercentage = Math.round((countC / totalChecked) * 100);
      setFormData(prev => ({
        ...prev,
        cumplimiento: `${compliancePercentage}%`
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cumplimiento: ''
      }));
    }
  }, [formData.c, formData.nc, formData.na]);

  // Get current counts for display
  const getCurrentCounts = () => {
    const cArray = Array.isArray(formData.c) ? formData.c : Array(14).fill(false);
    const ncArray = Array.isArray(formData.nc) ? formData.nc : Array(14).fill(false);
    const naArray = Array.isArray(formData.na) ? formData.na : Array(14).fill(false);
    
    // Safety check - ensure arrays are valid before filtering
    if (!cArray || !ncArray || !naArray) {
      console.warn('Arrays not properly initialized, returning zeros');
      return { countC: 0, countNC: 0, countNA: 0 };
    }
    
    return {
      countC: cArray.filter(item => item).length,
      countNC: ncArray.filter(item => item).length,
      countNA: naArray.filter(item => item).length
    };
  };

  const verificaciones = [
    "CUENTA CON ALGÚN TIPO DE SEGURIDAD (SELLO, CANDADO)",
    "VEHÍCULO LIMPIO, EXENTO DE OLORES Y LIBRE DE MATERIALES AJENOS A LA CARGA",
    "ESTADO GENERAL DEL VEHÍCULO",
    "EL PERSONAL INVOLUCRADO EN LA CARGA Y DESCARGA UTILIZA DOTACIÓN, EPP (USO OBLIGATORIO) LIMPIA Y COMPLETA",
    "EL PERSONAL SE ENCUENTRA EN BUEN ESTADO DE SALUD",
    "CERTIFICADO VIGENTE DE CAPACITACIÓN EN MANIPULACIÓN DE ALIMENTOS (CONDUCTOR Y AYUDANTE)",
    "CUENTA CON CERTIFICADO DE CAPACITACIÓN DE MANIPULACIÓN, ALMACENAMIENTO Y TRANSPORTE DE SUSTANCIAS QUÍMICAS",
    "CERTIFICADO VIGENTE DE FUMIGACIÓN",
    "LICENCIA SANITARIA VIGENTE DEL VEHÍCULO",
    "CUENTA CON CERTIFICADO DE CALIDAD E IDENTIFICACIÓN COMPLETA (LOTE, FP, FV)",
    "PRESENTA REGISTROS DE CONTROL DE TEMPERATURA Y MANTENIMIENTO/CALIBRACIÓN DEL EQUIPO DE MEDICIÓN (SI APLICA)",
    "LOS ALIMENTOS, INSUMOS, MATERIAL DE EMPAQUE, ETIQUETA SON TRANSPORTADOS EN CONDICIONES HIGIÉNICAS, EN BUEN ESTADO Y PROTEGIDOS DE CONTAMINACIÓN Y/O PROLIFERACIÓN MICROBIANA",
    "EL EMBALAJE DEL ENVASE RECIBIDO TIENE LA LEYENDA: 'PARA CONTACTO CON ALIMENTOS Y BEBIDAS', INFORMACIÓN DEL FABRICANTE Y LOTE (TRAZABILIDAD)",
    "AL EVIDENCIA DE CONTAMINACIÓN CRUZADA POR PRESENCIA DE ALÉRGENOS"
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange038 = (field: keyof AnalisisFisicoquimicoMateriaPrima, value: string) => {
    setFormData038(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange062 = (field: keyof AnalisisMaterialesEmpaque, value: string) => {
    setFormData062(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckChange = (index: number, option: 'C' | 'NC' | 'NA' | null) => {
    setFormData(prev => {
      const newChecks = Array.isArray(prev.checks) ? [...prev.checks] : Array(14).fill(false);
      const newC = Array.isArray(prev.c) ? [...prev.c] : Array(14).fill(false);
      const newNc = Array.isArray(prev.nc) ? [...prev.nc] : Array(14).fill(false);
      const newNa = Array.isArray(prev.na) ? [...prev.na] : Array(14).fill(false);
      
      if (option === 'C') {
        newChecks[index] = true;
        newC[index] = true;
        newNc[index] = false;
        newNa[index] = false;
      } else if (option === 'NC') {
        newChecks[index] = true;
        newC[index] = false;
        newNc[index] = true;
        newNa[index] = false;
      } else if (option === 'NA') {
        newChecks[index] = true;
        newC[index] = false;
        newNc[index] = false;
        newNa[index] = true;
      } else {
        // Si option es null, desmarcar todo
        newChecks[index] = false;
        newC[index] = false;
        newNc[index] = false;
        newNa[index] = false;
      }
      
      return {
        ...prev,
        checks: newChecks,
        c: newC,
        nc: newNc,
        na: newNa
      };
    });
    
    // Cerrar el menú después de seleccionar una opción
    setSelectedOption(prev => {
      const newOptions = { ...prev };
      delete newOptions[index];
      return newOptions;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedFormat === 'recal-040') {
        console.log('Guardando inspección RE-CAL-040:', formData);

        const dataToSend = {
          formatId: 'recal-040',
          ...formData,
          fecha: formData.fecha || new Date().toISOString().split('T')[0]
        };

        if (editingRecord) {
          // Actualizar registro existente
          const response = await fetch(`/api/materia-prima/${editingRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          if (!response.ok) throw new Error('Error al actualizar registro');

          const updatedRecord = await response.json();
          setRegistros(prev => prev.map(reg => (String(reg.id) === String(editingRecord.id) ? updatedRecord : reg)));
          toast({
            title: 'Registro actualizado',
            description: 'La inspección ha sido actualizada exitosamente',
          });
        } else {
          // Crear nuevo registro
          const response = await fetch('/api/materia-prima', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          if (!response.ok) throw new Error('Error al crear registro');

          const newRecord = await response.json();
          await fetchRegistros();
          toast({
            title: 'Registro guardado',
            description: 'La inspección ha sido guardada exitosamente',
          });
        }
      }

      if (selectedFormat === 'recal-038') {
        console.log('Guardando análisis RE-CAL-038:', formData038);

        const dataToSend = {
          formatId: 'recal-038',
          ...formData038
        };

        if (editingRecord) {
          const response = await fetch(`/api/materia-prima/${editingRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          if (!response.ok) throw new Error('Error al actualizar registro');

          const updatedRecord = await response.json();
          setRegistros(prev => prev.map(reg => (String(reg.id) === String(editingRecord.id) ? updatedRecord : reg)));
          toast({
            title: 'Registro actualizado',
            description: 'El análisis ha sido actualizado exitosamente',
          });
        } else {
          const response = await fetch('/api/materia-prima', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          if (!response.ok) throw new Error('Error al crear registro');

          const newRecord = await response.json();
          await fetchRegistros();
          toast({
            title: 'Registro guardado',
            description: 'El análisis ha sido guardado exitosamente',
          });
        }
      }

      if (selectedFormat === 'recal-062') {
        console.log('Guardando análisis RE-CAL-062:', formData062);

        const dataToSend = {
          formatId: 'recal-062',
          ...formData062
        };

        if (editingRecord) {
          const response = await fetch(`/api/materia-prima/${editingRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          if (!response.ok) throw new Error('Error al actualizar registro');

          const updatedRecord = await response.json();
          setRegistros(prev => prev.map(reg => (String(reg.id) === String(editingRecord.id) ? updatedRecord : reg)));
          toast({
            title: 'Registro actualizado',
            description: 'El análisis ha sido actualizado exitosamente',
          });
        } else {
          const response = await fetch('/api/materia-prima', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
          });

          if (!response.ok) throw new Error('Error al crear registro');

          const newRecord = await response.json();
          await fetchRegistros();
          toast({
            title: 'Registro guardado',
            description: 'El análisis ha sido guardado exitosamente',
          });
        }
      }

      setShowForm(false);
      setEditingRecord(null);
      // No establecer selectedFormat en null para mantener los registros visibles
      
      // Reset all forms after successful save
      setFormData({
        fecha: '',
        proveedor: '',
        producto: '',
        nombreConductor: '',
        placaVehiculo: '',
        loteProveedor: '',
        responsableCalidad: '',
        observaciones: '',
        cumplimiento: '',
        tipoMaterial: '',
        checks: Array(14).fill(false),
        c: Array(14).fill(false),
        nc: Array(14).fill(false),
        na: Array(14).fill(false)
      });
      setFormData038(empty038);
      setFormData062(empty062);

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el registro",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: MateriaPrimaRecord) => {
    setEditingRecord(record);
    setViewingRecord(null);

    if (record.formatId === 'recal-040') {
      const rec = record as any;
      
      // Helper to format date to YYYY-MM-DD for input type="date"
      const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };
      
      setFormData({
        fecha: formatDateForInput(rec.fecha),
        proveedor: rec.proveedor || '',
        producto: rec.producto || '',
        nombreConductor: rec.nombre_conductor || rec.nombreConductor || '',
        placaVehiculo: rec.placa_vehiculo || rec.placaVehiculo || '',
        loteProveedor: rec.lote_proveedor || rec.loteProveedor || '',
        responsableCalidad: rec.responsable_calidad || rec.responsableCalidad || '',
        observaciones: rec.observaciones || '',
        cumplimiento: rec.cumplimiento || '',
        tipoMaterial: rec.tipo_material || rec.tipoMaterial || '',
        checks: Array.isArray(rec.checks) ? rec.checks : Array(14).fill(false),
        c: Array.isArray(rec.c) ? rec.c : Array(14).fill(false),
        nc: Array.isArray(rec.nc) ? rec.nc : Array(14).fill(false),
        na: Array.isArray(rec.na) ? rec.na : Array(14).fill(false)
      });
      setSelectedOption({});
    }

    if (record.formatId === 'recal-038') {
      const rec = record as any;
      
      // Helper to format date to YYYY-MM-DD for input type="date"
      const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };
      
      setFormData038({
        formatId: 'recal-038',
        id: rec.id || '',
        materia_prima: rec.materia_prima || '',
        fecha_ingreso: formatDateForInput(rec.fecha_ingreso),
        fecha_analisis: formatDateForInput(rec.fecha_analisis),
        proveedor: rec.proveedor || '',
        producto: rec.producto || '',
        fecha_vencimiento: formatDateForInput(rec.fecha_vencimiento),
        lote_interno: rec.lote_interno || '',
        lote_proveedor: rec.lote_proveedor || '',
        unds_analizar: rec.unds_analizar || rec.und_analizar_visual || '',
        l: rec.l || '',
        brix: rec.brix || '',
        indice_refraccion: rec.indice_refraccion || '',
        ph: rec.ph || '',
        densidad: rec.densidad || '',
        acidez: rec.acidez || '',
        neto: rec.neto || '',
        drenado: rec.drenado || '',
        sulfitos_soppm: rec.sulfitos_soppm || '',
        color: rec.color || '',
        olor: rec.olor || '',
        sabor: rec.sabor || '',
        textura: rec.textura || '',
        oxidacion: rec.oxidacion || '',
        abolladura: rec.abolladura || '',
        filtracion: rec.filtracion || '',
        etiqueta: rec.etiqueta || '',
        corrugado: rec.corrugado || '',
        identificacion_lote: rec.identificacion_lote || '',
        und_analizar_visual: rec.und_analizar_visual || '',
        und_recibidas: rec.und_recibidas || '',
        realizado_por: rec.realizado_por || '',
        observaciones: rec.observaciones || '',
        verificado_por: rec.verificado_por || ''
      });
    }

    if (record.formatId === 'recal-062') {
      const rec = record as any;
      
      // Helper to format date to YYYY-MM-DD for input type="date"
      const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };
      
      const formDataToSet = {
        formatId: 'recal-062' as const,
        id: rec.id || '',
        fecha_ingreso: formatDateForInput(rec.fecha_ingreso),
        fecha_analisis: formatDateForInput(rec.fecha_analisis),
        proveedor: rec.proveedor || '',
        producto: rec.producto || '',
        lote_interno: rec.lote_interno || '',
        lote_proveedor: rec.lote_proveedor || '',
        unidades_analizar: rec.unidades_analizar || '',
        peso: rec.peso || '',
        hermeticidad: rec.hermeticidad || '',
        punto_llenado: rec.punto_llenado || '',
        choque_termico: rec.choque_termico || '',
        ajuste_etiqueta: rec.ajuste_etiqueta || '',
        verificacion_visual: rec.verificacion_visual || '',
        diametro: rec.diametro || '',
        largo: rec.largo || '',
        ancho: rec.ancho || '',
        alto: rec.alto || '',
        observaciones: rec.observaciones || '',
        realizado_por: rec.realizado_por || ''
      };
      
      setFormData062(formDataToSet);
    }

    setSelectedFormat(record.formatId);
    setShowForm(true);
  };

  const confirmDelete = (record: MateriaPrimaRecord) => {
    setRecordToDelete(record);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    
    try {
      const response = await fetch(`/api/materia-prima/${recordToDelete.id}?formatId=${recordToDelete.formatId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar registro');

      setRegistros(prev => prev.filter(reg => String(reg.id) !== String(recordToDelete.id)));
      toast({
        title: "Registro eliminado",
        description: "El registro ha sido eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive"
      });
    }
    setRecordToDelete(null);
  };

  const handleView = (record: MateriaPrimaRecord) => {
    handleEdit(record);
  };

  const handleSelectFormat = (formato: typeof formatos[0]) => {
    setSelectedFormat(formato.id as FormatoId);
    setShowForm(false);
    setEditingRecord(null);
    const today = getTodayDate();
    setFormData({
      fecha: today,
      proveedor: '',
      producto: '',
      nombreConductor: '',
      placaVehiculo: '',
      loteProveedor: '',
      responsableCalidad: '',
      observaciones: '',
      cumplimiento: '',
      tipoMaterial: '',
      checks: Array(14).fill(false),
      c: Array(14).fill(false),
      nc: Array(14).fill(false),
      na: Array(14).fill(false)
    });
    setFormData038({
      ...empty038,
      fecha_ingreso: today,
      fecha_analisis: today
    });
    setFormData062({
      ...empty062,
      fecha_ingreso: today,
      fecha_analisis: today
    });
  };

  const handleBackToFormats = () => {
    setSelectedFormat(null);
    setShowForm(false);
    setEditingRecord(null);
  };

  const registrosDelFormato = selectedFormat
    ? registros.filter((r) => r.formatId === selectedFormat)
    : [];

  const FormatoCard = ({ formato }: { formato: typeof formatos[0] }) => (
    <Card
      className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50"
      onClick={() => handleSelectFormat(formato)}
    >
      <CardHeader className={`text-white pb-4 ${
        formato.id === 'recal-038'
          ? 'bg-gradient-to-r from-purple-500 to-purple-600'
          : formato.id === 'recal-062'
          ? 'bg-gradient-to-r from-orange-500 to-orange-600'
          : 'bg-gradient-to-r from-green-400 to-green-500'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`bg-white px-3 py-1 rounded-full text-sm font-bold shadow-md ${
              formato.id === 'recal-038' ? 'text-purple-700' : formato.id === 'recal-062' ? 'text-orange-700' : 'text-green-600'
            }`}>
              {formato.codigo}
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                {formato.nombre}
              </CardTitle>
              <div className={`text-sm mt-1 ${
                formato.id === 'recal-038' ? 'text-purple-100' : formato.id === 'recal-062' ? 'text-orange-100' : 'text-green-100'
              }`}>
                <p>Código: {formato.codigo} | Versión: {formato.version}</p>
                <p>Fecha Aprobación: {formato.fechaAprobacion}</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 bg-gradient-to-br from-gray-50 to-white">
        <div className={`p-4 rounded-lg border ${
          formato.id === 'recal-038'
            ? 'bg-purple-50 border-purple-200'
            : formato.id === 'recal-062'
            ? 'bg-orange-50 border-orange-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <p className="text-gray-700 text-sm font-medium">{formato.descripcion}</p>
        </div>
        <div className="mt-4 flex items-center justify-center">
          <div className={`text-white px-4 py-2 rounded-lg font-semibold transition-colors ${
            formato.id === 'recal-038'
              ? 'bg-purple-600 hover:bg-purple-700'
              : formato.id === 'recal-062'
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-green-500 hover:bg-green-600'
          }`}>
            Click para acceder →
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AnalisisCard = ({ record }: { record: AnalisisFisicoquimicoMateriaPrima }) => (
    <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-purple-700 px-3 py-1 rounded-full text-sm font-bold shadow-md">
              RE-CAL-038
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                ANÁLISIS FISICOQUÍMICOS MATERIAS PRIMAS
              </CardTitle>
              <div className="text-sm text-purple-100 mt-1">
                <p>Fecha análisis: {record.fecha_analisis || '-'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleView(record)}
              className="flex items-center gap-1 bg-white text-purple-700 hover:bg-purple-50"
            >
              <Eye className="h-4 w-4" />
              Ver
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleEdit(record)}
              className="flex items-center gap-1 bg-white text-purple-700 hover:bg-purple-50"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => confirmDelete(record)}
              className="flex items-center gap-1 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 bg-gradient-to-br from-gray-50 to-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Materia prima:</span>
            <p className="text-gray-900 font-medium">{record.materia_prima}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Proveedor:</span>
            <p className="text-gray-900 font-medium">{record.proveedor}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmpaqueCard = ({ record }: { record: AnalisisMaterialesEmpaque }) => (
    <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-orange-700 px-3 py-1 rounded-full text-sm font-bold shadow-md">
              RE-CAL-062
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                ANÁLISIS MATERIALES DE EMPAQUE
              </CardTitle>
              <div className="text-sm text-orange-100 mt-1">
                <p>Fecha análisis: {record.fecha_analisis || '-'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleView(record)}
              className="flex items-center gap-1 bg-white text-orange-700 hover:bg-orange-50"
            >
              <Eye className="h-4 w-4" />
              Ver
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleEdit(record)}
              className="flex items-center gap-1 bg-white text-orange-700 hover:bg-orange-50"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => confirmDelete(record)}
              className="flex items-center gap-1 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 bg-gradient-to-br from-gray-50 to-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Proveedor:</span>
            <p className="text-gray-900 font-medium">{record.proveedor}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Producto:</span>
            <p className="text-gray-900 font-medium">{record.producto}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const InspeccionCard = ({ record }: { record: InspeccionVehiculo }) => (
    <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-blue-700 px-3 py-1 rounded-full text-sm font-bold shadow-md">
              RE-CAL-040
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                Inspección de Vehículos para Recepción de Materia Prima
              </CardTitle>
              <div className="text-sm text-blue-100 mt-1">
                <p>Código: RE-CAL-040 | Versión: 4</p>
                <p>Fecha: {record.fecha}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-sm font-semibold text-white bg-blue-800 px-2 py-1 rounded">
              {record.cumplimiento}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleView(record)}
            className="flex items-center gap-1 bg-white text-blue-700 hover:bg-blue-50"
          >
            <Eye className="h-4 w-4" />
            Ver
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleEdit(record)}
            className="flex items-center gap-1 bg-white text-blue-700 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => confirmDelete(record)}
            className="flex items-center gap-1 bg-red-600 text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 bg-gradient-to-br from-gray-50 to-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Proveedor:</span>
            <p className="text-gray-900 font-medium">{record.proveedor}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Producto:</span>
            <p className="text-gray-900 font-medium">{record.producto}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Conductor:</span>
            <p className="text-gray-900 font-medium">{record.nombreConductor}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Placa:</span>
            <p className="text-gray-900 font-medium">{record.placaVehiculo}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Lote:</span>
            <p className="text-gray-900 font-medium">{record.loteProveedor}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Tipo:</span>
            <p className="text-gray-900 font-medium capitalize">{record.tipoMaterial ? record.tipoMaterial.replace('-', ' ') : '-'}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-700 block mb-1">Responsable:</span>
            <p className="text-gray-900 font-medium">{record.responsableCalidad}</p>
          </div>
        </div>
        {record.observaciones && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="font-semibold text-gray-700 block mb-2">Observaciones:</span>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-gray-900">{record.observaciones}</p>
            </div>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="font-semibold text-gray-700 block mb-3">Lista de Verificación:</span>
          <div className="grid grid-cols-7 gap-2">
            {(Array.isArray(record.checks) ? record.checks : Array(14).fill(false)).map((checked, index) => {
              const isC = (Array.isArray(record.c) ? record.c : Array(14).fill(false))[index];
              const isNC = (Array.isArray(record.nc) ? record.nc : Array(14).fill(false))[index];
              const isNA = (Array.isArray(record.na) ? record.na : Array(14).fill(false))[index];
              
              return (
                <div key={`materia-prima-${(record as any).date || 'unknown'}-${index}`} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all transform hover:scale-105 ${
                  isC 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-700 text-white shadow-md' 
                    : isNC
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-600 text-white shadow-md'
                    : isNA
                    ? 'bg-gradient-to-br from-orange-400 to-orange-500 border-orange-600 text-white shadow-md'
                    : 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500 text-white shadow-md'
                }`}>
                  {index + 1}
                  
                  {/* Indicador visual de la opción seleccionada */}
                  {isC && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-green-600 rounded-full border-2 border-white transform translate-x-1 -translate-y-1"></div>
                  )}
                  {isNC && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white transform translate-x-1 -translate-y-1"></div>
                  )}
                  {isNA && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-orange-500 rounded-full border-2 border-white transform translate-x-1 -translate-y-1"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-white-50" onClick={handlePageClick}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Materia Prima</h1>
              <p className="text-gray-600">Gestión de materia prima</p>
            </div>
            {selectedFormat && (
              <Button
                onClick={handleBackToFormats}
                variant="outline"
                className="flex items-center gap-2"
              >
                ← Volver a Formatos
              </Button>
            )}
          </div>

          {/* Vista de formatos */}
          {!selectedFormat && !showForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formatos.map((formato) => (
                <FormatoCard key={formato.id} formato={formato} />
              ))}
            </div>
          )}

          {/* Vista de registros del formato seleccionado */}
          {selectedFormat && !showForm && (
            <div>
              {/* Header del formato con información */}
              <div className={`rounded-xl p-6 border mb-6 ${
                selectedFormat === 'recal-038'
                  ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
                  : selectedFormat === 'recal-062'
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'
                  : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg ${
                      selectedFormat === 'recal-038' ? 'bg-purple-600' : selectedFormat === 'recal-062' ? 'bg-orange-600' : 'bg-green-500'
                    }`}>
                      {formatos.find(f => f.id === selectedFormat)?.codigo}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {formatos.find(f => f.id === selectedFormat)?.nombre}
                      </h2>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Código: {formatos.find(f => f.id === selectedFormat)?.codigo} | Versión: {formatos.find(f => f.id === selectedFormat)?.version}</p>
                        <p>Fecha Aprobación: {formatos.find(f => f.id === selectedFormat)?.fechaAprobacion}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const today = getTodayDate();
                      setShowForm(true);
                      setEditingRecord(null);
                      setFormData({
                        fecha: today,
                        proveedor: '',
                        producto: '',
                        nombreConductor: '',
                        placaVehiculo: '',
                        loteProveedor: '',
                        responsableCalidad: '',
                        observaciones: '',
                        cumplimiento: '',
                        tipoMaterial: '',
                        checks: Array(14).fill(false),
                        c: Array(14).fill(false),
                        nc: Array(14).fill(false),
                        na: Array(14).fill(false)
                      });
                      setFormData038(prev => ({ ...empty038, fecha_ingreso: today, fecha_analisis: today }));
                      setFormData062(prev => ({ ...empty062, fecha_ingreso: today, fecha_analisis: today }));
                    }}
                    className={`flex items-center gap-2 text-white font-semibold shadow-lg transition-all hover:shadow-xl ${
                      selectedFormat === 'recal-038'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : selectedFormat === 'recal-062'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                    Nuevo Registro
                  </Button>
                </div>
              </div>

              {/* Lista de Registros */}
              {registrosDelFormato.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-gray-400 mb-4">
                    <FileText className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay registros</h3>
                  <p className="text-gray-600 mb-4">Comienza creando tu primer registro de inspección</p>
                  <Button
                    onClick={() => {
                      setShowForm(true);
                      setEditingRecord(null);
                      setFormData({
                        fecha: '',
                        proveedor: '',
                        producto: '',
                        nombreConductor: '',
                        placaVehiculo: '',
                        loteProveedor: '',
                        responsableCalidad: '',
                        observaciones: '',
                        cumplimiento: '',
                        tipoMaterial: '',
                        checks: Array(14).fill(false),
                        c: Array(14).fill(false),
                        nc: Array(14).fill(false),
                        na: Array(14).fill(false)
                      });
                    }}
                    className={`text-white ${
                      selectedFormat === 'recal-038'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : selectedFormat === 'recal-062'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className={`${
                      selectedFormat === 'recal-038'
                        ? 'bg-purple-50'
                        : selectedFormat === 'recal-062'
                        ? 'bg-orange-50'
                        : 'bg-green-50'
                    }`}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Proveedor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Producto</th>
                        {selectedFormat === 'recal-040' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Conductor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Placa</th>
                          </>
                        )}
                        {selectedFormat === 'recal-038' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Materia Prima</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Realizado Por</th>
                          </>
                        )}
                        {selectedFormat === 'recal-062' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Lote Interno</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Realizado Por</th>
                          </>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registrosDelFormato.map((record) => (
                        <tr 
                          key={`${record.formatId}-${record.id}`} 
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setViewingRecord(record)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.formatId === 'recal-040' 
                              ? (record as InspeccionVehiculo).fecha 
                              : (record as AnalisisFisicoquimicoMateriaPrima | AnalisisMaterialesEmpaque).fecha_analisis
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.proveedor}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.producto}</td>
                          {selectedFormat === 'recal-040' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(record as InspeccionVehiculo).nombreConductor}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(record as InspeccionVehiculo).placaVehiculo}</td>
                            </>
                          )}
                          {selectedFormat === 'recal-038' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(record as AnalisisFisicoquimicoMateriaPrima).materia_prima}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(record as AnalisisFisicoquimicoMateriaPrima).realizado_por}</td>
                            </>
                          )}
                          {selectedFormat === 'recal-062' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(record as AnalisisMaterialesEmpaque).lote_interno || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(record as AnalisisMaterialesEmpaque).realizado_por}</td>
                            </>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(record);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(record);
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Modal para formulario */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-50">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-blue-900">
                        {editingRecord ? 'Editar Registro' : 'Nuevo Registro'}
                      </h2>
                      <div className="mt-1 text-sm text-blue-800">
                        <div className="font-semibold">{formatos.find(f => f.id === selectedFormat)?.nombre}</div>
                        <div>
                          {formatos.find(f => f.id === selectedFormat)?.codigo} | Versión: {formatos.find(f => f.id === selectedFormat)?.version} | Fecha Aprobación: {formatos.find(f => f.id === selectedFormat)?.fechaAprobacion}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowForm(false);
                        setEditingRecord(null);
                        setFormData({
                          fecha: '',
                          proveedor: '',
                          producto: '',
                          nombreConductor: '',
                          placaVehiculo: '',
                          loteProveedor: '',
                          responsableCalidad: '',
                          observaciones: '',
                          cumplimiento: '',
                          tipoMaterial: '',
                          checks: Array(14).fill(false),
                          c: Array(14).fill(false),
                          nc: Array(14).fill(false),
                          na: Array(14).fill(false)
                        });
                      }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {selectedFormat === 'recal-038' && (
                      <div key={`recal038-form-${editingRecord?.id || 'new'}`} className="space-y-3">
                        <div className="text-sm font-semibold text-gray-700">MATERIA PRIMA</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mp_materia_prima">MATERIA PRIMA</Label>
                            <Input id="mp_materia_prima" value={formData038.materia_prima} onChange={(e) => handleInputChange038('materia_prima', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_fecha_ingreso">FECHA DE INGRESO</Label>
                            <Input id="mp_fecha_ingreso" type="date" value={formData038.fecha_ingreso} onChange={(e) => handleInputChange038('fecha_ingreso', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_fecha_analisis">FECHA DE ANALISIS</Label>
                            <Input id="mp_fecha_analisis" type="date" value={formData038.fecha_analisis} onChange={(e) => handleInputChange038('fecha_analisis', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_proveedor">PROVEEDOR</Label>
                            <Input id="mp_proveedor" value={formData038.proveedor} onChange={(e) => handleInputChange038('proveedor', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_producto">PRODUCTO</Label>
                            <Input id="mp_producto" value={formData038.producto} onChange={(e) => handleInputChange038('producto', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_fecha_vencimiento">FECHA DE VENCIMIENTO</Label>
                            <Input
                              id="mp_fecha_vencimiento"
                              type="date"
                              value={formData038.fecha_vencimiento}
                              onChange={(e) => handleInputChange038('fecha_vencimiento', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_lote_interno">LOTE INTERNO</Label>
                            <Input id="mp_lote_interno" value={formData038.lote_interno} onChange={(e) => handleInputChange038('lote_interno', e.target.value)} />
                          </div>
                        </div>

                        <div className="text-sm font-semibold text-gray-700">ANALISIS FISICOQUIMICO</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mp_lote_proveedor">LOTE PROVEEDOR</Label>
                            <Input id="mp_lote_proveedor" value={formData038.lote_proveedor} onChange={(e) => handleInputChange038('lote_proveedor', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_unds_analizar">UNDS. ANALIZAR</Label>
                            <Input id="mp_unds_analizar" value={formData038.unds_analizar} onChange={(e) => handleInputChange038('unds_analizar', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_l">L</Label>
                            <Input id="mp_l" value={formData038.l} onChange={(e) => handleInputChange038('l', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_brix">BRIX</Label>
                            <Input id="mp_brix" value={formData038.brix} onChange={(e) => handleInputChange038('brix', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_indice_refraccion">INDICE DE REFRACCION</Label>
                            <Input id="mp_indice_refraccion" value={formData038.indice_refraccion} onChange={(e) => handleInputChange038('indice_refraccion', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_ph">pH</Label>
                            <Input id="mp_ph" value={formData038.ph} onChange={(e) => handleInputChange038('ph', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_densidad">DENSIDAD</Label>
                            <Input id="mp_densidad" value={formData038.densidad} onChange={(e) => handleInputChange038('densidad', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_acidez">ACIDEZ</Label>
                            <Input id="mp_acidez" value={formData038.acidez} onChange={(e) => handleInputChange038('acidez', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_neto">NETO</Label>
                            <Input id="mp_neto" value={formData038.neto} onChange={(e) => handleInputChange038('neto', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_drenado">DRENADO</Label>
                            <Input id="mp_drenado" value={formData038.drenado} onChange={(e) => handleInputChange038('drenado', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_sulfitos">SULFITOS (SOPPM)</Label>
                            <Input id="mp_sulfitos" value={formData038.sulfitos_soppm} onChange={(e) => handleInputChange038('sulfitos_soppm', e.target.value)} />
                          </div>
                        </div>

                        <div className="text-sm font-semibold text-gray-700">ORGANOLEPTICO</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mp_color">COLOR</Label>
                            <Input id="mp_color" value={formData038.color} onChange={(e) => handleInputChange038('color', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_olor">OLOR</Label>
                            <Input id="mp_olor" value={formData038.olor} onChange={(e) => handleInputChange038('olor', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_sabor">SABOR</Label>
                            <Input id="mp_sabor" value={formData038.sabor} onChange={(e) => handleInputChange038('sabor', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_textura">TEXTURA</Label>
                            <Input id="mp_textura" value={formData038.textura} onChange={(e) => handleInputChange038('textura', e.target.value)} />
                          </div>
                        </div>

                        <div className="text-sm font-semibold text-gray-700">VISUAL</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mp_oxidacion">OXIDACIÓN</Label>
                            <Input id="mp_oxidacion" value={formData038.oxidacion} onChange={(e) => handleInputChange038('oxidacion', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_abolladura">ABOLLADURA</Label>
                            <Input id="mp_abolladura" value={formData038.abolladura} onChange={(e) => handleInputChange038('abolladura', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_filtracion">FILTRACIÓN</Label>
                            <Input id="mp_filtracion" value={formData038.filtracion} onChange={(e) => handleInputChange038('filtracion', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_etiqueta">ETIQUETA</Label>
                            <Input id="mp_etiqueta" value={formData038.etiqueta} onChange={(e) => handleInputChange038('etiqueta', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_corrugado">CORRUGADO</Label>
                            <Input id="mp_corrugado" value={formData038.corrugado} onChange={(e) => handleInputChange038('corrugado', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_identificacion_lote">IDENTIFICACIÓN LOTE</Label>
                            <Input id="mp_identificacion_lote" value={formData038.identificacion_lote} onChange={(e) => handleInputChange038('identificacion_lote', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_und_analizar_visual">UND. ANALIZAR</Label>
                            <Input id="mp_und_analizar_visual" value={formData038.und_analizar_visual} onChange={(e) => handleInputChange038('und_analizar_visual', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_und_recibidas">UND. RECIBIDAS</Label>
                            <Input id="mp_und_recibidas" value={formData038.und_recibidas} onChange={(e) => handleInputChange038('und_recibidas', e.target.value)} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mp_realizado_por">REALIZADO POR:</Label>
                            <Input id="mp_realizado_por" value={formData038.realizado_por} onChange={(e) => handleInputChange038('realizado_por', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mp_verificado_por">VERIFICADO POR:</Label>
                            <Input id="mp_verificado_por" value={formData038.verificado_por} onChange={(e) => handleInputChange038('verificado_por', e.target.value)} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mp_observaciones">OBSERVACIONES</Label>
                          <Textarea
                            id="mp_observaciones"
                            value={formData038.observaciones || ''}
                            onChange={(e) => handleInputChange038('observaciones', e.target.value)}
                            placeholder="Ingrese observaciones adicionales..."
                            rows={4}
                          />
                        </div>
                      </div>
                    )}

                    {selectedFormat === 'recal-062' && (
                      <div key={`recal062-form-${editingRecord?.id || 'new'}`} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="em_fecha_ingreso">FECHA DE INGRESO</Label>
                            <Input id="em_fecha_ingreso" type="date" value={formData062.fecha_ingreso} onChange={(e) => handleInputChange062('fecha_ingreso', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_fecha_analisis">FECHA DE ANALISIS</Label>
                            <Input id="em_fecha_analisis" type="date" value={formData062.fecha_analisis} onChange={(e) => handleInputChange062('fecha_analisis', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_proveedor">PROVEEDOR</Label>
                            <Input id="em_proveedor" value={formData062.proveedor} onChange={(e) => handleInputChange062('proveedor', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_producto">PRODUCTO</Label>
                            <Input id="em_producto" value={formData062.producto} onChange={(e) => handleInputChange062('producto', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_lote_interno">LOTE INTERNO</Label>
                            <Input id="em_lote_interno" value={formData062.lote_interno} onChange={(e) => handleInputChange062('lote_interno', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_lote_proveedor">LOTE PROVEEDOR</Label>
                            <Input id="em_lote_proveedor" value={formData062.lote_proveedor} onChange={(e) => handleInputChange062('lote_proveedor', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_unidades_analizar">UNIDADES A ANALIZAR</Label>
                            <Input id="em_unidades_analizar" value={formData062.unidades_analizar} onChange={(e) => handleInputChange062('unidades_analizar', e.target.value)} />
                          </div>
                        </div>

                        <div className="text-sm font-semibold text-gray-700 mt-4">PRUEBAS</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="em_peso">PESO</Label>
                            <Input id="em_peso" value={formData062.peso} onChange={(e) => handleInputChange062('peso', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_hermeticidad">HERMETICIDAD</Label>
                            <Input id="em_hermeticidad" value={formData062.hermeticidad} onChange={(e) => handleInputChange062('hermeticidad', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_punto_llenado">PUNTO DE LLENADO</Label>
                            <Input id="em_punto_llenado" value={formData062.punto_llenado} onChange={(e) => handleInputChange062('punto_llenado', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_choque_termico">CHOQUE TERMICO</Label>
                            <Input id="em_choque_termico" value={formData062.choque_termico} onChange={(e) => handleInputChange062('choque_termico', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_ajuste_etiqueta">AJUSTE ETIQUETA</Label>
                            <Input id="em_ajuste_etiqueta" value={formData062.ajuste_etiqueta} onChange={(e) => handleInputChange062('ajuste_etiqueta', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_verificacion_visual">VERIFICACION VISUAL</Label>
                            <Input id="em_verificacion_visual" value={formData062.verificacion_visual} onChange={(e) => handleInputChange062('verificacion_visual', e.target.value)} />
                          </div>
                        </div>

                        <div className="text-sm font-semibold text-gray-700 mt-4">DIMENSIONES</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="em_diametro">DIAMETRO</Label>
                            <Input id="em_diametro" value={formData062.diametro} onChange={(e) => handleInputChange062('diametro', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_largo">LARGO</Label>
                            <Input id="em_largo" value={formData062.largo} onChange={(e) => handleInputChange062('largo', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_ancho">ANCHO</Label>
                            <Input id="em_ancho" value={formData062.ancho} onChange={(e) => handleInputChange062('ancho', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="em_alto">ALTO</Label>
                            <Input id="em_alto" value={formData062.alto} onChange={(e) => handleInputChange062('alto', e.target.value)} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="em_realizado_por">REALIZADO POR</Label>
                            <Input id="em_realizado_por" value={formData062.realizado_por} onChange={(e) => handleInputChange062('realizado_por', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedFormat !== 'recal-038' && selectedFormat !== 'recal-062' && (<div key={`recal040-form-${editingRecord?.id || 'new'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fecha">FECHA</Label>
                        <Input
                          id="fecha"
                          type="date"
                          value={formData.fecha}
                          onChange={(e) => handleInputChange('fecha', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proveedor">PROVEEDOR</Label>
                        <Input
                          id="proveedor"
                          value={formData.proveedor}
                          onChange={(e) => handleInputChange('proveedor', e.target.value)}
                          placeholder="Nombre del proveedor"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="producto">PRODUCTO</Label>
                        <Input
                          id="producto"
                          value={formData.producto}
                          onChange={(e) => handleInputChange('producto', e.target.value)}
                          placeholder="Producto recibido"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nombreConductor">NOMBRE DEL CONDUCTOR</Label>
                        <Input
                          id="nombreConductor"
                          value={formData.nombreConductor}
                          onChange={(e) => handleInputChange('nombreConductor', e.target.value)}
                          placeholder="Nombre completo del conductor"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="placaVehiculo">PLACA DEL VEHÍCULO</Label>
                        <Input
                          id="placaVehiculo"
                          value={formData.placaVehiculo}
                          onChange={(e) => handleInputChange('placaVehiculo', e.target.value)}
                          placeholder="Placa del vehículo"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="loteProveedor">LOTE PROVEEDOR</Label>
                        <Input
                          id="loteProveedor"
                          value={formData.loteProveedor}
                          onChange={(e) => handleInputChange('loteProveedor', e.target.value)}
                          placeholder="Número de lote del proveedor"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="responsableCalidad">RESPONSABLE ÁREA DE CALIDAD</Label>
                        <Input
                          id="responsableCalidad"
                          value={formData.responsableCalidad}
                          onChange={(e) => handleInputChange('responsableCalidad', e.target.value)}
                          placeholder="Nombre del responsable de calidad"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tipoMaterial">TIPO DE MATERIAL</Label>
                        <Select value={formData.tipoMaterial} onValueChange={(value) => handleInputChange('tipoMaterial', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione tipo de material" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="materia-prima">MATERIA PRIMA</SelectItem>
                            <SelectItem value="material-empaque">MATERIAL DE EMPAQUE</SelectItem>
                            <SelectItem value="insumos">INSUMOS</SelectItem>
                            <SelectItem value="producto-terminado">PRODUCTO TERMINADO</SelectItem>
                            <SelectItem value="materia-prima-fresca">MATERIA PRIMA FRESCA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-700 mb-3">Lista de Verificación:</div>
                      <div className="grid grid-cols-7 gap-2">
                        {(Array.isArray(formData.checks) ? formData.checks : Array(14).fill(false)).map((checked, index) => {
                          const currentOption = selectedOption[index];
                          const isMenuOpen = currentOption === 'SHOW_MENU';
                          const isTooltipOpen = currentOption === 'SHOW_TOOLTIP';
                          const isC = (Array.isArray(formData.c) ? formData.c : Array(14).fill(false))[index];
                          const isNC = (Array.isArray(formData.nc) ? formData.nc : Array(14).fill(false))[index];
                          const isNA = (Array.isArray(formData.na) ? formData.na : Array(14).fill(false))[index];
                          
                          // Determinar si el menú debe aparecer hacia arriba (primeras 2 filas = índices 0-13)
                          const isInTopRows = index < 7; // Primera fila (índices 0-6)
                          const dropdownPosition = isInTopRows ? 'bottom-full mb-2' : 'top-full mt-2';
                          const tooltipPosition = isInTopRows ? 'bottom-full mb-2' : 'top-full mt-2';
                          const shouldShowTooltip = (canHover && hoveredCheck === index) || (!canHover && isTooltipOpen);

                          const colIndex = index % 7;
                          const tooltipAlignClass = colIndex === 0
                            ? 'left-0'
                            : colIndex === 6
                            ? 'right-0'
                            : 'left-1/2 transform -translate-x-1/2';
                          const tooltipArrowAlignClass = colIndex === 0
                            ? 'left-4'
                            : colIndex === 6
                            ? 'right-4'
                            : 'left-1/2 transform -translate-x-1/2';
                          const dropdownAlignClass = colIndex === 0
                            ? 'left-0'
                            : colIndex === 6
                            ? 'right-0'
                            : 'left-1/2 transform -translate-x-1/2';
                          
                          return (
                            <div 
                              key={index} 
                              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all transform cursor-pointer relative ${
                                isC 
                                  ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-700 text-white shadow-md' 
                                  : isNC
                                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-600 text-white shadow-md'
                                  : isNA
                                  ? 'bg-gradient-to-br from-orange-400 to-orange-500 border-orange-600 text-white shadow-md'
                                  : 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500 text-white shadow-md'
                              } ${hoveredCheck === index ? 'scale-110 ring-2 ring-blue-400' : ''}`}
                              onMouseEnter={() => setHoveredCheck(index)}
                              onMouseLeave={() => setHoveredCheck(null)}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent page click handler
                                if (canHover) {
                                  // Desktop: click abre/cierra menú directamente
                                  setSelectedOption(prev => ({
                                    ...prev,
                                    [index]: prev[index] === undefined ? 'SHOW_MENU' : undefined
                                  }));
                                  return;
                                }

                                // Móvil: 1er tap muestra texto, 2do tap muestra opciones, 3er tap cierra
                                setSelectedOption(prev => {
                                  const next = { ...prev };
                                  const curr = prev[index];
                                  if (curr === undefined) next[index] = 'SHOW_TOOLTIP';
                                  else if (curr === 'SHOW_TOOLTIP') next[index] = 'SHOW_MENU';
                                  else delete next[index];
                                  return next;
                                });
                              }}
                            >
                              {index + 1}
                              
                              {/* Indicador visual de la opción seleccionada */}
                              {isC && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-green-600 rounded-full border-2 border-white transform translate-x-1 -translate-y-1"></div>
                              )}
                              {isNC && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white transform translate-x-1 -translate-y-1"></div>
                              )}
                              {isNA && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-orange-500 rounded-full border-2 border-white transform translate-x-1 -translate-y-1"></div>
                              )}
                              
                              {/* Tooltip con descripción */}
                              {shouldShowTooltip && !isMenuOpen && (
                                <div className={`absolute ${tooltipPosition} ${tooltipAlignClass} z-[60] w-64 max-w-[calc(100vw-2rem)] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-normal break-words`}>
                                  <div className="font-bold mb-1">Verificación {index + 1}</div>
                                  <div className="text-gray-300">{verificaciones[index]}</div>
                                  <div className={`absolute ${isInTopRows ? 'bottom-0 translate-y-full' : 'top-0 -translate-y-full'} ${tooltipArrowAlignClass} w-0 h-0 ${isInTopRows ? 'border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900' : 'border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-900'}`}></div>
                                </div>
                              )}
                              
                              {/* Opciones desplegables */}
                              {isMenuOpen && (
                                <div className={`absolute ${dropdownPosition} ${dropdownAlignClass} z-[70] bg-white rounded-lg shadow-xl border border-gray-200 p-1 min-w-[140px]`} onClick={(e) => e.stopPropagation()}>
                                  <div className="space-y-1">
                                    <button
                                      onClick={() => handleCheckChange(index, 'C')}
                                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                                        (Array.isArray(formData.c) ? formData.c : Array(14).fill(false))[index] 
                                          ? 'bg-green-500 text-white' 
                                          : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                                      }`}
                                    >
                                      ✅ Conforme
                                    </button>
                                    <button
                                      onClick={() => handleCheckChange(index, 'NC')}
                                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                                        (Array.isArray(formData.nc) ? formData.nc : Array(14).fill(false))[index] 
                                          ? 'bg-yellow-500 text-white' 
                                          : 'bg-gray-100 text-gray-700 hover:bg-yellow-100'
                                      }`}
                                    >
                                      ⚠️ No Conforme
                                    </button>
                                    <button
                                      onClick={() => handleCheckChange(index, 'NA')}
                                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                                        (Array.isArray(formData.na) ? formData.na : Array(14).fill(false))[index] 
                                          ? 'bg-orange-500 text-white' 
                                          : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                                      }`}
                                    >
                                      ❌ No Aplica
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="porcentajeCumplimiento">PORCENTAJE CUMPLIMIENTO</Label>
                        <Input
                          id="porcentajeCumplimiento"
                          value={formData.cumplimiento}
                          onChange={(e) => handleInputChange('cumplimiento', e.target.value)}
                          placeholder="Ej: 95%"
                          readOnly
                        />
                      </div>
                      
                      {/* Contadores visuales */}
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-700">Resumen de Verificación:</div>
                        <div className="flex gap-3">
                          <div className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg border border-green-200 flex-1 min-w-[120px]">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              C
                            </div>
                            <div className="text-sm font-medium text-green-700">
                              <div>Conforme</div>
                              <div className="text-lg font-bold">{getCurrentCounts().countC}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex-1 min-w-[120px]">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              NC
                            </div>
                            <div className="text-sm font-medium text-yellow-700">
                              <div>No Conforme</div>
                              <div className="text-lg font-bold">{getCurrentCounts().countNC}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 bg-orange-50 p-3 rounded-lg border border-orange-200 flex-1 min-w-[120px]">
                            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              NA
                            </div>
                            <div className="text-sm font-medium text-orange-700">
                              <div>No Aplica</div>
                              <div className="text-lg font-bold">{getCurrentCounts().countNA}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div> {/* ← CIERRE DEL GRID CORREGIDO */}
                    </div>)}

                    {selectedFormat === 'recal-062' && (
                      <div className="space-y-2">
                        <Label htmlFor="em_observaciones">OBSERVACIONES ADICIONALES</Label>
                        <Textarea
                          id="em_observaciones"
                          value={formData062.observaciones || ''}
                          onChange={(e) => handleInputChange062('observaciones', e.target.value)}
                          placeholder="Ingrese observaciones adicionales..."
                          rows={4}
                        />
                      </div>
                    )}
                    {selectedFormat !== 'recal-038' && selectedFormat !== 'recal-062' && (
                      <div className="space-y-2">
                        <Label htmlFor="observaciones">OBSERVACIONES</Label>
                        <Textarea
                          id="observaciones"
                          value={formData.observaciones || ''}
                          onChange={(e) => handleInputChange('observaciones', e.target.value)}
                          placeholder="Ingrese observaciones adicionales..."
                          rows={4}
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowForm(false);
                          setEditingRecord(null);
                          setFormData({
                            fecha: '',
                            proveedor: '',
                            producto: '',
                            nombreConductor: '',
                            placaVehiculo: '',
                            loteProveedor: '',
                            responsableCalidad: '',
                            observaciones: '',
                            cumplimiento: '',
                            tipoMaterial: '',
                            checks: Array(14).fill(false),
                            c: Array(14).fill(false),
                            nc: Array(14).fill(false),
                            na: Array(14).fill(false)
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Guardando...' : (editingRecord ? 'Actualizar Registro' : 'Guardar Registro')}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal para ver detalles del registro */}
          {viewingRecord && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-50">
                <div className={`bg-gradient-to-r border-b px-6 py-4 ${
                  viewingRecord.formatId === 'recal-038'
                    ? 'from-purple-50 to-purple-100 border-purple-200'
                    : viewingRecord.formatId === 'recal-062'
                    ? 'from-orange-50 to-orange-100 border-orange-200'
                    : 'from-green-50 to-green-100 border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Detalles del Registro
                      </h2>
                      <div className="mt-1 text-sm text-gray-600">
                        <div className="font-semibold">{formatos.find(f => f.id === viewingRecord.formatId)?.nombre}</div>
                        <div>
                          {formatos.find(f => f.id === viewingRecord.formatId)?.codigo} | Versión: {formatos.find(f => f.id === viewingRecord.formatId)?.version}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingRecord(null)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  {viewingRecord.formatId === 'recal-040' && (() => {
                    const rec = viewingRecord as any;
                    const checks = Array.isArray(rec.checks) ? rec.checks : Array(14).fill(false);
                    const cArray = Array.isArray(rec.c) ? rec.c : Array(14).fill(false);
                    const ncArray = Array.isArray(rec.nc) ? rec.nc : Array(14).fill(false);
                    const naArray = Array.isArray(rec.na) ? rec.na : Array(14).fill(false);
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">Fecha:</span>
                            <p className="text-gray-900">{rec.fecha || '-'}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">Proveedor:</span>
                            <p className="text-gray-900">{rec.proveedor || '-'}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">Producto:</span>
                            <p className="text-gray-900">{rec.producto || '-'}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">Nombre Conductor:</span>
                            <p className="text-gray-900">{rec.nombre_conductor || rec.nombreConductor || '-'}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">Placa Vehículo:</span>
                            <p className="text-gray-900">{rec.placa_vehiculo || rec.placaVehiculo || '-'}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">Lote Proveedor:</span>
                            <p className="text-gray-900">{rec.lote_proveedor || rec.loteProveedor || '-'}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">Responsable Calidad:</span>
                            <p className="text-gray-900">{rec.responsable_calidad || rec.responsableCalidad || '-'}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">Tipo Material:</span>
                            <p className="text-gray-900">{rec.tipo_material || rec.tipoMaterial || '-'}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="font-semibold text-gray-700 block mb-1">Cumplimiento:</span>
                            <p className="text-gray-900">{rec.cumplimiento || '-'}</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-2">Observaciones:</span>
                          <p className="text-gray-900">{rec.observaciones || rec.observaciones || '-'}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-3">Lista de Verificación (14 ítems):</span>
                          <div className="space-y-2">
                            {verificaciones.map((texto, index) => {
                              const isC = cArray[index];
                              const isNC = ncArray[index];
                              const isNA = naArray[index];
                              const isChecked = checks[index];
                              
                              let statusText = 'No evaluado';
                              let statusClass = 'bg-gray-100 text-gray-600';
                              let statusBadge = '⚪';
                              
                              if (isC) {
                                statusText = 'Cumple (C)';
                                statusClass = 'bg-green-100 text-green-700 border-green-300';
                                statusBadge = '✅';
                              } else if (isNC) {
                                statusText = 'No Cumple (NC)';
                                statusClass = 'bg-yellow-100 text-yellow-700 border-yellow-300';
                                statusBadge = '⚠️';
                              } else if (isNA) {
                                statusText = 'No Aplica (NA)';
                                statusClass = 'bg-orange-100 text-orange-700 border-orange-300';
                                statusBadge = '❌';
                              }
                              
                              return (
                                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${statusClass}`}>
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/50 flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">{texto}</p>
                                    <p className="text-xs mt-1 font-semibold">{statusBadge} {statusText}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {viewingRecord.formatId === 'recal-038' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Materia Prima:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).materia_prima}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Fecha Ingreso:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).fecha_ingreso}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Fecha Análisis:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).fecha_analisis}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Proveedor:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).proveedor}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Producto:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).producto}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Fecha Vencimiento:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).fecha_vencimiento || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Lote Interno:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).lote_interno || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Lote Proveedor:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).lote_proveedor || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Unidades a Analizar:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).unds_analizar || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">L (Litros):</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).l || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Brix:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).brix || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Índice de Refracción:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).indice_refraccion || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">pH:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).ph || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Densidad:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).densidad || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Acidez:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).acidez || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Neto:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).neto || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Drenado:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).drenado || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Sulfitos (SO2 ppm):</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).sulfitos_soppm || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Color:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).color || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Olor:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).olor || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Sabor:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).sabor || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Textura:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).textura || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Oxidación:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).oxidacion || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Abolladura:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).abolladura || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Filtración:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).filtracion || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Etiqueta:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).etiqueta || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Corrugado:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).corrugado || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Identificación Lote:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).identificacion_lote || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Und. Analizar Visual:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).und_analizar_visual || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Und. Recibidas:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).und_recibidas || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Realizado Por:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).realizado_por}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Verificado Por:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).verificado_por || '-'}</p>
                        </div>
                      </div>
                      {(viewingRecord as AnalisisFisicoquimicoMateriaPrima).observaciones && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-2">Observaciones:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisFisicoquimicoMateriaPrima).observaciones}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {viewingRecord.formatId === 'recal-062' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Fecha Ingreso:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).fecha_ingreso}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Fecha Análisis:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).fecha_analisis}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Proveedor:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).proveedor}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Producto:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).producto}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Lote Interno:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).lote_interno || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Lote Proveedor:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).lote_proveedor || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Unidades a Analizar:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).unidades_analizar || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Peso:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).peso || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Hermeticidad:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).hermeticidad || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Punto de Llenado:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).punto_llenado || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Choque Térmico:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).choque_termico || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Ajuste de Etiqueta:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).ajuste_etiqueta || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Verificación Visual:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).verificacion_visual || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Diámetro:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).diametro || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Largo:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).largo || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Ancho:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).ancho || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Alto:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).alto || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-1">Realizado Por:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).realizado_por}</p>
                        </div>
                      </div>
                      {(viewingRecord as AnalisisMaterialesEmpaque).observaciones && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-2">Observaciones Adicionales:</span>
                          <p className="text-gray-900">{(viewingRecord as AnalisisMaterialesEmpaque).observaciones}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-6 flex justify-end gap-3">
                    <Button
                      onClick={() => handleEdit(viewingRecord)}
                      variant="outline"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => setViewingRecord(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          {recordToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
                      <p className="text-sm text-gray-500">¿Estás seguro de eliminar este registro?</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Formato:</span> {recordToDelete.formatId === 'recal-040' ? 'RE-CAL-040' : recordToDelete.formatId === 'recal-038' ? 'RE-CAL-038' : 'RE-CAL-062'}
                    </p>
                   
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Proveedor:</span> {recordToDelete.proveedor}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Producto:</span> {recordToDelete.producto}
                    </p>
                  </div>
                  <p className="text-sm text-red-600 mb-6">Esta acción no se puede deshacer.</p>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setRecordToDelete(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}