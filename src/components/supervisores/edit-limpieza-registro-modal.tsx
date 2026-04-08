'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { limpiezaRegistrosService, type LimpiezaRegistro } from '@/lib/limpieza-registros-service';
import { useToast } from '@/hooks/use-toast';

interface EditLimpiezaRegistroModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  registro: LimpiezaRegistro | null;
  onSaved?: () => void;
}

export function EditLimpiezaRegistroModal({
  isOpen,
  onOpenChange,
  registro,
  onSaved,
}: EditLimpiezaRegistroModalProps) {
  const { toast } = useToast();
  const [fecha, setFecha] = React.useState('');
  const [mesCorte, setMesCorte] = React.useState('');
  const [turno, setTurno] = React.useState<'dia' | 'noche' | ''>('');
  const [detalles, setDetalles] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && registro) {
      // Convertir fecha al formato YYYY-MM-DD para el input date
      const fechaStr = String(registro.fecha || '');
      const fechaParaInput = fechaStr.includes('-')
        ? fechaStr.slice(0, 10)
        : fechaStr;
      setFecha(fechaParaInput);
      setMesCorte(registro.mes_corte || '');
      setTurno((registro.turno ?? '') as any);
      setDetalles(registro.detalles || '');
    }
  }, [isOpen, registro]);

  const handleSave = async () => {
    if (!registro) return;
    setIsSaving(true);
    try {
      console.log('📤 Actualizando registro principal:', registro.id);
      console.log('  fecha:', fecha);
      console.log('  mes_corte:', mesCorte);
      console.log('  detalles:', detalles);

      await limpiezaRegistrosService.update(registro.id, {
        fecha,
        mes_corte: mesCorte || null,
        turno: (turno || null) as any,
        detalles: detalles || null,
      });

      console.log('✅ Registro actualizado exitosamente');
      toast({
        title: 'Registro actualizado',
        description: 'El registro de limpieza ha sido actualizado exitosamente.',
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      console.error('❌ Error al actualizar registro:', err);
      toast({
        title: 'Error al guardar',
        description: err instanceof Error ? err.message : 'No se pudo actualizar el registro.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Registro de Limpieza</DialogTitle>
        </DialogHeader>

        {!registro ? (
          <div className="text-sm text-muted-foreground">No hay registro seleccionado.</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Mes de Corte</Label>
              <Input value={mesCorte} onChange={(e) => setMesCorte(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Turno</Label>
              <Select value={turno} onValueChange={(v) => setTurno((v || '') as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Día</SelectItem>
                  <SelectItem value="noche">Noche</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Detalles de limpieza</Label>
              <Textarea value={detalles} onChange={(e) => setDetalles(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={!registro || isSaving}>
            {isSaving ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
