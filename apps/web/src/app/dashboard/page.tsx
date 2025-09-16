// apps/web/src/app/dashboard/page.tsx
'use client';
import Link from 'next/link';

// 1. Importamos los hooks que necesitamos, incluyendo useCallback
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CreateListDialog } from '@/components/dashboard/CreateListDialog'; // <-- Importamos el nuevo componente

type ShoppingList = {
  id: number;
  name: string;
  budget: number | null;
  is_archived: boolean;
};

export default function DashboardPage() {
  const { token, logout, isLoading } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Movemos fetchLists fuera del useEffect y lo envolvemos en useCallback
  // Esto nos permite llamarlo desde cualquier parte y es una optimización de rendimiento.
  const fetchLists = useCallback(async () => {
    if (!token) return; // No hacer nada si no hay token

    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/shopping-lists', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('No se pudieron obtener las listas.');
      }
      const data = await response.json();
      setLists(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  }, [token]); // Se volverá a crear solo si el token cambia

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!token) {
      router.push('/login');
      return;
    }
    // 3. Ahora el useEffect solo se encarga de llamar a la función
    fetchLists();
  }, [token, isLoading, router, fetchLists]);

  if (isLoading || isFetching) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Mis Listas</h1>
          <Button onClick={logout}>Cerrar Sesión</Button>
        </header>

        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {token && <CreateListDialog token={token} onListCreated={fetchLists} />}

          {/* Mapeo de las listas existentes */}
          {lists.map((list) => (
            <Link href={`/dashboard/lists/${list.id}`} key={list.id}>
              <Card className="h-48 flex flex-col justify-between hover:border-blue-500 transition-colors">
                <CardHeader>
                  <CardTitle>{list.name}</CardTitle>
                  {list.budget && (
                    <CardDescription>Presupuesto: ${list.budget}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {list.is_archived ? 'Archivada' : 'Activa'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Muestra este mensaje si no se están cargando listas y el array está vacío */}
        {!isFetching && lists.length === 0 && (
           <div className="text-center mt-8 col-span-full">
             <p className="text-gray-500">Aún no tienes listas. ¡Haz clic arriba para crear la primera!</p>
           </div>
        )}
      </div>
    </div>
  );
}
