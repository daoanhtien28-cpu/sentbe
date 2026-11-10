import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: Partial<Record<keyof UsersRepository, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByPhone: vi.fn(),
      findByCardNumber: vi.fn(),
      findByIdentifier: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    service = new UsersService(mockRepo as unknown as UsersRepository);
  });

  describe('create', () => {
    it('should create user with email only', async () => {
      mockRepo.findByEmail!.mockResolvedValue(null);
      mockRepo.findByCardNumber!.mockResolvedValue(null);
      mockRepo.save!.mockImplementation((data) => Promise.resolve({ id: 'user-1', ...data }));

      const result = await service.create({
        email: 'user@example.com',
        password: '123456',
        fullName: 'Nguyen Van A',
      });

      expect(mockRepo.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          fullName: 'Nguyen Van A',
        }),
      );
      expect(result.id).toBe('user-1');
    });

    it('should create user with 3 fields only (email, sdt, password) and default fullName', async () => {
      mockRepo.findByEmail!.mockResolvedValue(null);
      mockRepo.findByPhone!.mockResolvedValue(null);
      mockRepo.findByCardNumber!.mockResolvedValue(null);
      mockRepo.save!.mockImplementation((data) => Promise.resolve({ id: 'user-3fields', ...data }));

      const result = await service.create({
        email: 'user3@example.com',
        sdt: '0987654321',
        password: '123456',
      });

      expect(mockRepo.findByEmail).toHaveBeenCalledWith('user3@example.com');
      expect(mockRepo.findByPhone).toHaveBeenCalledWith('0987654321');
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user3@example.com',
          phone: '0987654321',
          sdt: '0987654321',
          fullName: 'DAO ANH TIEN',
        }),
      );
      expect(result.id).toBe('user-3fields');
    });

    it('should create user with phone only', async () => {
      mockRepo.findByPhone!.mockResolvedValue(null);
      mockRepo.findByCardNumber!.mockResolvedValue(null);
      mockRepo.save!.mockImplementation((data) => Promise.resolve({ id: 'user-2', ...data }));

      const result = await service.create({
        phone: '0987654321',
        password: '123456',
        fullName: 'Nguyen Van B',
      });

      expect(mockRepo.findByPhone).toHaveBeenCalledWith('0987654321');
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '0987654321',
          phoneNumber: '0987654321',
          fullName: 'Nguyen Van B',
        }),
      );
      expect(result.id).toBe('user-2');
    });

    it('should support phone number input in email field if valid phone format', async () => {
      mockRepo.findByPhone!.mockResolvedValue(null);
      mockRepo.findByCardNumber!.mockResolvedValue(null);
      mockRepo.save!.mockImplementation((data) => Promise.resolve({ id: 'user-3', ...data }));

      const result = await service.create({
        email: '0987654321',
        password: '123456',
        fullName: 'Nguyen Van C',
      });

      expect(mockRepo.findByPhone).toHaveBeenCalledWith('0987654321');
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '0987654321',
        }),
      );
      expect(result.id).toBe('user-3');
    });

    it('should throw BadRequestException if neither email nor phone provided', async () => {
      await expect(
        service.create({
          password: '123456',
          fullName: 'Nguyen Van D',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email already registered', async () => {
      mockRepo.findByEmail!.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          email: 'used@example.com',
          password: '123456',
          fullName: 'Nguyen Van E',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if phone already registered', async () => {
      mockRepo.findByPhone!.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          phone: '0987654321',
          password: '123456',
          fullName: 'Nguyen Van F',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});

