'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductList } from '@/components/supervisores/product-list';
import {
  getProductCategories,
  type ProductCategory,
} from '@/lib/supervisores-data';
import { Calendar } from '@/components/ui/calendar';
import { useState, useMemo, useEffect } from 'react';
import { es } from 'date-fns/locale';
import { format, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Task = {
  id: number;
  date: Date;
  title: string;
  status: 'pending' | 'completed';
};

const initialTasks: Task[] = [
  {
    id: 1,
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    title: 'Limpieza de maquinaria',
    status: 'completed',
  },
  {
    id: 2,
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    title: 'Revisión de suelos',
    status: 'pending',
  },
  {
    id: 3,
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    title: 'Desinfección de áreas comunes',
    status: 'pending',
  },
  { id: 4, date: new Date(), title: 'Tarea para hoy', status: 'pending' },
];

export default function TecnicoPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [tasks] = useState<Task[]>(initialTasks);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getProductCategories();
        setProductCategories(categories);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };
    
    loadCategories();
  }, []);

  const pendingDays = useMemo(
    () =>
      tasks.filter((task) => task.status === 'pending').map((task) => task.date),
    [tasks]
  );
  const completedDays = useMemo(
    () =>
      tasks
        .filter((task) => task.status === 'completed')
        .map((task) => task.date),
    [tasks]
  );

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks
      .filter((task) => isSameDay(task.date, selectedDate))
      .sort((a, b) => a.id - b.id);
  }, [tasks, selectedDate]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/');
    } else if (user.role !== 'tecnico') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (user.role !== 'tecnico') {
    return (
      <div className="flex h-full items-center justify-center py-6">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-destructive">
              Acceso Denegado
            </CardTitle>
            <CardDescription>
              No tienes los permisos necesarios para acceder a esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="font-headline text-3xl mb-4">Panel de Técnico</h1>
      <Tabs defaultValue="produccion" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="produccion">Producción</TabsTrigger>
          <TabsTrigger value="embalaje">Embalaje</TabsTrigger>
          <TabsTrigger value="limpieza-cronograma">
            Limpieza y Cronograma
          </TabsTrigger>
        </TabsList>
        <TabsContent value="produccion">
          <Card>
            <CardHeader>
              <CardTitle>Productos de Producción</CardTitle>
              <CardDescription>
                Listado de productos y categorías de producción.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductList
                categories={productCategories}
                type="produccion"
                readOnly
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="embalaje">
          <Card>
            <CardHeader>
              <CardTitle>Productos de Embalaje</CardTitle>
              <CardDescription>
                Listado de productos y categorías de embalaje.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductList
                categories={productCategories}
                type="embalaje"
                readOnly
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="limpieza-cronograma">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Limpieza</CardTitle>
              <CardDescription>
                Calendario de labores de limpieza.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  locale={es}
                  modifiers={{
                    pending: pendingDays,
                    completed: completedDays,
                  }}
                  modifiersClassNames={{
                    pending: 'bg-accent/70',
                    completed: 'bg-success text-success-foreground',
                  }}
                />
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline text-xl mb-4">
                  Labores para{' '}
                  {selectedDate
                    ? format(selectedDate, 'PPP', { locale: es })
                    : '...'}
                </h3>
                <div className="flex-1 space-y-4">
                  {selectedDayTasks.length > 0 ? (
                    selectedDayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={task.status === 'completed'}
                          disabled
                        />
                        <Label
                          htmlFor={`task-${task.id}`}
                          className={`flex-1 ${
                            task.status === 'completed'
                              ? 'line-through text-muted-foreground'
                              : ''
                          }`}
                        >
                          {task.title}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No hay labores para esta fecha.
                    </p>
                  )}
                </div>
                <div className="mt-auto space-y-4 pt-4">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-accent/70"></div>
                      <span>Pendiente</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-success"></div>
                      <span>Completada</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}