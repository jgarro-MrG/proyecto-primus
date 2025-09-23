// apps/api/src/users/dto/update-category-order.dto.ts
import { IsArray, IsInt } from 'class-validator';

export class UpdateCategoryOrderDto {
  @IsArray()
  @IsInt({ each: true })
  categoryIds: number[];
}
