// apps/api/src/auth/interfaces/request-with-user.interface.ts
import { Request } from 'express';
import { User } from '@repo/database'; // Import your Prisma User type

export interface RequestWithUser extends Request {
  user: User;
}