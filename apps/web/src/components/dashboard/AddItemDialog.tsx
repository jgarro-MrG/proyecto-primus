// src/components/dashboard/AddItemDialog.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Category = { id: number; name: string; };

const formSchema = z.object({
  productName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  quantity: z.coerce.number().int().min(1, { message: "La cantidad debe ser al menos 1." }),
  price_per_unit: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number().positive().optional()),
  categoryId: z.coerce.number().optional(),
});

interface AddItemDialogProps {
  listId: number;
  token: string;
  onItemAdded: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialProductName?: string;
}

export function AddItemDialog({ listId, token, onItemAdded, isOpen, setIsOpen, initialProductName }: AddItemDialogProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { quantity: 1 },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        productName: initialProductName || "",
        quantity: 1,
        price_per_unit: undefined,
        categoryId: undefined,
      });

      const fetchCategories = async () => {
        try {
          const response = await fetch('http://localhost:3000/categories');
          if (!response.ok) throw new Error('No se pudieron obtener las categorías');
          const data = await response.json();
          setCategories(data);
        } catch (error) {
          console.error("Failed to fetch categories:", error);
        }
      };
      fetchCategories();
    }
  }, [isOpen, initialProductName, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(`http://localhost:3000/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('No se pudo añadir el artículo.');
      
      toast({ title: "¡Éxito!", description: `"${values.productName}" ha sido añadido a tu lista.` });
      onItemAdded();
      setIsOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Artículo</DialogTitle>
          <DialogDescription>Completa los detalles de tu nuevo artículo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="productName" render={({ field }) => ( <FormItem><FormLabel>Nombre del Artículo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>Cantidad</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="price_per_unit" render={({ field }) => ( <FormItem><FormLabel>Precio (Opcional)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Ej: 1.99" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría (Opcional)</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value ? String(field.value) : undefined}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit">Añadir a la Lista</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

