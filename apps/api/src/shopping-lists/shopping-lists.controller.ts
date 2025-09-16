// apps/api/src/shopping-lists/shopping-lists.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseIntPipe, Patch, Delete } from '@nestjs/common';
import { ShoppingListsService } from './shopping-lists.service';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreateListItemDto } from './dto/create-list-item.dto';

@UseGuards(AuthGuard('jwt')) // <-- Protege todas las rutas de este controlador
@Controller('shopping-lists')
export class ShoppingListsController {
  constructor(private readonly shoppingListsService: ShoppingListsService) {}

  @Post()
  create(@Body() createDto: CreateShoppingListDto, @Request() req) {
    const userId = req.user.id;
    return this.shoppingListsService.create(createDto, userId);
  }

  @Get()
  findAll(@Request() req) {
    const userId = req.user.id;
    return this.shoppingListsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) { // <-- ID es número, usa ParseIntPipe
    const userId = req.user.id;
    return this.shoppingListsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateShoppingListDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.shoppingListsService.update(id, updateDto, userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user.id;
    return this.shoppingListsService.remove(id, userId);
  }

  @Post(':listId/items')
  addItem(
    @Param('listId', ParseIntPipe) listId: number,
    @Request() req,
    @Body() createListItemDto: CreateListItemDto,
  ) {
    return this.shoppingListsService.addItemToList(listId, req.user.id, createListItemDto);
  }
}
