import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

export class LoginDto {
  @ApiPropertyOptional({
    example: "user@example.com hoặc 0987654321",
    description: "Email hoặc số điện thoại đăng nhập",
  })
  @IsOptional()
  @IsString({ message: "Email phải là chuỗi ký tự" })
  email?: string;

  @ApiPropertyOptional({
    example: "0987654321",
    description: "Số điện thoại đăng nhập (sdt)",
  })
  @IsOptional()
  @IsString({ message: "Số điện thoại phải là chuỗi ký tự" })
  sdt?: string;

  @ApiPropertyOptional({
    example: "0987654321",
    description: "Số điện thoại đăng nhập (phone)",
  })
  @IsOptional()
  @IsString({ message: "Số điện thoại phải là chuỗi ký tự" })
  phone?: string;

  @ApiPropertyOptional({
    example: "0987654321",
    description: "Số điện thoại đăng nhập (alias của phone)",
  })
  @IsOptional()
  @IsString({ message: "Số điện thoại phải là chuỗi ký tự" })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: "user@example.com hoặc 0987654321",
    description: "Định danh đăng nhập (email hoặc số điện thoại)",
  })
  @IsOptional()
  @IsString({ message: "Định danh phải là chuỗi ký tự" })
  identifier?: string;

  @ApiProperty({
    example: "123456",
    description: "Mật khẩu (đúng 6 chữ số)",
  })
  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @IsString({ message: "Mật khẩu phải là chuỗi ký tự" })
  @Matches(/^[0-9]{6}$/, { message: "Mật khẩu phải gồm đúng 6 chữ số" })
  password: string;

  @ApiPropertyOptional({ example: "9704123456789012", description: "Số thẻ ngân hàng (tùy chọn)", required: false })
  @IsOptional()
  @IsString({ message: "Số thẻ phải là chuỗi ký tự" })
  cardNumber?: string;
}
