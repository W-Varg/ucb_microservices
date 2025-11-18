import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "johndoe", description: "Nombre de usuario único" })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: "john@example.com",
    description: "Email del usuario",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "Password123!",
    description: "Contraseña (mín 6 caracteres)",
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: ["user"], description: "Roles del usuario" })
  @IsOptional()
  @IsArray()
  roles?: string[];
}

export class LoginDto {
  @ApiProperty({ example: "johndoe", description: "Username o email" })
  @IsString()
  username: string;

  @ApiProperty({ example: "Password123!", description: "Contraseña" })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Refresh token",
  })
  @IsString()
  refreshToken: string;
}
