import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { normalizePattern } from '../common/utils/pattern.util';
import {
  canonicalizePhone,
  isValidEmail,
  isValidPhone,
} from '../common/utils/phone.util';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserDocument } from './schemas/user.schema';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    let rawEmail = dto.email?.trim();
    let rawPhone = (dto.sdt || dto.phone || dto.phoneNumber)?.trim();

    // Nếu truyền identifier mà chưa truyền email/phone
    if (dto.identifier && dto.identifier.trim()) {
      const iden = dto.identifier.trim();
      if (iden.includes('@')) {
        if (!rawEmail) rawEmail = iden;
      } else {
        if (!rawPhone) rawPhone = iden;
      }
    }

    // Nếu FE gửi số điện thoại vào trường email (ví dụ form đăng ký dùng 1 ô nhập)
    if (rawEmail && !rawEmail.includes('@') && isValidPhone(rawEmail)) {
      if (!rawPhone) {
        rawPhone = rawEmail;
        rawEmail = undefined;
      }
    }

    // Bắt buộc phải có email hoặc số điện thoại
    if (!rawEmail && !rawPhone) {
      throw new BadRequestException('Vui lòng cung cấp email hoặc số điện thoại để đăng ký');
    }

    let normalizedEmail: string | undefined;
    if (rawEmail) {
      if (!isValidEmail(rawEmail)) {
        throw new BadRequestException('Email không hợp lệ');
      }
      normalizedEmail = rawEmail.toLowerCase().trim();
      const existingEmail = await this.usersRepo.findByEmail(normalizedEmail);
      if (existingEmail) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    let canonicalPhone: string | undefined;
    if (rawPhone) {
      if (!isValidPhone(rawPhone)) {
        throw new BadRequestException('Số điện thoại không hợp lệ');
      }
      canonicalPhone = canonicalizePhone(rawPhone);
      const existingPhone = await this.usersRepo.findByPhone(canonicalPhone);
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    let cardNumber = dto.cardNumber;
    if (cardNumber) {
      const existingCard = await this.usersRepo.findByCardNumber(cardNumber);
      if (existingCard) {
        throw new ConflictException('Số thẻ đã được sử dụng');
      }
    } else {
      cardNumber = await this.generateUniqueCardNumber();
    }

    const hashedPassword = await bcrypt.hash(normalizePattern(dto.password), 10);

    const userData: Partial<User> = {
      cardNumber,
      password: hashedPassword,
      fullName: dto.fullName?.trim() || 'DAO ANH TIEN',
    };

    if (normalizedEmail) {
      userData.email = normalizedEmail;
    }
    if (canonicalPhone) {
      userData.phone = canonicalPhone;
      userData.phoneNumber = canonicalPhone;
      userData.sdt = canonicalPhone;
    }

    return this.usersRepo.save(userData);
  }

  private async generateUniqueCardNumber(): Promise<string> {
    let cardNumber = '';
    let exists = true;
    while (exists) {
      const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      cardNumber = `9704${random12}`;
      const found = await this.usersRepo.findByCardNumber(cardNumber);
      if (!found) {
        exists = false;
      }
    }
    return cardNumber;
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return user;
  }

  async findByCardNumber(cardNumber: string): Promise<UserDocument | null> {
    return this.usersRepo.findByCardNumber(cardNumber);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepo.findByEmail(email);
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.usersRepo.findByPhone(phone);
  }

  async findByIdentifier(identifier: string): Promise<UserDocument | null> {
    return this.usersRepo.findByIdentifier(identifier);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const updateData: Partial<User> = {};

    if (dto.fullName !== undefined) {
      updateData.fullName = dto.fullName;
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim();
      if (email) {
        if (!isValidEmail(email)) {
          throw new BadRequestException('Email không hợp lệ');
        }
        const normalizedEmail = email.toLowerCase();
        const existing = await this.usersRepo.findByEmail(normalizedEmail);
        if (existing && existing.id !== userId) {
          throw new ConflictException('Email đã được sử dụng');
        }
        updateData.email = normalizedEmail;
      }
    }

    const rawPhone = (dto.sdt || dto.phone || dto.phoneNumber)?.trim();
    if (rawPhone !== undefined) {
      if (rawPhone) {
        if (!isValidPhone(rawPhone)) {
          throw new BadRequestException('Số điện thoại không hợp lệ');
        }
        const canonical = canonicalizePhone(rawPhone);
        const existing = await this.usersRepo.findByPhone(canonical);
        if (existing && existing.id !== userId) {
          throw new ConflictException('Số điện thoại đã được sử dụng');
        }
        updateData.phone = canonical;
        updateData.phoneNumber = canonical;
        updateData.sdt = canonical;
      }
    }

    const updated = await this.usersRepo.update(userId, updateData);
    if (!updated) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return updated;
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);

    const isMatch = await bcrypt.compare(
      normalizePattern(dto.currentPassword),
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const isSameAsOld = await bcrypt.compare(
      normalizePattern(dto.newPassword),
      user.password,
    );
    if (isSameAsOld) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu cũ',
      );
    }

    const newHashed = await bcrypt.hash(
      normalizePattern(dto.newPassword),
      10,
    );
    await this.usersRepo.update(userId, { password: newHashed });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    const hashed = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;
    await this.usersRepo.update(userId, { refreshToken: hashed ?? undefined });
  }
}

