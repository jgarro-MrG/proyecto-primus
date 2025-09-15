// apps/api/src/prisma/prisma.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <-- ¡Esencial que esté exportado!
})
export class PrismaModule {}