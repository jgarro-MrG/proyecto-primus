// apps/api/src/shopping-lists/dto/update-list-item.dto.ts
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateListItemDto {
  @IsBoolean()
  @IsNotEmpty()
  isChecked: boolean;
}
