import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle("Auth Service API")
    .setDescription(
      "Authentication and Authorization Service for Microservices Architecture",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Authentication")
    .addTag("Health")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port);

  console.log(`Auth Service is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();
