// apps/web/src/components/dashboard/EditListItemDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  quantity: z.coerce.number().int().min(1, { message: "La cantidad debe ser al menos 1." }),
});

type ListItem = { id: number; quantity: number; product: { name: string; }; };

interface EditListItemDialogProps {
  item: ListItem | null;
  listId: number;
  token: string;
  onItemUpdated: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function EditListItemDialog({ item, listId, token, onItemUpdated, isOpen, setIsOpen }: EditListItemDialogProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    if (item) form.reset({ quantity: item.quantity });
  }, [item, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!item) return;
    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${listId}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('No se pudo actualizar el artículo.');
      toast({ title: "¡Éxito!", description: "La cantidad ha sido actualizada." });
      onItemUpdated();
      setIsOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Artículo: {item?.product.name}</DialogTitle>
          <DialogDescription>Ajusta la cantidad que necesitas.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Cantidad</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Guardar Cantidad</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
