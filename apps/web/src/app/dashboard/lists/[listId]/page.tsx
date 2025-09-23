// apps/web/src/app/dashboard/lists/[listId]/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Trash2, Pencil, ArrowLeft, AlertTriangle, ShoppingCart, GripVertical } from 'lucide-react';
import { EditListDialog } from '@/components/dashboard/EditListDialog';
import { EditListItemDialog } from '@/components/dashboard/EditListItemDialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AddItemDialog } from '@/components/dashboard/AddItemDialog';


// Tipos para nuestros datos
type Category = { id: number; name: string; display_order: number; };
type Product = { id: number; name: string; category: Category | null; };
type ListItem = { id: number; quantity: number; price_per_unit: number | null; product: Product; is_checked: boolean; };
type ShoppingList = { id: number; name: string; budget: number | null; is_archived: boolean; items: ListItem[]; };
type GroupedItems = { [categoryName: string]: { items: ListItem[], id: number } };

function SortableAccordionItem({ categoryName, group, children }: { categoryName: string, group: GroupedItems[string], children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: group.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem value={categoryName}>
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          <div className="flex items-center">
            <span {...attributes} {...listeners} className="cursor-grab p-2 touch-none">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </span>
            {categoryName} <span className="text-sm font-normal text-gray-500 ml-2">({group.items.length})</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    </div>
  );
}

export default function ListDetailPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const [list, setList] = useState<ShoppingList | null>(null);
  const { listId } = useParams();
  const [groupedItems, setGroupedItems] = useState<GroupedItems>({});
  const [sortedCategories, setSortedCategories] = useState<string[]>([]);
  const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(true);
  const [isEditListOpen, setIsEditListOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const processAndSetGroups = useCallback((fetchedList: ShoppingList) => {
    const groups = fetchedList.items.reduce((acc: GroupedItems, item) => {
      const categoryName = item.product.category?.name || 'Sin Categoría';
      const categoryId = item.product.category?.id || 0;
      if (!acc[categoryName]) {
        acc[categoryName] = { items: [], id: categoryId };
      }
      acc[categoryName].items.push(item);
      return acc;
    }, {});

    const sortedCategoryNames = Object.keys(groups);
    setGroupedItems(groups);
    setSortedCategories(sortedCategoryNames);
    setActiveAccordionItems(sortedCategoryNames);
  }, []);

  const fetchListDetails = useCallback(async () => {
    if (!token || !listId) return;
    setIsFetching(true);
    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${listId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) {
        if (response.status === 403 || response.status === 404) router.push('/dashboard');
        throw new Error('No se pudo obtener la lista.');
      }
      const data = await response.json();
      setList(data);
      processAndSetGroups(data);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  }, [token, listId, router, processAndSetGroups, toast]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) router.push('/login');
    else fetchListDetails();
  }, [token, isAuthLoading, router, fetchListDetails]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedCategories.findIndex(name => groupedItems[name].id === active.id);
      const newIndex = sortedCategories.findIndex(name => groupedItems[name].id === over.id);
      const newOrder = arrayMove(sortedCategories, oldIndex, newIndex);
      setSortedCategories(newOrder);

      if (token) {
        const categoryIdsInNewOrder = newOrder.map(name => groupedItems[name].id).filter(id => id !== 0);
        try {
          await fetch(`http://localhost:3000/users/me/category-order`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ categoryIds: categoryIdsInNewOrder }),
          });
          toast({ title: "Orden de categorías guardado." });
        } catch (error) {
          toast({ title: "Error", description: "No se pudo guardar el nuevo orden.", variant: "destructive" });
          setSortedCategories(arrayMove(newOrder, newIndex, oldIndex));
        }
      }
    }
  }

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddItemOpen(true);
  };

  const onItemAdded = () => {
    setNewItemName('');
    fetchListDetails();
  };

  const handleToggleItemChecked = async (itemId: number, currentCheckedState: boolean) => {
    if (!token) return;
    setList(currentList => {
      if (!currentList) return null;
      return { ...currentList, items: currentList.items.map(item => item.id === itemId ? { ...item, is_checked: !currentCheckedState } : item) };
    });
    try {
      await fetch(`http://localhost:3000/shopping-lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isChecked: !currentCheckedState }),
      });
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo actualizar el artículo.", variant: "destructive" });
      fetchListDetails();
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
      await fetch(`http://localhost:3000/shopping-lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      toast({ title: "Artículo eliminado" });
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo eliminar el artículo.", variant: "destructive" });
      setList(originalList);
    }
  };

  const handleEditItemClick = (item: ListItem) => {
    setSelectedItem(item);
    setIsEditItemOpen(true);
  };

  const { checkedItemsTotal, estimatedListTotal, isOverBudget } = useMemo(() => {
    if (!list?.items) return { checkedItemsTotal: 0, estimatedListTotal: 0, isOverBudget: false };
    let checkedTotal = 0;
    let estimatedTotal = 0;
    for (const item of list.items) {
      const itemPrice = item.price_per_unit || 0;
      const itemTotal = itemPrice * item.quantity;
      estimatedTotal += itemTotal;
      if (item.is_checked) checkedTotal += itemTotal;
    }
    const overBudget = list.budget != null && list.budget > 0 && estimatedTotal > list.budget;
    return { checkedItemsTotal: checkedTotal, estimatedListTotal: estimatedTotal, isOverBudget: overBudget };
  }, [list]);

  // const groupedItems = useMemo(() => {
  //   if (!list?.items) return {};
  //   const groups = list.items.reduce((acc: GroupedItems, item) => {
  //     const categoryName = item.product.category?.name || 'Sin Categoría';
  //     const categoryOrder = item.product.category?.display_order || 999; // 'Sin Categoría' va al final
  //     if (!acc[categoryName]) {
  //       acc[categoryName] = { items: [], order: categoryOrder };
  //     }
  //     acc[categoryName].items.push(item);
  //     return acc;
  //   }, {});
  //   // Abre todos los acordeones por defecto la primera vez que se cargan los grupos
  //   if (Object.keys(activeAccordionItems).length === 0 && Object.keys(groups).length > 0) {
  //       setActiveAccordionItems(Object.keys(groups));
  //   }
  //   return groups;
  // }, [list, activeAccordionItems]);

  // const sortedCategories = useMemo(() => {
  //   return Object.keys(groupedItems).sort((a, b) => groupedItems[a].order - groupedItems[b].order);
  // }, [groupedItems]);

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

  if (isFetching || isAuthLoading) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner className="h-12 w-12" /></div>;
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

                <div className="space-y-4 mt-6">
                  {sortedCategories.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={sortedCategories.map(name => groupedItems[name].id)} strategy={verticalListSortingStrategy}>
                        <Accordion type="multiple" value={activeAccordionItems} onValueChange={setActiveAccordionItems} className="w-full">
                          {sortedCategories.map((categoryName) => {
                            const group = groupedItems[categoryName];
                            const sortedItems = [...group.items].sort((a, b) => Number(a.is_checked) - Number(b.is_checked));
                            return (
                              <SortableAccordionItem key={group.id} categoryName={categoryName} group={group}>
                                <div className="space-y-2 pt-2">
                                  {sortedItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm group">
                                      <div className="flex items-center gap-3">
                                        <Checkbox id={`item-${item.id}`} checked={item.is_checked} onCheckedChange={() => handleToggleItemChecked(item.id, item.is_checked)} />
                                        <label htmlFor={`item-${item.id}`} className={cn("font-medium cursor-pointer", item.is_checked && "line-through text-gray-500")}>
                                          {item.product.name}
                                        </label>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        {item.price_per_unit != null ? (<span className="text-sm font-semibold text-gray-800">${item.price_per_unit.toFixed(2)}</span>) : null}
                                        <span className="text-sm text-gray-500 cursor-pointer hover:text-blue-600" onClick={() => handleEditItemClick(item)}>Cantidad: {item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteItem(item.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </SortableAccordionItem>
                            );
                          })}
                        </Accordion>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <EmptyState icon={ShoppingCart} title="Tu lista está vacía" description="Usa el formulario de arriba para añadir tu primer artículo." className="mt-6" />
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

            <AddItemDialog listId={list.id} token={token} onItemAdded={onItemAdded} isOpen={isAddItemOpen} setIsOpen={setIsAddItemOpen} initialProductName={newItemName} />
            <EditListDialog list={list} token={token} onListUpdated={fetchListDetails} isOpen={isEditListOpen} setIsOpen={setIsEditListOpen} />
            <EditListItemDialog item={selectedItem} listId={list.id} token={token} onItemUpdated={fetchListDetails} isOpen={isEditItemOpen} setIsOpen={setIsEditItemOpen} />
          </>
        )}
      </div>
    </div>
  );
}
