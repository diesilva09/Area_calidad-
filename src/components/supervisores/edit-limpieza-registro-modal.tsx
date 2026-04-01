'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  const [detalles, setDetalles] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && registro) {
      setFecha(String(registro.fecha || '').slice(0, 10));
      setMesCorte(registro.mes_corte || '');
      setDetalles(registro.detalles || '');
    }
  }, [isOpen, registro]);

  const handleSave = async () => {
    if (!registro) return;
    setIsSaving(true);
    try {
      await limpiezaRegistrosService.update(registro.id, {
        fecha,
        mes_corte: mesCorte || null,
        detalles: detalles || null,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
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
              <Label>Detalles</Label>
              <Textarea value={detalles} onChange={(e) => setDetalles(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={!registro || isSaving}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
