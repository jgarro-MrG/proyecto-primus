// apps/api/src/shopping-lists/dto/create-shopping-list.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateShoppingListDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}