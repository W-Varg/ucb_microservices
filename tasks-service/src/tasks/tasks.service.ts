import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private readonly kafkaService: KafkaService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    this.logger.log(`Creating new task: ${createTaskDto.title}`);
    const createdTask = new this.taskModel(createTaskDto);
    const saved = await createdTask.save();
    this.logger.log(`Task created successfully with ID: ${saved._id}`);
    
    // Publicar evento de tarea creada en Kafka
    try {
      await this.kafkaService.publishTaskCreated(saved.toObject());
    } catch (error) {
      this.logger.error('Failed to publish task created event', error.message);
    }
    
    return saved;
  }

  async findAll(): Promise<Task[]> {
    this.logger.log('Fetching all tasks');
    const tasks = await this.taskModel.find().sort({ createdAt: -1 }).exec();
    this.logger.log(`Found ${tasks.length} tasks`);
    return tasks;
  }

  async findOne(id: string): Promise<Task> {
    this.logger.log(`Fetching task with ID: ${id}`);
    const task = await this.taskModel.findById(id).exec();
    
    if (!task) {
      this.logger.warn(`Task not found with ID: ${id}`);
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    this.logger.log(`Updating task with ID: ${id}`);
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .exec();
    
    if (!updatedTask) {
      this.logger.warn(`Task not found for update with ID: ${id}`);
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    this.logger.log(`Task updated successfully: ${id}`);
    
    // Publicar evento de tarea actualizada en Kafka
    try {
      await this.kafkaService.publishTaskUpdated(id, updatedTask.toObject());
    } catch (error) {
      this.logger.error('Failed to publish task updated event', error.message);
    }
    
    return updatedTask;
  }

  async remove(id: string): Promise<Task> {
    this.logger.log(`Deleting task with ID: ${id}`);
    const deletedTask = await this.taskModel.findByIdAndDelete(id).exec();
    
    if (!deletedTask) {
      this.logger.warn(`Task not found for deletion with ID: ${id}`);
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    this.logger.log(`Task deleted successfully: ${id}`);
    
    // Publicar evento de tarea eliminada en Kafka
    try {
      await this.kafkaService.publishTaskDeleted(id, deletedTask.toObject());
    } catch (error) {
      this.logger.error('Failed to publish task deleted event', error.message);
    }
    
    return deletedTask;
  }

  async count(): Promise<number> {
    return this.taskModel.countDocuments().exec();
  }

  async countByPriority(priority: string): Promise<number> {
    return this.taskModel.countDocuments({ priority }).exec();
  }

  async countCompleted(): Promise<number> {
    return this.taskModel.countDocuments({ completed: true }).exec();
  }
}
