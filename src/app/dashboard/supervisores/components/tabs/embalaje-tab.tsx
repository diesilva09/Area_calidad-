import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import { ProductList } from '@/components/supervisores/product-list';
import { AddEditProductModal } from '@/components/supervisores/add-product-modal';
import { SupervisorHandlers } from '../../hooks/use-supervisor-data';
import { ProductCategory } from '@/lib/supervisores-data';
import { EmbalajeRecord } from '@/lib/embalaje-records-service';
import type { AddItemFormValues } from '@/components/supervisores/add-product-modal';
import Link from 'next/link';
import { ProductSearch } from '@/components/supervisores/product-search';

interface EmbalajeTabProps {
  records: EmbalajeRecord[];
  categories: ProductCategory[];
  handlers: SupervisorHandlers;
  isJefe: boolean;
  onRefresh: () => void;
}

export function EmbalajeTab({
  records,
  categories,
  handlers,
  isJefe,
  onRefresh
}: EmbalajeTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AddItemFormValues | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [highlightTarget, setHighlightTarget] = useState<{ categoryId: string; productId: string } | null>(null);

  const filteredCategories = useMemo(() => {
    const term = globalSearchTerm.trim().toLowerCase();
    if (!term) return categories;

    return categories
      .map((category) => {
        const filteredProducts = category.products.filter((product) =>
          product.name.toLowerCase().includes(term) || product.id.toLowerCase().includes(term)
        );
        return { ...category, products: filteredProducts };
      })
      .filter((category) => category.products.length > 0);
  }, [categories, globalSearchTerm]);

  const pendingRecords = records.filter((record) => {
    return (
      record.presentacion === 'Pendiente' ||
      record.nivel_inspeccion === 'Pendiente' ||
      record.etiqueta === 'Pendiente' ||
      record.marcacion === 'Pendiente' ||
      record.presentacion_no_conforme === 'Pendiente' ||
      record.cajas === 'Pendiente' ||
      record.responsable_identificador_cajas === 'Pendiente' ||
      record.responsable_embalaje === 'Pendiente' ||
      record.responsable_calidad === 'Pendiente'
    );
  });

  const handleCreateProduct = () => {
    setEditingItem({ type: 'embalaje', id: '', name: '', categoryId: undefined } as any);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: any, categoryId: string) => {
    setEditingItem({
      type: 'embalaje',
      id: product.id,
      name: product.name,
      categoryId: product.category_id ?? categoryId,
      oldCategoryId: categoryId,
      pesosConfig: product.pesos_config ?? product.pesosConfig,
      temperaturasConfig: product.temperaturas_config ?? product.temperaturasConfig,
      calidadRangosConfig: product.calidad_rangos_config ?? product.calidadRangosConfig,
    } as any);
    setIsModalOpen(true);
  };

  const handleCreateCategory = () => {
    setEditingItem({ type: 'category', id: '', name: '' } as any);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingItem({ type: 'category', id: category.id, name: category.name } as any);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (category: ProductCategory) => {
    await handlers.handleDeleteCategory(category.id);
    await Promise.resolve(onRefresh());
  };

  const handleSave = async (values: AddItemFormValues, initialData: AddItemFormValues | null) => {
    if (values.type === 'category') {
      if (initialData?.id) {
        await handlers.handleEditCategory({
          id: initialData.id,
          name: values.name as string,
          type: 'embalaje',
          products: [],
        });
      } else {
        await handlers.handleCreateCategory({
          id: values.id as string,
          name: values.name as string,
          type: 'embalaje',
          products: [],
        });
      }
      await Promise.resolve(onRefresh());
      return;
    }

    if (values.type === 'embalaje' || values.type === 'product') {
      const targetProductId = (initialData?.id ?? values.id) as string;
      const targetCategoryId = (values.categoryId ?? initialData?.categoryId) as string;

      if (initialData?.id) {
        await handlers.handleEditProduct({
          id: initialData.id,
          name: values.name as string,
          category_id: values.categoryId as string,
          oldCategoryId: (initialData as any)?.oldCategoryId ?? (initialData as any)?.categoryId,
          pesos_config: (values as any).pesosConfig ?? null,
          temperaturas_config: (values as any).temperaturasConfig ?? null,
          calidad_rangos_config: (values as any).calidadRangosConfig ?? null,
        } as any);
      } else {
        await handlers.handleCreateProduct({
          id: values.id as string,
          name: values.name as string,
          category_id: values.categoryId as string,
          pesos_config: (values as any).pesosConfig ?? null,
          temperaturas_config: (values as any).temperaturasConfig ?? null,
          calidad_rangos_config: (values as any).calidadRangosConfig ?? null,
        } as any);
      }
      await Promise.resolve(onRefresh());

      if (targetProductId && targetCategoryId) {
        setHighlightTarget({
          categoryId: targetCategoryId,
          productId: targetProductId,
        });

        const uniqueId = `${targetCategoryId}_${targetProductId}`;
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set('tab', 'embalaje');
        nextParams.set('highlight', uniqueId);
        router.replace(`/dashboard/supervisores?${nextParams.toString()}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <Package className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Gestión de Embalaje
          </h2>
        </div>
        
        {isJefe && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={handleCreateCategory}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
            <Button
              onClick={handleCreateProduct}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        )}
      </div>

      {pendingRecords.length > 0 && (
        <Card className="border-2 border-yellow-400 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-yellow-900" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-yellow-900">
                    Tienes {pendingRecords.length} registro{pendingRecords.length !== 1 ? 's' : ''} pendiente{pendingRecords.length !== 1 ? 's' : ''} de embalaje
                  </div>
                  <div className="text-sm text-yellow-800">
                    Completa los campos pendientes para cerrar esos registros.
                  </div>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="border-yellow-400 text-yellow-800 hover:bg-yellow-100 w-full sm:w-auto"
              >
                <Link href="/dashboard/supervisores/embalaje-pending">
                  Ver pendientes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories and Products */}
      <ProductSearch
        categories={categories}
        onProductSelect={(product, categoryId) => {
          setGlobalSearchTerm(product.name);
          setHighlightTarget({ categoryId, productId: product.id });
        }}
        placeholder="Buscar producto por nombre o código..."
        value={globalSearchTerm}
        onValueChange={setGlobalSearchTerm}
      />

      <div className="grid gap-6">
        {categories.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No se encontraron categorías/productos para Embalaje.
            </CardContent>
          </Card>
        )}
        {filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 break-words">{category.name}</span>
                  {isJefe && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Button
                        onClick={() => handleEditCategory(category)}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        Editar Categoría
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductList
                  categories={[category]}
                  type="embalaje"
                  readOnly={!isJefe}
                  showSearch={false}
                  highlightTarget={highlightTarget}
                  onEditCategory={isJefe ? handleEditCategory : undefined}
                  onDeleteCategory={isJefe ? handleDeleteCategory : undefined}
                  onEditProduct={handleEditProduct}
                  onDeleteProduct={
                    isJefe
                      ? (product) => handlers.handleDeleteProduct(product.id)
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <AddEditProductModal
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setEditingItem(null);
          }}
          onSave={handleSave}
          categories={categories}
          initialData={editingItem}
        />
      )}
    </div>
  );
}
