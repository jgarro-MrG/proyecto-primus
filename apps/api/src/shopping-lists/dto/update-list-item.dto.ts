// apps/api/src/shopping-lists/dto/update-list-item.dto.ts
import { IsBoolean, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateListItemDto {
  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  isChecked: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}
