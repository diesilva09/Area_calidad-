'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, ProductCategory } from '@/lib/supervisores-data';

interface ProductSearchProps {
  categories: ProductCategory[];
  onProductSelect?: (product: Product, categoryId: string) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ProductSearch({ 
  categories, 
  onProductSelect, 
  placeholder = "Buscar producto...", 
  className,
  value,
  onValueChange,
}: ProductSearchProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = value ?? internalSearchTerm;

  const setSearchTerm = (nextValue: string) => {
    if (onValueChange) {
      onValueChange(nextValue);
    } else {
      setInternalSearchTerm(nextValue);
    }
  };
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Array<{
    product: Product;
    categoryId: string;
    categoryName: string;
  }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filtrar productos basados en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts([]);
      setIsOpen(false);
      return;
    }

    const results: Array<{
      product: Product;
      categoryId: string;
      categoryName: string;
    }> = [];

    categories.forEach((category) => {
      category.products.forEach((product) => {
        if (
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.id.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          results.push({
            product,
            categoryId: category.id,
            categoryName: category.name,
          });
        }
      });
    });

    // Ordenar por relevancia (prioridad para coincidencias exactas)
    results.sort((a, b) => {
      const aName = a.product.name.toLowerCase();
      const bName = b.product.name.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      // Coincidencia exacta al inicio
      if (aName.startsWith(search) && !bName.startsWith(search)) return -1;
      if (!aName.startsWith(search) && bName.startsWith(search)) return 1;
      
      // Coincidencia exacta en cualquier parte
      if (aName.includes(search) && !bName.includes(search)) return -1;
      if (!aName.includes(search) && bName.includes(search)) return 1;
      
      // Orden alfabético
      return aName.localeCompare(bName);
    });

    setFilteredProducts(results.slice(0, 10)); // Limitar a 10 resultados
    setIsOpen(results.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm, categories]);

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = filteredProducts[selectedIndex];
          onProductSelect?.(selected.product, selected.categoryId);
          if (!onValueChange) {
            setSearchTerm(''); // Limpiar búsqueda después de seleccionar (solo modo no controlado)
          }
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
  const handleProductClick = (product: Product, categoryId: string) => {
    if (!onValueChange) {
      setSearchTerm(''); // Limpiar búsqueda después de seleccionar (solo modo no controlado)
    }
    setIsOpen(false);
    setSelectedIndex(-1);
    onProductSelect?.(product, categoryId);
  };

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
            if (searchTerm.trim() && filteredProducts.length > 0) {
              setIsOpen(true);
            }
          }}
        />
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg"
        >
          {filteredProducts.map((item, index) => (
            <li
              key={`${item.categoryId}-${item.product.id}`}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                selectedIndex === index && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleProductClick(item.product, item.categoryId)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{item.product.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.categoryName} • {item.product.id}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {searchTerm && !isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg p-3">
          <p className="text-sm text-muted-foreground">
            No se encontraron productos para "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
