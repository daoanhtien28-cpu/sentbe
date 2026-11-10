import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới bằng email hoặc số điện thoại' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công, trả về tokens' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc thiếu email/số điện thoại' })
  @ApiResponse({ status: 409, description: 'Email hoặc số điện thoại đã tồn tại' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng email hoặc số điện thoại và mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về tokens' })
  @ApiResponse({ status: 400, description: 'Thiếu thông tin đăng nhập hoặc mật khẩu không đúng định dạng' })
  @ApiResponse({ status: 401, description: 'Email/số điện thoại hoặc mật khẩu không đúng' })
  async login(@Body() dto: LoginDto) {
    const rawIdentifier =
      dto.identifier ||
      dto.sdt ||
      dto.phone ||
      dto.phoneNumber ||
      dto.email ||
      dto.cardNumber;

    if (!rawIdentifier || !rawIdentifier.trim()) {
      throw new BadRequestException('Vui lòng cung cấp email hoặc số điện thoại để đăng nhập');
    }

    const user = await this.authService.validateUser(rawIdentifier.trim(), dto.password);
    return this.authService.login(user);
  }


  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  @ApiResponse({ status: 200, description: 'Trả về tokens mới' })
  async refresh(@Body() _dto: RefreshTokenDto, @CurrentUser() user: UserDocument) {
    return this.authService.refreshTokens(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất (vô hiệu hóa refresh token)' })
  async logout(@CurrentUser() user: UserDocument) {
    await this.authService.logout(user.id);
    return { message: 'Đăng xuất thành công' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  async me(@CurrentUser() user: UserDocument) {
    return user;
  }
}
