// apps/api/src/shopping-lists/shopping-lists.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { CreateListItemDto } from './dto/create-list-item.dto';
import { UpdateListItemDto } from './dto/update-list-item.dto';

@Injectable()
export class ShoppingListsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateShoppingListDto, userId: string) {
    return this.prisma.shoppingList.create({
      data: {
        name: createDto.name,
        user_id: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.shoppingList.findMany({
      where: { user_id: userId },
    });
  }

  async findOne(id: number, userId: string) {
    const list = await this.prisma.shoppingList.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },              
          },
          orderBy: {
            id: 'asc'
          }
        },
      },
    });

    if (!list) {
      throw new NotFoundException(`Shopping list with ID ${id} not found`);
    }
    if (list.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to access this list');
    }
    return list;
  }

  async update(id: number, updateDto: UpdateShoppingListDto, userId: string) {
    // Primero, usamos findOne para asegurar que la lista exista y pertenezca al usuario.
    // findOne ya lanza excepciones si no se cumplen las condiciones.
    await this.findOne(id, userId);

    return this.prisma.shoppingList.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number, userId: string) {
    // Primero, verificamos que la lista exista y que pertenezca al usuario.
    const list = await this.prisma.shoppingList.findUnique({
      where: { id },
    });

    if (!list) {
      throw new NotFoundException(`Shopping list with ID ${id} not found`);
    }

    if (list.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this list');
    }

    // Si todo es correcto, eliminamos la lista.
    await this.prisma.shoppingList.delete({
      where: { id },
    });

    return; // No se devuelve contenido en una eliminación exitosa.
  }

  // Para añadir un artículo a una lista
  async addItemToList(listId: number, userId: string, createListItemDto: CreateListItemDto) {
    const { productName, quantity, price_per_unit } = createListItemDto;

    // Primero, verificamos que el usuario sea el dueño de la lista
    const list = await this.prisma.shoppingList.findUnique({ where: { id: listId } });
    if (!list || list.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to modify this list');
    }

    // Buscamos si el producto ya existe (por nombre, distinción de mayúsculas/minúsculas)
    // En una app real, esto sería más complejo (productos globales vs. de usuario)
    let product = await this.prisma.product.findFirst({
      where: {
        name: {
          equals: productName,
          mode: 'insensitive',
        },
        // Opcional: filtrar por productos globales (user_id: null) o de este usuario
      },
    });

    // Si el producto no existe, lo creamos
    if (!product) {
      product = await this.prisma.product.create({
        data: {
          name: productName,
          user_id: userId, // Lo creamos como un producto personalizado del usuario
        },
      });
    }

    // Finalmente, creamos el ListItem y lo conectamos a la lista y al producto
    const listItem = await this.prisma.listItem.create({
      data: {
        quantity,
        price_per_unit,
        list_id: listId,
        product_id: product.id,
      },
      include: {
        product: true
      }
    });

    return listItem;
  }

  async updateListItem(listId: number, itemId: number, userId: string, updateListItemDto: UpdateListItemDto) {
    const list = await this.prisma.shoppingList.findUnique({
      where: { id: listId },
      include: { items: true },
    });

    if (!list || list.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to access this list');
    }

    const itemExists = list.items.some(item => item.id === itemId);
    if (!itemExists) {
      throw new NotFoundException(`List item with ID ${itemId} not found in this list`);
    }

    // Construye el objeto de datos dinámicamente
    const dataToUpdate: { is_checked?: boolean; quantity?: number; price_per_unit?: number } = {};
    if (updateListItemDto.isChecked !== undefined) {
      dataToUpdate.is_checked = updateListItemDto.isChecked;
    }
    if (updateListItemDto.quantity !== undefined) {
      dataToUpdate.quantity = updateListItemDto.quantity;
    }
    if (updateListItemDto.price_per_unit !== undefined) {
      dataToUpdate.price_per_unit = updateListItemDto.price_per_unit;
    }

    return this.prisma.listItem.update({
      where: { id: itemId },
      data: dataToUpdate,
      include: {
        product: true,
      },
    });
  }

  async deleteListItem(listId: number, itemId: number, userId: string) {
    // Verificamos que el usuario sea el dueño de la lista a la que pertenece el artículo
    const list = await this.prisma.shoppingList.findUnique({
      where: { id: listId },
      include: { items: true },
    });

    if (!list || list.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to access this list');
    }

    // Verificamos que el artículo realmente pertenezca a esta lista
    const itemExists = list.items.some(item => item.id === itemId);
    if (!itemExists) {
      throw new NotFoundException(`List item with ID ${itemId} not found in this list`);
    }

    // Si todo es correcto, eliminamos el artículo
    await this.prisma.listItem.delete({
      where: { id: itemId },
    });

    // No devolvemos nada en una operación de borrado exitosa (HTTP 204 No Content)
    return;
  }

}
