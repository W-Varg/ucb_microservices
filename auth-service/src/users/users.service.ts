import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "./schemas/user.schema";
import { RegisterDto } from "../auth/dto/auth.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const { username, email, password, roles } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException("Username or email already exists");
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      username,
      email,
      password: hashedPassword,
      roles: roles || ["user"],
    });

    await user.save();
    this.logger.log(`User created: ${username}`);

    return user;
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken });
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
