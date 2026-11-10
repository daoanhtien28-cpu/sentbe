import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { BanksService } from '../banks/banks.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  QueryTransactionsDto,
  TransactionCategoryFilter,
  TransactionSearchType,
  TransactionSortOrder,
  TransactionTypeFilter,
} from './dto/query-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  TransactionCategory,
  TransactionDocument,
  TransactionStatus,
} from './schemas/transaction.schema';
import { TransactionsRepository } from './transactions.repository';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepo: TransactionsRepository,
    private readonly walletsService: WalletsService,
    private readonly banksService: BanksService,
  ) { }

  /**
   * Lấy danh sách giao dịch có bộ lọc và phân trang.
   */
  async getTransactions(userId: string, query: QueryTransactionsDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    // 1. Phân loại giao dịch (Tất cả / Trong nước DOMESTIC / Quốc tế INTERNATIONAL)
    if (query.category && query.category !== TransactionCategoryFilter.ALL) {
      filter.category = query.category;
    }

    // 2. Lọc theo loại giao dịch (전체 / 입금 / 출금)
    if (query.type === TransactionTypeFilter.DEPOSIT) {
      filter.isDeposit = true;
    } else if (query.type === TransactionTypeFilter.WITHDRAWAL) {
      filter.isDeposit = false;
    }

    // 3. Lọc theo thời gian thực tế của giao dịch (transferTime: YYYY.MM.DD)
    let startFilterTime: string | null = null;
    let endFilterTime: string | null = null;

    if (query.startDate || query.endDate) {
      // Ưu tiên ngày do người dùng chỉ định trực tiếp (직접입력)
      if (query.startDate) {
        startFilterTime = this.normalizeDateStr(query.startDate);
      }
      if (query.endDate) {
        endFilterTime = this.normalizeDateStr(query.endDate);
      }
    } else if (
      query.period &&
      query.period !== 'ALL' &&
      query.period !== 'CUSTOM'
    ) {
      // Lọc theo mốc thời gian nhanh (1M, 3M, 6M, 1Y)
      startFilterTime = this.getPeriodStartDate(query.period);
    }

    if (startFilterTime || endFilterTime) {
      const timeFilter: Record<string, string> = {};
      if (startFilterTime) {
        timeFilter.$gte = startFilterTime;
      }
      if (endFilterTime) {
        timeFilter.$lte = endFilterTime;
      }
      filter.transferTime = timeFilter;
    }

    // 3. Tìm kiếm từ khóa (예금주명 / 메모)
    if (query.keyword && query.keyword.trim()) {
      const keyword = query.keyword.trim();
      const regex = new RegExp(keyword, 'i');

      if (query.searchType === TransactionSearchType.HOLDER) {
        filter.$or = [
          { title: regex },
          { 'beneficiaryBank.accountName': regex },
          { 'paymentBank.accountName': regex },
        ];
      } else if (query.searchType === TransactionSearchType.MEMO) {
        filter.content = regex;
      } else {
        filter.$or = [
          { title: regex },
          { content: regex },
          { 'beneficiaryBank.accountName': regex },
        ];
      }
    }

    // 4. Lọc theo khoảng số tiền giao dịch (minAmount, maxAmount)
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      const amountFilter: Record<string, number> = {};
      if (query.minAmount !== undefined && !isNaN(Number(query.minAmount))) {
        amountFilter.$gte = Number(query.minAmount);
      }
      if (query.maxAmount !== undefined && !isNaN(Number(query.maxAmount))) {
        amountFilter.$lte = Number(query.maxAmount);
      }
      if (Object.keys(amountFilter).length > 0) {
        filter.transferAmount = amountFilter;
      }
    }

    // 5. Thứ tự sắp xếp (최신순 / 과거순) - theo thời gian giao dịch thực tế
    const sortDirection: 1 | -1 =
      query.sortOrder === TransactionSortOrder.OLDEST ? 1 : -1;
    const sort: Record<string, 1 | -1> = {
      transferTime: sortDirection,
      transferTimeDetail: sortDirection,
      createdAt: sortDirection,
    };

    const [items, total] = await Promise.all([
      this.transactionsRepo.findWithPagination(filter, sort, skip, limit),
      this.transactionsRepo.count(filter),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Lấy chi tiết một giao dịch.
   */
  async getTransactionById(userId: string, id: string): Promise<TransactionDocument> {
    const tx = await this.transactionsRepo.findById(id);
    if (!tx) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    if (tx.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập giao dịch này');
    }
    return tx;
  }

  /**
   * Tạo giao dịch mới (tự động cập nhật số dư ví).
   */
  async createTransaction(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionDocument> {
    const wallet = await this.walletsService.getMyWallet(userId);
    const isDeposit = dto.isDeposit ?? false;
    const fee = dto.fee ?? 0;
    const totalRequired = isDeposit ? 0 : dto.transferAmount + fee;

    if (!isDeposit && wallet.availableBalance < totalRequired) {
      throw new BadRequestException('Số dư khả dụng trong ví không đủ để thực hiện giao dịch');
    }

    // Tính toán số dư mới
    const delta = isDeposit ? dto.transferAmount : -totalRequired;
    const newAvailableBalance = Math.max(0, wallet.availableBalance + delta);
    const newTotalBalance = Math.max(0, wallet.totalBalance + delta);

    // Cập nhật số dư ví
    await this.walletsService.updateMyWallet(userId, {
      availableBalance: newAvailableBalance,
      availableBalanceEdit: newAvailableBalance,
      totalBalance: newTotalBalance,
    });

    // Xác định thông tin ngân hàng nhận
    const category = dto.category || TransactionCategory.DOMESTIC;
    const isInternational = category === TransactionCategory.INTERNATIONAL;

    let receiverBankName = dto.receiverBankName || (isInternational ? 'Ngân hàng MBBank' : 'K bank');
    let receiverImageUrl = isInternational ? 'assets/images/bank/bank_mbbank.png' : 'assets/images/bank/bank_kbank.png';
    let receiverBankCode = dto.receiverBankCode || (isInternational ? 'MB' : 'KBANK');

    if (dto.receiverBankCode) {
      try {
        const bank = await this.banksService.getBankByCode(dto.receiverBankCode);
        receiverBankName = bank.name;
        receiverImageUrl = bank.imageUrl;
        receiverBankCode = bank.code;
      } catch (_) { }
    }

    // Tạo mã giao dịch & thời gian theo giờ chuẩn KST (UTC+9)
    const now = new Date();
    const kstTime = now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60 * 1000;
    const kstDate = new Date(kstTime);
    const defaultDateStr = `${kstDate.getFullYear()}.${String(kstDate.getMonth() + 1).padStart(2, '0')}.${String(kstDate.getDate()).padStart(2, '0')}`;
    const defaultTimeStr = `${String(kstDate.getHours()).padStart(2, '0')}:${String(kstDate.getMinutes()).padStart(2, '0')}:${String(kstDate.getSeconds()).padStart(2, '0')}`;

    const dateStr = dto.transferTime
      ? (this.normalizeDateStr(dto.transferTime) || defaultDateStr)
      : defaultDateStr;
    const timeStr = dto.transferTimeDetail || defaultTimeStr;

    // Sinh mã giao dịch chuẩn giao diện (Quốc tế dạng AE + 11 số ngẫu nhiên, VD: AE24518506135)
    const randomSuffix = Math.floor(10000000000 + Math.random() * 90000000000).toString();
    const defaultTxNumber = isInternational
      ? `AE${randomSuffix}`
      : `1128OTT${Date.now().toString().slice(-9)}`;
    const transferNumber = dto.transferNumber || defaultTxNumber;

    let exchangeRate = dto.exchangeRate;
    let receiveAmount = dto.receiveAmount;
    let receiverCurrency = dto.receiverCurrency;

    if (isInternational) {
      receiverCurrency = receiverCurrency || 'VND';
      if (exchangeRate && !receiveAmount) {
        // Tự động tính tiền đổi ra cho người nhận: tiền nhập * tỷ giá
        receiveAmount = Math.round(dto.transferAmount * exchangeRate);
      } else if (!exchangeRate && receiveAmount && dto.transferAmount > 0) {
        // Tự động suy ra tỷ giá quy đổi
        exchangeRate = Number((receiveAmount / dto.transferAmount).toFixed(6));
      }
    } else {
      receiverCurrency = receiverCurrency || dto.currency || wallet.currency || 'KRW';
      receiveAmount = receiveAmount ?? dto.transferAmount;
      exchangeRate = exchangeRate ?? 1;
    }

    const statusStr = dto.status ? dto.status.toUpperCase() : TransactionStatus.SUCCESS;

    // Map nhãn trạng thái hiển thị tiếng Việt
    const defaultStatusDisplayMap: Record<string, string> = {
      [TransactionStatus.PROCESSING]: 'Đang thực hiện',
      [TransactionStatus.SUCCESS]: 'Hoàn thành',
      [TransactionStatus.COMPLETED]: 'Hoàn thành',
      [TransactionStatus.PENDING]: 'Đang chờ xử lý',
      [TransactionStatus.FAILED]: 'Thất bại',
      [TransactionStatus.CANCELLED]: 'Đã hủy',
    };
    const statusDisplay =
      dto.statusDisplay || defaultStatusDisplayMap[statusStr] || 'Đang thực hiện';

    const slashDate = dateStr.replace(/\./g, '/');
    const transferStatusDetail =
      dto.transferStatusDetail || `Đã chuyển tiền (${slashDate})`;

    const transferMethod = dto.transferMethod || 'Rút tiền tự động';
    const deliveryMethod =
      dto.deliveryMethod || (isInternational ? 'Ngân hàng/Chuyển nhanh' : 'BANK_TRANSFER');

    const receiverPhone =
      dto.receiverPhone || dto.beneficiaryBank?.phoneNumber || (isInternational ? '+84 335053104' : '');

    const finalAmount = dto.finalAmount ?? (dto.transferAmount + fee);

    const defaultPaymentBank = {
      bankCode: wallet.linkedBankCode || 'NH',
      name: wallet.linkedBankName || '농협 (NH Bank)',
      imageUrl: wallet.imageUrl || 'assets/images/bank/nonghyup_bank.png',
      accountNumber: wallet.accountNumber || '3022130908031',
      accountName: wallet.ownerName || 'KIM SENTBE',
    };

    const paymentBank = dto.paymentBank
      ? {
        ...defaultPaymentBank,
        ...dto.paymentBank,
      }
      : defaultPaymentBank;

    const defaultBeneficiaryBank = {
      bankCode: receiverBankCode,
      name: receiverBankName,
      imageUrl: receiverImageUrl,
      accountNumber:
        dto.receiverAccountNumber || (isInternational ? '9906052006' : '9876 543 210'),
      accountName: dto.receiverName || dto.title,
      phoneNumber: receiverPhone,
    };

    const beneficiaryBank = dto.beneficiaryBank
      ? {
        ...defaultBeneficiaryBank,
        ...dto.beneficiaryBank,
        phoneNumber: dto.beneficiaryBank.phoneNumber || receiverPhone,
      }
      : defaultBeneficiaryBank;

    return this.transactionsRepo.save({
      userId: new Types.ObjectId(userId),
      walletId: (wallet as any)._id || new Types.ObjectId(wallet.id),
      transferNumber,
      category,
      transferChannel: dto.transferChannel || (isInternational ? 'Sentbe' : 'IBK'),
      transferTypeTag: dto.transferTypeTag || (isInternational ? (isDeposit ? '해외입금' : '해외송금') : (isDeposit ? '입금' : '체크')),
      title: dto.title,
      content: dto.content || '',
      isDeposit,
      currency: dto.currency || wallet.currency || 'KRW',
      transferAmount: dto.transferAmount,
      fee,
      finalAmount,
      transferMethod,
      transferStatusDetail,
      receiverPhone,
      statusDisplay,
      exchangeRate: exchangeRate ?? undefined,
      receiverCurrency,
      receiveAmount: receiveAmount ?? undefined,
      receiverCountry: dto.receiverCountry || (isInternational ? 'VN' : 'KR'),
      deliveryMethod,
      balanceAfter: dto.balanceAfter ?? newAvailableBalance,
      totalWithdrawalAmount: dto.totalWithdrawalAmount ?? (dto.balanceAfter ?? newAvailableBalance),
      status: (statusStr as TransactionStatus) || TransactionStatus.SUCCESS,
      paymentBank,
      beneficiaryBank,
      transferTime: dateStr,
      transferTimeDetail: timeStr,
    });
  }

  /**
   * Cập nhật thông tin giao dịch (cho phép sửa tất cả thông tin và tự động bù trừ số dư ví).
   */
  async updateTransaction(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionDocument> {
    const tx = await this.getTransactionById(userId, id);
    const wallet = await this.walletsService.getMyWallet(userId);

    // 1. Kiểm tra và tính toán bù trừ số dư nếu thay đổi số tiền, loại giao dịch hoặc phí
    const willChangeAmount =
      dto.transferAmount !== undefined && dto.transferAmount !== tx.transferAmount;
    const willChangeDeposit =
      dto.isDeposit !== undefined && dto.isDeposit !== tx.isDeposit;
    const willChangeFee = dto.fee !== undefined && dto.fee !== tx.fee;

    if (willChangeAmount || willChangeDeposit || willChangeFee) {
      const oldAmount = tx.transferAmount;
      const oldFee = tx.fee || 0;
      const oldContribution = tx.isDeposit ? oldAmount : -(oldAmount + oldFee);

      const newAmount = dto.transferAmount ?? tx.transferAmount;
      const newIsDeposit = dto.isDeposit ?? tx.isDeposit;
      const newFee = dto.fee !== undefined ? dto.fee : oldFee;
      const newContribution = newIsDeposit ? newAmount : -(newAmount + newFee);

      const delta = newContribution - oldContribution;
      const projectedBalance = wallet.availableBalance + delta;

      // Nếu số dư sau điều chỉnh < 0 thì KHÔNG cho sửa, ném lỗi 400
      if (projectedBalance < 0) {
        throw new BadRequestException(
          `Số dư ví không đủ để điều chỉnh giao dịch này. Số dư hiện tại: ${wallet.availableBalance} KRW, mức điều chỉnh cần thêm: ${Math.abs(delta)} KRW.`,
        );
      }

      await this.walletsService.updateMyWallet(userId, {
        availableBalance: projectedBalance,
        availableBalanceEdit: projectedBalance,
        totalBalance: Math.max(0, wallet.totalBalance + delta),
      });

      dto.balanceAfter = dto.balanceAfter !== undefined ? dto.balanceAfter : projectedBalance;
      dto.totalWithdrawalAmount = dto.totalWithdrawalAmount !== undefined ? dto.totalWithdrawalAmount : projectedBalance;
    }

    // Hợp nhất dữ liệu paymentBank nếu có cập nhật
    if (dto.paymentBank) {
      dto.paymentBank = {
        ...(tx.paymentBank || {}),
        ...dto.paymentBank,
      };
    }

    // 2. Nếu đổi mã ngân hàng nhận receiverBankCode hoặc các trường người nhận lẻ tẻ, tự động cập nhật beneficiaryBank
    if (
      dto.receiverBankCode ||
      dto.receiverName ||
      dto.receiverAccountNumber ||
      dto.receiverBankName ||
      dto.receiverPhone ||
      dto.beneficiaryBank
    ) {
      dto.beneficiaryBank = {
        ...(tx.beneficiaryBank || {}),
        ...(dto.beneficiaryBank || {}),
      };

      if (dto.receiverBankCode) {
        try {
          const bank = await this.banksService.getBankByCode(dto.receiverBankCode);
          dto.beneficiaryBank.bankCode = bank.code;
          dto.beneficiaryBank.name = bank.name;
          dto.beneficiaryBank.imageUrl = bank.imageUrl;
        } catch (_) { }
      }

      if (dto.receiverBankName) dto.beneficiaryBank.name = dto.receiverBankName;
      if (dto.receiverAccountNumber) dto.beneficiaryBank.accountNumber = dto.receiverAccountNumber;
      if (dto.receiverName) dto.beneficiaryBank.accountName = dto.receiverName;
      if (dto.receiverPhone) dto.beneficiaryBank.phoneNumber = dto.receiverPhone;
    }

    // Chuẩn hóa định dạng ngày nếu người dùng chỉnh sửa transferTime
    if (dto.transferTime) {
      dto.transferTime = this.normalizeDateStr(dto.transferTime) || dto.transferTime;
      if (!dto.transferStatusDetail) {
        dto.transferStatusDetail = `Đã chuyển tiền (${dto.transferTime.replace(/\./g, '/')})`;
      }
    }

    // Tự động tính lại số tiền cuối cùng (finalAmount = transferAmount + fee) nếu có thay đổi
    if (dto.transferAmount !== undefined || dto.fee !== undefined) {
      if (dto.finalAmount === undefined) {
        const effectiveAmount = dto.transferAmount ?? tx.transferAmount;
        const effectiveFee = dto.fee !== undefined ? dto.fee : (tx.fee || 0);
        dto.finalAmount = effectiveAmount + effectiveFee;
      }
    }

    // Tự động map statusDisplay nếu cập nhật status
    if (dto.status && !dto.statusDisplay) {
      const defaultStatusDisplayMap: Record<string, string> = {
        [TransactionStatus.PROCESSING]: 'Đang thực hiện',
        [TransactionStatus.SUCCESS]: 'Hoàn thành',
        [TransactionStatus.COMPLETED]: 'Hoàn thành',
        [TransactionStatus.PENDING]: 'Đang chờ xử lý',
        [TransactionStatus.FAILED]: 'Thất bại',
        [TransactionStatus.CANCELLED]: 'Đã hủy',
      };
      dto.statusDisplay = defaultStatusDisplayMap[dto.status.toUpperCase()] || tx.statusDisplay;
    }

    // Đồng bộ số điện thoại người nhận
    if (dto.receiverPhone || dto.beneficiaryBank?.phoneNumber) {
      const phone = dto.receiverPhone || dto.beneficiaryBank?.phoneNumber;
      dto.receiverPhone = phone;
      if (dto.beneficiaryBank) {
        dto.beneficiaryBank.phoneNumber = phone;
      }
    }

    // Tự động tính toán lại tỷ giá hoặc tiền nhận nếu có thay đổi liên quan đến giao dịch quốc tế
    const effectiveCategory = dto.category ?? tx.category ?? TransactionCategory.DOMESTIC;
    if (effectiveCategory === TransactionCategory.INTERNATIONAL) {
      const effectiveAmount = dto.transferAmount ?? tx.transferAmount;
      if (dto.exchangeRate !== undefined && dto.receiveAmount === undefined) {
        dto.receiveAmount = Math.round(effectiveAmount * dto.exchangeRate);
      } else if (dto.receiveAmount !== undefined && dto.exchangeRate === undefined && effectiveAmount > 0) {
        dto.exchangeRate = Number((dto.receiveAmount / effectiveAmount).toFixed(6));
      } else if (
        dto.transferAmount !== undefined &&
        dto.exchangeRate === undefined &&
        dto.receiveAmount === undefined &&
        tx.exchangeRate
      ) {
        dto.receiveAmount = Math.round(dto.transferAmount * tx.exchangeRate);
      }
    }

    // 3. Cập nhật tất cả thông tin vào database
    const updated = await this.transactionsRepo.update(id, dto);
    if (!updated) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    return updated;
  }

  /**
   * Xóa một giao dịch (không hoàn tác số dư ví).
   */
  async deleteTransaction(userId: string, id: string): Promise<{ message: string }> {
    await this.getTransactionById(userId, id);
    await this.transactionsRepo.delete(id);
    return { message: 'Xóa giao dịch thành công' };
  }

  /**
   * Chuẩn hóa chuỗi ngày thành định dạng YYYY.MM.DD đồng nhất.
   */
  private normalizeDateStr(val?: string): string | null {
    if (!val) return null;
    const cleaned = val.trim().replace(/[-/]/g, '.');
    const parts = cleaned.split('.');
    if (parts.length === 3) {
      const y = parts[0].padStart(4, '0');
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}.${m}.${d}`;
    }
    return cleaned;
  }

  /**
   * Tính ngày bắt đầu theo mốc thời gian (KST - Asia/Seoul UTC+9).
   */
  private getPeriodStartDate(period: string): string | null {
    const now = new Date();
    const kstTime = now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60 * 1000;
    const kstDate = new Date(kstTime);

    if (period === '1M') {
      kstDate.setMonth(kstDate.getMonth() - 1);
    } else if (period === '3M') {
      kstDate.setMonth(kstDate.getMonth() - 3);
    } else if (period === '6M') {
      kstDate.setMonth(kstDate.getMonth() - 6);
    } else if (period === '1Y') {
      kstDate.setFullYear(kstDate.getFullYear() - 1);
    } else {
      return null;
    }

    const y = kstDate.getFullYear();
    const m = String(kstDate.getMonth() + 1).padStart(2, '0');
    const d = String(kstDate.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  }

}
