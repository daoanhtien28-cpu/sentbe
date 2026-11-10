import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BanksService } from '../banks/banks.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  QueryTransactionsDto,
  TransactionCategoryFilter,
} from './dto/query-transactions.dto';
import {
  TransactionCategory,
  TransactionStatus,
} from './schemas/transaction.schema';
import { TransactionsRepository } from './transactions.repository';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mockRepo: Partial<Record<keyof TransactionsRepository, ReturnType<typeof vi.fn>>>;
  let mockWalletsService: Partial<Record<keyof WalletsService, ReturnType<typeof vi.fn>>>;
  let mockBanksService: Partial<Record<keyof BanksService, ReturnType<typeof vi.fn>>>;

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockWallet = {
    id: '507f1f77bcf86cd799439012',
    availableBalance: 1000000,
    totalBalance: 1000000,
    currency: 'KRW',
    accountNumber: '123-456-789',
    ownerName: 'KIM SENTBE',
    linkedBankCode: 'IBK',
    linkedBankName: 'IBK',
    imageUrl: 'assets/images/bank/bank_ibk.png',
  };

  beforeEach(() => {
    mockRepo = {
      save: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'tx-1', ...data })),
      findWithPagination: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findById: vi.fn(),
      update: vi.fn().mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      delete: vi.fn().mockResolvedValue(true),
    };

    mockWalletsService = {
      getMyWallet: vi.fn().mockResolvedValue({ ...mockWallet }),
      updateMyWallet: vi.fn().mockResolvedValue({}),
    };

    mockBanksService = {
      getBankByCode: vi.fn().mockResolvedValue({
        code: 'VCB',
        name: 'Vietcombank',
        imageUrl: 'assets/images/bank/bank_vcb.png',
      }),
    };

    service = new TransactionsService(
      mockRepo as unknown as TransactionsRepository,
      mockWalletsService as unknown as WalletsService,
      mockBanksService as unknown as BanksService,
    );
  });

  describe('createTransaction (Domestic)', () => {
    it('should create domestic transaction with KRW defaults', async () => {
      const dto: CreateTransactionDto = {
        title: 'GS25 편의점',
        transferAmount: 5000,
        category: TransactionCategory.DOMESTIC,
      };

      const result = await service.createTransaction(mockUserId, dto);

      expect(result).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          category: TransactionCategory.DOMESTIC,
          transferAmount: 5000,
          receiverCurrency: 'KRW',
          receiveAmount: 5000,
          exchangeRate: 1,
          transferTypeTag: '체크',
        }),
      );
      expect(mockWalletsService.updateMyWallet).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          availableBalance: 995000,
        }),
      );
    });
  });

  describe('createTransaction (International)', () => {
    it('should calculate receiveAmount from transferAmount and exchangeRate', async () => {
      const dto: CreateTransactionDto = {
        title: 'NGUYEN VAN A',
        transferAmount: 200000, // 200,000 KRW
        fee: 5000,              // 5,000 KRW fee
        category: TransactionCategory.INTERNATIONAL,
        exchangeRate: 18.35,     // 1 KRW = 18.35 VND
        receiverCurrency: 'VND',
        receiverCountry: 'VN',
      };

      await service.createTransaction(mockUserId, dto);

      // Expected receiveAmount: 200,000 * 18.35 = 3,670,000 VND
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          category: TransactionCategory.INTERNATIONAL,
          transferAmount: 200000,
          fee: 5000,
          exchangeRate: 18.35,
          receiverCurrency: 'VND',
          receiveAmount: 3670000,
          receiverCountry: 'VN',
          transferChannel: 'Sentbe',
          transferTypeTag: '해외송금',
        }),
      );

      // Wallet should be deducted: 200,000 + 5,000 = 205,000 KRW
      expect(mockWalletsService.updateMyWallet).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          availableBalance: 795000,
        }),
      );
    });

    it('should derive exchangeRate if receiveAmount is provided without exchangeRate', async () => {
      const dto: CreateTransactionDto = {
        title: 'JOHN DOE',
        transferAmount: 100000, // 100,000 KRW
        category: TransactionCategory.INTERNATIONAL,
        receiveAmount: 1800000,  // 1,800,000 VND
        receiverCurrency: 'VND',
      };

      await service.createTransaction(mockUserId, dto);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          category: TransactionCategory.INTERNATIONAL,
          transferAmount: 100000,
          receiveAmount: 1800000,
          exchangeRate: 18, // 1,800,000 / 100,000 = 18
          receiverCurrency: 'VND',
        }),
      );
    });

    it('should successfully create international transaction with PROCESSING status and full payload', async () => {
      const payload: CreateTransactionDto = {
        category: TransactionCategory.INTERNATIONAL,
        title: 'DAO ANH TIEN',
        transferAmount: 1111.0,
        isDeposit: false,
        currency: 'KRW',
        transferChannel: 'Sentbe',
        transferTypeTag: '해외송금',
        content: 'Chuyển tiền quốc tế',
        status: 'PROCESSING',
        fee: 5000.0,
        exchangeRate: 18.35,
        receiverCurrency: 'VND',
        receiveAmount: 20387.0,
        receiverCountry: 'VN',
        deliveryMethod: 'BANK_TRANSFER',
        receiverName: 'DAO ANH TIEN',
        receiverBankCode: 'VCB',
        receiverBankName: 'Vietcombank',
        receiverAccountNumber: '',
        paymentBank: {
          bankCode: 'SENTBE_WALLET',
          name: 'Ví Sentbe',
          imageUrl: '',
          accountNumber: 'Ví điện tử Sentbe',
          accountName: 'Ví Sentbe',
        },
        beneficiaryBank: {
          bankCode: 'VCB',
          name: 'Vietcombank',
          imageUrl: '',
          accountNumber: '',
          accountName: 'DAO ANH TIEN',
        },
        transferTime: '2026.11.10',
        transferTimeDetail: '23:38:38',
      };

      const result = await service.createTransaction(mockUserId, payload);
      expect(result).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PROCESSING',
          category: TransactionCategory.INTERNATIONAL,
          transferAmount: 1111.0,
          receiveAmount: 20387.0,
          receiverCountry: 'VN',
        }),
      );
    });

    it('should correctly format international transaction matching mobile UI receipt with AE code and recipient details', async () => {
      const payload: CreateTransactionDto = {
        category: TransactionCategory.INTERNATIONAL,
        title: 'Cuong Van Vu',
        transferNumber: 'AE24518506135',
        transferTime: '2026/09/11',
        currency: 'KRW',
        transferAmount: 970000,
        fee: 5000,
        exchangeRate: 18.810743,
        receiverCurrency: 'VND',
        receiveAmount: 18246421,
        status: 'PROCESSING',
        transferMethod: 'Rút tiền tự động',
        deliveryMethod: 'Ngân hàng/Chuyển nhanh',
        receiverPhone: '+84 335053104',
        paymentBank: {
          bankCode: 'NH',
          name: '농협 (NH Bank)',
          accountNumber: '3022130908031',
        },
        beneficiaryBank: {
          name: 'Ngân hàng MBBank',
          accountNumber: '9906052006',
          accountName: 'Cuong Van Vu',
          phoneNumber: '+84 335053104',
        },
      };

      const result = await service.createTransaction(mockUserId, payload);
      expect(result).toBeDefined();
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          transferNumber: 'AE24518506135',
          category: TransactionCategory.INTERNATIONAL,
          status: 'PROCESSING',
          statusDisplay: 'Đang thực hiện',
          transferAmount: 970000,
          fee: 5000,
          finalAmount: 975000,
          receiveAmount: 18246421,
          transferMethod: 'Rút tiền tự động',
          transferStatusDetail: 'Đã chuyển tiền (2026/09/11)',
          deliveryMethod: 'Ngân hàng/Chuyển nhanh',
          receiverPhone: '+84 335053104',
          paymentBank: expect.objectContaining({
            name: '농협 (NH Bank)',
            accountNumber: '3022130908031',
          }),
          beneficiaryBank: expect.objectContaining({
            name: 'Ngân hàng MBBank',
            accountNumber: '9906052006',
            accountName: 'Cuong Van Vu',
            phoneNumber: '+84 335053104',
          }),
        }),
      );
    });

    it('should throw BadRequestException if balance is insufficient for transfer + fee', async () => {
      const dto: CreateTransactionDto = {
        title: 'NGUYEN VAN A',
        transferAmount: 1000000,
        fee: 5000,
        category: TransactionCategory.INTERNATIONAL,
      };

      await expect(service.createTransaction(mockUserId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTransactions with category filter', () => {
    it('should pass category filter to repository query', async () => {
      const query: QueryTransactionsDto = {
        category: TransactionCategoryFilter.INTERNATIONAL,
      };

      await service.getTransactions(mockUserId, query);

      expect(mockRepo.findWithPagination).toHaveBeenCalledWith(
        expect.objectContaining({
          category: TransactionCategoryFilter.INTERNATIONAL,
        }),
        expect.any(Object),
        0,
        20,
      );
    });
  });

  describe('updateTransaction', () => {
    it('should recalculate receiveAmount when exchangeRate is updated', async () => {
      const existingTx = {
        id: 'tx-1',
        userId: { toString: () => mockUserId },
        category: TransactionCategory.INTERNATIONAL,
        transferAmount: 100000,
        fee: 0,
        exchangeRate: 18.0,
        receiveAmount: 1800000,
        isDeposit: false,
      };
      mockRepo.findById!.mockResolvedValue(existingTx);

      await service.updateTransaction(mockUserId, 'tx-1', {
        exchangeRate: 18.5,
      });

      expect(mockRepo.update).toHaveBeenCalledWith(
        'tx-1',
        expect.objectContaining({
          exchangeRate: 18.5,
          receiveAmount: 1850000, // 100,000 * 18.5
        }),
      );
    });

    it('should allow updating all fields in a transaction including mobile receipt details', async () => {
      const existingTx = {
        id: 'tx-2',
        userId: { toString: () => mockUserId },
        category: TransactionCategory.INTERNATIONAL,
        transferAmount: 500000,
        fee: 5000,
        transferNumber: '1128OTT123456789',
        transferTime: '2026.09.10',
        paymentBank: {
          name: 'IBK',
          accountNumber: '123456',
        },
        beneficiaryBank: {
          name: 'Vietcombank',
          accountNumber: '987654',
          accountName: 'OLD NAME',
        },
      };
      mockRepo.findById!.mockResolvedValue(existingTx);

      const updatePayload = {
        title: 'Cuong Van Vu',
        transferNumber: 'AE24518506135',
        transferTime: '2026/09/11',
        transferTimeDetail: '12:43:00',
        transferAmount: 970000,
        fee: 5000,
        finalAmount: 975000,
        exchangeRate: 18.810743,
        receiverCurrency: 'VND',
        receiveAmount: 18246421,
        status: 'PROCESSING',
        statusDisplay: 'Đang thực hiện',
        transferMethod: 'Rút tiền tự động',
        transferStatusDetail: 'Đã chuyển tiền (2026/09/11)',
        deliveryMethod: 'Ngân hàng/Chuyển nhanh',
        receiverPhone: '+84 335053104',
        paymentBank: {
          bankCode: 'NH',
          name: '농협 (NH Bank)',
          accountNumber: '3022130908031',
        },
        beneficiaryBank: {
          bankCode: 'MB',
          name: 'Ngân hàng MBBank',
          accountNumber: '9906052006',
          accountName: 'Cuong Van Vu',
          phoneNumber: '+84 335053104',
        },
      };

      await service.updateTransaction(mockUserId, 'tx-2', updatePayload);

      expect(mockRepo.update).toHaveBeenCalledWith(
        'tx-2',
        expect.objectContaining({
          transferNumber: 'AE24518506135',
          status: 'PROCESSING',
          statusDisplay: 'Đang thực hiện',
          transferAmount: 970000,
          fee: 5000,
          finalAmount: 975000,
          receiveAmount: 18246421,
          transferMethod: 'Rút tiền tự động',
          transferStatusDetail: 'Đã chuyển tiền (2026/09/11)',
          deliveryMethod: 'Ngân hàng/Chuyển nhanh',
          receiverPhone: '+84 335053104',
          paymentBank: expect.objectContaining({
            name: '농협 (NH Bank)',
            accountNumber: '3022130908031',
          }),
          beneficiaryBank: expect.objectContaining({
            name: 'Ngân hàng MBBank',
            accountNumber: '9906052006',
            accountName: 'Cuong Van Vu',
            phoneNumber: '+84 335053104',
          }),
        }),
      );
    });
  });
});

