// apps/web/src/app/dashboard/lists/[listId]/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Trash2, Pencil, ArrowLeft, ShoppingCart, AlertTriangle } from 'lucide-react';
import { EditListDialog } from '@/components/dashboard/EditListDialog';
import { EditListItemDialog } from '@/components/dashboard/EditListItemDialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/dashboard/EmptyState';

// Tipos para nuestros datos
type Product = { id: number; name: string; };
type ListItem = { id: number; quantity: number; price_per_unit: number | null; product: Product; is_checked: boolean; };
type ShoppingList = { id: number; name: string; budget: number | null; is_archived: boolean; items: ListItem[]; };

export default function ListDetailPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { listId } = params;
  const { toast } = useToast();

  const [list, setList] = useState<ShoppingList | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // Estados para controlar los diálogos de edición
  const [isEditListOpen, setIsEditListOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);

  // calculo del total de la lista
  const { checkedItemsTotal, estimatedListTotal, isOverBudget } = useMemo(() => {
    if (!list?.items) {
      return { checkedItemsTotal: 0, estimatedListTotal: 0, isOverBudget: false };
    }

    let checkedTotal = 0;
    let estimatedTotal = 0;

    for (const item of list.items) {
      const itemPrice = item.price_per_unit || 0;
      const itemTotal = itemPrice * item.quantity;

      estimatedTotal += itemTotal;
      if (item.is_checked) {
        checkedTotal += itemTotal;
      }
    }

    // Nueva comprobación: ¿El total estimado supera el presupuesto?
    const overBudget = list.budget != null && estimatedTotal > list.budget;

    return {
      checkedItemsTotal: checkedTotal,
      estimatedListTotal: estimatedTotal,
      isOverBudget: overBudget,
    };
  }, [list]); // Se re-ejecutará si la lista cambia

  const fetchListDetails = useCallback(async () => {
    if (!token || !listId) return;
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${listId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          router.push('/dashboard');
        }
        throw new Error('No se pudo obtener la lista.');
      }
      const data = await response.json();
      setList(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  }, [token, listId, router]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }
    fetchListDetails();
  }, [token, isAuthLoading, router, fetchListDetails]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }
    fetchListDetails();
  }, [token, isAuthLoading, router, fetchListDetails]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newItemName.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productName: newItemName, quantity: 1 }),
      });
      if (!response.ok) throw new Error('No se pudo añadir el artículo.');

      setNewItemName('');
      await fetchListDetails(); // Refresca la lista para mostrar el nuevo artículo
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleItemChecked = async (itemId: number, currentCheckedState: boolean) => {
    if (!token) return;

    setList(currentList => {
      if (!currentList) return null;
      return {
        ...currentList,
        items: currentList.items.map(item =>
          item.id === itemId ? { ...item, is_checked: !currentCheckedState } : item
        ),
      };
    });

    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isChecked: !currentCheckedState }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el artículo.');
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      fetchListDetails(); // Revertir si hay error
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!token) return;
    const originalList = list;

    setList(currentList => {
      if (!currentList) return null;
      return { ...currentList, items: currentList.items.filter(item => item.id !== itemId) };
    });

    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudo eliminar el artículo.');
      toast({ title: "Artículo eliminado" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setList(originalList);
    }
  };

  const handleEditItemClick = (item: ListItem) => {
    setSelectedItem(item);
    setIsEditItemOpen(true);
  };

  if (isFetching || isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </header>

        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

        {list && token && (
          <>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-4xl">{list.name}</CardTitle>
                    {list.budget && <CardDescription>Presupuesto: ${list.budget}</CardDescription>}
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setIsEditListOpen(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
                  <Input
                    placeholder="Añadir nuevo artículo..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                  <Button type="submit">Añadir</Button>
                </form>

                <div className="space-y-2 mt-6">
                  {list.items.length > 0 ? (
                    [...list.items].sort((a, b) => Number(a.is_checked) - Number(b.is_checked)).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm group">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`item-${item.id}`}
                            checked={item.is_checked}
                            onCheckedChange={() => handleToggleItemChecked(item.id, item.is_checked)}
                          />
                          <label
                            htmlFor={`item-${item.id}`}
                            className={cn("font-medium cursor-pointer", item.is_checked && "line-through text-gray-500")}
                          >
                            {item.product.name}
                          </label>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Mostramos el precio si existe */}
                          {item.price_per_unit && (
                            <span className="text-sm font-semibold text-gray-800">
                              ${item.price_per_unit.toFixed(2)}
                            </span>
                          )}
                          <span className="text-sm text-gray-500 cursor-pointer hover:text-blue-600" onClick={() => handleEditItemClick(item)}>
                            Cantidad: {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={ShoppingCart}
                      title="Tu lista está vacía"
                      description="Usa el formulario de arriba para añadir tu primer artículo y empezar a comprar."
                      className="mt-6"
                    />
                  )}
                </div>
              </CardContent>
              {/* --- SECCIÓN DE TOTALES --- */}
              <CardFooter className="flex justify-between items-center bg-gray-50 p-4 mt-4 rounded-b-lg border-t">
                <div>
                  <p className="text-sm text-gray-600">Total del Carrito</p>
                  <p className="text-xl font-bold text-green-600">${checkedItemsTotal.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Estimado</p>
                  {/* Aplicamos clases condicionales para la alerta */}
                  <div className={cn("flex items-center justify-end gap-2", isOverBudget && "text-red-500")}>
                    {isOverBudget && <AlertTriangle className="h-5 w-5" />}
                    <p className="text-xl font-bold">
                      ${estimatedListTotal.toFixed(2)}
                    </p>
                  </div>
                  {list.budget != null && (
                    <p className="text-xs text-gray-400">Presupuesto: ${list.budget.toFixed(2)}</p>
                  )}
                </div>
              </CardFooter>
            </Card>

            <EditListDialog
              list={list}
              token={token}
              onListUpdated={fetchListDetails}
              isOpen={isEditListOpen}
              setIsOpen={setIsEditListOpen}
            />
            <EditListItemDialog
              item={selectedItem}
              listId={list.id}
              token={token}
              onItemUpdated={fetchListDetails}
              isOpen={isEditItemOpen}
              setIsOpen={setIsEditItemOpen}
            />
          </>
        )}
      </div>
    </div>
  );
}


