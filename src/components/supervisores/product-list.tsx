'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Eye, Package, PackageOpen } from 'lucide-react';
import type { Product, ProductCategory } from '@/lib/supervisores-data';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useScrollRestoration, scrollToSelectorWithRetry } from '@/hooks/useScrollRestoration';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '../ui/button';
import { ProductSearch } from './product-search';
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

type ProductListProps = {
  categories: ProductCategory[];
  type: 'produccion' | 'embalaje';
  readOnly?: boolean;
  showSearch?: boolean;
  highlightTarget?: { categoryId: string; productId: string } | null;
  onEditCategory?: (category: ProductCategory) => void;
  onDeleteCategory?: (category: ProductCategory) => void;
  onEditProduct?: (product: Product, categoryId: string) => void;
  onDeleteProduct?: (product: Product, categoryId: string) => void;
};

export function ProductList({ 
  categories, 
  type,
  readOnly = false,
  showSearch = true,
  highlightTarget = null,
  onEditCategory,
  onDeleteCategory,
  onEditProduct,
  onDeleteProduct,
}: ProductListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [touchSelectedProductUniqueId, setTouchSelectedProductUniqueId] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteType, setConfirmDeleteType] = useState<'category' | 'product' | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<ProductCategory | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<{ product: Product; categoryId: string } | null>(null);
  const { restoreScrollPosition } = useScrollRestoration();
  const cancelScrollRef = useRef<null | (() => void)>(null);
  const clearHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Crear un ID único combinando categoría y producto
  const getUniqueProductId = (product: Product, category: ProductCategory) => {
    return `${category.id}_${product.id}`;
  };

  const getOffsetTop = () => {
    if (typeof window === 'undefined') return 96;
    try {
      const isTabletOrMobile =
        window.matchMedia?.('(max-width: 768px)')?.matches ||
        window.matchMedia?.('(pointer: coarse)')?.matches;
      return isTabletOrMobile ? 132 : 96;
    } catch {
      return 96;
    }
  };

  const cancelPendingScroll = useCallback(() => {
    if (cancelScrollRef.current) {
      cancelScrollRef.current();
      cancelScrollRef.current = null;
    }
    if (clearHighlightTimeoutRef.current) {
      clearTimeout(clearHighlightTimeoutRef.current);
      clearHighlightTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelPendingScroll();
    };
  }, [cancelPendingScroll]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    // Solo procesar highlight si estamos en la pestaña correcta
    if (tab && tab !== type) return;

    // `highlight` es transitorio (se usa para enfocar/scroll). `selected` se soporta por retrocompatibilidad.
    const highlight = searchParams.get('highlight');
    const selected = searchParams.get('selected');
    const target = highlight || selected;
    if (!target) {
      // Si no hay parámetros, restaurar desde sessionStorage
      return;
    }

    const parts = target.split('_');
    if (parts.length < 2) return;

    // Soportar IDs con '_' (tanto categoryId como productId pueden contener '_')
    let cat: ProductCategory | undefined;
    let prod: Product | undefined;
    let resolvedCategoryId: string | null = null;

    for (let i = 1; i < parts.length; i++) {
      const maybeCategoryId = parts.slice(0, i).join('_');
      const maybeProductId = parts.slice(i).join('_');

      const foundCategory = categories.find((c) => c.id === maybeCategoryId);
      const foundProduct = foundCategory?.products.find((p) => p.id === maybeProductId);

      if (foundCategory && foundProduct) {
        cat = foundCategory;
        prod = foundProduct;
        resolvedCategoryId = maybeCategoryId;
        break;
      }
    }

    if (!cat || !prod || !resolvedCategoryId) return;

    // Enfoque temporal: seleccionar + resaltar y luego desmarcar
    handleProductSelect(prod, resolvedCategoryId, true);

    // Limpiar params transitorios para evitar que re-renders (p.ej. mostrar/ocultar historial)
    // vuelvan a disparar el auto-scroll. Al regresar desde otra pantalla, el param se agrega de nuevo.
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('highlight');
    nextParams.delete('selected');
    if (!nextParams.get('tab')) nextParams.set('tab', type);
    setTimeout(() => {
      router.replace(`/dashboard/supervisores?${nextParams.toString()}`, { scroll: false });
    }, 800);

    // NO limpiar highlight automáticamente para evitar recargas que cambian la pestaña
    // El usuario puede limpiarlo manualmente o navegar a otra página
    // Limpiar params transitorios SOLO si hay un problema de navegación
    // const nextParams = new URLSearchParams(searchParams.toString());
    // nextParams.delete('highlight');
    // nextParams.delete('selected');
    // if (!nextParams.get('tab')) nextParams.set('tab', type);
    // router.replace(`/dashboard/supervisores?${nextParams.toString()}`);
  }, [searchParams?.get('tab'), searchParams?.get('highlight'), searchParams?.get('selected'), categories, type, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      try {
        setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
      } catch {
        setIsTouchDevice(false);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Sincronizar filteredCategories cuando cambian las categorías principales
  useEffect(() => {
    setFilteredCategories(categories);
  }, [categories]);

  // Mantener categorías abiertas cuando hay búsqueda; si no, dejar que el usuario controle el accordion
  useEffect(() => {
    if (searchTerm) {
      setOpenCategoryIds(filteredCategories.map((c) => c.id));
    }
  }, [searchTerm, filteredCategories]);

  // Restaurar producto destacado después de que las categorías se carguen
  // SOLO ejecutar una vez al cargar inicialmente, NO cuando cambian las categorías
  useEffect(() => {
    if (categories.length > 0 && !highlightTarget) {
      const timer = setTimeout(() => {
        restoreScrollPosition();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  // Manejar búsqueda desde el componente ProductSearch
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories
      .map((category) => {
        const filteredProducts = category.products.filter((product) =>
          product.name.toLowerCase().includes(term.toLowerCase()) ||
          product.id.toLowerCase().includes(term.toLowerCase())
        );
        return { ...category, products: filteredProducts };
      })
      .filter((category) => category.products.length > 0 || term.length === 0);
    
    setFilteredCategories(filtered);
  };

  // Manejar selección de producto desde el buscador
  const handleProductSelect = useCallback((product: Product, categoryId: string, autoClearSelection = false) => {
    cancelPendingScroll();

    // Limpiar resaltado anterior
    setHighlightedProductId(null);
    setSelectedProductId(product.id);

    // Asegurar que la categoría esté abierta (modo controlado)
    setOpenCategoryIds((prev) => {
      if (prev.includes(categoryId)) return prev;
      return [...prev, categoryId];
    });

    if (autoClearSelection) {
      clearHighlightTimeoutRef.current = setTimeout(() => {
        setSelectedProductId(null);
      }, 3000);
    }

    const uniqueSelectorId = `${categoryId}_${product.id}`;
    cancelScrollRef.current = scrollToSelectorWithRetry({
      selector: `[data-product-id="${uniqueSelectorId}"]`,
      maxAttempts: 30,
      attemptDelayMs: 120,
      offsetTop: getOffsetTop(),
      onFound: () => {
        setHighlightedProductId(product.id);
        clearHighlightTimeoutRef.current = setTimeout(() => {
          setHighlightedProductId(null);
        }, 3000);
      },
    });
  }, [cancelPendingScroll]);

  // Permitir que el componente padre solicite enfocar un producto (abrir categoría + autoscroll)
  // SOLO ejecutar cuando highlightTarget cambia activamente, NO por otros renders
  useEffect(() => {
    if (!highlightTarget?.categoryId || !highlightTarget?.productId) return;

    const category = categories.find((c) => c.id === highlightTarget.categoryId);
    const product = category?.products.find((p) => p.id === highlightTarget.productId);
    if (!category || !product) return;

    handleProductSelect(product, category.id, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightTarget?.categoryId, highlightTarget?.productId]);
  
  const defaultOpenValues = searchTerm
    ? filteredCategories.map((c) => c.id)
    : []; // Categorías cerradas por defecto cuando no hay búsqueda

  // Inicializar openCategoryIds una sola vez (y cuando llegan categorías)
  useEffect(() => {
    if (openCategoryIds.length === 0 && defaultOpenValues.length > 0) {
      setOpenCategoryIds(defaultOpenValues);
    }
  }, [defaultOpenValues, openCategoryIds.length]);

  const openDeleteCategoryConfirm = (category: ProductCategory) => {
    setConfirmDeleteType('category');
    setConfirmDeleteCategory(category);
    setConfirmDeleteProduct(null);
    setConfirmDeleteOpen(true);
  };

  const openDeleteProductConfirm = (product: Product, categoryId: string) => {
    setConfirmDeleteType('product');
    setConfirmDeleteProduct({ product, categoryId });
    setConfirmDeleteCategory(null);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteType === 'category' && confirmDeleteCategory && onDeleteCategory) {
      onDeleteCategory(confirmDeleteCategory);
    }

    if (confirmDeleteType === 'product' && confirmDeleteProduct && onDeleteProduct) {
      onDeleteProduct(confirmDeleteProduct.product, confirmDeleteProduct.categoryId);
    }

    setConfirmDeleteOpen(false);
    setConfirmDeleteType(null);
    setConfirmDeleteCategory(null);
    setConfirmDeleteProduct(null);
  };

  return (
    <div className="space-y-4">
      {showSearch && (
        <ProductSearch
          categories={categories}
          onProductSelect={handleProductSelect}
          placeholder="Buscar producto por nombre o código..."
        />
      )}

      {filteredCategories.length > 0 ? (
        <Accordion
          type="multiple"
          value={openCategoryIds}
          onValueChange={(values) => setOpenCategoryIds(values as string[])}
          className="w-full"
        >
          {filteredCategories.map((category) => {
            return (
            <AccordionItem value={category.id} key={category.id} data-value={category.id}>
              <div className="flex items-center gap-2">
                <AccordionTrigger className="text-lg font-medium hover:no-underline flex-1">
                  <span className="flex-1 text-left">{category.name}</span>
                </AccordionTrigger>
                {!readOnly && onEditCategory && onDeleteCategory && (
                  <div className="flex items-center gap-2 pr-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditCategory) {
                          onEditCategory(category);
                        }
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteCategoryConfirm(category);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
              <AccordionContent>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
                  {category.products.map((product) => {
                      const uniqueProductId = getUniqueProductId(product, category);
                      const isTouchSelected = isTouchDevice && touchSelectedProductUniqueId === uniqueProductId;

                      const recordsHref =
                        type === 'embalaje'
                          ? `/dashboard/supervisores/product/${uniqueProductId}/embalaje`
                          : `/dashboard/supervisores/product/${uniqueProductId}/records`;

                      const handleCardClick = (e: React.MouseEvent) => {
                        if (!isTouchDevice) {
                          router.push(recordsHref);
                          return;
                        }

                        if (touchSelectedProductUniqueId === uniqueProductId) {
                          router.push(recordsHref);
                          return;
                        }

                        e.preventDefault();
                        setTouchSelectedProductUniqueId(uniqueProductId);
                      };

                      return (
                        <Card 
                          key={uniqueProductId} 
                          className={`
                            relative transition-all duration-500 hover:bg-accent group
                            min-h-[120px] sm:min-h-[140px]
                            ${isTouchSelected ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}
                            ${selectedProductId === product.id && highlightedProductId !== product.id
                              ? 'ring-2 ring-blue-300 bg-blue-50/30'
                              : ''
                            }
                            ${highlightedProductId === product.id 
                              ? 'ring-4 ring-blue-400 ring-opacity-60 bg-blue-50 shadow-lg scale-105 z-10' 
                              : 'hover:bg-accent hover:shadow-md'
                            }
                          `}
                          data-product-id={uniqueProductId}
                          role="button"
                          tabIndex={0}
                          onClick={handleCardClick}
                        >
                          {highlightedProductId === product.id && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 z-20 animate-bounce">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          )}
                          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                            <CardTitle className={`text-sm sm:text-base lg:text-lg ${highlightedProductId === product.id ? 'text-blue-700 font-bold' : 'text-gray-900'} leading-tight`}>
                              {product.name}
                            </CardTitle>
                          </CardHeader>
                          <div
                            className={`absolute top-2 right-2 flex items-center transition-opacity gap-1 ${isTouchSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {type === 'embalaje' ? (
                              <>
                                <Button 
                                  asChild
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 sm:h-8 sm:w-8" 
                                  title="Ver Registros de Embalaje"
                                >
                                  <Link href={`/dashboard/supervisores/product/${uniqueProductId}/embalaje`}>
                                    <PackageOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Link>
                                </Button>
                                <Button 
                                  asChild
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 sm:h-8 sm:w-8" 
                                  title="Ver Detalles del Producto"
                                >
                                  <Link href={`/dashboard/supervisores/product/${uniqueProductId}`}>
                                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Link>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  asChild
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 sm:h-8 sm:w-8" 
                                  title="Ver Registros de Producción"
                                >
                                  <Link href={`/dashboard/supervisores/product/${uniqueProductId}/records`}>
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Link>
                                </Button>
                                <Button 
                                  asChild
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 sm:h-8 sm:w-8" 
                                  title="Ver Detalles del Producto"
                                >
                                  <Link href={`/dashboard/supervisores/product/${uniqueProductId}`}>
                                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Link>
                                </Button>
                              </>
                            )}
                            {!readOnly && onEditProduct && onDeleteProduct && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={(e) => {
                                  e.stopPropagation();
                                  onEditProduct(product, category.id);
                                }}>
                                  <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteProductConfirm(product, category.id);
                                }}>
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </AccordionContent>
            </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="text-muted-foreground col-span-full text-center py-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            <p className="text-base">No se encontraron productos o categorías con los filtros aplicados.</p>
            <p className="text-sm text-gray-500">Intente con otros términos de búsqueda</p>
          </div>
        </div>
      )}

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeleteType === 'category'
                ? `¿Estás seguro que deseas eliminar la categoría "${confirmDeleteCategory?.name ?? ''}"?`
                : confirmDeleteType === 'product'
                  ? `¿Estás seguro que deseas eliminar el producto "${confirmDeleteProduct?.product?.name ?? ''}"?`
                  : '¿Estás seguro que deseas eliminar este elemento?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
