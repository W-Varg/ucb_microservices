import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ 
    example: 'Completar proyecto', 
    description: 'Título de la tarea' 
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({ 
    example: 'Finalizar el proyecto de microservicios', 
    description: 'Descripción detallada de la tarea' 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    example: 'high', 
    description: 'Prioridad de la tarea',
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  })
  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ 
    example: 'Completar proyecto actualizado', 
    description: 'Título de la tarea' 
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ 
    example: 'Nueva descripción', 
    description: 'Descripción detallada de la tarea' 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Estado de completado' 
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiPropertyOptional({ 
    example: 'low', 
    description: 'Prioridad de la tarea',
    enum: ['low', 'medium', 'high']
  })
  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: string;
}
