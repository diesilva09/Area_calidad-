'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Microscope, Plus, FileText, Calendar, Beaker, Pencil, Trash2, Thermometer, Clock, Settings, BarChart3, Menu, X, ChevronLeft, LayoutDashboard, Download, Package, Building, Truck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CronogramaCalendar } from '@/components/microbiologia/cronograma-calendar';
import { ChartContainer } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddCondicionesAmbientalesModal } from '@/components/microbiologia/add-condiciones-ambientales-modal';
import { AddTemperaturaEquiposModal } from '@/components/microbiologia/add-temperatura-equipos-modal';
import { AddMediosCultivoModal } from '@/components/microbiologia/add-medios-cultivo-modal';
import { AddEsterilizacionAutoclaveModal } from '@/components/microbiologia/add-esterilizacion-autoclave-modal';
import { AddCustodiaMuestrasModal } from '@/components/microbiologia/add-custodia-muestras-modal';
import { AddIncubadoraControlModal } from '@/components/microbiologia/add-incubadora-control-modal';
import { AddResultadosMicrobiologicosModal } from '@/components/microbiologia/add-resultados-microbiologicos-modal';
import { ViewResultadosMicrobiologicosModal } from '@/components/microbiologia/view-resultados-microbiologicos-modal';
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
import { microbiologiaCronogramaService } from '@/lib/microbiologia-cronograma-service';
import type { TareaCronograma } from '@/components/microbiologia/cronograma-calendar';
import { CronogramaProductoTerminado } from '@/components/producto-terminado/cronograma-producto-terminado';
import { useToast } from '@/hooks/use-toast';

export default function LabMicrobiologiaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const calidadMicrobiologicaMeta = 0.97;
  const mesesIndicador = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  // Función para limpiar el tipo de muestra de valores duplicados/corruptos
  const limpiarTipoMuestra = (tipo: string): string => {
    if (!tipo) return '';
    const tiposValidos = ['nombre', 'linea', 'producto', 'lote', 'envase', 'otro'];
    if (tiposValidos.includes(tipo)) return tipo;
    for (const tipoValido of tiposValidos) {
      if (tipo.toLowerCase().includes(tipoValido)) {
        return tipoValido;
      }
    }
    return tipo;
  };

  // Función para limpiar el área de valores duplicados/corruptos
  const limpiarArea = (area: string): string => {
    if (!area) return '';
    const areasValidas = [
      'Conservas', 'Salsas', 'Preparación Conservas', 'Preparación Salsas',
      'Embalaje', 'Frutos Secos', 'Micropesaje', 'BD MP (Bodega Materia Prima)',
      'BD PT (Bodega Producto Terminado)', 'Personal de Aseo', 'Mantenimiento (MTTO)',
      'Laboratorio Procesos', 'Laboratorio MP', 'Vestier Masculino 1',
      'Vestier Masculino 2', 'Vestier Femenino 1', 'Vestier Femenino 2',
      'Esclusa Ingreso Área de Preparación', 'Estación de Lavado de Manos Preparación de Salsas',
      'Estación de Lavado de Manos Envasado de Salsas', 'Esclusa Ingreso Área de Producción',
      'Envases (general)', 'Dispensadores', 'Secador Vestier Masculino 1',
      'Secador Vestier Masculino 2', 'Secador Vestier Femenino 1', 'Secador Vestier Femenino 2',
      'Otro'
    ];
    if (areasValidas.includes(area)) return area;
    for (const areaValida of areasValidas) {
      if (area.includes(areaValida)) {
        return areaValida;
      }
    }
    return area;
  };

  // ========== FUNCIONES DE EXPORTACIÓN RE-CAL-107 ==========

  // Función auxiliar para obtener el label del tipo de muestra
  const getTipoMuestraLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      'nombre': 'Nombre', 'linea': 'Línea', 'producto': 'Producto',
      'lote': 'Lote', 'envase': 'Envase', 'otro': 'Otro'
    };
    return labels[tipo] || tipo;
  };

  // Función auxiliar para obtener el label del motivo
  const getMotivoLabel = (motivo: string): string => {
    const labels: Record<string, string> = {
      'control_rutinario': 'Control Rutinario',
      'validacion_proceso': 'Validación de Proceso',
      'investigacion_incidente': 'Investigación de Incidente',
      'otro': 'Otro'
    };
    return labels[motivo] || motivo;
  };

  // Preparar datos para exportación
  const prepareExportData = (registro: CustodiaMuestras) => ({
    'ID': registro.id || '', 'Código': registro.codigo || '', 'Estado': registro.estado || '',
    'Tipo': registro.tipo || '', 'Muestra ID': registro.muestra_id || '',
    'Tipo de Muestra': getTipoMuestraLabel(registro.tipo_muestra || ''),
    'Valor Muestra': registro.valor_muestra || '', 'Área': registro.area || '',
    'Motivo': getMotivoLabel(registro.motivo || ''), 'Motivo Personalizado': registro.motivo_personalizado || '',
    'Temperatura': registro.temperatura || '', 'Cantidad': registro.cantidad || '',
    'Toma Muestra Fecha': registro.toma_muestra_fecha || '', 'Toma Muestra Hora': registro.toma_muestra_hora || '',
    'Recepción Lab Fecha': registro.recepcion_lab_fecha || '', 'Recepción Lab Hora': registro.recepcion_lab_hora || '',
    'Medio Transporte': registro.medio_transporte || '', 'Responsable': registro.responsable || '',
    'Observaciones': registro.observaciones || '', 'Tipo Análisis SL': registro.tipo_analisis_sl || '',
    'Tipo Análisis BC': registro.tipo_analisis_bc || '', 'Tipo Análisis YM': registro.tipo_analisis_ym || '',
    'Tipo Análisis TC': registro.tipo_analisis_tc || '', 'Tipo Análisis EC': registro.tipo_analisis_ec || '',
    'Tipo Análisis LS': registro.tipo_analisis_ls || '', 'Tipo Análisis ETB': registro.tipo_analisis_etb || '',
    'Tipo Análisis XSA': registro.tipo_analisis_xsa || '',
    'Fecha Creación': registro.created_at || '', 'Fecha Actualización': registro.updated_at || '',
  });

  // Exportar a Excel (Individual)
  const exportarExcelIndividual = (registro: CustodiaMuestras) => {
    const data = [prepareExportData(registro)];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro RE-CAL-107');
    XLSX.writeFile(wb, `RE-CAL-107_${registro.codigo}_${registro.id}.xlsx`);
  };

  // Exportar a Excel (General)
  const exportarExcelGeneral = () => {
    if (custodiaMuestrasRegistros.length === 0) { alert('No hay registros para exportar'); return; }
    const data = custodiaMuestrasRegistros.map(prepareExportData);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registros RE-CAL-107');
    XLSX.writeFile(wb, `RE-CAL-107_General_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Exportar a PDF (Individual)
  const exportarPdfIndividual = async (registro: CustodiaMuestras) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const data = prepareExportData(registro);
    let y = 20;
    doc.setFontSize(16); doc.setTextColor(0, 51, 102);
    doc.text('RE-CAL-107 - Custodia de Muestras', 105, y, { align: 'center' });
    y += 10; doc.setFontSize(12); doc.setTextColor(100, 100, 100);
    doc.text(`Registro: ${registro.codigo} (ID: ${registro.id})`, 105, y, { align: 'center' });
    y += 15; doc.setDrawColor(200, 200, 200); doc.line(20, y, 190, y); y += 10;
    doc.setFontSize(10);
    Object.entries(data).forEach(([key, value]) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.setTextColor(0, 51, 102); doc.setFont('helvetica', 'bold');
      doc.text(`${key}:`, 20, y); doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal');
      const textValue = String(value || '-');
      if (textValue.length > 80) { const splitText = doc.splitTextToSize(textValue, 120); doc.text(splitText, 70, y); y += splitText.length * 5; }
      else { doc.text(textValue, 70, y); }
      y += 7;
    });
    doc.save(`RE-CAL-107_${registro.codigo}_${registro.id}.pdf`);
  };

  // Exportar a PDF (General)
  const exportarPdfGeneral = async () => {
    if (custodiaMuestrasRegistros.length === 0) { alert('No hay registros para exportar'); return; }
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape' });
    const registros = custodiaMuestrasRegistros.slice(0, 50);
    doc.setFontSize(16); doc.setTextColor(0, 51, 102);
    doc.text('RE-CAL-107 - Custodia de Muestras (Reporte General)', 150, 20, { align: 'center' });
    const headers = ['Código', 'Estado', 'Tipo', 'Área', 'Tipo Muestra', 'Valor', 'Responsable', 'Fecha'];
    const rows = registros.map(r => [r.codigo || '', r.estado || '', r.tipo || '', r.area || '', getTipoMuestraLabel(r.tipo_muestra || ''), r.valor_muestra || '', r.responsable || '', r.toma_muestra_fecha || '']);
    let y = 40; const colWidths = [25, 25, 25, 35, 25, 35, 35, 30];
    doc.setFillColor(0, 51, 102); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    let x = 15; headers.forEach((header, i) => { doc.rect(x, y, colWidths[i], 8, 'F'); doc.text(header, x + 2, y + 6); x += colWidths[i]; });
    y += 8; doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal');
    rows.forEach((row, rowIndex) => { if (y > 190) { doc.addPage(); y = 20; } x = 15; const fillColor = rowIndex % 2 === 0 ? 245 : 255; row.forEach((cell, i) => { doc.setFillColor(fillColor, fillColor, fillColor); doc.rect(x, y, colWidths[i], 7, 'F'); doc.text(String(cell || '-').substring(0, 20), x + 2, y + 5); x += colWidths[i]; }); y += 7; });
    doc.save(`RE-CAL-107_General_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Exportar a Word (Individual)
  const exportarWordIndividual = async (registro: CustodiaMuestras) => {
    const { Document, Paragraph, Table, TableCell, TableRow, Packer } = await import('docx');
    const { saveAs } = await import('file-saver');
    const data = prepareExportData(registro);
    const tableRows = Object.entries(data).map(([key, value]) => new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: key, bold: true })], shading: { fill: '003366' }, width: { size: 40, type: 'pct' } }), new TableCell({ children: [new Paragraph({ text: String(value || '-') })], width: { size: 60, type: 'pct' } })] }));
    const doc = new Document({ sections: [{ properties: {}, children: [new Paragraph({ text: 'RE-CAL-107 - Custodia de Muestras', heading: 'Heading1', alignment: 'center' }), new Paragraph({ text: `Registro: ${registro.codigo} (ID: ${registro.id})`, alignment: 'center', spacing: { after: 400 } }), new Table({ rows: tableRows, width: { size: 100, type: 'pct' } })] }] });
    const blob = await Packer.toBlob(doc); saveAs(blob, `RE-CAL-107_${registro.codigo}_${registro.id}.docx`);
  };

  // Exportar a Word (General)
  const exportarWordGeneral = async () => {
    if (custodiaMuestrasRegistros.length === 0) { alert('No hay registros para exportar'); return; }
    const { Document, Paragraph, Table, TableCell, TableRow, Packer } = await import('docx');
    const { saveAs } = await import('file-saver');
    const registros = custodiaMuestrasRegistros.slice(0, 100);
    const headers = ['Código', 'Estado', 'Tipo', 'Área', 'Tipo Muestra', 'Valor', 'Responsable', 'Fecha'];
    const tableHeader = new TableRow({ children: headers.map(h => new TableCell({ children: [new Paragraph({ text: h, bold: true })], shading: { fill: '003366' } })) });
    const tableRows = registros.map(r => new TableRow({ children: [new TableCell({ children: [new Paragraph(r.codigo || '')] }), new TableCell({ children: [new Paragraph(r.estado || '')] }), new TableCell({ children: [new Paragraph(r.tipo || '')] }), new TableCell({ children: [new Paragraph(r.area || '')] }), new TableCell({ children: [new Paragraph(getTipoMuestraLabel(r.tipo_muestra || ''))] }), new TableCell({ children: [new Paragraph(r.valor_muestra || '')] }), new TableCell({ children: [new Paragraph(r.responsable || '')] }), new TableCell({ children: [new Paragraph(r.toma_muestra_fecha || '')] })] }));
    const doc = new Document({ sections: [{ properties: {}, children: [new Paragraph({ text: 'RE-CAL-107 - Custodia de Muestras (Reporte General)', heading: 'Heading1', alignment: 'center' }), new Paragraph({ text: `Total de registros: ${registros.length}`, alignment: 'center', spacing: { after: 400 } }), new Table({ rows: [tableHeader, ...tableRows], width: { size: 100, type: 'pct' } })] }] });
    const blob = await Packer.toBlob(doc); saveAs(blob, `RE-CAL-107_General_${new Date().toISOString().split('T')[0]}.docx`);
  };

  // ========== FUNCIONES GENÉRICAS DE EXPORTACIÓN PARA TODOS LOS REGISTROS ==========

  // Exportar array genérico a Excel
  const exportarArrayExcel = (registros: any[], titulo: string, fileName: string) => {
    if (registros.length === 0) { alert('No hay registros para exportar'); return; }
    const ws = XLSX.utils.json_to_sheet(registros);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, titulo);
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Exportar array genérico a PDF
  const exportarArrayPdf = async (registros: any[], titulo: string, fileName: string, columnas: string[]) => {
    if (registros.length === 0) { alert('No hay registros para exportar'); return; }
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape' });
    const data = registros.slice(0, 50);
    doc.setFontSize(16); doc.setTextColor(0, 51, 102);
    doc.text(titulo, 150, 20, { align: 'center' });
    const rows = data.map(r => columnas.map(col => String(r[col] || '-').substring(0, 25)));
    const colWidths = columnas.map(() => 240 / columnas.length);
    let y = 40;
    doc.setFillColor(0, 51, 102); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    let x = 15; columnas.forEach((header, i) => { doc.rect(x, y, colWidths[i], 8, 'F'); doc.text(header.substring(0, 15), x + 2, y + 6); x += colWidths[i]; });
    y += 8; doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal');
    rows.forEach((row, rowIndex) => { if (y > 190) { doc.addPage(); y = 20; } x = 15; const fillColor = rowIndex % 2 === 0 ? 245 : 255; row.forEach((cell, i) => { doc.setFillColor(fillColor, fillColor, fillColor); doc.rect(x, y, colWidths[i], 7, 'F'); doc.text(cell, x + 2, y + 5); x += colWidths[i]; }); y += 7; });
    doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Exportar array genérico a Word
  const exportarArrayWord = async (registros: any[], titulo: string, fileName: string, columnas: string[]) => {
    if (registros.length === 0) { alert('No hay registros para exportar'); return; }
    const { Document, Paragraph, Table, TableCell, TableRow, Packer } = await import('docx');
    const { saveAs } = await import('file-saver');
    const data = registros.slice(0, 100);
    const tableHeader = new TableRow({ children: columnas.map(h => new TableCell({ children: [new Paragraph({ text: h, bold: true })], shading: { fill: '003366' } })) });
    const tableRows = data.map(r => new TableRow({ children: columnas.map(col => new TableCell({ children: [new Paragraph(String(r[col] || '-'))] })) }));
    const doc = new Document({ sections: [{ properties: {}, children: [new Paragraph({ text: titulo, heading: 'Heading1', alignment: 'center' }), new Paragraph({ text: `Total de registros: ${data.length}`, alignment: 'center', spacing: { after: 400 } }), new Table({ rows: [tableHeader, ...tableRows], width: { size: 100, type: 'pct' } })] }] });
    const blob = await Packer.toBlob(doc); saveAs(blob, `${fileName}_${new Date().toISOString().split('T')[0]}.docx`);
  };

  // Componente reutilizable de botones de exportación
  const BotonesExportacion = ({ registros, titulo, fileName, columnas }: { registros: any[], titulo: string, fileName: string, columnas: string[] }) => {
    if (registros.length === 0) return null;
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => exportarArrayExcel(registros, titulo, fileName)} title="Exportar Excel">
          <Download className="w-4 h-4 mr-1" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportarArrayPdf(registros, titulo, fileName, columnas)} title="Exportar PDF">
          <FileText className="w-4 h-4 mr-1" /> PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportarArrayWord(registros, titulo, fileName, columnas)} title="Exportar Word">
          <FileText className="w-4 h-4 mr-1" /> Word
        </Button>
      </>
    );
  };

  // ========== FUNCIONES DE EXPORTACIÓN INDIVIDUAL ==========

  // Exportar registro individual a Excel
  const exportarIndividualExcel = (registro: any, fileName: string) => {
    const ws = XLSX.utils.json_to_sheet([registro]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro');
    XLSX.writeFile(wb, `${fileName}_${registro.id}.xlsx`);
  };

  // Exportar registro individual a PDF
  const exportarIndividualPdf = async (registro: any, titulo: string, fileName: string) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16); doc.setTextColor(0, 51, 102);
    doc.text(titulo, 105, y, { align: 'center' });
    y += 10; doc.setFontSize(12); doc.setTextColor(100, 100, 100);
    doc.text(`ID: ${registro.id}`, 105, y, { align: 'center' });
    y += 15; doc.setDrawColor(200, 200, 200); doc.line(20, y, 190, y); y += 10;
    doc.setFontSize(10);
    Object.entries(registro).forEach(([key, value]) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.setTextColor(0, 51, 102); doc.setFont('helvetica', 'bold');
      doc.text(`${key}:`, 20, y); doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal');
      const textValue = String(value || '-');
      if (textValue.length > 80) { const splitText = doc.splitTextToSize(textValue, 120); doc.text(splitText, 70, y); y += splitText.length * 5; }
      else { doc.text(textValue.substring(0, 50), 70, y); }
      y += 7;
    });
    doc.save(`${fileName}_${registro.id}.pdf`);
  };

  // Exportar registro individual a Word
  const exportarIndividualWord = async (registro: any, titulo: string, fileName: string) => {
    const { Document, Paragraph, Table, TableCell, TableRow, Packer } = await import('docx');
    const { saveAs } = await import('file-saver');
    const tableRows = Object.entries(registro).map(([key, value]) => new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: key, bold: true })], shading: { fill: '003366' }, width: { size: 40, type: 'pct' } }), new TableCell({ children: [new Paragraph({ text: String(value || '-') })], width: { size: 60, type: 'pct' } })] }));
    const doc = new Document({ sections: [{ properties: {}, children: [new Paragraph({ text: titulo, heading: 'Heading1', alignment: 'center' }), new Paragraph({ text: `ID: ${registro.id}`, alignment: 'center', spacing: { after: 400 } }), new Table({ rows: tableRows, width: { size: 100, type: 'pct' } })] }] });
    const blob = await Packer.toBlob(doc); saveAs(blob, `${fileName}_${registro.id}.docx`);
  };

  // Componente de botones de exportación individual
  const BotonesExportacionIndividual = ({ registro, titulo, fileName }: { registro: any, titulo: string, fileName: string }) => {
    if (!registro) return null;
    return (
      <>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); exportarIndividualExcel(registro, fileName); }} title="Exportar Excel">
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); exportarIndividualPdf(registro, titulo, fileName); }} title="Exportar PDF">
          <FileText className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); exportarIndividualWord(registro, titulo, fileName); }} title="Exportar Word">
          <FileText className="w-4 h-4" />
        </Button>
      </>
    );
  };

  const [isCondicionesModalOpen, setIsCondicionesModalOpen] = useState(false);
  const [isTemperaturaModalOpen, setIsTemperaturaModalOpen] = useState(false);
  const [isMediosCultivoModalOpen, setIsMediosCultivoModalOpen] = useState(false);
  const [isEsterilizacionAutoclaveModalOpen, setIsEsterilizacionAutoclaveModalOpen] = useState(false);
  const [isCustodiaMuestrasModalOpen, setIsCustodiaMuestrasModalOpen] = useState(false);
  const [isIncubadoraControlModalOpen, setIsIncubadoraControlModalOpen] = useState(false);
  const [isResultadosMicrobiologicosModalOpen, setIsResultadosMicrobiologicosModalOpen] = useState(false);
  const [isViewResultadosMicrobiologicosModalOpen, setIsViewResultadosMicrobiologicosModalOpen] = useState(false);
  const [viewingResultadosMicrobiologicos, setViewingResultadosMicrobiologicos] = useState<ResultadosMicrobiologicos | null>(null);
  const [isControlLavadoInactivacionModalOpen, setIsControlLavadoInactivacionModalOpen] = useState(false);
  const [isRegistrosRecepcionFormatosModalOpen, setIsRegistrosRecepcionFormatosModalOpen] = useState(false);
  const [isIndicadorModalOpen, setIsIndicadorModalOpen] = useState(false);
  const [indicadorMes, setIndicadorMes] = useState<'all' | string>('all');
  // Búsqueda y filtro para RE-CAL-046
  const [busquedaRecal046, setBusquedaRecal046] = useState('');
  const [filtroTipoRecal046, setFiltroTipoRecal046] = useState<'all' | string>('all');
  const [condicionesRegistros, setCondicionesRegistros] = useState<CondicionesAmbientales[]>([]);
  const [temperaturaRegistros, setTemperaturaRegistros] = useState<TemperaturaEquipos[]>([]);
  const [mediosCultivoRegistros, setMediosCultivoRegistros] = useState<MediosCultivo[]>([]);
  const [esterilizacionAutoclaveRegistros, setEsterilizacionAutoclaveRegistros] = useState<EsterilizacionAutoclave[]>([]);
  const [custodiaMuestrasRegistros, setCustodiaMuestrasRegistros] = useState<CustodiaMuestras[]>([]);
  const [incubadoraControlRegistros, setIncubadoraControlRegistros] = useState<IncubadoraControl[]>([]);
  const [resultadosMicrobiologicosRegistros, setResultadosMicrobiologicosRegistros] = useState<ResultadosMicrobiologicos[]>([]);
  const [controlLavadoInactivacionRegistros, setControlLavadoInactivacionRegistros] = useState<ControlLavadoInactivacion[]>([]);
  const [registrosRecepcionFormatosRegistros, setRegistrosRecepcionFormatosRegistros] = useState<RegistrosRecepcionFormatos[]>([]);
  const [editingCondiciones, setEditingCondiciones] = useState<CondicionesAmbientales | null>(null);
  const [editingTemperatura, setEditingTemperatura] = useState<TemperaturaEquipos | null>(null);
  const [editingMediosCultivo, setEditingMediosCultivo] = useState<MediosCultivo | null>(null);
  const [editingEsterilizacionAutoclave, setEditingEsterilizacionAutoclave] = useState<EsterilizacionAutoclave | null>(null);
  const [editingCustodiaMuestras, setEditingCustodiaMuestras] = useState<CustodiaMuestras | null>(null);
  const [editingIncubadoraControl, setEditingIncubadoraControl] = useState<IncubadoraControl | null>(null);
  const [editingResultadosMicrobiologicos, setEditingResultadosMicrobiologicos] = useState<ResultadosMicrobiologicos | null>(null);
  const [editingControlLavadoInactivacion, setEditingControlLavadoInactivacion] = useState<ControlLavadoInactivacion | null>(null);
  const [editingRegistrosRecepcionFormatos, setEditingRegistrosRecepcionFormatos] = useState<RegistrosRecepcionFormatos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<'principal' | 'condiciones' | 'temperatura' | 'medios-cultivo' | 'esterilizacion-autoclave' | 'custodia-muestras' | 'incubadora-control' | 'resultados-microbiologicos' | 'control-lavado-inactivacion' | 'registros-recepcion-formatos' | 'detalle' | 'conograma' | 'indicadores'>('principal');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detalle, setDetalle] = useState<{ tipo: string; titulo: string; record: any } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmContext, setDeleteConfirmContext] = useState<{
    label: string;
    run: () => Promise<void>;
  } | null>(null);
  const [isCronogramaModalOpen, setIsCronogramaModalOpen] = useState(false);
  const [cronogramaSeleccionado, setCronogramaSeleccionado] = useState<{
    codigo: string;
    titulo: string;
    version: string;
    fechaAprobacion: string;
  } | null>(null);
  const [pendingTaskToComplete, setPendingTaskToComplete] = useState<TareaCronograma | null>(null);

  const registrosResultadosConResultado = useMemo(() => {
    return resultadosMicrobiologicosRegistros.filter(
      (r) => Boolean(r?.fecha) && (Boolean(r.cumple) || Boolean(r.no_cumple))
    );
  }, [resultadosMicrobiologicosRegistros]);

  const registrosResultadosFiltrados = useMemo(() => {
    if (indicadorMes === 'all') return registrosResultadosConResultado;
    const month = Number(indicadorMes);
    if (!month || month < 1 || month > 12) return registrosResultadosConResultado;

    return registrosResultadosConResultado.filter((r) => {
      const d = new Date(r.fecha);
      if (Number.isNaN(d.getTime())) return false;
      return d.getMonth() + 1 === month;
    });
  }, [indicadorMes, registrosResultadosConResultado]);

  const calidadMicrobiologicaSerie = useMemo(() => {
    const bucket = new Map<
      string,
      { mes: string; total: number; cumple: number; cumplimiento: number }
    >();

    for (const registro of registrosResultadosFiltrados) {
      if (!registro?.fecha) continue;

      const date = new Date(registro.fecha);
      if (Number.isNaN(date.getTime())) continue;

      const mes = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const prev = bucket.get(mes) ?? { mes, total: 0, cumple: 0, cumplimiento: 0 };
      const nextTotal = prev.total + 1;
      const nextCumple = prev.cumple + (registro.cumple ? 1 : 0);
      bucket.set(mes, {
        mes,
        total: nextTotal,
        cumple: nextCumple,
        cumplimiento: nextTotal > 0 ? (nextCumple / nextTotal) * 100 : 0,
      });
    }

    return Array.from(bucket.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [registrosResultadosFiltrados]);

  const calidadMicrobiologicaResumen = useMemo(() => {
    const total = registrosResultadosFiltrados.length;
    const cumple = registrosResultadosFiltrados.filter((r) => Boolean(r.cumple)).length;
    const porcentaje = total > 0 ? (cumple / total) * 100 : 0;
    return { total, cumple, porcentaje };
  }, [registrosResultadosFiltrados]);

  useEffect(() => {
    if (!user) {
      router.push('/login-simple');
      return;
    }

    // Verificar roles permitidos
    if (user.role !== 'jefe' && user.role !== 'operario' && user.role !== 'supervisor') {
      router.push('/dashboard');
      return;
    }

    // Cargar registros existentes
    loadRegistros();
  }, [user, router]);

  // Generar automáticamente registros pendientes desde cronograma cuando se abre la vista
  useEffect(() => {
    if (vistaActual === 'custodia-muestras') {
      // Solo generar registros automáticos si NO venimos del cronograma a completar una tarea específica
      // Esto evita duplicados: si venimos del cronograma, el usuario creará el registro manualmente
      if (!pendingTaskToComplete) {
        generarRegistrosDesdeCronograma();
      } else {
        // Solo cargar los registros sin generar nuevos
        loadRegistros();
      }
    }
  }, [vistaActual, pendingTaskToComplete]);

  // Función para generar registros automáticamente desde el cronograma
  const generarRegistrosDesdeCronograma = async () => {
    try {
      setIsLoading(true);
      const fechaActual = new Date();
      const mes = fechaActual.getMonth() + 1; // getMonth() devuelve 0-11
      const anio = fechaActual.getFullYear();
      
      console.log(`🔄 Generando registros para ${mes}/${anio}...`);
      
      // Generar registros desde el cronograma
      const resultado = await custodiaMuestrasService.generarDesdeCronograma(mes, anio);
      
      if (resultado.creados > 0) {
        toast({
          title: "Registros generados",
          description: `Se crearon ${resultado.creados} registros pendientes desde el cronograma PL-CAL-008`,
        });
      }
      
      // Recargar la lista completa de registros
      const registrosActualizados = await custodiaMuestrasService.getAll();
      setCustodiaMuestrasRegistros(registrosActualizados);
      
    } catch (error) {
      console.error('Error al generar registros desde cronograma:', error);
      // No mostrar toast de error para no molestar al usuario
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleCondicionesSuccessfulSubmit = async (values?: any, estado?: 'pendiente' | 'completado') => {
    await loadRegistros(); // Recargar los registros después de agregar/actualizar
  };

  const handleTemperaturaSuccessfulSubmit = async (values?: any, estado?: 'pendiente' | 'completado') => {
    await loadRegistros(); // Recargar los registros después de agregar/actualizar
  };

  const handleMediosCultivoSuccessfulSubmit = async (values?: any, estado?: 'pendiente' | 'completado') => {
    await loadRegistros(); // Recargar los registros después de agregar/actualizar
  };

  const handleEsterilizacionAutoclaveSuccessfulSubmit = async (values?: any, estado?: 'pendiente' | 'completado') => {
    await loadRegistros(); // Recargar los registros después de agregar/actualizar
  };

  const handleCustodiaMuestrasSuccessfulSubmit = async (values?: any, estado?: 'pendiente' | 'completado') => {
    await loadRegistros(); // Recargar los registros después de agregar/actualizar

    // Si hay una tarea pendiente de completar y el registro fue completado, marcarla como completada
    if (pendingTaskToComplete && estado === 'completado') {
      try {
        const tipoCronograma = (pendingTaskToComplete as any).cronogramaTipo;

        if (tipoCronograma === 'agua-potable') {
          // Marcar tarea de agua potable como completada
          const response = await fetch(`/api/cronograma-agua-potable?id=${pendingTaskToComplete.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'completed' }),
          });

          if (!response.ok) {
            throw new Error('Error al marcar la tarea de agua potable como completada');
          }

          toast({
            title: 'Éxito',
            description: 'La tarea del cronograma de agua potable ha sido marcada como completada',
          });
        } else {
          // Marcar tarea de microbiología como completada
          await microbiologiaCronogramaService.markAsCompleted(pendingTaskToComplete.id);
          toast({
            title: 'Éxito',
            description: 'La tarea del cronograma ha sido marcada como completada',
          });
        }

        setPendingTaskToComplete(null);
      } catch (error) {
        console.error('Error al marcar la tarea como completada:', error);
        toast({
          title: 'Error',
          description: 'No se pudo marcar la tarea como completada',
          variant: 'destructive',
        });
      }
    }
  };

  const handleIncubadoraControlSuccessfulSubmit = async (values?: any, estado?: 'pendiente' | 'completado') => {
    await loadRegistros(); // Recargar los registros después de agregar/actualizar
  };

  const handleResultadosMicrobiologicosSuccessfulSubmit = async (values?: any, estado?: 'pendiente' | 'completado') => {
    await loadRegistros(); // Recargar los registros después de agregar/actualizar
  };

  const handleControlLavadoInactivacionSuccessfulSubmit = async (values?: any, estado?: 'pendiente' | 'completado') => {
    await loadRegistros(); // Recargar los registros después de agregar/actualizar
  };

  const handleRegistrosRecepcionFormatosSuccessfulSubmit = async (values?: any, estado?: 'pendiente' | 'completado') => {
    await loadRegistros(); // Recargar los registros después de agregar/actualizar
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

  const openDetalle = (tipo: string, titulo: string, record: any) => {
    setDetalle({ tipo, titulo, record });
    setVistaActual('detalle');
  };

  const formatDetalleLabel = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const renderDetalleValue = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'string') {
      const isIsoDateLike = /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value);
      if (isIsoDateLike) {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) return d.toLocaleString('es-ES');
      }
    }
    return String(value);
  };

  const renderDetalleGrid = (items: Array<{ label: string; value: any }>) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg border bg-white p-3 min-w-0">
            <p className="text-xs font-medium text-gray-500">{it.label}</p>
            <p className="text-sm text-gray-900 mt-1 break-words whitespace-pre-wrap overflow-wrap-anywhere">{renderDetalleValue(it.value)}</p>
          </div>
        ))}
      </div>
    );
  };

  // Función específica para mostrar detalle de Custodia de Muestras (RE-CAL-107)
  const renderDetalleGridCustodia = (record: any) => {
    // Mapeo de valores de motivo a etiquetas legibles
    const motivoLabels: Record<string, string> = {
      'control_rutinario': 'Control Rutinario',
      'validacion_proceso': 'Validación de Proceso',
      'investigacion_incidente': 'Investigación de Incidente',
      'otro': 'Otro',
    };

    // Definir solo los campos que están en el modal, en orden lógico
    const camposModal = [
      { key: 'codigo', label: 'Código' },
      { key: 'estado', label: 'Estado' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'muestra_id', label: 'Muestra' },
      { key: 'tipo_muestra', label: 'Tipo de Muestra', formatter: (v: string) => {
        const labels: Record<string, string> = {
          'nombre': 'Nombre',
          'linea': 'Línea',
          'producto': 'Producto',
          'lote': 'Lote',
          'envase': 'Envase',
          'otro': 'Otro'
        };
        return labels[v] || v;
      }},
      { key: 'valor_muestra', label: 'Valor', formatter: (v: string, r: any) => {
        const tipo = r?.tipo_muestra;
        const tipoLabel: Record<string, string> = {
          'nombre': 'Nombre:',
          'linea': 'Línea:',
          'producto': 'Producto:',
          'lote': 'Lote:',
          'envase': 'Envase:',
          'otro': 'Otro:'
        };
        return tipo ? `${tipoLabel[tipo] || ''} ${v || '-'}` : (v || '-');
      }},
      { key: 'area', label: 'Área' },
      { key: 'motivo', label: 'Motivo', formatter: (v: string) => motivoLabels[v] || v },
      // motivo_personalizado se mostrará solo si motivo es "otro" y tiene valor
      { key: 'motivo_personalizado', label: 'Motivo Personalizado', conditional: true },
      { key: 'temperatura', label: 'Temperatura' },
      { key: 'cantidad', label: 'Cantidad' },
      { key: 'toma_muestra_fecha', label: 'Toma Muestra Fecha' },
      { key: 'toma_muestra_hora', label: 'Toma Muestra Hora' },
      { key: 'recepcion_lab_fecha', label: 'Recepción Lab Fecha' },
      { key: 'recepcion_lab_hora', label: 'Recepción Lab Hora' },
      { key: 'medio_transporte', label: 'Medio Transporte' },
      { key: 'responsable', label: 'Responsable' },
      { key: 'observaciones', label: 'Observaciones' },
      { key: 'tipo_analisis_sl', label: 'Tipo Análisis SL' },
      { key: 'tipo_analisis_bc', label: 'Tipo Análisis BC' },
      { key: 'tipo_analisis_ym', label: 'Tipo Análisis YM' },
      { key: 'tipo_analisis_tc', label: 'Tipo Análisis TC' },
      { key: 'tipo_analisis_ec', label: 'Tipo Análisis EC' },
      { key: 'tipo_analisis_ls', label: 'Tipo Análisis LS' },
      { key: 'tipo_analisis_etb', label: 'Tipo Análisis ETB' },
      { key: 'tipo_analisis_xsa', label: 'Tipo Análisis XSA' },
      // cronograma_task_id excluido - es un ID interno
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {camposModal.map((campo) => {
          const value = record?.[campo.key];
          // Mostrar campo solo si tiene valor (no nulo, vacío o guiones)
          let hasValue = value !== null && value !== undefined && value !== '' && value !== '-';
          
          // Para motivo_personalizado, solo mostrar si motivo es "otro" y hay valor
          if (campo.key === 'motivo_personalizado') {
            const motivo = record?.motivo;
            if (motivo !== 'otro' || !hasValue) {
              return null; // No mostrar este campo
            }
          }
          
          // Para observaciones, ocultar texto automático del sistema
          if (campo.key === 'observaciones' && typeof value === 'string' && value.toLowerCase().includes('generado automáticamente')) {
            hasValue = false; // Tratar como vacío
          }
          
          // Aplicar formatter si existe (pasar record para formatters que necesiten contexto)
          const displayValue = hasValue && campo.formatter ? campo.formatter(value, record) : value;
          
          return (
            <div key={campo.key} className="rounded-lg border bg-white p-3 min-w-0">
              <p className="text-xs font-medium text-gray-500">{campo.label}</p>
              <p className="text-sm text-gray-900 mt-1 break-words whitespace-pre-wrap overflow-wrap-anywhere">
                {hasValue ? renderDetalleValue(displayValue) : ''}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  // Función específica para mostrar detalle de Resultados Microbiológicos (RE-CAL-046)
  const renderDetalleGridResultados = (record: any) => {
    // Definir campos del modal en orden lógico
    const camposModal = [
      { key: 'codigo', label: 'Código' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'mes_muestreo', label: 'Mes de Muestreo' },
      { key: 'hora_muestreo', label: 'Hora de Muestreo' },
      { key: 'interno_externo', label: 'Interno/Externo' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'muestra', label: 'Muestra' },
      { key: 'tipo_muestra', label: 'Tipo de Muestra', formatter: (v: string) => {
        const labels: Record<string, string> = {
          'nombre': 'Nombre',
          'linea': 'Línea',
          'producto': 'Producto',
          'lote': 'Lote',
          'envase': 'Envase',
          'otro': 'Otro'
        };
        return labels[v] || v;
      }},
      { key: 'valor_muestra', label: 'Valor', formatter: (v: string, r: any) => v || '-', getLabel: (r: any) => {
        // Label dinámico según el tipo de muestra
        const tipo = r?.tipo_muestra;
        const labels: Record<string, string> = {
          'nombre': 'Nombre',
          'linea': 'Línea',
          'producto': 'Producto',
          'lote': 'Lote',
          'envase': 'Envase',
          'otro': 'Otro'
        };
        return labels[tipo] || 'Valor';
      }},
      { key: 'area', label: 'Área' },
      { key: 'fecha_produccion', label: 'Fecha de Producción' },
      { key: 'fecha_vencimiento', label: 'Fecha de Vencimiento' },
      { key: 'mesofilos', label: 'Mesófilos' },
      { key: 'coliformes_totales', label: 'Coliformes Totales' },
      { key: 'coliformes_fecales', label: 'Coliformes Fecales' },
      { key: 'e_coli', label: 'E. Coli' },
      { key: 'mohos', label: 'Mohos' },
      { key: 'levaduras', label: 'Levaduras' },
      { key: 'staphylococcus_aureus', label: 'Staphylococcus Aureus' },
      { key: 'bacillus_cereus', label: 'Bacillus Cereus' },
      { key: 'listeria', label: 'Listeria' },
      { key: 'salmonella', label: 'Salmonella' },
      { key: 'enterobacterias', label: 'Enterobacterias' },
      { key: 'clostridium', label: 'Clostridium' },
      { key: 'esterilidad_comercial', label: 'Esterilidad Comercial' },
      { key: 'anaerobias', label: 'Anaerobias' },
      { key: 'observaciones', label: 'Observaciones' },
      { key: 'parametros_referencia', label: 'Parámetros de Referencia' },
      { key: 'cumple', label: 'Cumple' },
      { key: 'no_cumple', label: 'No Cumple' },
      { key: 'medio_diluyente', label: 'Medio Diluyente' },
      { key: 'factor_dilucion', label: 'Factor de Dilución' },
      { key: 'responsable', label: 'Responsable' },
      // cronograma_task_id excluido - es un ID interno
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {camposModal.map((campo) => {
          const value = record?.[campo.key];
          // Mostrar campo solo si tiene valor (no nulo, vacío o guiones)
          let hasValue = value !== null && value !== undefined && value !== '' && value !== '-';
          
          // Para observaciones, ocultar texto automático del sistema
          if (campo.key === 'observaciones' && typeof value === 'string' && value.toLowerCase().includes('generado automáticamente')) {
            hasValue = false; // Tratar como vacío
          }
          
          // Aplicar formatter si existe (pasar record para formatters que necesiten contexto)
          const displayValue = hasValue && campo.formatter ? campo.formatter(value, record) : value;
          
          // Obtener label dinámico si existe getLabel
          const fieldLabel = campo.getLabel ? campo.getLabel(record) : campo.label;
          
          return (
            <div key={campo.key} className="rounded-lg border bg-white p-3 min-w-0">
              <p className="text-xs font-medium text-gray-500">{fieldLabel}</p>
              <p className="text-sm text-gray-900 mt-1 break-words whitespace-pre-wrap overflow-wrap-anywhere">
                {hasValue ? renderDetalleValue(displayValue) : ''}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const getVistaTitulo = () => {
    const titulos: Record<string, string> = {
      principal: 'Registros',
      condiciones: 'RE-CAL-021 - Condiciones Ambientales',
      temperatura: 'RE-CAL-016 - Temperatura Equipos',
      'medios-cultivo': 'RE-CAL-023 - Medios de Cultivo',
      'esterilizacion-autoclave': 'RE-CAL-063 - Esterilización Autoclave',
      'custodia-muestras': 'RE-CAL-096 - Custodia de Muestras',
      'incubadora-control': 'RE-CAL-089 - Control de Incubadora',
      'resultados-microbiologicos': 'RE-CAL-046 - Resultados Microbiológicos',
      'control-lavado-inactivacion': 'RE-CAL-111 - Control Lavado e Inactivación',
      'registros-recepcion-formatos': 'RE-CAL-086 - Registros Recepción Formatos',
      conograma: 'Cronogramas',
      indicadores: 'Indicadores BPM',
      detalle: detalle?.titulo || 'Detalle',
    };
    return titulos[vistaActual] || 'LAB. MICROBIOLOGÍA';
  };

  const handleDelete = async (opts: { id?: string; label: string; run: () => Promise<void> }) => {
    if (!opts.id) {
      toast({
        title: 'Error',
        description: 'No se encontró el ID del registro.',
        variant: 'destructive',
      });
      return;
    }

    setDeleteConfirmContext({
      label: opts.label,
      run: opts.run,
    });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmContext) return;

    try {
      await deleteConfirmContext.run();
      toast({
        title: 'Registro eliminado',
        description: `El registro de ${deleteConfirmContext.label} fue eliminado correctamente.`,
      });
      loadRegistros();
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      toast({
        title: 'Error',
        description: `No se pudo eliminar el registro de ${deleteConfirmContext.label}.`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setDeleteConfirmContext(null);
    }
  };

  // Componente Sidebar Item
  const SidebarItem = ({ 
    id, 
    icon: Icon, 
    title, 
    subtitle, 
    color = 'gray',
    count
  }: { 
    id: string; 
    icon: any; 
    title: string; 
    subtitle?: string;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo' | 'cyan' | 'pink' | 'gray' | 'violet' | 'orange';
    count?: number;
  }) => {
    const isActive = vistaActual === id;
    const colors = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-600' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'text-pink-600' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-600' },
      violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    };
    const c = colors[color];
    
    return (
      <button
        onClick={() => {
          setVistaActual(id as any);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
          isActive ? `${c.bg} ${c.text} font-medium` : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-white/60' : 'bg-gray-100 group-hover:bg-white'}`}>
          <Icon className={`w-4 h-4 ${isActive ? c.icon : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium">{title}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
        {count !== undefined && count > 0 && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{count}</span>
        )}
      </button>
    );
  };

  if (!user || (user.role !== 'jefe' && user.role !== 'operario' && user.role !== 'supervisor')) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'flex' : 'hidden'} flex-col fixed lg:static inset-y-0 left-0 lg:relative z-50 w-72 bg-white border-r border-gray-200 h-screen lg:h-full`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Microscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm">LAB. MICROBIOLOGÍA</h1>
              <p className="text-xs text-gray-500">Sistema de Gestión</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Módulos</div>
          <SidebarItem 
            id="principal" 
            icon={FileText} 
            title="Registros" 
            subtitle="Formatos RE-CAL" 
            color="blue" 
            count={condicionesRegistros.length + temperaturaRegistros.length + mediosCultivoRegistros.length + esterilizacionAutoclaveRegistros.length + custodiaMuestrasRegistros.length + incubadoraControlRegistros.length + resultadosMicrobiologicosRegistros.length + controlLavadoInactivacionRegistros.length + registrosRecepcionFormatosRegistros.length} 
          />
          <SidebarItem 
            id="conograma" 
            icon={Clock} 
            title="Cronogramas" 
            subtitle="Planificación de actividades" 
            color="violet" 
          />
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header con menú hamburguesa */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900">{getVistaTitulo()}</h1>
          <div className="w-10" />
        </header>

        {/* Header escritorio - también con menú hamburguesa para colapsar sidebar */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 p-4 items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-100 mr-3">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900 text-lg">{getVistaTitulo()}</h1>
          <div className="flex-1" />
        </header>

        {/* Área de contenido */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <AlertDialog
            open={isDeleteConfirmOpen}
            onOpenChange={(open) => {
              setIsDeleteConfirmOpen(open);
              if (!open) setDeleteConfirmContext(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteConfirmContext
                    ? `¿Eliminar este registro de ${deleteConfirmContext.label}? Esta acción no se puede deshacer.`
                    : '¿Eliminar este registro? Esta acción no se puede deshacer.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={(e) => {
                    e.preventDefault();
                    confirmDelete();
                  }}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Header Desktop - Botón Volver */}
          {vistaActual !== 'principal' && vistaActual !== 'detalle' && (
            <div className="hidden lg:flex items-center justify-end mb-6">
              <Button variant="outline" onClick={() => setVistaActual('principal')}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Volver a Registros
              </Button>
            </div>
          )}

      {vistaActual === 'detalle' && detalle && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{detalle.titulo}</h1>
              <p className="text-gray-600 mt-2">Detalle del registro</p>
            </div>
            <Button
              onClick={() => setVistaActual(detalle.tipo as any)}
              variant="outline"
            >
              Volver
            </Button>
          </div>

          {detalle.tipo === 'custodia-muestras' ? (
            // Vista específica para RE-CAL-107 - solo campos del modal
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
                <CardDescription>Campos del registro seleccionado</CardDescription>
              </CardHeader>
              <CardContent>
                {renderDetalleGridCustodia(detalle.record)}
              </CardContent>
            </Card>
          ) : detalle.tipo === 'resultados-microbiologicos' ? (
            // Vista específica para RE-CAL-046 - solo campos del modal
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
                <CardDescription>Campos del registro seleccionado</CardDescription>
              </CardHeader>
              <CardContent>
                {renderDetalleGridResultados(detalle.record)}
              </CardContent>
            </Card>
          ) : (
            // Vista genérica para otros tipos
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
                <CardDescription>Campos del registro seleccionado</CardDescription>
              </CardHeader>
              <CardContent>
                {renderDetalleGrid(
                  Object.entries(detalle.record ?? {})
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, value]) => ({
                      label: formatDetalleLabel(key),
                      value,
                    }))
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

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
              className="group border-blue-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
                        setEditingCondiciones(null);
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
              className="group border-green-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={handleVerTemperatura}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Thermometer className="h-6 w-6 text-green-600" />
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
                        setEditingTemperatura(null);
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
              className="group border-purple-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
                        setEditingMediosCultivo(null);
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
              className="group border-orange-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
                        setEditingEsterilizacionAutoclave(null);
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
              className="group border-red-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
                        setEditingCustodiaMuestras(null);
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
              className="group border-teal-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
                        setEditingIncubadoraControl(null);
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
              className="group border-indigo-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
                        setEditingResultadosMicrobiologicos(null);
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
              className="group border-cyan-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
                        setEditingControlLavadoInactivacion(null);
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
              className="group border-amber-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
                        setEditingRegistrosRecepcionFormatos(null);
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="flex justify-end items-center gap-2">
                <BotonesExportacion 
                  registros={condicionesRegistros} 
                  titulo="RE-CAL-021 - Condiciones Ambientales" 
                  fileName="RE-CAL-021_Condiciones_Ambientales"
                  columnas={['fecha', 'hora', 'temperatura', 'humedad', 'responsable']}
                />
                <Button onClick={() => {
                  setEditingCondiciones(null);
                  setIsCondicionesModalOpen(true);
                }}>
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
                  <Button onClick={() => {
                    setEditingCondiciones(null);
                    setIsCondicionesModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {condicionesRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('condiciones', 'RE-CAL-021 - Condiciones Ambientales', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        {registro.estado === 'pendiente' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCondiciones(registro);
                              setIsCondicionesModalOpen(true);
                            }}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCondiciones(registro);
                              setIsCondicionesModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <BotonesExportacionIndividual 
                          registro={registro} 
                          titulo="RE-CAL-021 - Condiciones Ambientales" 
                          fileName="RE-CAL-021_Condiciones_Ambientales"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Condiciones Ambientales',
                              run: () => condicionesAmbientalesService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
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
              <div className="flex justify-end items-center gap-2">
                <BotonesExportacion 
                  registros={temperaturaRegistros} 
                  titulo="RE-CAL-016 - Temperatura Equipos" 
                  fileName="RE-CAL-016_Temperatura_Equipos"
                  columnas={['fecha', 'equipo', 'temperatura', 'responsable']}
                />
                <Button onClick={() => {
                  setEditingTemperatura(null);
                  setIsTemperaturaModalOpen(true);
                }}>
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
                    <Thermometer className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay registros
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comienza agregando tu primer registro de temperatura de equipos.
                  </p>
                  <Button onClick={() => {
                    setEditingTemperatura(null);
                    setIsTemperaturaModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {temperaturaRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('temperatura', 'RE-CAL-016 - Temperatura Equipos', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        {registro.estado === 'pendiente' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTemperatura(registro);
                              setIsTemperaturaModalOpen(true);
                            }}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTemperatura(registro);
                              setIsTemperaturaModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <BotonesExportacionIndividual 
                          registro={registro} 
                          titulo="RE-CAL-016 - Temperatura Equipos" 
                          fileName="RE-CAL-016_Temperatura_Equipos"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Temperatura Equipos',
                              run: () => temperaturaEquiposService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">
                            {(() => {
                              const serial = Number(registro.fecha);
                              if (Number.isFinite(serial) && serial > 1000) {
                                // Excel serial date
                                const epoch = new Date(1900, 0, 1);
                                const adjustment = serial > 60 ? 1 : 0;
                                const days = serial - 1 - adjustment;
                                const date = new Date(epoch);
                                date.setDate(epoch.getDate() + days);
                                return date.toLocaleDateString('es-ES');
                              }
                              return registro.fecha || '-';
                            })()}
                          </p>
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
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
              <div className="flex justify-end items-center gap-2">
                <BotonesExportacion 
                  registros={mediosCultivoRegistros} 
                  titulo="RE-CAL-022 - Medios de Cultivo" 
                  fileName="RE-CAL-022_Medios_Cultivo"
                  columnas={['fecha', 'lote', 'medio_cultivo', 'volumen_preparado', 'ph', 'responsable']}
                />
                <Button onClick={() => {
                  setEditingMediosCultivo(null);
                  setIsMediosCultivoModalOpen(true);
                }}>
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
                  <Button onClick={() => {
                    setEditingMediosCultivo(null);
                    setIsMediosCultivoModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mediosCultivoRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('medios-cultivo', 'RE-CAL-022 - Medios de Cultivo', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        {registro.estado === 'pendiente' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMediosCultivo(registro);
                              setIsMediosCultivoModalOpen(true);
                            }}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMediosCultivo(registro);
                              setIsMediosCultivoModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <BotonesExportacionIndividual 
                          registro={registro} 
                          titulo="RE-CAL-022 - Medios de Cultivo" 
                          fileName="RE-CAL-022_Medios_Cultivo"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Medios de Cultivo',
                              run: () => mediosCultivoService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">{new Date(registro.fecha).toLocaleDateString('es-ES')}</p>
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
                          <p className="text-sm text-gray-900">{new Date(registro.fecha_vencimiento).toLocaleDateString('es-ES')}</p>
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
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
              <div className="flex justify-end items-center gap-2">
                <BotonesExportacion 
                  registros={esterilizacionAutoclaveRegistros} 
                  titulo="RE-CAL-017 - Esterilización en Autoclave" 
                  fileName="RE-CAL-017_Esterilizacion_Autoclave"
                  columnas={['fecha', 'carga', 'inicio_ciclo_hora', 'fin_ciclo_hora', 'realizado_por']}
                />
                <Button onClick={() => {
                  setEditingEsterilizacionAutoclave(null);
                  setIsEsterilizacionAutoclaveModalOpen(true);
                }}>
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
                  <Button onClick={() => {
                    setEditingEsterilizacionAutoclave(null);
                    setIsEsterilizacionAutoclaveModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {esterilizacionAutoclaveRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('esterilizacion-autoclave', 'RE-CAL-017 - Esterilización en Autoclave', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        {registro.estado === 'pendiente' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEsterilizacionAutoclave(registro);
                              setIsEsterilizacionAutoclaveModalOpen(true);
                            }}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEsterilizacionAutoclave(registro);
                              setIsEsterilizacionAutoclaveModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <BotonesExportacionIndividual 
                          registro={registro} 
                          titulo="RE-CAL-017 - Esterilización Autoclave" 
                          fileName="RE-CAL-017_Esterilizacion_Autoclave"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Esterilización Autoclave',
                              run: () => esterilizacionAutoclaveService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Fecha</p>
                          <p className="text-sm text-gray-900">{new Date(registro.fecha).toLocaleDateString('es-ES')}</p>
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
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
              <div className="flex justify-end items-center gap-2">
                {custodiaMuestrasRegistros.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={exportarExcelGeneral} title="Exportar Excel">
                      <Download className="w-4 h-4 mr-1" /> Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportarPdfGeneral} title="Exportar PDF">
                      <FileText className="w-4 h-4 mr-1" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportarWordGeneral} title="Exportar Word">
                      <FileText className="w-4 h-4 mr-1" /> Word
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setCronogramaSeleccionado({
                      codigo: 'PL-CAL-008',
                      titulo: 'Plan de Muestreo Microbiológico - Cronograma Toma de Muestras internas',
                      version: '5',
                      fechaAprobacion: '16 de diciembre de 2022',
                    });
                    setIsCronogramaModalOpen(true);
                  }}
                >
                  Cronograma
                </Button>
                <Button onClick={() => {
                  setEditingCustodiaMuestras(null);
                  setIsCustodiaMuestrasModalOpen(true);
                }}>
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
                  <Button onClick={() => {
                    setEditingCustodiaMuestras(null);
                    setIsCustodiaMuestrasModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {custodiaMuestrasRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className={`border rounded-xl shadow-sm p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${registro.estado === 'pendiente' ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-white' : 'border-green-200 bg-white hover:border-green-300'}`}
                      onClick={() => openDetalle('custodia-muestras', 'RE-CAL-107 - Custodia de Muestras', registro)}
                    >
                      {/* Badge de estado */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {registro.estado === 'pendiente' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                              Pendiente
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                              Completado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                        {registro.estado === 'pendiente' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Limpiar datos corruptos antes de editar
                              const registroLimpio = {
                                ...registro,
                                area: limpiarArea(registro.area || ''),
                                tipo_muestra: limpiarTipoMuestra(registro.tipo_muestra || ''),
                              };
                              setEditingCustodiaMuestras(registroLimpio);
                              setIsCustodiaMuestrasModalOpen(true);
                            }}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Limpiar datos corruptos antes de editar
                              const registroLimpio = {
                                ...registro,
                                area: limpiarArea(registro.area || ''),
                                tipo_muestra: limpiarTipoMuestra(registro.tipo_muestra || ''),
                              };
                              setEditingCustodiaMuestras(registroLimpio);
                              setIsCustodiaMuestrasModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportarExcelIndividual(registro);
                          }}
                          title="Exportar Excel"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportarPdfIndividual(registro);
                          }}
                          title="Exportar PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportarWordIndividual(registro);
                          }}
                          title="Exportar Word"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Custodia de Muestras',
                              run: () => custodiaMuestrasService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Código</p>
                          <p className="text-sm text-gray-900">{registro.codigo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tipo</p>
                          <p className="text-sm text-gray-900">{registro.tipo}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Muestra</p>
                          <p className="text-sm text-gray-900">{registro.muestra_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Área</p>
                          <p className="text-sm text-gray-900">{registro.area}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Cantidad</p>
                          <p className="text-sm text-gray-900">{registro.cantidad}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Responsable</p>
                          <p className="text-sm text-gray-900">{registro.responsable}</p>
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

      {/* Vista de Control de Incubadora */}
      {vistaActual === 'incubadora-control' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">RE-CAL-089 - Control de Incubadora</h1>
              <p className="text-gray-600 mt-2">
                Registro de operación y control de incubadora del laboratorio
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
              <div className="flex justify-end items-center gap-2">
                <BotonesExportacion 
                  registros={incubadoraControlRegistros} 
                  titulo="RE-CAL-089 - Control de Incubadora" 
                  fileName="RE-CAL-089_Control_Incubadora"
                  columnas={['fecha', 'temperatura_1', 'temperatura_2', 'diferencia', 'responsable']}
                />
                <Button onClick={() => {
                  setEditingIncubadoraControl(null);
                  setIsIncubadoraControlModalOpen(true);
                }}>
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
                  <Button onClick={() => {
                    setEditingIncubadoraControl(null);
                    setIsIncubadoraControlModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {incubadoraControlRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('incubadora-control', 'RE-CAL-089 - Operación y Control de Incubadora', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        {registro.estado === 'pendiente' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingIncubadoraControl(registro);
                              setIsIncubadoraControlModalOpen(true);
                            }}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingIncubadoraControl(registro);
                              setIsIncubadoraControlModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <BotonesExportacionIndividual 
                          registro={registro} 
                          titulo="RE-CAL-089 - Control Incubadora" 
                          fileName="RE-CAL-089_Control_Incubadora"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Control Incubadora',
                              run: () => incubadoraControlService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          <Dialog open={isIndicadorModalOpen} onOpenChange={setIsIndicadorModalOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Indicador</DialogTitle>
                <DialogDescription>
                  CALIDAD MICROBIOLÓGICA (RE-CAL-079)
                </DialogDescription>
              </DialogHeader>

              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>CALIDAD MICROBIOLÓGICA (RE-CAL-079)</CardTitle>
                      <CardDescription>
                        Meta: 97%
                      </CardDescription>
                      <div className="mt-3 w-full sm:max-w-[240px]">
                        <Select value={indicadorMes} onValueChange={(v) => setIndicadorMes(v as any)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filtrar por mes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los meses</SelectItem>
                            {mesesIndicador.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-gray-500">Cumplimiento global</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {calidadMicrobiologicaResumen.porcentaje.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {calidadMicrobiologicaResumen.cumple} / {calidadMicrobiologicaResumen.total} muestras
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {calidadMicrobiologicaSerie.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500">Aún no hay muestras con CUMPLE/NO CUMPLE para graficar.</p>
                    </div>
                  ) : (
                    <div className="h-[260px] w-full">
                      <ChartContainer
                        config={{
                          cumplimiento: {
                            label: 'Cumplimiento %',
                            color: '#2563eb',
                          },
                        }}
                      >
                        <ResponsiveContainer>
                          <BarChart data={calidadMicrobiologicaSerie} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="mes"
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => {
                                const [year, month] = String(value).split('-');
                                const m = mesesIndicador.find((x) => x.value === String(Number(month)));
                                return m ? `${m.label.slice(0, 3)} ${year}` : String(value);
                              }}
                            />
                            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={40} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                const point: any = payload[0].payload;
                                return (
                                  <div className="bg-white p-2 rounded shadow-md">
                                    <p className="text-sm text-gray-900">{`Mes: ${label}`}</p>
                                    <p className="text-sm text-gray-900">{`Cumplimiento: ${Number(point.cumplimiento).toFixed(1)}%`}</p>
                                  </div>
                                );
                              }}
                              labelFormatter={(label: any) => `Mes: ${label}`}
                            />
                            <ReferenceLine y={calidadMicrobiologicaMeta * 100} stroke="#16a34a" strokeDasharray="6 6" />
                            <Bar dataKey="cumplimiento" fill="var(--color-cumplimiento)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <div className="flex justify-end items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsIndicadorModalOpen(true)}
                >
                  Indicador
                </Button>
                <BotonesExportacion 
                  registros={resultadosMicrobiologicosRegistros} 
                  titulo="RE-CAL-046 - Resultados Microbiológicos" 
                  fileName="RE-CAL-046_Resultados_Microbiologicos"
                  columnas={['codigo', 'fecha', 'muestra', 'area', 'responsable', 'estado']}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setCronogramaSeleccionado({
                      codigo: 'PL-CAL-008',
                      titulo: 'Plan de Muestreo Microbiológico - Cronograma Toma de Muestras internas',
                        version: '5',
                        fechaAprobacion: '16 de diciembre de 2022',
                      });
                      setIsCronogramaModalOpen(true);
                    }}
                  >
                    Cronograma
                  </Button>
                  <Button onClick={() => {
                    setEditingResultadosMicrobiologicos(null);
                    setIsResultadosMicrobiologicosModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Registro
                  </Button>
                </div>
            </CardHeader>
            <CardContent>
              {/* Barra de búsqueda y filtro */}
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por labor..."
                    value={busquedaRecal046}
                    onChange={(e) => setBusquedaRecal046(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filtroTipoRecal046} onValueChange={setFiltroTipoRecal046}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="manipuladores">Manipuladores</SelectItem>
                    <SelectItem value="superficies">Superficies</SelectItem>
                    <SelectItem value="ambientes">Ambientes</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  <Button onClick={() => {
                    setEditingResultadosMicrobiologicos(null);
                    setIsResultadosMicrobiologicosModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {resultadosMicrobiologicosRegistros
                    .filter((registro: any) => {
                      // Filtro por búsqueda (labor/muestra)
                      const searchMatch = !busquedaRecal046 || 
                        (registro.muestra?.toLowerCase() || '').includes(busquedaRecal046.toLowerCase()) ||
                        (registro.area?.toLowerCase() || '').includes(busquedaRecal046.toLowerCase());
                      
                      // Filtro por tipo
                      const tipoMatch = filtroTipoRecal046 === 'all' || 
                        (registro.tipo?.toLowerCase() || '') === filtroTipoRecal046.toLowerCase();
                      
                      return searchMatch && tipoMatch;
                    })
                    .map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setViewingResultadosMicrobiologicos(registro);
                        setIsViewResultadosMicrobiologicosModalOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingResultadosMicrobiologicos(registro);
                            setIsViewResultadosMicrobiologicosModalOpen(true);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Ver detalles
                        </Button>
                        {registro.estado === 'pendiente' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingResultadosMicrobiologicos(registro);
                              setIsResultadosMicrobiologicosModalOpen(true);
                            }}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingResultadosMicrobiologicos(registro);
                              setIsResultadosMicrobiologicosModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <BotonesExportacionIndividual 
                          registro={registro} 
                          titulo="RE-CAL-046 - Resultados Microbiológicos" 
                          fileName="RE-CAL-046_Resultados_Microbiologicos"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Resultados Microbiológicos',
                              run: () => resultadosMicrobiologicosService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500">Fecha</p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {new Date(registro.fecha).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500">Muestra</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{registro.muestra}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500">Lote</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{registro.lote}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500">Área</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{registro.area}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500">Mesófilos</p>
                          <p className="text-sm font-medium text-gray-900">{registro.mesofilos || '-'}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500">Cumple</p>
                          <p className="text-sm font-medium text-gray-900">
                            {registro.cumple ? '✅ Sí' : registro.no_cumple ? '❌ No' : '-'}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500">Responsable</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{registro.responsable}</p>
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

      {/* Vista de Control Lavado e Inactivación */}
      {vistaActual === 'control-lavado-inactivacion' && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="flex justify-end items-center gap-2">
                <BotonesExportacion 
                  registros={controlLavadoInactivacionRegistros} 
                  titulo="RE-CAL-045 - Control Lavado e Inactivación" 
                  fileName="RE-CAL-045_Control_Lavado_Inactivacion"
                  columnas={['fecha', 'producto', 'lote', 'responsable']}
                />
                <Button onClick={() => {
                  setEditingControlLavadoInactivacion(null);
                  setIsControlLavadoInactivacionModalOpen(true);
                }}>
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
                  <Button onClick={() => {
                    setEditingControlLavadoInactivacion(null);
                    setIsControlLavadoInactivacionModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {controlLavadoInactivacionRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('control-lavado-inactivacion', 'RE-CAL-111 - Control Lavado e Inactivación', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        {registro.estado === 'pendiente' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingControlLavadoInactivacion(registro);
                              setIsControlLavadoInactivacionModalOpen(true);
                            }}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingControlLavadoInactivacion(registro);
                              setIsControlLavadoInactivacionModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <BotonesExportacionIndividual 
                          registro={registro} 
                          titulo="RE-CAL-045 - Control Lavado e Inactivación" 
                          fileName="RE-CAL-045_Control_Lavado_Inactivacion"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Control Lavado e Inactivación',
                              run: () => controlLavadoInactivacionService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="flex justify-end items-center gap-2">
                <BotonesExportacion 
                  registros={registrosRecepcionFormatosRegistros} 
                  titulo="RE-CAL-100 - Registros Recepción Formatos" 
                  fileName="RE-CAL-100_Recepcion_Formatos"
                  columnas={['fecha', 'formato', 'area', 'responsable']}
                />
                <Button onClick={() => {
                  setEditingRegistrosRecepcionFormatos(null);
                  setIsRegistrosRecepcionFormatosModalOpen(true);
                }}>
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
                  <Button onClick={() => {
                    setEditingRegistrosRecepcionFormatos(null);
                    setIsRegistrosRecepcionFormatosModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Registro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrosRecepcionFormatosRegistros.map((registro: any) => (
                    <div
                      key={registro.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => openDetalle('registros-recepcion-formatos', 'RE-CAL-100 - Recepción de Formatos', registro)}
                    >
                      <div className="flex items-center justify-end gap-2 mb-3">
                        {registro.estado === 'pendiente' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRegistrosRecepcionFormatos(registro);
                              setIsRegistrosRecepcionFormatosModalOpen(true);
                            }}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="variant"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRegistrosRecepcionFormatos(registro);
                              setIsRegistrosRecepcionFormatosModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <BotonesExportacionIndividual 
                          registro={registro} 
                          titulo="RE-CAL-100 - Registros Recepción Formatos" 
                          fileName="RE-CAL-100_Recepcion_Formatos"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete({
                              id: registro.id,
                              label: 'Recepción de Formatos',
                              run: () => registrosRecepcionFormatosService.delete(registro.id),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
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

      {/* Vista de Cronogramas */}
      {vistaActual === 'conograma' && (
        <>
          {/* Header Principal */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cronogramas de Muestreo</h2>
            <p className="text-gray-600">Planificación y seguimiento de actividades microbiológicas</p>
          </div>

          {/* Sección: Cronogramas Internos */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cronogramas Internos</h3>
                <p className="text-sm text-gray-500">Muestreos realizados dentro de la organización</p>
              </div>
              <Badge className="ml-auto bg-blue-100 text-blue-700 hover:bg-blue-100">2 activos</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* PL-CAL-008 - Plan de Muestreo Microbiológico */}
              <Card 
                className="group border-violet-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => {
                  setCronogramaSeleccionado({
                    codigo: 'PL-CAL-008',
                    titulo: 'Plan de Muestreo Microbiológico - Cronograma Toma de Muestras internas',
                    version: '5',
                    fechaAprobacion: '16 de diciembre de 2022',
                  });
                  setIsCronogramaModalOpen(true);
                }}
              >
                <div className="h-1 bg-violet-500" />
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Microscope className="w-6 h-6 text-violet-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">PL-CAL-008</CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          Plan de Muestreo Microbiológico
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 text-xs">V5</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    Cronograma Toma de Muestras internas para análisis microbiológico
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500">Activo</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                      <FileText className="w-3 h-3 mr-1" />
                      Ver Cronograma
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* PL-CAL-009 - Plan de Muestreo Producto Terminado */}
              <Card
                className="group border-emerald-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => {
                  setCronogramaSeleccionado({
                    codigo: 'PL-CAL-009',
                    titulo: 'Plan de Muestreo Producto Terminado - Cronograma Toma de Muestras',
                    version: '4',
                    fechaAprobacion: '16 de diciembre de 2022',
                  });
                  setIsCronogramaModalOpen(true);
                }}
              >
                <div className="h-1 bg-emerald-500" />
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">PL-CAL-009</CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          Plan de Muestreo Producto Terminado
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">V4</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    Cronograma Toma de Muestras Producto Terminado
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500">Activo</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                      <FileText className="w-3 h-3 mr-1" />
                      Ver Cronograma
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sección: Cronogramas Externos */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cronogramas Externos</h3>
                <p className="text-sm text-gray-500">Muestreos realizados por laboratorios externos</p>
              </div>
              <Badge className="ml-auto bg-blue-100 text-blue-700 hover:bg-blue-100">2 activos</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* PL-CAL-009 - Cronograma Agua Potable (Externo) */}
              <Card
                className="group border-blue-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => {
                  setCronogramaSeleccionado({
                    codigo: 'PL-CAL-009',
                    titulo: 'Cronograma Agua Potable - Muestreo Externo',
                    version: '5',
                    fechaAprobacion: '16 de diciembre de 2022',
                  });
                  setIsCronogramaModalOpen(true);
                }}
              >
                <div className="h-1 bg-blue-500" />
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Beaker className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">PL-CAL-009</CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          Cronograma Agua Potable
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">V5</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    Muestreo y análisis de agua potable realizado por laboratorios externos certificados
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500">Activo</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <FileText className="w-3 h-3 mr-1" />
                      Ver Cronograma
                    </Button>
                  </div>
                </CardContent>
              </Card>
<Card
                className="group border-orange-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={()=>{
                  setCronogramaSeleccionado({
                    codigo: 'PL-CAL-009',
                    titulo: 'Plan de Muestreo Producto Terminado - Muestreo Externo',
                    version: '4',
                    fechaAprobacion: '16 de diciembre de 2022'
                  });
                  setIsCronogramaModalOpen(true);
                }}
              >
                <div className="h-1 bg-orange-500" />
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">PL-CAL-009</CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          Producto Terminado Externo
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">V4</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    Muestreo externo de producto terminado realizado por laboratorios certificados
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500">Activo</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      <FileText className="w-3 h-3 mr-1" />
                      Ver Cronograma
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Leyenda */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Leyenda de Estados</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Cronograma Activo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-violet-100 border border-violet-200" />
                <span className="text-gray-600">Microbiológico</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200" />
                <span className="text-gray-600">Producto Terminado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
                <span className="text-gray-600">PT Externo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200" />
                <span className="text-gray-600">Agua Potable (Externo)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal del Cronograma con Calendario */}
      <Dialog open={isCronogramaModalOpen} onOpenChange={setIsCronogramaModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {cronogramaSeleccionado?.codigo === 'PL-CAL-009' ? (
                <Package className="w-5 h-5 text-emerald-600" />
              ) : (
                <Microscope className="w-5 h-5 text-violet-600" />
              )}
              {cronogramaSeleccionado?.codigo} - {cronogramaSeleccionado?.titulo}
            </DialogTitle>
            <DialogDescription>
              Versión {cronogramaSeleccionado?.version} | Aprobado: {cronogramaSeleccionado?.fechaAprobacion}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {cronogramaSeleccionado?.codigo === 'PL-CAL-009' ? (
              <CronogramaProductoTerminado
                tipoCronograma={
                  cronogramaSeleccionado?.titulo?.includes('Agua Potable') ? 'agua-potable' :
                  cronogramaSeleccionado?.titulo?.includes('Externo') ? 'pt-externo' :
                  'producto-terminado'
                }
                onViewTask={async (task) => {
                  console.log('Ver tarea PT:', task);
                  // Cerrar modal del cronograma
                  setIsCronogramaModalOpen(false);
                  
                  // Si la tarea tiene registro107, navegar directamente a RE-CAL-107
                  if (task.registro107) {
                    console.log('📋 Navegando a RE-CAL-107 desde botón Ver 107:', task.registro107);
                    // Limpiar datos corruptos antes de mostrar
                    const registroLimpio = {
                      ...task.registro107,
                      area: limpiarArea(task.registro107.area || ''),
                      tipo_muestra: limpiarTipoMuestra(task.registro107.tipo_muestra || ''),
                    };
                    // Navegar a la vista de Custodia de Muestras y mostrar el detalle
                    setVistaActual('custodia-muestras');
                    setTimeout(() => {
                      openDetalle('custodia-muestras', 'RE-CAL-107 - Custodia de Muestras', registroLimpio);
                    }, 100);
                    return;
                  }
                  
                  // Fallback: buscar el registro por cronograma_task_id
                  try {
                    const registro = await custodiaMuestrasService.getByCronogramaTaskId(task.id);
                    if (registro) {
                      const registroLimpio = {
                        ...registro,
                        area: limpiarArea(registro.area || ''),
                        tipo_muestra: limpiarTipoMuestra(registro.tipo_muestra || ''),
                      };
                      setVistaActual('custodia-muestras');
                      setTimeout(() => {
                        openDetalle('custodia-muestras', 'RE-CAL-107 - Custodia de Muestras', registroLimpio);
                      }, 100);
                    } else {
                      toast({
                        title: 'Registro no encontrado',
                        description: 'No se encontró el registro RE-CAL-107 asociado a esta tarea.',
                        variant: 'destructive',
                      });
                    }
                  } catch (error) {
                    console.error('Error al obtener registro:', error);
                    toast({
                      title: 'Error',
                      description: 'No se pudo cargar el registro de custodia.',
                      variant: 'destructive',
                    });
                  }
                }}
                onCompleteTask={async (task) => {
                  console.log('Completar tarea PT/Agua Potable:', task);
                  // Guardar la tarea pendiente con el tipo de cronograma
                  setPendingTaskToComplete({
                    ...task,
                    cronogramaTipo: 'agua-potable' // Marcar como tarea de agua potable
                  } as any);
                  // Cerrar modal del cronograma
                  setIsCronogramaModalOpen(false);
                  
                  // Abrir directamente el modal de edición del RE-CAL-107 para completar la tarea
                  if (task.registro107) {
                    console.log('📋 Abriendo modal RE-CAL-107 para completar:', task.registro107);
                    // Limpiar datos corruptos antes de mostrar
                    const registroLimpio = {
                      ...task.registro107,
                      area: limpiarArea(task.registro107.area || ''),
                      tipo_muestra: limpiarTipoMuestra(task.registro107.tipo_muestra || ''),
                    };
                    // Abrir el modal de edición con el registro existente
                    setEditingCustodiaMuestras(registroLimpio);
                    setIsCustodiaMuestrasModalOpen(true);
                    return;
                  }
                  
                  // Fallback: buscar el registro por cronograma_task_id
                  try {
                    const registro = await custodiaMuestrasService.getByCronogramaTaskId(task.id);
                    if (registro) {
                      const registroLimpio = {
                        ...registro,
                        area: limpiarArea(registro.area || ''),
                        tipo_muestra: limpiarTipoMuestra(registro.tipo_muestra || ''),
                      };
                      // Abrir el modal de edición con el registro existente
                      setEditingCustodiaMuestras(registroLimpio);
                      setIsCustodiaMuestrasModalOpen(true);
                    } else {
                      toast({
                        title: 'Registro no encontrado',
                        description: 'No se encontró el registro RE-CAL-107 asociado a esta tarea.',
                        variant: 'destructive',
                      });
                    }
                  } catch (error) {
                    console.error('Error al obtener registro:', error);
                    toast({
                      title: 'Error',
                      description: 'No se pudo cargar el registro de custodia.',
                      variant: 'destructive',
                    });
                  }
                }}
              />
            ) : (
              <CronogramaCalendar 
              onViewTask={async (task) => {
                // Cerrar modal del cronograma
                setIsCronogramaModalOpen(false);
                console.log('🔍 Buscando registro RE-CAL-107 para task.id:', task.id);
                try {
                  // Buscar el registro de Custodia de Muestras asociado a esta tarea
                  const registro = await custodiaMuestrasService.getByCronogramaTaskId(task.id);
                  console.log('📋 Registro RE-CAL-107 encontrado:', registro);
                  if (registro) {
                    // Limpiar datos corruptos antes de mostrar
                    const registroLimpio = {
                      ...registro,
                      area: limpiarArea(registro.area || ''),
                      tipo_muestra: limpiarTipoMuestra(registro.tipo_muestra || ''),
                    };
                    // Navegar a la vista de Custodia de Muestras y mostrar el detalle
                    setVistaActual('custodia-muestras');
                    setTimeout(() => {
                      openDetalle('custodia-muestras', 'RE-CAL-107 - Custodia de Muestras', registroLimpio);
                    }, 100);
                  } else {
                    toast({
                      title: 'Registro no encontrado',
                      description: 'No se encontró el registro de custodia asociado a esta tarea.',
                      variant: 'destructive',
                    });
                  }
                } catch (error) {
                  console.error('Error al obtener registro:', error);
                  toast({
                    title: 'Error',
                    description: 'No se pudo cargar el registro de custodia asociado.',
                    variant: 'destructive',
                  });
                }
              }}
              onCompleteTask={async (task) => {
                // Guardar la tarea pendiente para completar después con el tipo de cronograma
                setPendingTaskToComplete({
                  ...task,
                  cronogramaTipo: 'microbiologia' // Marcar como tarea de microbiología
                } as any);
                // Cerrar modal del cronograma
                setIsCronogramaModalOpen(false);
                // Navegar a RE-CAL-107 (Custodia de Muestras)
                setVistaActual('custodia-muestras');

                // Verificar si ya existe un registro para esta tarea del cronograma
                try {
                  const existing = await custodiaMuestrasService.getByCronogramaTaskId(task.id);
                  if (existing) {
                    // Si existe, limpiar datos corruptos y cargarlo para edición
                    const registroLimpio = {
                      ...existing,
                      area: limpiarArea(existing.area || ''),
                      tipo_muestra: limpiarTipoMuestra(existing.tipo_muestra || ''),
                    };
                    setEditingCustodiaMuestras(registroLimpio);
                  } else {
                    // Si no existe, crear nuevo registro
                    setEditingCustodiaMuestras(null);
                  }
                } catch {
                  // Si hay error al buscar, asumir que no existe y crear nuevo
                  setEditingCustodiaMuestras(null);
                }

                setIsCustodiaMuestrasModalOpen(true);
              }}
            />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modales para agregar registros */}
      <AddCondicionesAmbientalesModal
        isOpen={isCondicionesModalOpen}
        onOpenChange={setIsCondicionesModalOpen}
        onSuccessfulSubmit={handleCondicionesSuccessfulSubmit}
        editingRecord={editingCondiciones}
        onEditingRecordChange={setEditingCondiciones}
      />
      
      <AddTemperaturaEquiposModal
        isOpen={isTemperaturaModalOpen}
        onOpenChange={setIsTemperaturaModalOpen}
        onSuccessfulSubmit={handleTemperaturaSuccessfulSubmit}
        editingRecord={editingTemperatura}
        onEditingRecordChange={setEditingTemperatura}
      />
      
      <AddMediosCultivoModal
        isOpen={isMediosCultivoModalOpen}
        onOpenChange={setIsMediosCultivoModalOpen}
        onSuccessfulSubmit={handleMediosCultivoSuccessfulSubmit}
        editingRecord={editingMediosCultivo}
        onEditingRecordChange={setEditingMediosCultivo}
      />
      
      <AddEsterilizacionAutoclaveModal
        isOpen={isEsterilizacionAutoclaveModalOpen}
        onOpenChange={setIsEsterilizacionAutoclaveModalOpen}
        onSuccessfulSubmit={handleEsterilizacionAutoclaveSuccessfulSubmit}
        editingRecord={editingEsterilizacionAutoclave}
        onEditingRecordChange={setEditingEsterilizacionAutoclave}
      />
      
      <AddCustodiaMuestrasModal
        isOpen={isCustodiaMuestrasModalOpen}
        onOpenChange={(open) => {
          setIsCustodiaMuestrasModalOpen(open);
          if (!open) {
            // Limpiar pendingTaskToComplete cuando se cierra el modal
            setPendingTaskToComplete(null);
          }
        }}
        onSuccessfulSubmit={handleCustodiaMuestrasSuccessfulSubmit}
        editingRecord={editingCustodiaMuestras}
        onEditingRecordChange={setEditingCustodiaMuestras}
        initialTask={pendingTaskToComplete ? {
          id: pendingTaskToComplete.id,
          tipo: pendingTaskToComplete.tipo === 'otro' ? (pendingTaskToComplete.tipoPersonalizado || 'Otro') : pendingTaskToComplete.tipo,
          area: pendingTaskToComplete.area === 'Otro' ? (pendingTaskToComplete.areaPersonalizada || 'Otro') : pendingTaskToComplete.area,
          responsable: pendingTaskToComplete.responsable,
        } : null}
      />
      
      <AddIncubadoraControlModal
        isOpen={isIncubadoraControlModalOpen}
        onOpenChange={setIsIncubadoraControlModalOpen}
        onSuccessfulSubmit={handleIncubadoraControlSuccessfulSubmit}
        editingRecord={editingIncubadoraControl}
        onEditingRecordChange={setEditingIncubadoraControl}
      />
      
      <AddResultadosMicrobiologicosModal
        isOpen={isResultadosMicrobiologicosModalOpen}
        onOpenChange={setIsResultadosMicrobiologicosModalOpen}
        onSuccessfulSubmit={handleResultadosMicrobiologicosSuccessfulSubmit}
        editingRecord={editingResultadosMicrobiologicos}
        onEditingRecordChange={setEditingResultadosMicrobiologicos}
      />
      
      <ViewResultadosMicrobiologicosModal
        isOpen={isViewResultadosMicrobiologicosModalOpen}
        onOpenChange={setIsViewResultadosMicrobiologicosModalOpen}
        registro={viewingResultadosMicrobiologicos}
      />
      
      <AddControlLavadoInactivacionModal
        isOpen={isControlLavadoInactivacionModalOpen}
        onOpenChange={setIsControlLavadoInactivacionModalOpen}
        onSuccessfulSubmit={handleControlLavadoInactivacionSuccessfulSubmit}
        editingRecord={editingControlLavadoInactivacion}
        onEditingRecordChange={setEditingControlLavadoInactivacion}
      />
      
      <AddRegistrosRecepcionFormatosModal
        isOpen={isRegistrosRecepcionFormatosModalOpen}
        onOpenChange={setIsRegistrosRecepcionFormatosModalOpen}
        onSuccessfulSubmit={handleRegistrosRecepcionFormatosSuccessfulSubmit}
        editingRecord={editingRegistrosRecepcionFormatos}
        onEditingRecordChange={setEditingRegistrosRecepcionFormatos}
      />
        </div>
      </main>
    </div>
  );
}
