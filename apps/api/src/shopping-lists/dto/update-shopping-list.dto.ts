// apps/api/src/shopping-lists/dto/update-shopping-list.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateShoppingListDto } from './create-shopping-list.dto';

// PartialType hace que todas las propiedades de CreateShoppingListDto sean opcionales
export class UpdateShoppingListDto extends PartialType(CreateShoppingListDto) {}