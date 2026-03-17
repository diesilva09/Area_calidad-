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

interface InspeccionVehiculo {
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

export default function MateriaPrimaPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InspeccionVehiculo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  // Estado inicial - sin registros de ejemplo
  const [registros, setRegistros] = useState<InspeccionVehiculo[]>([]);

  const formatos = [
    {
      id: 'recal-040',
      nombre: 'Inspección de Vehículos para Recepción de Materia Prima',
      codigo: 'RE-CAL-040',
      version: '4',
      fechaAprobacion: 'ENERO 02 DE 2024',
      descripcion: 'Formato para inspección de vehículos que transportan materia prima'
    }
  ];

  const [formData, setFormData] = useState({
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

  const [hoveredCheck, setHoveredCheck] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<{[key: number]: 'C' | 'NC' | 'NA' | 'SHOW_MENU' | null}>({});

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
      console.log('Guardando inspección RE-CAL-040:', formData);
      
      const nuevoRegistro: InspeccionVehiculo = {
        ...formData,
        id: Date.now().toString(),
        fecha: formData.fecha || new Date().toISOString().split('T')[0]
      };
      
      if (editingRecord) {
        // Actualizar registro existente
        setRegistros(prev => prev.map(reg => 
          reg.id === editingRecord.id ? nuevoRegistro : reg
        ));
        toast({
          title: "Registro actualizado",
          description: "La inspección ha sido actualizada exitosamente",
        });
      } else {
        // Agregar nuevo registro
        setRegistros(prev => [...prev, nuevoRegistro]);
        toast({
          title: "Registro guardado",
          description: "La inspección ha sido guardada exitosamente",
        });
      }

      // Resetear formulario
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
      setShowForm(false);
      setEditingRecord(null);

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

  const handleEdit = (record: InspeccionVehiculo) => {
    setEditingRecord(record);
    setFormData({
      fecha: record.fecha,
      proveedor: record.proveedor,
      producto: record.producto,
      nombreConductor: record.nombreConductor,
      placaVehiculo: record.placaVehiculo,
      loteProveedor: record.loteProveedor,
      responsableCalidad: record.responsableCalidad,
      observaciones: record.observaciones,
      cumplimiento: record.cumplimiento,
      tipoMaterial: record.tipoMaterial,
      checks: record.checks,
      c: record.c,
      nc: record.nc,
      na: record.na
    });
    setShowForm(true);
  };

  const handleDelete = (record: InspeccionVehiculo) => {
    setRegistros(prev => prev.filter(reg => reg.id !== record.id));
    toast({
      title: "Registro eliminado",
      description: "La inspección ha sido eliminada exitosamente",
    });
  };

  const handleView = (record: InspeccionVehiculo) => {
    setEditingRecord(record);
    setFormData(record);
    setShowForm(true);
  };

  const handleSelectFormat = (formato: typeof formatos[0]) => {
    setSelectedFormat(formato.id);
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
      c: Array(14).fill(false),      // CORREGIDO: ahora es un array
      nc: Array(14).fill(false),     // CORREGIDO
      na: Array(14).fill(false)      // CORREGIDO
    });
  };

  const handleBackToFormats = () => {
    setSelectedFormat(null);
    setShowForm(false);
    setEditingRecord(null);
  };

  const FormatoCard = ({ formato }: { formato: typeof formatos[0] }) => (
    <Card 
      className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50"
      onClick={() => handleSelectFormat(formato)}
    >
      <CardHeader className="bg-gradient-to-r from-green-400 to-green-500 text-white pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-bold shadow-md">
              {formato.codigo}
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                {formato.nombre}
              </CardTitle>
              <div className="text-sm text-green-100 mt-1">
                <p>Código: {formato.codigo} | Versión: {formato.version}</p>
                <p>Fecha Aprobación: {formato.fechaAprobacion}</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 bg-gradient-to-br from-gray-50 to-white">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-gray-700 text-sm font-medium">{formato.descripcion}</p>
        </div>
        <div className="mt-4 flex items-center justify-center">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors">
            Click para acceder →
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
            onClick={() => handleDelete(record)}
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
            <p className="text-gray-900 font-medium capitalize">{record.tipoMaterial.replace('-', ' ')}</p>
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
                <div key={index} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all transform hover:scale-105 ${
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
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
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
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg transition-all hover:shadow-xl"
                  >
                    <Plus className="h-5 w-5" />
                    Nuevo Registro
                  </Button>
                </div>
              </div>

              {/* Lista de Registros */}
              {registros.length === 0 ? (
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
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registros.map((record) => (
                    <InspeccionCard key={record.id} record={record} />
                  ))}
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
                    <h2 className="text-xl font-bold text-blue-900">
                      {editingRecord ? 'Editar Registro RE-CAL-040' : 'Nuevo Registro RE-CAL-040'}
                    </h2>
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
                          const hasOption = selectedOption[index] !== undefined && selectedOption[index] !== null;
                          const currentOption = selectedOption[index];
                          const isC = (Array.isArray(formData.c) ? formData.c : Array(14).fill(false))[index];
                          const isNC = (Array.isArray(formData.nc) ? formData.nc : Array(14).fill(false))[index];
                          const isNA = (Array.isArray(formData.na) ? formData.na : Array(14).fill(false))[index];
                          
                          // Determinar si el menú debe aparecer hacia arriba (primeras 2 filas = índices 0-13)
                          const isInTopRows = index < 7; // Primera fila (índices 0-6)
                          const dropdownPosition = isInTopRows ? 'bottom-full mb-2' : 'top-full mt-2';
                          const tooltipPosition = isInTopRows ? 'top-full mt-2' : 'bottom-full mb-2';
                          const tooltipArrow = isInTopRows ? 
                            'border-l-8 border-r-8 border-t-8 border-transparent border-b-gray-900' : 
                            'border-l-8 border-r-8 border-b-8 border-transparent border-t-gray-900';
                          
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
                                // Toggle the dropdown menu - set a temporary value to show dropdown
                                setSelectedOption(prev => ({
                                  ...prev,
                                  [index]: prev[index] === undefined ? 'SHOW_MENU' : undefined
                                }));
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
                              {hoveredCheck === index && !hasOption && currentOption !== 'SHOW_MENU' && (
                                <div className={`absolute ${tooltipPosition} left-1/2 transform -translate-x-1/2 z-[60] w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl`}>
                                  <div className="font-bold mb-1">Verificación {index + 1}</div>
                                  <div className="text-gray-300">{verificaciones[index]}</div>
                                  <div className={`absolute ${isInTopRows ? 'bottom-0' : 'top-0'} left-1/2 transform -translate-x-1/2 ${isInTopRows ? 'translate-y-full' : 'translate-y-1/2'} w-0 h-0 ${isInTopRows ? 'border-l-8 border-r-8 border-b-8 border-transparent border-t-gray-900' : 'border-l-8 border-r-8 border-t-8 border-transparent border-b-gray-900'}`}></div>
                                </div>
                              )}
                              
                              {/* Opciones desplegables */}
                              {hasOption && (
                                <div className={`absolute ${dropdownPosition} left-1/2 transform -translate-x-1/2 z-[70] bg-white rounded-lg shadow-xl border border-gray-200 p-1 min-w-[140px]`} onClick={(e) => e.stopPropagation()}>
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
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              C
                            </div>
                            <div className="text-sm font-medium text-green-700">
                              <div>Conforme</div>
                              <div className="text-lg font-bold">{getCurrentCounts().countC}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              NC
                            </div>
                            <div className="text-sm font-medium text-yellow-700">
                              <div>No Conforme</div>
                              <div className="text-lg font-bold">{getCurrentCounts().countNC}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 bg-orange-50 p-3 rounded-lg border border-orange-200">
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

                    <div className="space-y-2">
                      <Label htmlFor="observaciones">OBSERVACIONES</Label>
                      <Textarea
                        id="observaciones"
                        value={formData.observaciones}
                        onChange={(e) => handleInputChange('observaciones', e.target.value)}
                        placeholder="Ingrese observaciones adicionales..."
                        rows={4}
                      />
                    </div>

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
        </div>
      </div>
    </div>
  );
}