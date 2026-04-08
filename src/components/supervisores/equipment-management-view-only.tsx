'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, AlertTriangle } from 'lucide-react';
import { equiposApi, type Equipo } from '@/lib/equipos-api';
import { useAuth } from '@/contexts/auth-context';

interface EquipmentManagementViewOnlyProps {
  allowEdit?: boolean; // Prop para controlar si permite edición
}

export function EquipmentManagementViewOnly({ allowEdit = false }: EquipmentManagementViewOnlyProps) {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Determinar si el usuario puede editar basado en su rol y la prop
  const canEdit = allowEdit && user?.role === 'jefe';

  // Cargar equipos desde la API
  useEffect(() => {
    const loadEquipos = async () => {
      try {
        setLoading(true);
        const data = await equiposApi.getAll();
        setEquipos(data);
      } catch (error) {
        console.error('Error al cargar equipos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEquipos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Wrench className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm text-gray-600">Cargando equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mensaje de permisos limitados para operarios */}
      {!canEdit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Modo de solo lectura
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Como supervisor, solo puedes ver la lista de equipos. 
                Para modificar equipos, contacta a un supervisor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de equipos (solo visualización) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {equipos.map((equipo) => (
          <Card key={equipo.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                {equipo.nombre}
              </CardTitle>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Código:</span> {equipo.codigo}
              </div>
              <div className="text-sm">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {equipo.area}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {equipo.partes && equipo.partes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Partes:</h4>
                  <div className="space-y-1">
                    {equipo.partes.map((parte) => (
                      <div
                        key={parte.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{parte.nombre}</div>
                          {parte.observaciones && (
                            <div className="text-gray-500 text-xs mt-1">
                              {parte.observaciones}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!equipo.partes || equipo.partes.length === 0) && (
                <div className="text-sm text-gray-500 italic">
                  Sin partes registradas
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {equipos.length === 0 && !loading && (
        <div className="text-center py-8">
          <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay equipos registrados
          </h3>
          <p className="text-gray-600">
            No se encontraron equipos en el sistema.
          </p>
        </div>
      )}
    </div>
  );
}
