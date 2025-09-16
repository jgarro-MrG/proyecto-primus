// apps/api/src/shopping-lists/dto/create-list-item.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateListItemDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price_per_unit?: number;
}
