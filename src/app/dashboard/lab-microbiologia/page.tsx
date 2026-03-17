'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Microscope, Plus, FileText, Calendar, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddCondicionesAmbientalesModal } from '@/components/microbiologia/add-condiciones-ambientales-modal';
import { AddTemperaturaEquiposModal } from '@/components/microbiologia/add-temperatura-equipos-modal';
import { AddMediosCultivoModal } from '@/components/microbiologia/add-medios-cultivo-modal';
import { AddEsterilizacionAutoclaveModal } from '@/components/microbiologia/add-esterilizacion-autoclave-modal';
import { AddCustodiaMuestrasModal } from '@/components/microbiologia/add-custodia-muestras-modal';
import { AddIncubadoraControlModal } from '@/components/microbiologia/add-incubadora-control-modal';
import { AddResultadosMicrobiologicosModal } from '@/components/microbiologia/add-resultados-microbiologicos-modal';
import { AddControlLavadoInactivacionModal } from '@/components/microbiologia/add-control-lavado-inactivacion-modal';
import { AddRegistrosRecepcionFormatosModal } from '@/components/microbiologia/add-registros-recepcion-formatos-modal';
import { condicionesAmbientalesService, type CondicionesAmbientales } from '@/lib/condiciones-ambientales-service';
import { temperaturaEquiposService, type TemperaturaEquipos } from '@/lib/temperatura-equipos-service';
import { mediosCultivoService, type MediosCultivo } from '@/lib/medios-cultivo-service';
import { esterilizacionAutoclaveService, type EsterilizacionAutoclave } from '@/lib/esterilizacion-autoclave-service';
import { custodiaMuestrasService, type CustodiaMuestras } from '@/lib/custodia-muestras-service';
import { incubadoraControlService, type IncubadoraControl } from '@/lib/incubadora-control-service';
import { resultadosMicrobiologicosService, type ResultadosMicrobiologicos } from '@/lib/resultados-microbiologicos-service';
import { controlLavadoInactivacionService, type ControlLavadoInactivacion } from '@/lib/control-lavado-inactivacion-service';
import { registrosRecepcionFormatosService, type RegistrosRecepcionFormatos } from '@/lib/registros-recepcion-formatos-service';
import { useToast } from '@/hooks/use-toast';

export default function LabMicrobiologiaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isCondicionesModalOpen, setIsCondicionesModalOpen] = useState(false);
  const [isTemperaturaModalOpen, setIsTemperaturaModalOpen] = useState(false);
  const [isMediosCultivoModalOpen, setIsMediosCultivoModalOpen] = useState(false);
  const [isEsterilizacionAutoclaveModalOpen, setIsEsterilizacionAutoclaveModalOpen] = useState(false);
  const [isCustodiaMuestrasModalOpen, setIsCustodiaMuestrasModalOpen] = useState(false);
  const [isIncubadoraControlModalOpen, setIsIncubadoraControlModalOpen] = useState(false);
  const [isResultadosMicrobiologicosModalOpen, setIsResultadosMicrobiologicosModalOpen] = useState(false);
  const [isControlLavadoInactivacionModalOpen, setIsControlLavadoInactivacionModalOpen] = useState(false);
  const [isRegistrosRecepcionFormatosModalOpen, setIsRegistrosRecepcionFormatosModalOpen] = useState(false);
  const [condicionesRegistros, setCondicionesRegistros] = useState<CondicionesAmbientales[]>([]);
  const [temperaturaRegistros, setTemperaturaRegistros] = useState<TemperaturaEquipos[]>([]);
  const [mediosCultivoRegistros, setMediosCultivoRegistros] = useState<MediosCultivo[]>([]);
  const [esterilizacionAutoclaveRegistros, setEsterilizacionAutoclaveRegistros] = useState<EsterilizacionAutoclave[]>([]);
  const [custodiaMuestrasRegistros, setCustodiaMuestrasRegistros] = useState<CustodiaMuestras[]>([]);
  const [incubadoraControlRegistros, setIncubadoraControlRegistros] = useState<IncubadoraControl[]>([]);
  const [resultadosMicrobiologicosRegistros, setResultadosMicrobiologicosRegistros] = useState<ResultadosMicrobiologicos[]>([]);
  const [controlLavadoInactivacionRegistros, setControlLavadoInactivacionRegistros] = useState<ControlLavadoInactivacion[]>([]);
  const [registrosRecepcionFormatosRegistros, setRegistrosRecepcionFormatosRegistros] = useState<RegistrosRecepcionFormatos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<'principal' | 'condiciones' | 'temperatura' | 'medios-cultivo' | 'esterilizacion-autoclave' | 'custodia-muestras' | 'incubadora-control' | 'resultados-microbiologicos' | 'control-lavado-inactivacion' | 'registros-recepcion-formatos'>('principal');

  useEffect(() => {
    if (!user) {
      router.push('/login-simple');
      return;
    }

    // Verificar roles permitidos
    if (user.role !== 'jefe' && user.role !== 'operario') {
      router.push('/dashboard');
      return;
    }

    // Cargar registros existentes
    loadRegistros();
  }, [user, router]);

  const loadRegistros = async () => {
    try {
      setIsLoading(true);
      
      // Cargar los nueve tipos de registros en paralelo
      const [condicionesData, temperaturaData, mediosCultivoData, esterilizacionAutoclaveData, custodiaMuestrasData, incubadoraControlData, resultadosMicrobiologicosData, controlLavadoInactivacionData, registrosRecepcionFormatosData] = await Promise.all([
        condicionesAmbientalesService.getAll(),
        temperaturaEquiposService.getAll(),
        mediosCultivoService.getAll(),
        esterilizacionAutoclaveService.getAll(),
        custodiaMuestrasService.getAll(),
        incubadoraControlService.getAll(),
        resultadosMicrobiologicosService.getAll(),
        controlLavadoInactivacionService.getAll(),
        registrosRecepcionFormatosService.getAll()
      ]);

      setCondicionesRegistros(condicionesData);
      setTemperaturaRegistros(temperaturaData);
      setMediosCultivoRegistros(mediosCultivoData);
      setEsterilizacionAutoclaveRegistros(esterilizacionAutoclaveData);
      setCustodiaMuestrasRegistros(custodiaMuestrasData);
      setIncubadoraControlRegistros(incubadoraControlData);
      setResultadosMicrobiologicosRegistros(resultadosMicrobiologicosData);
      setControlLavadoInactivacionRegistros(controlLavadoInactivacionData);
      setRegistrosRecepcionFormatosRegistros(registrosRecepcionFormatosData);
    } catch (error) {
      console.error('Error al cargar registros:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCondicionesSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleTemperaturaSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleMediosCultivoSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleEsterilizacionAutoclaveSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleCustodiaMuestrasSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleIncubadoraControlSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleResultadosMicrobiologicosSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleControlLavadoInactivacionSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleRegistrosRecepcionFormatosSuccessfulSubmit = () => {
    loadRegistros(); // Recargar los registros después de agregar uno nuevo
  };

  const handleVerCondiciones = () => {
    setVistaActual('condiciones');
  };

  const handleVerTemperatura = () => {
    setVistaActual('temperatura');
  };

  const handleVerMediosCultivo = () => {
    setVistaActual('medios-cultivo');
  };

  const handleVerEsterilizacionAutoclave = () => {
    setVistaActual('esterilizacion-autoclave');
  };

  const handleVerCustodiaMuestras = () => {
    setVistaActual('custodia-muestras');
  };

  const handleVerIncubadoraControl = () => {
    setVistaActual('incubadora-control');
  };

  const handleVerResultadosMicrobiologicos = () => {
    setVistaActual('resultados-microbiologicos');
  };

  const handleVerControlLavadoInactivacion = () => {
    setVistaActual('control-lavado-inactivacion');
  };

  const handleVerRegistrosRecepcionFormatos = () => {
    setVistaActual('registros-recepcion-formatos');
  };

  const handleVolverPrincipal = () => {
    setVistaActual('principal');
  };

  if (!user || (user.role !== 'jefe' && user.role !== 'operario')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white p-1 sm:p-2 md:p-4 lg:p-6">
      {/* Vista Principal - Tarjetas de registros */}
      {vistaActual === 'principal' && (
        <>
          <div className="mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">LAB. MICROBIOLOGÍA</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
                Módulo de análisis microbiológicos y control de calidad microbiológica.
              </p>
            </div>
          </div>

          {/* Formatos Disponibles */}
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {/* RE-CAL-021 - Condiciones Ambientales */}
            <Card 
              className="border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleVerCondiciones}
            >
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base md:text-lg">RE-CAL-021</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Condiciones Ambientales
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-xs sm:text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-021</p>
                    <p><strong>Versión:</strong> 2</p>
                    <p><strong>Aprobación:</strong> 03-may-2021</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <span className="text-xs sm:text-sm text-gray-500">
                      {condicionesRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs sm:text-sm px-2 sm:px-4 py-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCondicionesModalOpen(true);
                      }}
                    >
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden xs:inline sm:inline">Nuevo</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-016 - Temperatura Equipos */}
            <Card 
              className="border-green-200 bg-green-50 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleVerTemperatura}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">🌡️</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-016</CardTitle>
                    <CardDescription>
                      Temperatura Equipos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-016</p>
                    <p><strong>Versión:</strong> 2</p>
                    <p><strong>Aprobación:</strong> 03-may-2021</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {temperaturaRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTemperaturaModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-022 - Medios de Cultivo */}
            <Card 
              className="border-purple-200 bg-purple-50 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleVerMediosCultivo}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Beaker className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-022</CardTitle>
                    <CardDescription>
                      Medios de Cultivo
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-022</p>
                    <p><strong>Versión:</strong> 2</p>
                    <p><strong>Aprobación:</strong> FEBRERO 28 DE 2020</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {mediosCultivoRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMediosCultivoModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-017 - Esterilización en Autoclave */}
            <Card 
              className="border-orange-200 bg-orange-50 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleVerEsterilizacionAutoclave}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Microscope className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-017</CardTitle>
                    <CardDescription>
                      Esterilización en Autoclave
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-017</p>
                    <p><strong>Versión:</strong> 2</p>
                    <p><strong>Aprobación:</strong> 03-may-2021</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {esterilizacionAutoclaveRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEsterilizacionAutoclaveModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-107 - Custodia de Muestras */}
            <Card 
              className="border-red-200 bg-red-50 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleVerCustodiaMuestras}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-107</CardTitle>
                    <CardDescription>
                      Custodia de Muestras
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-107</p>
                    <p><strong>Versión:</strong> 2</p>
                    <p><strong>Aprobación:</strong> Marzo 10 de 2022</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {custodiaMuestrasRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCustodiaMuestrasModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-089 - Control de Incubadora */}
            <Card 
              className="border-teal-200 bg-teal-50 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleVerIncubadoraControl}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-089</CardTitle>
                    <CardDescription>
                      Control de Incubadora
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-089</p>
                    <p><strong>Versión:</strong> 1</p>
                    <p><strong>Aprobación:</strong> Noviembre 07 de 2025</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {incubadoraControlRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsIncubadoraControlModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-046 - Resultados Microbiológicos */}
            <Card 
              className="border-indigo-200 bg-indigo-50 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleVerResultadosMicrobiologicos}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Microscope className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-046</CardTitle>
                    <CardDescription>
                      Resultados Microbiológicos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-046</p>
                    <p><strong>Versión:</strong> 4</p>
                    <p><strong>Aprobación:</strong> Abril 22 de 2024</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {resultadosMicrobiologicosRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsResultadosMicrobiologicosModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-111 - Control Lavado e Inactivación */}
            <Card 
              className="border-cyan-200 bg-cyan-50 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleVerControlLavadoInactivacion}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                    <Beaker className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-111</CardTitle>
                    <CardDescription>
                      Control Lavado e Inactivación
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-111</p>
                    <p><strong>Versión:</strong> 1</p>
                    <p><strong>Aprobación:</strong> Julio 01 de 2020</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {controlLavadoInactivacionRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsControlLavadoInactivacionModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RE-CAL-100 - Registros Recepción Formatos */}
            <Card 
              className="border-amber-200 bg-amber-50 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleVerRegistrosRecepcionFormatos}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">RE-CAL-100</CardTitle>
                    <CardDescription>
                      Registros Recepción Formatos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Código:</strong> RE-CAL-100</p>
                    <p><strong>Versión:</strong> 1</p>
                    <p><strong>Aprobación:</strong> Abril 24 de 2020</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {registrosRecepcionFormatosRegistros.length} registros
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRegistrosRecepcionFormatosModalOpen(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Vista de Condiciones Ambientales */}
      {vistaActual === 'condiciones' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-021 - Condiciones Ambientales</h1>
              <p className="text-gray-600 mt-2">
                Registro de condiciones ambientales del laboratorio de microbiología
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Condiciones Ambientales</CardTitle>
                  <CardDescription>
                    Todos los registros de condiciones ambientales del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCondicionesModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : condicionesRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de condiciones ambientales.
                  </p>
                  <Button onClick={() => setIsCondicionesModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {condicionesRegistros.map((registro: any) => (
                    <div key={registro.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Hora</p>
                          <p className="text-sm text-gray-900">{registro.hora}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Temperatura</p>
                          <p className="text-sm text-gray-900">{registro.temperatura}°C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Humedad</p>
                          <p className="text-sm text-gray-900">{registro.humedad_relativa}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.responsable}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">
                            {registro.observaciones || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Temperatura Equipos */}
      {vistaActual === 'temperatura' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-016 - Temperatura Equipos</h1>
              <p className="text-gray-600 mt-2">
                Registro de temperatura de equipos del laboratorio de microbiología
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Temperatura Equipos</CardTitle>
                  <CardDescription>
                    Todos los registros de temperatura de equipos del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => setIsTemperaturaModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : temperaturaRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🌡️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de temperatura de equipos.
                  </p>
                  <Button onClick={() => setIsTemperaturaModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {temperaturaRegistros.map((registro: any) => (
                    <div key={registro.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">{registro.fecha}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Horario</p>
                          <p className="text-sm text-gray-900">{registro.horario}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Incubadora 037</p>
                          <p className="text-sm text-gray-900">{registro.incubadora_037}°C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Incubadora 038</p>
                          <p className="text-sm text-gray-900">{registro.incubadora_038}°C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Nevera</p>
                          <p className="text-sm text-gray-900">{registro.nevera}°C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Realizado por</p>
                          <p className="text-sm text-gray-900">{registro.realizado_por}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Medios de Cultivo */}
      {vistaActual === 'medios-cultivo' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-022 - Medios de Cultivo</h1>
              <p className="text-gray-600 mt-2">
                Registro de preparación de medios de cultivo y control negativo
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Medios de Cultivo</CardTitle>
                  <CardDescription>
                    Todos los registros de preparación de medios de cultivo
                  </CardDescription>
                </div>
                <Button onClick={() => setIsMediosCultivoModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : mediosCultivoRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Beaker className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de medios de cultivo.
                  </p>
                  <Button onClick={() => setIsMediosCultivoModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mediosCultivoRegistros.map((registro: any) => (
                    <div key={registro.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Medio</p>
                          <p className="text-sm text-gray-900">{registro.medio}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Lote</p>
                          <p className="text-sm text-gray-900">{registro.lote}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Vencimiento</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_vencimiento).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Preparado por</p>
                          <p className="text-sm text-gray-900">{registro.preparado_por}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Autoclave</p>
                          <p className="text-sm text-gray-900">{registro.autoclave}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-3 pt-3 border-t">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Temperatura</p>
                          <p className="text-sm text-gray-900">{registro.temperatura}°C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Presión</p>
                          <p className="text-sm text-gray-900">{registro.presion} psi</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tiempo</p>
                          <p className="text-sm text-gray-900">{registro.tiempo} min</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Control Negativo</p>
                          <p className="text-sm text-gray-900">{registro.control_negativo}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Esterilización en Autoclave */}
      {vistaActual === 'esterilizacion-autoclave' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-017 - Esterilización en Autoclave</h1>
              <p className="text-gray-600 mt-2">
                Registro de proceso de esterilización en autoclave microbiología
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Esterilización en Autoclave</CardTitle>
                  <CardDescription>
                    Todos los registros de esterilización en autoclave del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => setIsEsterilizacionAutoclaveModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : esterilizacionAutoclaveRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Microscope className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de esterilización en autoclave.
                  </p>
                  <Button onClick={() => setIsEsterilizacionAutoclaveModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {esterilizacionAutoclaveRegistros.map((registro: any) => (
                    <div key={registro.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Elementos</p>
                          <p className="text-sm text-gray-900">{registro.elementos_medios_cultivo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Inicio Ciclo</p>
                          <p className="text-sm text-gray-900">{registro.inicio_ciclo_hora}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fin Ciclo</p>
                          <p className="text-sm text-gray-900">{registro.fin_ciclo_hora}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Cinta Indicadora</p>
                          <p className="text-sm text-gray-900">{registro.cinta_indicadora}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Realizado por</p>
                          <p className="text-sm text-gray-900">{registro.realizado_por}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Custodia de Muestras */}
      {vistaActual === 'custodia-muestras' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-107 - Custodia de Muestras</h1>
              <p className="text-gray-600 mt-2">
                Registro y cadena de custodia de muestras análisis interno
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Custodia de Muestras</CardTitle>
                  <CardDescription>
                    Todos los registros de custodia de muestras del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCustodiaMuestrasModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : custodiaMuestrasRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de custodia de muestras.
                  </p>
                  <Button onClick={() => setIsCustodiaMuestrasModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {custodiaMuestrasRegistros.map((registro: any) => (
                    <div key={registro.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Código</p>
                          <p className="text-sm text-gray-900">{registro.codigo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tipo</p>
                          <p className="text-sm text-gray-900">{registro.tipo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">ID Muestra</p>
                          <p className="text-sm text-gray-900">{registro.muestra_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Área</p>
                          <p className="text-sm text-gray-900">{registro.area}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Temperatura</p>
                          <p className="text-sm text-gray-900">{registro.temperatura}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Cantidad</p>
                          <p className="text-sm text-gray-900">{registro.cantidad}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Toma Muestra</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.toma_muestra_fecha).toLocaleDateString('es-ES')} {registro.toma_muestra_hora}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Recepción Lab</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.recepcion_lab_fecha).toLocaleDateString('es-ES')} {registro.recepcion_lab_hora}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.responsable}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Control de Incubadora */}
      {vistaActual === 'incubadora-control' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-089 - Control de Incubadora</h1>
              <p className="text-gray-600 mt-2">
                Registro de operación y control de incubadora
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Control de Incubadora</CardTitle>
                  <CardDescription>
                    Todos los registros de operación y control de incubadora del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => setIsIncubadoraControlModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : incubadoraControlRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de control de incubadora.
                  </p>
                  <Button onClick={() => setIsIncubadoraControlModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {incubadoraControlRegistros.map((registro: any) => (
                    <div key={registro.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Muestra</p>
                          <p className="text-sm text-gray-900">{registro.muestra}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Ingreso</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_ingreso).toLocaleDateString('es-ES')} {registro.hora_ingreso}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Salida</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_salida).toLocaleDateString('es-ES')} {registro.hora_salida}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Días Incubación</p>
                          <p className="text-sm text-gray-900">
                            {Math.ceil((new Date(registro.fecha_salida).getTime() - new Date(registro.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24))} días
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.responsable}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tiempo Total</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_salida).toLocaleDateString('es-ES')} - {new Date(registro.fecha_ingreso).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Resultados Microbiológicos */}
      {vistaActual === 'resultados-microbiologicos' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-046 - Resultados Microbiológicos</h1>
              <p className="text-gray-600 mt-2">
                Resultados microbiológicos análisis internos y externos
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Resultados Microbiológicos</CardTitle>
                  <CardDescription>
                    Todos los registros de resultados microbiológicos del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => setIsResultadosMicrobiologicosModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : resultadosMicrobiologicosRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Microscope className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de resultados microbiológicos.
                  </p>
                  <Button onClick={() => setIsResultadosMicrobiologicosModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {resultadosMicrobiologicosRegistros.map((registro: any) => (
                    <div key={registro.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Muestra</p>
                          <p className="text-sm text-gray-900">{registro.muestra}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Lote</p>
                          <p className="text-sm text-gray-900">{registro.lote}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tipo</p>
                          <p className="text-sm text-gray-900">{registro.tipo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Interno/Externo</p>
                          <p className="text-sm text-gray-900">{registro.interno_externo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Área</p>
                          <p className="text-sm text-gray-900">{registro.area}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Mesófilos</p>
                          <p className="text-sm text-gray-900">{registro.mesofilos || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Coliformes</p>
                          <p className="text-sm text-gray-900">{registro.coliformes_totales || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">E. coli</p>
                          <p className="text-sm text-gray-900">{registro.e_coli || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Salmonella</p>
                          <p className="text-sm text-gray-900">{registro.salmonella || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Cumple</p>
                          <p className="text-sm text-gray-900">
                            {registro.cumple ? '✅ Sí' : registro.no_cumple ? '❌ No' : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.responsable}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Control Lavado e Inactivación */}
      {vistaActual === 'control-lavado-inactivacion' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-111 - Control Lavado e Inactivación</h1>
              <p className="text-gray-600 mt-2">
                Control de lavado e inactivación de material - Laboratorio Microbiología
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Control de Lavado e Inactivación</CardTitle>
                  <CardDescription>
                    Todos los registros de control de lavado e inactivación del laboratorio
                  </CardDescription>
                </div>
                <Button onClick={() => setIsControlLavadoInactivacionModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : controlLavadoInactivacionRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Beaker className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de control de lavado e inactivación.
                  </p>
                  <Button onClick={() => setIsControlLavadoInactivacionModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {controlLavadoInactivacionRegistros.map((registro: any) => (
                    <div key={registro.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Actividad</p>
                          <p className="text-sm text-gray-900">{registro.actividad_realizada}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Sustancia Limpieza</p>
                          <p className="text-sm text-gray-900">{registro.sustancia_limpieza_nombre}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Desinfección 1</p>
                          <p className="text-sm text-gray-900">{registro.sustancia_desinfeccion_1_nombre}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Desinfección 2</p>
                          <p className="text-sm text-gray-900">{registro.sustancia_desinfeccion_2_nombre}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.realizado_por}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Vista de Registros Recepción Formatos */}
      {vistaActual === 'registros-recepcion-formatos' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-100 - Registros Recepción Formatos</h1>
              <p className="text-gray-600 mt-2">
                Registros recepción de formatos diligenciados en proceso
              </p>
            </div>
            <Button 
              onClick={handleVolverPrincipal}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Registros de Recepción de Formatos</CardTitle>
                  <CardDescription>
                    Todos los registros de recepción de formatos diligenciados en proceso
                  </CardDescription>
                </div>
                <Button onClick={() => setIsRegistrosRecepcionFormatosModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando registros...</p>
                </div>
              ) : registrosRecepcionFormatosRegistros.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de recepción de formatos.
                  </p>
                  <Button onClick={() => setIsRegistrosRecepcionFormatosModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrosRecepcionFormatosRegistros.map((registro: any) => (
                    <div key={registro.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha Entrega</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_entrega).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha Registros</p>
                          <p className="text-sm text-gray-900">
                            {new Date(registro.fecha_registros).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Código/Versión</p>
                          <p className="text-sm text-gray-900">{registro.codigo_version_registros}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">N° Folios</p>
                          <p className="text-sm text-gray-900">{registro.numero_folios}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Quien Entrega</p>
                          <p className="text-sm text-gray-900">{registro.nombre_quien_entrega}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Quien Recibe</p>
                          <p className="text-sm text-gray-900">{registro.nombre_quien_recibe}</p>
                        </div>
                      </div>
                      {registro.observaciones && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700">Observaciones</p>
                          <p className="text-sm text-gray-900">{registro.observaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modales para agregar registros */}
      <AddCondicionesAmbientalesModal
        isOpen={isCondicionesModalOpen}
        onOpenChange={setIsCondicionesModalOpen}
        onSuccessfulSubmit={handleCondicionesSuccessfulSubmit}
      />
      
      <AddTemperaturaEquiposModal
        isOpen={isTemperaturaModalOpen}
        onOpenChange={setIsTemperaturaModalOpen}
        onSuccessfulSubmit={handleTemperaturaSuccessfulSubmit}
      />
      
      <AddMediosCultivoModal
        isOpen={isMediosCultivoModalOpen}
        onOpenChange={setIsMediosCultivoModalOpen}
        onSuccessfulSubmit={handleMediosCultivoSuccessfulSubmit}
      />
      
      <AddEsterilizacionAutoclaveModal
        isOpen={isEsterilizacionAutoclaveModalOpen}
        onOpenChange={setIsEsterilizacionAutoclaveModalOpen}
        onSuccessfulSubmit={handleEsterilizacionAutoclaveSuccessfulSubmit}
      />
      
      <AddCustodiaMuestrasModal
        isOpen={isCustodiaMuestrasModalOpen}
        onOpenChange={setIsCustodiaMuestrasModalOpen}
        onSuccessfulSubmit={handleCustodiaMuestrasSuccessfulSubmit}
      />
      
      <AddIncubadoraControlModal
        isOpen={isIncubadoraControlModalOpen}
        onOpenChange={setIsIncubadoraControlModalOpen}
        onSuccessfulSubmit={handleIncubadoraControlSuccessfulSubmit}
      />
      
      <AddResultadosMicrobiologicosModal
        isOpen={isResultadosMicrobiologicosModalOpen}
        onOpenChange={setIsResultadosMicrobiologicosModalOpen}
        onSuccessfulSubmit={handleResultadosMicrobiologicosSuccessfulSubmit}
      />
      
      <AddControlLavadoInactivacionModal
        isOpen={isControlLavadoInactivacionModalOpen}
        onOpenChange={setIsControlLavadoInactivacionModalOpen}
        onSuccessfulSubmit={handleControlLavadoInactivacionSuccessfulSubmit}
      />
      
      <AddRegistrosRecepcionFormatosModal
        isOpen={isRegistrosRecepcionFormatosModalOpen}
        onOpenChange={setIsRegistrosRecepcionFormatosModalOpen}
        onSuccessfulSubmit={handleRegistrosRecepcionFormatosSuccessfulSubmit}
      />
    </div>
  );
}
