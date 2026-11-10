import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { normalizePattern } from '../common/utils/pattern.util';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { RegisterDto } from './dto/register.dto';
import { UserDocument } from '../users/schemas/user.schema';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const user = await this.usersService.create(dto);
    await this.walletsService.createDefaultWallet(
      user.id,
      dto.fullName || 'DAO ANH TIEN',
    );
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }


  async login(user: UserDocument): Promise<AuthTokens> {
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async refreshTokens(user: UserDocument): Promise<AuthTokens> {
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async validateUser(
    identifier: string,
    password: number[] | string,
  ): Promise<UserDocument> {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedException('Email, số điện thoại hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(
      normalizePattern(password),
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email, số điện thoại hoặc mật khẩu không đúng');
    }

    return user;
  }

  private async generateTokens(user: UserDocument): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone || user.phoneNumber,
      cardNumber: user.cardNumber,
    };


    // Access token: 30 days
    const accessOptions: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '30d') as any,
    };

    // Refresh token: 365 days (1 year)
    const refreshOptions: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '365d') as any,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessOptions),
      this.jwtService.signAsync(payload, refreshOptions),
    ]);

    return { accessToken, refreshToken };
  }
}
