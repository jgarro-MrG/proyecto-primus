// apps/api/src/shopping-lists/shopping-lists.module.ts
import { Module } from '@nestjs/common';
import { ShoppingListsService } from './shopping-lists.service';
import { ShoppingListsController } from './shopping-lists.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; // <-- Añade esta importación

@Module({
  imports: [PrismaModule], // <-- Añade el módulo aquí
  controllers: [ShoppingListsController],
  providers: [ShoppingListsService],
})
export class ShoppingListsModule {}