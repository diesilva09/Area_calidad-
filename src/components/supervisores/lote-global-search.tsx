'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type RecordKind = 'produccion' | 'embalaje';

type LoteSearchItem = {
  id: string;
  kind: RecordKind;
  lote: string;
  status?: 'pending' | 'completed' | string;
  responsable?: string;
  productKey?: string;
};

interface LoteGlobalSearchProps {
  kind: RecordKind;
  items: LoteSearchItem[];
  placeholder?: string;
  className?: string;
}

export function LoteGlobalSearch({
  kind,
  items,
  placeholder = 'Buscar lote...',
  className,
}: LoteGlobalSearchProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    const filtered = (items || [])
      .filter((r) => String(r?.lote ?? '').toLowerCase().includes(term))
      .sort((a, b) => {
        const aValue = String(a?.lote ?? '').toLowerCase();
        const bValue = String(b?.lote ?? '').toLowerCase();
        if (aValue.startsWith(term) && !bValue.startsWith(term)) return -1;
        if (!aValue.startsWith(term) && bValue.startsWith(term)) return 1;
        return aValue.localeCompare(bValue);
      })
      .slice(0, 12);

    return filtered;
  }, [items, searchTerm]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setIsOpen(results.length > 0);
    setSelectedIndex(-1);
  }, [results.length, searchTerm]);

  const statusBadge = (status: any) => {
    const v = String(status ?? '').toLowerCase();
    if (v === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDIENTE</Badge>;
    }
    if (v === 'completed') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">COMPLETADO</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">SIN ESTADO</Badge>;
  };

  const goToRecord = (item: LoteSearchItem) => {
    const isPending = String(item.status ?? '').toLowerCase() === 'pending';

    if (item.kind === 'embalaje') {
      const base = '/dashboard/supervisores/embalaje-record/';
      const suffix = isPending ? '?complete=1' : '';
      router.push(`${base}${encodeURIComponent(String(item.id))}${suffix}`);
      return;
    }

    // Producción: si está pendiente y podemos resolver el producto, abrimos el modal de completar
    if (isPending && item.productKey) {
      router.push(
        `/dashboard/supervisores/product/${encodeURIComponent(item.productKey)}/records?highlightRecord=${encodeURIComponent(String(item.id))}&completeRecord=${encodeURIComponent(String(item.id))}`
      );
      return;
    }

    // Fallback: ir al detalle del registro
    router.push(`/dashboard/supervisores/production-record/${encodeURIComponent(String(item.id))}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (results.length === 0) return;

        const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
        const selected = results[nextIndex];
        if (!selected) return;

        setSearchTerm('');
        setIsOpen(false);
        setSelectedIndex(-1);
        goToRecord(selected);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const inputElement = inputRef.current;
      const listElement = listRef.current;
      if (!inputElement || !listElement) return;

      const target = event.target as Node;
      if (!target) return;

      try {
        if (!inputElement.contains(target) && !listElement.contains(target)) {
          setIsOpen(false);
          setSelectedIndex(-1);
        }
      } catch {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)}>
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
            if (searchTerm.trim() && results.length > 0) setIsOpen(true);
          }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded-md border bg-popover shadow-lg"
        >
          {results.map((item, idx) => (
            <li
              key={`${item.kind}-${String(item.id)}`}
              className={cn(
                'cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                selectedIndex === idx && 'bg-accent text-accent-foreground'
              )}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => {
                setSearchTerm('');
                setIsOpen(false);
                setSelectedIndex(-1);
                goToRecord(item);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{item.lote || '—'}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.responsable ? `Responsable: ${item.responsable}` : 'Responsable: —'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {statusBadge(item.status)}
                  <Badge variant="outline" className="text-[10px]">
                    {kind === 'produccion' ? '084' : '093'}
                  </Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {searchTerm.trim() && !isOpen && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg p-3">
          <p className="text-sm text-muted-foreground">No se encontraron lotes para "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
