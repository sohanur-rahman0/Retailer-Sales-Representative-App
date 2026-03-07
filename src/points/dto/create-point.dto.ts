import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export class CreatePointDto {
  @ApiProperty({ example: 'Downtown Point', description: 'Point name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, description: 'Territory ID this point belongs to' })
  @IsInt()
  territoryId: number;
}