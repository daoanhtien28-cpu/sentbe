import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TransactionCategory } from '../schemas/transaction.schema';

export class CreateTransactionDto {
  @ApiProperty({ example: '자연애마트', description: 'Tên đơn vị / người nhận hiển thị to trên thẻ' })
  @IsString()
  title: string;

  @ApiProperty({ example: 9470, description: 'Số tiền giao dịch (tiền gửi nhập vào, VD KRW)' })
  @IsNumber()
  @Min(1)
  transferAmount: number;

  @ApiPropertyOptional({
    enum: TransactionCategory,
    default: TransactionCategory.DOMESTIC,
    description: 'Phân loại giao dịch: DOMESTIC (Trong nước) hoặc INTERNATIONAL (Quốc tế)',
  })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiPropertyOptional({ example: false, default: false, description: 'false: 출금 (Tiền ra -), true: 입금 (Tiền vào +)' })
  @IsOptional()
  @IsBoolean()
  isDeposit?: boolean;

  @ApiPropertyOptional({ example: '체크', default: '체크', description: 'Tag loại giao dịch (체크, 이체, ATM)' })
  @IsOptional()
  @IsString()
  transferTypeTag?: string;

  @ApiPropertyOptional({ example: 'KB', description: 'Mã ngân hàng người nhận (KB, SH, SHINHAN, HANA...)' })
  @IsOptional()
  @IsString()
  receiverBankCode?: string;

  @ApiPropertyOptional({ example: '국민은행', description: 'Tên ngân hàng người nhận' })
  @IsOptional()
  @IsString()
  receiverBankName?: string;

  @ApiPropertyOptional({ example: '9876 543 210', description: 'Số tài khoản người nhận' })
  @IsOptional()
  @IsString()
  receiverAccountNumber?: string;

  @ApiPropertyOptional({ example: '자연애마트', description: 'Tên người nhận (nếu khác title)' })
  @IsOptional()
  @IsString()
  receiverName?: string;

  @ApiPropertyOptional({ example: 'Mua đồ ăn tối', description: 'Ghi chú / Lời nhắn (메모)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Phí giao dịch' })
  @IsOptional()
  @IsNumber()
  fee?: number;

  @ApiPropertyOptional({ example: 18.35, description: 'Tỷ giá quy đổi tiền tệ (VD: 1 KRW = 18.35 VND)' })
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional({ example: 'VND', description: 'Đơn vị tiền tệ người nhận thực nhận (VD: VND, USD, PHP)' })
  @IsOptional()
  @IsString()
  receiverCurrency?: string;

  @ApiPropertyOptional({ example: 18350000, description: 'Số tiền quy đổi người nhận thực nhận. Nếu để trống, server tự động tính: transferAmount * exchangeRate' })
  @IsOptional()
  @IsNumber()
  receiveAmount?: number;

  @ApiPropertyOptional({ example: '+84 335053104', description: 'Số điện thoại người nhận' })
  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @ApiPropertyOptional({ example: 975000, description: 'Số tiền cuối cùng thanh toán (transferAmount + fee). Tự động tính nếu để trống' })
  @IsOptional()
  @IsNumber()
  finalAmount?: number;

  @ApiPropertyOptional({ example: 'Rút tiền tự động', default: 'Rút tiền tự động', description: 'Phương thức chuyển (VD: Rút tiền tự động, Chuyển khoản thủ công)' })
  @IsOptional()
  @IsString()
  transferMethod?: string;

  @ApiPropertyOptional({ example: 'Đã chuyển tiền (2026/09/11)', description: 'Trạng thái chuyển tiền chi tiết kèm ngày' })
  @IsOptional()
  @IsString()
  transferStatusDetail?: string;

  @ApiPropertyOptional({ example: 'Đang thực hiện', description: 'Tên trạng thái hiển thị tiếng Việt (VD: Đang thực hiện, Hoàn thành, Thất bại)' })
  @IsOptional()
  @IsString()
  statusDisplay?: string;

  @ApiPropertyOptional({ example: 'VN', description: 'Mã quốc gia người nhận (VD: VN, PH, US)' })
  @IsOptional()
  @IsString()
  receiverCountry?: string;

  @ApiPropertyOptional({ example: 'Ngân hàng/Chuyển nhanh', description: 'Phương thức nhận tiền (VD: Ngân hàng/Chuyển nhanh, BANK_TRANSFER)' })
  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @ApiPropertyOptional({ example: '2026.09.16', description: 'Ngày giao dịch (YYYY.MM.DD hoặc YYYY/MM/DD)' })
  @IsOptional()
  @IsString()
  transferTime?: string;

  @ApiPropertyOptional({ example: 2686, description: 'Số dư sau giao dịch (잔액)' })
  @IsOptional()
  @IsNumber()
  balanceAfter?: number;

  @ApiPropertyOptional({ example: 2686, description: 'Số dư sau giao dịch (tương thích UI cũ)' })
  @IsOptional()
  @IsNumber()
  totalWithdrawalAmount?: number;

  @ApiPropertyOptional({ example: '18:08:45', description: 'Giờ giao dịch (HH:mm:ss)' })
  @IsOptional()
  @IsString()
  transferTimeDetail?: string;

  @ApiPropertyOptional({ example: 'AE24518506135', description: 'Mã số giao dịch' })
  @IsOptional()
  @IsString()
  transferNumber?: string;

  @ApiPropertyOptional({ example: 'Sentbe', description: 'Kênh giao dịch' })
  @IsOptional()
  @IsString()
  transferChannel?: string;

  @ApiPropertyOptional({ example: 'PROCESSING', description: 'Mã trạng thái giao dịch (PROCESSING, SUCCESS, PENDING, FAILED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'KRW', description: 'Đơn vị tiền tệ người gửi' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Thông tin tài khoản rút tiền / ngân hàng người gửi',
    example: {
      bankCode: 'NH',
      name: '농협 (NH Bank)',
      imageUrl: 'assets/images/bank/nonghyup_bank.png',
      accountNumber: '3022130908031',
      accountName: 'KIM SENTBE',
    },
  })
  @IsOptional()
  paymentBank?: {
    bankCode?: string;
    name: string;
    imageUrl?: string;
    accountNumber: string;
    accountName?: string;
  };

  @ApiPropertyOptional({
    description: 'Thông tin người nhận / ngân hàng thụ hưởng',
    example: {
      bankCode: 'MB',
      name: 'Ngân hàng MBBank',
      imageUrl: 'assets/images/bank/bank_mb.png',
      accountNumber: '9906052006',
      accountName: 'Cuong Van Vu',
      phoneNumber: '+84 335053104',
    },
  })
  @IsOptional()
  beneficiaryBank?: {
    bankCode?: string;
    name: string;
    imageUrl?: string;
    accountNumber: string;
    accountName: string;
    phoneNumber?: string;
  };
}
