'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Record {
  id: string | number;
  [key: string]: any;
}

interface UniversalSearchProps<T extends Record> {
  data: T[];
  searchFields: (keyof T)[];
  onRecordSelect?: (record: T, index: number) => void;
  placeholder?: string;
  className?: string;
  displayField?: keyof T;
  secondaryField?: keyof T;
}

export function UniversalSearch<T extends Record>({ 
  data, 
  searchFields, 
  onRecordSelect, 
  placeholder = "Buscar registro...", 
  className,
  displayField = 'id' as keyof T,
  secondaryField
}: UniversalSearchProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredRecords, setFilteredRecords] = useState<Array<{
    record: T;
    index: number;
  }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filtrar registros basados en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecords([]);
      setIsOpen(false);
      return;
    }

    const results: Array<{
      record: T;
      index: number;
    }> = [];

    data.forEach((record, index) => {
      const isMatch = searchFields.some(field => {
        const value = record[field];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });

      if (isMatch) {
        results.push({ record, index });
      }
    });

    // Ordenar por relevancia
    results.sort((a, b) => {
      const aValue = a.record[displayField]?.toString().toLowerCase() || '';
      const bValue = b.record[displayField]?.toString().toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      
      // Coincidencia exacta al inicio
      if (aValue.startsWith(search) && !bValue.startsWith(search)) return -1;
      if (!aValue.startsWith(search) && bValue.startsWith(search)) return 1;
      
      // Coincidencia exacta en cualquier parte
      if (aValue.includes(search) && !bValue.includes(search)) return -1;
      if (!aValue.includes(search) && bValue.includes(search)) return 1;
      
      // Orden alfabético
      return aValue.localeCompare(bValue);
    });

    setFilteredRecords(results.slice(0, 10)); // Limitar a 10 resultados
    setIsOpen(results.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm, data, searchFields, displayField]);

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredRecords.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = filteredRecords[selectedIndex];
          onRecordSelect?.(selected.record, selected.index);
          setSearchTerm(''); // Limpiar búsqueda después de seleccionar
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Manejar selección con click
  const handleRecordClick = (record: T, index: number) => {
    setSearchTerm(''); // Limpiar búsqueda después de seleccionar
    setIsOpen(false);
    setSelectedIndex(-1);
    onRecordSelect?.(record, index);
  };

  // Cerrar al hacer click fuera - Mejorado para evitar removeChild errors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Verificar que los elementos existan antes de usar contains()
      const inputElement = inputRef.current;
      const listElement = listRef.current;
      
      if (!inputElement || !listElement) return;
      
      const target = event.target as Node;
      
      // Verificar que el target sea un nodo válido
      if (!target || !target.contains) return;
      
      try {
        if (!inputElement.contains(target) && !listElement.contains(target)) {
          setIsOpen(false);
        }
      } catch (error) {
        // Si hay un error de DOM, simplemente cerrar el dropdown
        console.warn('Error en handleClickOutside:', error);
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup adicional para evitar problemas de DOM
  useEffect(() => {
    return () => {
      setIsOpen(false);
      setSelectedIndex(-1);
      setFilteredRecords([]);
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm.trim() && filteredRecords.length > 0) {
              setIsOpen(true);
            }
          }}
        />
      </div>

      {isOpen && filteredRecords.length > 0 && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg"
        >
          {filteredRecords.map((item, index) => (
            <li
              key={`${item.record.id}-${index}`}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                selectedIndex === index && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleRecordClick(item.record, item.index)}
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {item.record[displayField]?.toString() || 'Sin nombre'}
                </span>
                {secondaryField && item.record[secondaryField] && (
                  <span className="text-xs text-muted-foreground">
                    {item.record[secondaryField]?.toString()}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  ID: {item.record.id?.toString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {searchTerm && !isOpen && filteredRecords.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg p-3">
          <p className="text-sm text-muted-foreground">
            No se encontraron registros para "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
