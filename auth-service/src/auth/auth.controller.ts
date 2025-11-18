import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, RefreshTokenDto } from "./dto/auth.dto";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  @ApiResponse({ status: 409, description: "Username or email already exists" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with username and password" })
  @ApiResponse({ status: 200, description: "User successfully logged in" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token successfully refreshed" })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({ status: 200, description: "User successfully logged out" })
  async logout(@Request() req) {
    await this.authService.logout(req.user.userId);
    return { message: "Logged out successfully" };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Returns user profile" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getProfile(@Request() req) {
    return req.user;
  }

  @Get("validate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Validate JWT token" })
  @ApiResponse({ status: 200, description: "Token is valid" })
  @ApiResponse({ status: 401, description: "Token is invalid" })
  validateToken(@Request() req) {
    return {
      valid: true,
      user: req.user,
    };
  }
}
