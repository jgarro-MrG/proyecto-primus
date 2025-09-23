// src/components/dashboard/AddItemDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AddItemDialogProps {
  listId: number;
  token: string;
  onItemAdded: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialProductName: string;
}

export function AddItemDialog({ listId, token, onItemAdded, isOpen, setIsOpen, initialProductName }: AddItemDialogProps) {
  const [productName, setProductName] = useState(initialProductName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Sync the product name from the parent component when the dialog opens
    if (isOpen) {
      setProductName(initialProductName);
    }
  }, [initialProductName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del artículo no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productName: productName.trim(), quantity: 1 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo añadir el artículo.');
      }

      toast({ title: "Éxito", description: `"${productName.trim()}" ha sido añadido a la lista.` });
      onItemAdded(); // Callback to refresh the list in the parent
      setIsOpen(false); // Close the dialog
      setProductName(''); // Clear the input for the next use

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Artículo</DialogTitle>
          <DialogDescription>
            Ingresa el nombre del producto que deseas añadir a tu lista.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ej: Leche, Huevos, Pan..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner className="h-4 w-4 mr-2" /> : null}
              Añadir Artículo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}