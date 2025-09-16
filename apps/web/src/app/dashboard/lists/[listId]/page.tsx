// apps/web/src/app/dashboard/lists/[listId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type ShoppingList = {
  id: number;
  name: string;
  budget: number | null;
  is_archived: boolean;
};

export default function ListDetailPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { listId } = params;

  const [list, setList] = useState<ShoppingList | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchListDetails = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:3000/shopping-lists/${listId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          throw new Error('Lista no encontrada.');
        }
        if (!response.ok) {
          throw new Error('No se pudieron obtener los detalles de la lista.');
        }

        const data = await response.json();
        setList(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetching(false);
      }
    };

    if (listId) {
      fetchListDetails();
    }
  }, [token, isAuthLoading, router, listId]);

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
              {list.budget && (
                <CardDescription>Presupuesto: ${list.budget}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {/* Aquí es donde mostraremos la lista de artículos en el futuro */}
                Próximamente: ¡Artículos de la lista aquí!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}