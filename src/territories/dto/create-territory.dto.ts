import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateTerritoryDto {
    @ApiProperty({ example: 'Mirpur-10', description: 'Territory name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 1, description: 'Area ID' })
    @IsInt()
    areaId: number;
}
