// apps/web/src/components/dashboard/EditListDialog.tsx
'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  budget: z.coerce.number().positive().optional(),
});

type ShoppingList = { id: number; name: string; budget?: number | null; };

interface EditListDialogProps {
  list: ShoppingList;
  token: string;
  onListUpdated: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function EditListDialog({ list, token, onListUpdated, isOpen, setIsOpen }: EditListDialogProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (list) {
      form.reset({
        name: list.name,
        budget: list.budget || undefined,
      });
    }
  }, [list, form, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${list.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('No se pudo actualizar la lista.');

      toast({ title: "¡Éxito!", description: "Tu lista ha sido actualizada." });
      onListUpdated();
      setIsOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Lista</DialogTitle>
          <DialogDescription>Modifica los detalles de tu lista de compras.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Lista</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Compras del Sábado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presupuesto (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
