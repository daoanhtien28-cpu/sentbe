import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Email người dùng (cần email hoặc số điện thoại)',
  })
  @IsOptional()
  @IsString({ message: 'Email phải là chuỗi ký tự' })
  email?: string;

  @ApiPropertyOptional({
    example: '0987654321',
    description: 'Số điện thoại người dùng (sdt)',
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  sdt?: string;

  @ApiPropertyOptional({
    example: '0987654321',
    description: 'Số điện thoại người dùng (phone)',
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phone?: string;

  @ApiPropertyOptional({
    example: '0987654321',
    description: 'Số điện thoại người dùng (phoneNumber)',
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'user@example.com hoặc 0987654321',
    description: 'Định danh (email hoặc số điện thoại)',
  })
  @IsOptional()
  @IsString({ message: 'Định danh phải là chuỗi ký tự' })
  identifier?: string;

  @ApiProperty({
    example: '123456',
    description: 'Mật khẩu (đúng 6 chữ số)',
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @Matches(/^[0-9]{6}$/, { message: 'Mật khẩu phải gồm đúng 6 chữ số' })
  password: string;

  @ApiPropertyOptional({
    example: 'DAO ANH TIEN',
    description: 'Họ và tên người dùng (tùy chọn, mặc định: DAO ANH TIEN)',
  })
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName?: string;

  @ApiPropertyOptional({ example: '9704123456789012', description: 'Số thẻ ngân hàng (tùy chọn)' })
  @IsOptional()
  @IsString({ message: 'Số thẻ phải là chuỗi ký tự' })
  cardNumber?: string;
}

