import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: Partial<Record<keyof UsersService, ReturnType<typeof vi.fn>>>;
  let mockWalletsService: Partial<Record<keyof WalletsService, ReturnType<typeof vi.fn>>>;
  let mockJwtService: Partial<Record<keyof JwtService, ReturnType<typeof vi.fn>>>;
  let mockConfigService: Partial<Record<keyof ConfigService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    mockUsersService = {
      findById: vi.fn(),
      findByIdentifier: vi.fn(),
      create: vi.fn(),
      updateRefreshToken: vi.fn(),
    };

    mockWalletsService = {
      createDefaultWallet: vi.fn().mockResolvedValue({}),
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('jwt_token'),
    };

    mockConfigService = {
      get: vi.fn().mockReturnValue('secret'),
    };

    authService = new AuthService(
      mockUsersService as unknown as UsersService,
      mockWalletsService as unknown as WalletsService,
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
    );
  });

  describe('validateUser', () => {
    it('should validate user successfully with email and matching password', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const fakeUser = {
        id: 'u1',
        email: 'user@example.com',
        password: hashedPassword,
      };

      mockUsersService.findByIdentifier!.mockResolvedValue(fakeUser);

      const user = await authService.validateUser('user@example.com', '123456');
      expect(user).toEqual(fakeUser);
      expect(mockUsersService.findByIdentifier).toHaveBeenCalledWith('user@example.com');
    });

    it('should validate user successfully with phone and matching password', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const fakeUser = {
        id: 'u2',
        phone: '0987654321',
        password: hashedPassword,
      };

      mockUsersService.findByIdentifier!.mockResolvedValue(fakeUser);

      const user = await authService.validateUser('0987654321', '123456');
      expect(user).toEqual(fakeUser);
      expect(mockUsersService.findByIdentifier).toHaveBeenCalledWith('0987654321');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByIdentifier!.mockResolvedValue(null);

      await expect(
        authService.validateUser('notfound@example.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const fakeUser = {
        id: 'u3',
        phone: '0987654321',
        password: hashedPassword,
      };

      mockUsersService.findByIdentifier!.mockResolvedValue(fakeUser);

      await expect(
        authService.validateUser('0987654321', '654321'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register with phone, create wallet, and return tokens', async () => {
      const fakeUser = {
        id: 'u4',
        phone: '0987654321',
        phoneNumber: '0987654321',
        fullName: 'Test User',
      };

      mockUsersService.create!.mockResolvedValue(fakeUser);

      const tokens = await authService.register({
        phone: '0987654321',
        password: '123456',
        fullName: 'Test User',
      });

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '0987654321',
        }),
      );
      expect(mockWalletsService.createDefaultWallet).toHaveBeenCalledWith(
        'u4',
        'Test User',
      );
      expect(tokens).toEqual({
        accessToken: 'jwt_token',
        refreshToken: 'jwt_token',
      });
    });
  });
});

