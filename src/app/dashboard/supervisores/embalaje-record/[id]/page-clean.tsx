'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Package, User, CheckCircle, AlertCircle, Search, Edit } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { embalajeRecordsService, type EmbalajeRecord } from '@/lib/embalaje-records-service';
import { AddEmbalajeRecordModal } from '@/components/supervisores/add-embalaje-record-modal';

export default function EmbalajeRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<EmbalajeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const returnTo = searchParams?.get('returnTo') || '/dashboard/supervisores?tab=embalaje';
  
  // Desempaquetar params con React.use()
  const resolvedParams = use(params);

  const loadRecord = async () => {
    try {
      const records = await embalajeRecordsService.getAll();
      const foundRecord = records.find(r => r.id === resolvedParams.id);
      
      if (!foundRecord) {
        console.error('❌ Registro de embalaje no encontrado');
        setError('Registro no encontrado');
      } else {
        setRecord(foundRecord);
      }
    } catch (error) {
      console.error('❌ Error al cargar registro de embalaje:', error);
      setError('Error al cargar el registro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'jefe' && user.role !== 'operario' && user.role !== 'supervisor' && user.role !== 'tecnico')) {
      router.push('/dashboard');
      return;
    }

    loadRecord();
  }, [user, router, resolvedParams.id]);

  // Función para verificar si el registro está pendiente
  const isRecordPending = (record: EmbalajeRecord): boolean => {
    return record.presentacion === 'Pendiente' ||
           record.nivel_inspeccion === 'Pendiente' ||
           record.etiqueta === 'Pendiente' ||
           record.marcacion === 'Pendiente' ||
           record.presentacion_no_conforme === 'Pendiente' ||
           record.cajas === 'Pendiente' ||
           record.responsable_identificador_cajas === 'Pendiente' ||
           record.responsable_embalaje === 'Pendiente' ||
           record.responsable_calidad === 'Pendiente';
  };

  // Función para manejar la actualización exitosa
  const handleSuccessfulEdit = () => {
    // Recargar el registro para mostrar los cambios
    loadRecord();
  };

  if (!user) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded">
            <h1 className="text-xl font-bold text-green-800">CARGANDO REGISTRO DE EMBALAJE</h1>
          </div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error || 'Registro no encontrado'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={returnTo}>Volver</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <Button variant="ghost" asChild>
            <Link href={returnTo}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          
          {/* Botón de completar registro - solo mostrar si está pendiente */}
          {isRecordPending(record) && (
            <Button 
              onClick={() => setIsEditModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Completar Registro
            </Button>
          )}
        </div>

        {/* Título principal */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-green-600">Registro de Embalaje</h1>
            {isRecordPending(record) && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                ⏰ Pendiente
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            Detalles completos del registro de embalaje
          </p>
        </div>

        {/* Información básica */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <span className="text-sm text-gray-600">Fecha</span>
                <p className="font-semibold">{new Date(record.fecha).toLocaleDateString('es-ES')}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Mes de Corte</span>
                <p className="font-semibold">{record.mescorte}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Producto</span>
                <p className="font-semibold">{record.producto}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Lote</span>
                <p className="font-semibold">{record.lote}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Presentación</span>
                <p className="font-semibold">{record.presentacion}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Tamaño Lote</span>
                <p className="font-semibold">{record.tamano_lote}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Nivel Inspección</span>
                <p className="font-semibold">{record.nivel_inspeccion}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Creado</span>
                <p className="font-semibold">{new Date(record.created_at).toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados de Inspección */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Resultados de Inspección
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <span className="text-sm text-gray-600">Cajas Revisadas</span>
                <p className="font-semibold">{record.cajas_revisadas}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Unidades Revisadas</span>
                <p className="font-semibold">{record.total_unidades_revisadas}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Unidades Revisadas Real</span>
                <p className="font-semibold">{record.total_unidades_revisadas_real}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Unidades Faltantes</span>
                <p className="font-semibold">{record.unidades_faltantes}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">% Faltantes</span>
                <p className="font-semibold">{record.porcentaje_faltantes}%</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Unidades No Conformes</span>
                <p className="font-semibold">{record.unidades_no_conformes}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">% Incumplimiento</span>
                <p className="font-semibold">{record.porcentaje_incumplimiento}%</p>
              </div>
            </div>
            
            {record.observaciones_generales && (
              <div className="mt-6 pt-6 border-t">
                <span className="text-sm text-gray-600">Observaciones Generales</span>
                <p className="mt-2 text-gray-800">{record.observaciones_generales}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verificación de Atributos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Verificación de Atributos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Etiqueta */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-700 mb-2">Etiqueta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Estado</span>
                    <p className="font-semibold">{record.etiqueta}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">% No Conforme</span>
                    <p className="font-semibold">{record.porcentaje_etiqueta_no_conforme}%</p>
                  </div>
                </div>
              </div>

              {/* Marcación */}
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-700 mb-2">Marcación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Estado</span>
                    <p className="font-semibold">{record.marcacion}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">% No Conforme</span>
                    <p className="font-semibold">{record.porcentaje_marcacion_no_conforme}%</p>
                  </div>
                </div>
              </div>

              {/* Presentación */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-purple-700 mb-2">Presentación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Estado</span>
                    <p className="font-semibold">{record.presentacion_no_conforme}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">% No Conforme</span>
                    <p className="font-semibold">{record.porcentaje_presentacion_no_conforme}%</p>
                  </div>
                </div>
              </div>

              {/* Cajas */}
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold text-orange-700 mb-2">Cajas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Estado</span>
                    <p className="font-semibold">{record.cajas}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">% No Conforme</span>
                    <p className="font-semibold">{record.porcentaje_cajas_no_conformes}%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responsables */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Responsables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-sm text-gray-600">Identificador Cajas</span>
                <p className="font-semibold">{record.responsable_identificador_cajas}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Responsable Embalaje</span>
                <p className="font-semibold">{record.responsable_embalaje}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Responsable Calidad</span>
                <p className="font-semibold">{record.responsable_calidad}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Correcciones */}
        {record.correccion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Correcciones Aplicadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">{record.correccion}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de edición */}
      {record && (
        <AddEmbalajeRecordModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          productName={record.producto}
          productId={record.id}
          editMode={true}
          recordToEdit={record}
          onSuccessfulEdit={handleSuccessfulEdit}
        />
      )}
    </div>
  );
}
