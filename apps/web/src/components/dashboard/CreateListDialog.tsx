// apps/web/src/components/dashboard/CreateListDialog.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from '@/components/ui/card';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  budget: z.coerce.number().positive().optional(),
});

interface CreateListDialogProps {
  token: string;
  onListCreated: () => void;
}

export function CreateListDialog({ token, onListCreated }: CreateListDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/shopping-lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('No se pudo crear la lista.');
      }

      toast({
        title: "¡Éxito!",
        description: "Tu nueva lista de compras ha sido creada.",
      });

      form.reset();
      onListCreated();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudo crear la lista. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="flex items-center justify-center border-2 border-dashed h-48 hover:bg-gray-50 cursor-pointer">
          <div className="text-center">
            <p className="text-lg font-semibold">+ Crear Nueva Lista</p>
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Lista</DialogTitle>
          <DialogDescription>
            Dale un nombre a tu nueva lista de compras. Opcionalmente, puedes añadir un presupuesto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
             {error && <p className="text-red-500 text-sm">{error}</p>}
            <DialogFooter>
              <Button type="submit">Crear Lista</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}