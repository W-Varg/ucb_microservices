import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import { LoginDto, RegisterDto } from "./dto/auth.dto";

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.usersService.create(registerDto);
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { username, password } = loginDto;

    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("User account is inactive");
    }

    this.logger.log(`User logged in: ${username}`);
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
    this.logger.log(`User logged out: ${userId}`);
  }

  private async generateTokens(user: any): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: this.configService.get<string>("JWT_EXPIRATION", "15m"),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString() },
      {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.configService.get<string>(
          "JWT_REFRESH_EXPIRATION",
          "7d",
        ),
      },
    );

    // Guardar refresh token en la base de datos
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      refreshToken,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos en segundos
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }
}
