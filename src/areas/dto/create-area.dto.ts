import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateAreaDto {
    @ApiProperty({ example: 'Mirpur', description: 'Area name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 1, description: 'Region ID' })
    @IsInt()
    regionId: number;
}
