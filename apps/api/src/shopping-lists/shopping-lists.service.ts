// apps/api/src/shopping-lists/shopping-lists.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';

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

  async findOne(id: number, userId: string) { // <-- ID es ahora un número
    const list = await this.prisma.shoppingList.findUnique({
      where: { id },
    });

    if (!list) {
      throw new NotFoundException('Shopping list not found');
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
    // Igualmente, verificamos la propiedad antes de borrar.
    await this.findOne(id, userId);

    return this.prisma.shoppingList.delete({
      where: { id },
    });
  }

}
