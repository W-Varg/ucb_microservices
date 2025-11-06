import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @ApiProperty({ example: 'Completar proyecto', description: 'Título de la tarea' })
  @Prop({ required: true, trim: true })
  title: string;

  @ApiProperty({ 
    example: 'Finalizar el proyecto de microservicios', 
    description: 'Descripción detallada de la tarea',
    required: false 
  })
  @Prop({ trim: true })
  description?: string;

  @ApiProperty({ example: false, description: 'Estado de completado de la tarea' })
  @Prop({ default: false })
  completed: boolean;

  @ApiProperty({ 
    example: 'high', 
    description: 'Prioridad de la tarea',
    enum: ['low', 'medium', 'high'] 
  })
  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Fecha de creación' })
  @Prop()
  createdAt?: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Fecha de última actualización' })
  @Prop()
  updatedAt?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
