import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsArray, ArrayMinSize } from 'class-validator';

export class BulkUnassignDto {
    @ApiProperty({ example: 1, description: 'Sales Rep user ID' })
    @IsInt()
    sales_rep_id: number;

    @ApiProperty({ example: [1, 2, 3], description: 'Array of retailer IDs to unassign' })
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    retailer_ids: number[];
}
