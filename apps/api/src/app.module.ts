// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';

@Module({
  imports: [PrismaModule, AuthModule, ShoppingListsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}