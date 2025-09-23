// apps/api/src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateUserCategoryOrder(userId: string, categoryIds: number[]) {
    const transactions = categoryIds.map((categoryId, index) => {
      return this.prisma.userCategoryPreference.upsert({
        where: { user_id_category_id: { user_id: userId, category_id: categoryId } },
        update: { order: index },
        create: { user_id: userId, category_id: categoryId, order: index },
      });
    });

    return this.prisma.$transaction(transactions);
  }
}