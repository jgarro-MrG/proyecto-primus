// apps/api/src/users/users.controller.ts
import { Controller, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateCategoryOrderDto } from './dto/update-category-order.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me/category-order')
  updateCategoryOrder(@Request() req: RequestWithUser, @Body() updateDto: UpdateCategoryOrderDto) {
    return this.usersService.updateUserCategoryOrder(req.user.id, updateDto.categoryIds);
  }
}
