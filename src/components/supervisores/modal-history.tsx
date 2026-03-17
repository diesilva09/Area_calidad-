'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Clock, FileText } from 'lucide-react';
import { modalHistoryService, type ModalHistory } from '@/lib/modal-history-service';

interface ModalHistoryProps {
  modalType: 'production' | 'embalaje' | 'limpieza';
  isOpen: boolean;
  onClose: () => void;
}

export function ModalHistory({ modalType, isOpen, onClose }: ModalHistoryProps) {
  const [history, setHistory] = useState<ModalHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, modalType]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Primero intentar crear la tabla si no existe
      await modalHistoryService.createHistoryTable();
      
      // Luego cargar el historial
      const historyData = await modalHistoryService.getHistory(modalType);
      setHistory(historyData);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = (type: string) => {
    const titles: Record<string, string> = {
      'production': 'Producción',
      'embalaje': 'Embalaje',
      'limpieza': 'Limpieza'
    };
    return titles[type] || type;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] mx-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                Historial de Cambios - {getModalTitle(modalType)}
              </CardTitle>
              <CardDescription>
                Versiones y formatos del modal de {getModalTitle(modalType)}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <Clock className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p>Cargando historial...</p>
                  </div>
                </div>
              ) : history.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No hay historial disponible</p>
                    <p className="text-sm text-gray-400">
                      Esta es la primera versión del modal
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {history.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Versión {item.version}
                          </Badge>
                          <div className="text-sm text-gray-600">
                            {formatDate(item.createdAt.toString())}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index === 0 ? 'Actual' : 'Anterior'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Formato:</span>
                          <p className="text-gray-600">{item.format}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Tipo:</span>
                          <p className="text-gray-600">{item.type}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Fecha Aprobación:</span>
                          <p className="text-gray-600">{item.approvalDate}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Creado por:</span>
                          <p className="text-gray-600">{item.createdBy}</p>
                        </div>
                      </div>
                      
                      {item.changes && item.changes.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="font-semibold text-gray-700 mb-2">Cambios realizados:</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {item.changes.map((change, changeIndex) => (
                              <li key={changeIndex} className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <span>{change}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
