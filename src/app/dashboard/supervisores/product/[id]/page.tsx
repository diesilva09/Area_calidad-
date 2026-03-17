'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { productService, getProductCategories, type Product, type ProductCategory } from '@/lib/supervisores-data';
import { AddEditProductModal } from '@/components/supervisores/add-product-modal';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Crear un ID único combinando categoría y producto
  const getUniqueProductId = (product: Product, category: ProductCategory) => {
    return `${category.id}_${product.id}`;
  };

  const handleEditSuccess = async (values: any) => {
    if (!product || !category) return;

    try {
      await productService.update(
        product.id,
        {
          name: values.name,
          category_id: values.categoryId,
          pesosConfig: values.pesosConfig,
          temperaturasConfig: values.temperaturasConfig,
          calidadRangosConfig: values.calidadRangosConfig,
        },
        category.id
      );

      const refreshed = await productService.getById(product.id, values.categoryId || category.id);
      if (refreshed) {
        setProduct({
          ...product,
          ...refreshed,
        });
      }

      setIsEditModalOpen(false);
      toast({
        title: "Producto actualizado",
        description: `El producto "${values.name}" ha sido actualizado exitosamente.`,
      });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el producto. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Crear un ID único para el producto actual
  const uniqueProductId = product && category ? getUniqueProductId(product, category) : null;

  // Detectar si venimos del contexto de embalaje
  const isEmbalajeContext = searchParams.get('type') === 'embalaje' || 
                           document.referrer.includes('/dashboard/supervisores/product/') && document.referrer.includes('/embalaje');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const productId = params.id as string;
        
        // Cargar todas las categorías para encontrar el producto
        const categories = await getProductCategories();
        
        // Buscar el producto en todas las categorías
        let foundProduct: Product | null = null;
        let foundCategory: ProductCategory | null = null;
        
        // Si el ID contiene guión bajo, es un ID compuesto (nuevo formato)
        if (productId.includes('_')) {
          const [categoryId, productCode] = productId.split('_', 2);
          const targetCategory = categories.find(cat => cat.id === categoryId);
          if (targetCategory) {
            foundProduct = targetCategory.products.find((p: Product) => p.id === productCode) || null;
            foundCategory = targetCategory;
          }
        } else {
          // Búsqueda tradicional (compatibilidad hacia atrás)
          for (const cat of categories) {
            const productInCategory = cat.products.find((p: Product) => p.id === productId);
            if (productInCategory) {
              foundProduct = productInCategory;
              foundCategory = cat;
              break;
            }
          }
        }
        
        if (foundProduct && foundCategory) {
          let mergedProduct: Product = foundProduct;
          try {
            const detailedProduct = await productService.getById(foundProduct.id, foundCategory.id);
            if (detailedProduct) {
              mergedProduct = {
                ...foundProduct,
                ...detailedProduct,
              };
            }
          } catch (error) {
            console.error('Error al cargar detalle de producto:', error);
          }

          setProduct(mergedProduct);
          setCategory(foundCategory);
        } else {
          toast({
            title: "Producto no encontrado",
            description: "El producto que buscas no existe o ha sido eliminado.",
            variant: "destructive",
          });
          router.push('/dashboard/supervisores');
        }
      } catch (error) {
        console.error('Error al cargar producto:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el producto. Por favor, intente nuevamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.id, router, toast]);

  const handleDelete = async () => {
    if (!product || !category) return;
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar el producto "${product.name}"?`)) {
      try {
        await productService.delete(category.id, product.id);
        toast({
          title: "Producto eliminado",
          description: `El producto "${product.name}" ha sido eliminado exitosamente.`,
        });
        router.push('/dashboard/supervisores');
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto. Por favor, intente nuevamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product || !category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Producto no encontrado</CardTitle>
            <CardDescription>
              El producto que buscas no existe o ha sido eliminado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/dashboard/supervisores?tab=${isEmbalajeContext ? 'embalaje' : 'produccion'}`}>Volver a Supervisores</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" asChild className="text-sm sm:text-base">
            <Link href={`/dashboard/supervisores?tab=${isEmbalajeContext ? 'embalaje' : 'produccion'}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Supervisores
            </Link>
          </Button>
        </div>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl sm:text-2xl mb-2 leading-tight">{product.name}</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  ID del producto: {product.id}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <Link href={isEmbalajeContext ? `/dashboard/supervisores/product/${uniqueProductId}/embalaje` : `/dashboard/supervisores/product/${uniqueProductId}/records`}>
                    <Package className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Ver Registros {isEmbalajeContext ? 'de Embalaje' : 'de Producción'}</span>
                    <span className="sm:hidden">Registros</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Información del Producto</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-gray-600 text-sm">Código:</span>
                    <span className="font-medium text-sm sm:text-base text-right">{product.id}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-gray-600 text-sm">Nombre:</span>
                    <span className="font-medium text-sm sm:text-base text-right">{product.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 items-start">
                    <span className="text-gray-600 text-sm">Categoría:</span>
                    <Badge variant="secondary" className="text-xs sm:text-sm self-start sm:self-auto">{category.name}</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Información de la Categoría</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-gray-600 text-sm">ID Categoría:</span>
                    <span className="font-medium text-sm sm:text-base text-right">{category.id}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-gray-600 text-sm">Nombre Categoría:</span>
                    <span className="font-medium text-sm sm:text-base text-right">{category.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 items-start">
                    <span className="text-gray-600 text-sm">Tipo:</span>
                    <Badge variant="outline" className="text-xs sm:text-sm self-start sm:self-auto">{category.type}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {(product.temperaturas_config?.length || product.pesos_config?.length || product.calidad_rangos_config?.length) ? (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Rangos de Control</h3>

                {product.temperaturas_config?.length ? (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Temperatura de Envasado</h4>
                    <div className="space-y-2">
                      {product.temperaturas_config.map((t, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                          <span className="text-gray-600 text-sm">Envase: {t.envase_tipo}</span>
                          <span className="font-medium text-sm sm:text-base text-right">{t.temperatura_min} - {t.temperatura_max} °C</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {product.pesos_config?.length ? (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Pesos</h4>
                    <div className="space-y-3">
                      {product.pesos_config.map((p, idx) => (
                        <div key={idx} className="rounded-md border border-gray-200 p-3">
                          <div className="text-sm text-gray-700 mb-2">Envase: {p.envase_tipo}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600 text-sm">Drenado declarado</span>
                              <span className="font-medium text-sm">{p.peso_drenado_declarado}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600 text-sm">Rango drenado</span>
                              <span className="font-medium text-sm">{p.peso_drenado_min} - {p.peso_drenado_max}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600 text-sm">Neto declarado</span>
                              <span className="font-medium text-sm">{p.peso_neto_declarado}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {product.calidad_rangos_config?.length ? (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Calidad (Brix, pH, Acidez, etc.)</h4>
                    <div className="space-y-3">
                      {product.calidad_rangos_config.map((c, idx) => (
                        <div key={idx} className="rounded-md border border-gray-200 p-3">
                          <div className="text-sm text-gray-700 mb-2">Envase: {c.envase_tipo}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600 text-sm">Brix</span>
                              <span className="font-medium text-sm">{c.brix_min} - {c.brix_max}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600 text-sm">pH</span>
                              <span className="font-medium text-sm">{c.ph_min} - {c.ph_max}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600 text-sm">Acidez</span>
                              <span className="font-medium text-sm">{c.acidez_min} - {c.acidez_max}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600 text-sm">Consistencia</span>
                              <span className="font-medium text-sm">{c.consistencia_min} - {c.consistencia_max}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-600 text-sm">PPM SO2</span>
                              <span className="font-medium text-sm">{c.ppm_so2_min} - {c.ppm_so2_max}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                  Total de productos en la categoría: {category.products.length}
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/dashboard/supervisores/category/${category.id}`}>
                    Ver categoría completa
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Modal de edición */}
        {product && category && (
          <AddEditProductModal
            isOpen={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onSave={handleEditSuccess}
            categories={[category]}
            initialData={{
              type: 'product' as const,
              id: product.id,
              name: product.name,
              categoryId: category.id,
              pesosConfig: (product as any).pesos_config ?? (product as any).pesosConfig ?? [],
              temperaturasConfig: (product as any).temperaturas_config ?? (product as any).temperaturasConfig ?? [],
              calidadRangosConfig: (product as any).calidad_rangos_config ?? (product as any).calidadRangosConfig ?? [],
            }}
          />
        )}
      </div>
    </div>
  );
}
