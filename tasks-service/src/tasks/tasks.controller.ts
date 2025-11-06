import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { Task } from './schemas/task.schema';

@ApiTags('tasks')
@Controller('api/tasks')
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva tarea' })
  @ApiResponse({ status: 201, description: 'Tarea creada exitosamente', type: Task })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createTaskDto: CreateTaskDto) {
    this.logger.log(`POST /api/tasks - Creating task: ${createTaskDto.title}`);
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tareas' })
  @ApiResponse({ status: 200, description: 'Lista de tareas', type: [Task] })
  async findAll() {
    this.logger.log('GET /api/tasks - Fetching all tasks');
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarea por ID' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea encontrada', type: Task })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async findOne(@Param('id') id: string) {
    this.logger.log(`GET /api/tasks/${id} - Fetching task`);
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una tarea' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea actualizada', type: Task })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    this.logger.log(`PATCH /api/tasks/${id} - Updating task`);
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una tarea' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea eliminada', type: Task })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async remove(@Param('id') id: string) {
    this.logger.log(`DELETE /api/tasks/${id} - Deleting task`);
    return this.tasksService.remove(id);
  }
}
