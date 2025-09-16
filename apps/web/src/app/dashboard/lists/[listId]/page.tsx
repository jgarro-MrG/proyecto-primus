// apps/web/src/app/dashboard/lists/[listId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Tipos para nuestros datos
type Product = { id: number; name: string; };
type ListItem = { id: number; quantity: number; price_per_unit: number | null; product: Product; };
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

  // Estado para el formulario de nuevo artículo
  const [newItemName, setNewItemName] = useState('');

  const fetchListDetails = useCallback(async () => {
    if (!token || !listId) return;
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${listId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudieron obtener los detalles de la lista.');
      const data = await response.json();
      setList(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  }, [token, listId]);

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
    if (!newItemName.trim() || !token) return;

    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productName: newItemName }),
      });

      if (!response.ok) {
        throw new Error('No se pudo añadir el artículo.');
      }

      setNewItemName(''); // Limpiar el input
      fetchListDetails(); // Refrescar la lista de artículos
      toast({ title: "¡Artículo añadido!", description: `"${newItemName}" ha sido añadido a tu lista.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isAuthLoading || isFetching) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <Button asChild variant="outline">
            <Link href="/dashboard">← Volver a Mis Listas</Link>
          </Button>
        </header>

        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

        {list && (
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl">{list.name}</CardTitle>
              {list.budget && <CardDescription>Presupuesto: ${list.budget}</CardDescription>}
            </CardHeader>
            <CardContent>
              {/* Formulario para añadir nuevo artículo */}
              <form onSubmit={handleAddItem} className="flex gap-2 mb-6">
                <Input
                  type="text"
                  placeholder="Ej: Leche, Huevos..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-grow"
                />
                <Button type="submit">Añadir</Button>
              </form>

              {/* Lista de artículos */}
              <div className="space-y-2">
                {list.items.length > 0 ? (
                  list.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-sm text-gray-500">Cantidad: {item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Tu lista está vacía. ¡Añade tu primer artículo!</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}