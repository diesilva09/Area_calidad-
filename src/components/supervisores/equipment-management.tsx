'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Wrench } from 'lucide-react';
import { equiposApi, type Equipo, type Parte, type CreateEquipoData, type UpdateEquipoData, type CreateParteData, type UpdateParteData } from '@/lib/equipos-api';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function EquipmentManagement() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [showEquipoForm, setShowEquipoForm] = useState(false);
  const [showParteForm, setShowParteForm] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<Equipo | null>(null);
  const [editingParte, setEditingParte] = useState<Parte | null>(null);
  const [equipoSeleccionadoId, setEquipoSeleccionadoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCodeDuplicate, setIsCodeDuplicate] = useState(false);

  const [deleteEquipoId, setDeleteEquipoId] = useState<number | null>(null);
  const [isDeletingEquipo, setIsDeletingEquipo] = useState(false);
  const [deleteParteTarget, setDeleteParteTarget] = useState<{ equipoId: number; parteId: number } | null>(null);
  const [isDeletingParte, setIsDeletingParte] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const { toast } = useToast();

  const equipoSeleccionado = equipoSeleccionadoId
    ? equipos.find((e) => e.id === equipoSeleccionadoId) ?? null
    : null;

  const [equipoFormData, setEquipoFormData] = useState({
    area: 'Salsas' as Equipo['area'],
    codigo: '',
    nombre: '',
  });

  const [parteFormData, setParteFormData] = useState({
    nombre: '',
    observaciones: '',
  });

  // Cargar equipos desde la API
  useEffect(() => {
    const loadEquipos = async () => {
      try {
        setLoading(true);
        const data = await equiposApi.getAll();
        setEquipos(data);
      } catch (error) {
        console.error('Error al cargar equipos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los equipos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadEquipos();
  }, [toast]);

  // Verificar si el código está duplicado
  const checkCodeDuplicate = async (codigo: string) => {
    if (!codigo.trim()) {
      setIsCodeDuplicate(false);
      return;
    }

    setIsCheckingCode(true);
    try {
      // Verificar localmente primero para respuesta rápida
      const localDuplicate = equipos.some(eq => 
        eq.codigo.toLowerCase() === codigo.toLowerCase() && 
        eq.id !== editingEquipo?.id
      );
      
      if (localDuplicate) {
        setIsCodeDuplicate(true);
      } else {
        // Si no hay duplicado local, verificar en la API
        const allEquipos = await equiposApi.getAll();
        const apiDuplicate = allEquipos.some(eq => 
          eq.codigo.toLowerCase() === codigo.toLowerCase() && 
          eq.id !== editingEquipo?.id
        );
        setIsCodeDuplicate(apiDuplicate);
      }
    } catch (error) {
      console.error('Error checking code duplicate:', error);
      setIsCodeDuplicate(false);
    } finally {
      setIsCheckingCode(false);
    }
  };

  // Efecto para verificar código cuando cambia
  useEffect(() => {
    if (equipoFormData.codigo && !editingEquipo) {
      const timeoutId = setTimeout(() => {
        checkCodeDuplicate(equipoFormData.codigo);
      }, 500); // Debounce de 500ms

      return () => {
        clearTimeout(timeoutId);
        setIsCheckingCode(false);
      };
    } else {
      setIsCodeDuplicate(false);
      setIsCheckingCode(false);
    }
  }, [equipoFormData.codigo, editingEquipo, equipos]);

  const resetEquipoForm = () => {
    setEquipoFormData({
      area: 'Salsas',
      codigo: '',
      nombre: '',
    });
    setEditingEquipo(null);
    setIsCodeDuplicate(false);
    setIsCheckingCode(false);
  };

  const resetParteForm = () => {
    setParteFormData({
      nombre: '',
      observaciones: '',
    });
    setEditingParte(null);
  };

  // Cleanup function to prevent DOM issues
  useEffect(() => {
    return () => {
      // Cleanup any pending timeouts or async operations
      setIsCheckingCode(false);
    };
  }, []);

  const handleSaveEquipo = async () => {
    if (!equipoFormData.nombre || !equipoFormData.codigo) return;

    // Verificar duplicados antes de guardar (solo para nuevos equipos)
    if (!editingEquipo) {
      const isDuplicate = equipos.some(eq => 
        eq.codigo.toLowerCase() === equipoFormData.codigo.toLowerCase()
      );
      
      if (isDuplicate) {
        setIsCodeDuplicate(true);
        toast({
          title: "Código Duplicado",
          description: "Ya existe un equipo con este código",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (editingEquipo) {
        // Actualizar equipo existente
        const updatedEquipo = await equiposApi.update(editingEquipo.id, equipoFormData);
        setEquipos(prev => prev.map(eq => 
          eq.id === editingEquipo.id ? updatedEquipo : eq
        ));
        setEquipoSeleccionadoId((prev) => (prev === updatedEquipo.id ? updatedEquipo.id : prev));
        toast({
          title: "Equipo actualizado",
          description: "El equipo ha sido actualizado exitosamente",
        });
      } else {
        // Crear nuevo equipo
        const nuevoEquipo = await equiposApi.create(equipoFormData);
        setEquipos(prev => [...prev, nuevoEquipo]);
        setEquipoSeleccionadoId(nuevoEquipo.id);
        toast({
          title: "Equipo creado",
          description: "El equipo ha sido creado exitosamente",
        });
      }

      setShowEquipoForm(false);
      resetEquipoForm();
    } catch (error) {
      console.error('Error al guardar equipo:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el equipo",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDeleteEquipo = async () => {
    if (deleteEquipoId == null) return;
    if (isDeletingEquipo) return;

    const id = deleteEquipoId;
    setIsDeletingEquipo(true);
    try {
      await equiposApi.delete(id);
      setEquipos((prev) => prev.filter((eq) => eq.id !== id));
      setEquipoSeleccionadoId((prev) => (prev === id ? null : prev));
      toast({
        title: 'Equipo eliminado',
        description: 'El equipo ha sido eliminado exitosamente',
      });
      setDeleteEquipoId(null);
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingEquipo(false);
    }
  };

  const handleEditEquipo = (equipo: Equipo) => {
    setEquipoSeleccionadoId(equipo.id);
    setEditingEquipo(equipo);
    setEquipoFormData({
      area: equipo.area,
      codigo: equipo.codigo,
      nombre: equipo.nombre,
    });
    setShowEquipoForm(true);
  };

  const handleSaveParte = async () => {
    if (!parteFormData.nombre || !equipoSeleccionado) return;

    try {
      if (editingParte) {
        // Actualizar parte existente
        const updatedParte = await equiposApi.updateParte(editingParte.id, parteFormData);
        setEquipos(prev => prev.map(eq => {
          if (eq.id === equipoSeleccionado.id) {
            return {
              ...eq,
              partes: (eq.partes || []).map(parte =>
                parte.id === editingParte.id ? updatedParte : parte
              )
            };
          }
          return eq;
        }));
        toast({
          title: "Parte actualizada",
          description: "La parte ha sido actualizada exitosamente",
        });
      } else {
        // Crear nueva parte
        const nuevaParte = await equiposApi.createParte({
          equipo_id: equipoSeleccionado.id,
          nombre: parteFormData.nombre,
          observaciones: parteFormData.observaciones,
        });
        setEquipos(prev => prev.map(eq => {
          if (eq.id === equipoSeleccionado.id) {
            return {
              ...eq,
              partes: [...(eq.partes || []), nuevaParte]
            };
          }
          return eq;
        }));
        toast({
          title: "Parte agregada",
          description: "La parte ha sido agregada exitosamente",
        });
      }

      setShowParteForm(false);
      resetParteForm();
    } catch (error) {
      console.error('Error al guardar parte:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la parte",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDeleteParte = async () => {
    if (!deleteParteTarget) return;
    if (isDeletingParte) return;

    const { equipoId, parteId } = deleteParteTarget;
    setIsDeletingParte(true);
    try {
      await equiposApi.deleteParte(parteId);
      setEquipos((prev) =>
        prev.map((eq) => {
          if (eq.id === equipoId) {
            return {
              ...eq,
              partes: (eq.partes || []).filter((parte) => parte.id !== parteId),
            };
          }
          return eq;
        })
      );
      toast({
        title: 'Parte eliminada',
        description: 'La parte ha sido eliminada exitosamente',
      });
      setDeleteParteTarget(null);
    } catch (error) {
      console.error('Error al eliminar parte:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingParte(false);
    }
  };

  const handleEditParte = (equipo: Equipo, parte: Parte) => {
    setEquipoSeleccionadoId(equipo.id);
    setEditingParte(parte);
    setParteFormData({
      nombre: parte.nombre,
      observaciones: parte.observaciones || '',
    });
    setShowParteForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700">
          <span className="font-medium">Equipo seleccionado:</span>{' '}
          {equipoSeleccionado ? equipoSeleccionado.nombre : 'Ninguno'}
        </div>
        <Button onClick={() => setShowEquipoForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4 flexbox justify content-center" />
          Añadir Equipo
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando equipos...</p>
        </div>
      ) : equipos.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay equipos registrados
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza agregando tu primer equipo de producción
            </p>
            <Button onClick={() => setShowEquipoForm(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Equipo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {equipos.map((equipo) => (
            <Card
              key={equipo.id}
              className={`h-fit cursor-pointer transition-all ${
                equipoSeleccionadoId === equipo.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setEquipoSeleccionadoId(equipo.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{equipo.nombre}</CardTitle>
                    <div className="text-sm text-gray-600">
                      <div>Área: {equipo.area}</div>
                      <div>Código: {equipo.codigo}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEquipo(equipo);
                    }}
                    className="flex-1"
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEquipoSeleccionadoId(equipo.id);
                      setShowParteForm(true);
                    }}
                    className="flex-1"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Parte
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteEquipoId(equipo.id);
                    }}
                    disabled={isDeletingEquipo && deleteEquipoId === equipo.id}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {equipo.partes && equipo.partes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Partes ({equipo.partes.length})
                    </h4>
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
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditParte(equipo, parte)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteParteTarget({ equipoId: equipo.id, parteId: parte.id });
                              }}
                              className="h-6 w-6 p-0"
                              disabled={
                                isDeletingParte &&
                                deleteParteTarget?.equipoId === equipo.id &&
                                deleteParteTarget?.parteId === parte.id
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteEquipoId != null}
        onOpenChange={(open) => {
          if (!open && isDeletingEquipo) return;
          if (!open) setDeleteEquipoId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar equipo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingEquipo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteEquipo} disabled={isDeletingEquipo}>
              {isDeletingEquipo ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteParteTarget != null}
        onOpenChange={(open) => {
          if (!open && isDeletingParte) return;
          if (!open) setDeleteParteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar parte</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingParte}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteParte} disabled={isDeletingParte}>
              {isDeletingParte ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para agregar/editar equipo */}
      <Dialog 
        open={showEquipoForm} 
        onOpenChange={(open) => {
          if (!open) {
            resetEquipoForm();
          }
          setShowEquipoForm(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEquipo ? 'Editar Equipo' : 'Agregar Nuevo Equipo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="area-equipo">Área</Label>
              <select
                id="area-equipo"
                value={equipoFormData.area}
                onChange={(e) => setEquipoFormData(prev => ({ ...prev, area: e.target.value as Equipo['area'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Salsas">Salsas</option>
                <option value="Conservas">Conservas</option>
              </select>
            </div>
            <div>
              <Label htmlFor="codigo-equipo">Código del Equipo</Label>
              <Input
                id="codigo-equipo"
                value={equipoFormData.codigo}
                onChange={(e) => setEquipoFormData(prev => ({ ...prev, codigo: e.target.value }))}
                placeholder="Ej: EQ-001"
                className={isCodeDuplicate ? 'border-red-500 focus:border-red-500' : ''}
                disabled={!!editingEquipo}
              />
              {isCodeDuplicate && (
                <p className="text-sm text-red-500 mt-1">
                  Este código ya existe
                </p>
              )}
              {isCheckingCode && (
                <p className="text-sm text-gray-500 mt-1">
                  Verificando código...
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="nombre-equipo">Nombre del Equipo</Label>
              <Input
                id="nombre-equipo"
                value={equipoFormData.nombre}
                onChange={(e) => setEquipoFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Máquina Envasadora"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEquipoForm(false);
              resetEquipoForm();
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEquipo} 
              disabled={
                !equipoFormData.nombre || 
                !equipoFormData.codigo || 
                isCodeDuplicate || 
                isCheckingCode
              }
              className={isCodeDuplicate ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {isCodeDuplicate ? 'Código Duplicado' : isCheckingCode ? 'Verificando...' : (editingEquipo ? 'Actualizar' : 'Guardar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar/editar parte */}
      <Dialog 
        open={showParteForm} 
        onOpenChange={(open) => {
          if (!open) {
            resetParteForm();
          }
          setShowParteForm(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingParte 
                ? `Editar Parte de ${equipoSeleccionado?.nombre}` 
                : `Agregar Parte a ${equipoSeleccionado?.nombre}`
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre-parte">Nombre de la Parte</Label>
              <Input
                id="nombre-parte"
                value={parteFormData.nombre}
                onChange={(e) => setParteFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Motor principal"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowParteForm(false);
              resetParteForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveParte} disabled={!parteFormData.nombre}>
              {editingParte ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
