// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, ShoppingListsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}