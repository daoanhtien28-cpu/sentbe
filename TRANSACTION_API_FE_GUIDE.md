# 💳 Tài Liệu Tích Hợp API Lịch Sử Giao Dịch (Transactions) Cho Front-End

- **Base URL:** `http://localhost:3000/api`
- **Swagger Documentation:** `http://localhost:3000/api/docs`
- **Module:** `Transactions` (Hỗ trợ cả **Giao dịch trong nước [DOMESTIC]** & **Giao dịch quốc tế [INTERNATIONAL]** có quy đổi ngoại tệ)

---

## 1. Bản Đồ Ánh Xạ UI Với Dữ Liệu Backend

### 1.1. Giao diện thực tế trên Mobile

#### A. Giao dịch trong nước (Domestic - Nội địa Hàn Quốc):
```text
┌─────────────────────────────────────────────────────────────┐
│ 18:08:45 | 체크                                       출금  │
│ 자연애마트                                          9,470 원 │
│                                                잔액 2,686원 │
└─────────────────────────────────────────────────────────────┘
```

#### B. Giao dịch quốc tế (International - Chuyển tiền quốc tế có quy đổi ngoại tệ):
```text
┌─────────────────────────────────────────────────────────────┐
│ 14:20:10 | 해외송금 (Sentbe)                           출금  │
│ NGUYEN VAN A (Vietcombank)                        200,000 원 │
│ ➡️ Đổi ra: 3,670,000 VND (Tỷ giá: 18.35)      잔액 795,000원 │
└─────────────────────────────────────────────────────────────┘
```

#### C. Chi tiết biên lai giao dịch chuyển tiền quốc tế (Sentbe Remittance Detail):
```text
┌─────────────────────────────────────────────────────────────┐
│ ←                    Đang thực hiện                         │
│               AE24518506135 · 2026/09/11                    │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ [1 KRW ⇄ 18,81 VND]                                 │   │
│   │                                                     │   │
│   │ 🇰🇷 KRW                                 Số tiền gửi  │   │
│   │                                            970.000  │   │
│   │ 🇻🇳 VND                                 Số tiền nhận  │   │
│   │                                         18.246.421  │   │
│   │                                                     │   │
│   │ Phí                                          5.000  │   │
│   │                                                     │   │
│   │ Số tiền cuối cùng                                    │   │
│   │ 975.000 KRW                                         │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Phương thức chuyển                                          │
│ Rút tiền tự động                                            │
│                                                             │
│ Trạng thái chuyển tiền                                      │
│ Đã chuyển tiền (2026/09/11)                                 │
│                                                             │
│ Thông tin tài khoản Rút tiền tự động                        │
│ 농협 (NH Bank) 3022130908031                                │
│                                                             │
│ Phương thức nhận                                            │
│ Ngân hàng/Chuyển nhanh                                      │
│                                                             │
│ Thông tin người nhận                                        │
│ Phương thức nhận tiền: Ngân hàng MBBank                     │
│ Số tài khoản: 9906052006                                    │
│ Tên: Cuong Van Vu                                           │
│ Số điện thoại: +84 335053104                                │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.2. Bảng ánh xạ trường dữ liệu UI & Backend:

| Vị trí trên UI | Dữ liệu trên UI | Tên trường Backend | Kiểu | Mô tả & Quy tắc hiển thị |
| :--- | :--- | :--- | :---: | :--- |
| **Tiêu đề trạng thái** | `Đang thực hiện` | `statusDisplay` | `string` | Tên hiển thị trạng thái tiếng Việt (`Đang thực hiện`, `Hoàn thành`, `Thất bại`...) |
| **Mã & Ngày tham chiếu** | `AE24518506135` | `transferNumber` | `string` | Mã giao dịch quốc tế dạng `AE...` |
| **Ngày giao dịch** | `2026/09/11` | `transferTime` | `string` | Ngày thực hiện (`YYYY/MM/DD` hoặc `YYYY.MM.DD`) |
| **Phân loại** | Trong nước / Quốc tế | `category` | `enum` | `'DOMESTIC'` (Trong nước), `'INTERNATIONAL'` (Quốc tế) |
| **Tỷ giá quy đổi** | `1 KRW ⇄ 18,81 VND` | `exchangeRate` | `number` | Tỷ giá hối đoái quy đổi (VD: `18.810743` hoặc `18.81`) |
| **Số tiền gửi** | `970.000` | `transferAmount` | `number` | Số tiền người gửi thanh toán trước phí (KRW) |
| **Tiền tệ gửi** | `KRW` | `currency` | `string` | Đơn vị tiền tệ người gửi (mặc định: `KRW`) |
| **Số tiền nhận** | `18.246.421` | `receiveAmount` | `number` | Số tiền thực nhận sau quy đổi (VND) |
| **Tiền tệ nhận** | `VND` | `receiverCurrency` | `string` | Đơn vị tiền tệ người nhận thực tế nhận (`VND`, `USD`, `PHP`...) |
| **Phí giao dịch** | `5.000` | `fee` | `number` | Phí chuyển tiền (KRW) |
| **Số tiền cuối cùng** | `975.000 KRW` | `finalAmount` | `number` | **Tổng tiền thanh toán** = `transferAmount + fee` (Tô đậm xanh) |
| **Phương thức chuyển** | `Rút tiền tự động` | `transferMethod` | `string` | Phương thức trích tiền (`Rút tiền tự động`, `Chuyển khoản thủ công`...) |
| **Trạng thái chuyển tiền** | `Đã chuyển tiền (2026/09/11)` | `transferStatusDetail` | `string` | Chi tiết trạng thái chuyển tiền kèm ngày |
| **Tài khoản rút tiền** | `농협 (NH Bank) 3022130908031` | `paymentBank` | `object` | Ngân hàng và số tài khoản thanh toán (`paymentBank.name`, `paymentBank.accountNumber`) |
| **Phương thức nhận** | `Ngân hàng/Chuyển nhanh` | `deliveryMethod` | `string` | Phương thức giao tiền (`Ngân hàng/Chuyển nhanh`, `BANK_TRANSFER`...) |
| **Ngân hàng người nhận** | `Ngân hàng MBBank` | `beneficiaryBank.name` | `string` | Tên ngân hàng người nhận (`receiverBankName`) |
| **Số tài khoản người nhận** | `9906052006` | `beneficiaryBank.accountNumber` | `string` | Số tài khoản người nhận (`receiverAccountNumber`) |
| **Tên người nhận** | `Cuong Van Vu` | `beneficiaryBank.accountName` | `string` | Họ và tên người nhận (`title` hoặc `receiverName`) |
| **Số điện thoại người nhận** | `+84 335053104` | `receiverPhone` | `string` | Số điện thoại người thụ hưởng (có thể lưu cả trong `beneficiaryBank.phoneNumber`) |
| **Trạng thái giao dịch** | `PROCESSING` / `SUCCESS` | `status` | `string` | `'PROCESSING'`, `'SUCCESS'`, `'PENDING'`, `'COMPLETED'`, `'FAILED'`, `'CANCELLED'` |
| **Dòng phụ số dư ví** | `잔액 795,000원` | `balanceAfter` | `number` | Số dư khả dụng của ví còn lại sau giao dịch (`balanceAfter`) |

---

## 2. Cấu Trúc Dữ Liệu JSON Chuẩn (Transaction Schema)

### 2.1. Bản ghi giao dịch Quốc tế (International Transfer - Khớp với ảnh thực tế):
```json
{
  "id": "6aab1fadc960c32a73b0dff8",
  "userId": "6aab0b0f15966c417d393007",
  "walletId": "6aab10de6e482147645f43c3",
  "transferNumber": "AE24518506135",
  "category": "INTERNATIONAL",
  "transferChannel": "Sentbe",
  "transferTypeTag": "해외송금",
  "title": "Cuong Van Vu",
  "content": "Chuyển tiền quốc tế",
  "isDeposit": false,
  "currency": "KRW",
  "transferAmount": 970000,
  "fee": 5000,
  "finalAmount": 975000,
  "exchangeRate": 18.810743,
  "receiverCurrency": "VND",
  "receiveAmount": 18246421,
  "receiverCountry": "VN",
  "transferMethod": "Rút tiền tự động",
  "transferStatusDetail": "Đã chuyển tiền (2026/09/11)",
  "deliveryMethod": "Ngân hàng/Chuyển nhanh",
  "receiverPhone": "+84 335053104",
  "balanceAfter": 795000,
  "totalWithdrawalAmount": 795000,
  "status": "PROCESSING",
  "statusDisplay": "Đang thực hiện",
  "paymentBank": {
    "bankCode": "NH",
    "name": "농협 (NH Bank)",
    "imageUrl": "assets/images/bank/nonghyup_bank.png",
    "accountNumber": "3022130908031",
    "accountName": "KIM SENTBE"
  },
  "beneficiaryBank": {
    "bankCode": "MB",
    "name": "Ngân hàng MBBank",
    "imageUrl": "assets/images/bank/bank_mbbank.png",
    "accountNumber": "9906052006",
    "accountName": "Cuong Van Vu",
    "phoneNumber": "+84 335053104"
  },
  "transferTime": "2026.09.11",
  "transferTimeDetail": "12:43:00",
  "createdAt": "2026-09-11T03:43:00.000Z",
  "updatedAt": "2026-09-11T03:43:00.000Z"
}
```

### 2.2. Bản ghi giao dịch Trong nước (Domestic Transfer):
```json
{
  "id": "6aab1fadc960c32a73b0dff9",
  "userId": "6aab0b0f15966c417d393007",
  "walletId": "6aab10de6e482147645f43c3",
  "transferNumber": "1128OTT260916002",
  "category": "DOMESTIC",
  "transferChannel": "Sh 수협",
  "transferTypeTag": "체크",
  "title": "자연애마트",
  "content": "식료품 구매",
  "isDeposit": false,
  "currency": "KRW",
  "transferAmount": 9470,
  "fee": 0,
  "exchangeRate": 1,
  "receiverCurrency": "KRW",
  "receiveAmount": 9470,
  "receiverCountry": "KR",
  "deliveryMethod": "BANK_TRANSFER",
  "balanceAfter": 2686,
  "totalWithdrawalAmount": 2686,
  "status": "SUCCESS",
  "transferTime": "2026.09.16",
  "transferTimeDetail": "18:08:45"
}
```

---

## 3. Danh Sách Endpoints Chi Tiết

### 3.1. Lấy danh sách giao dịch với bộ lọc (`GET /api/transactions`)

* **Endpoint:** `/api/transactions`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <accessToken>`

#### Các tham số lọc (Query Parameters):

| Tham số | Kiểu | Mặc định | Ý nghĩa & Mô tả | Ví dụ |
| :--- | :---: | :---: | :--- | :--- |
| `category` | `enum` | `ALL` | **Phân loại**: `ALL` (tất cả), `DOMESTIC` (trong nước), `INTERNATIONAL` (quốc tế) | `?category=INTERNATIONAL` |
| `type` | `enum` | `ALL` | **거래구분**: `ALL` (전체), `DEPOSIT` (입금), `WITHDRAWAL` (출금) | `?type=WITHDRAWAL` |
| `sortOrder` | `enum` | `NEWEST` | **정렬순서**: `NEWEST` (최신순 - mới nhất), `OLDEST` (과거순 - cũ nhất) | `?sortOrder=NEWEST` |
| `period` | `string` | - | **조회기간**: `1M` (1개월), `3M` (3개월), `6M` (6개월), `1Y` (1년) | `?period=1M` |
| `startDate` | `string` | - | **직접입력**: Từ ngày (`YYYY.MM.DD` hoặc `YYYY-MM-DD`) | `?startDate=2026.08.01` |
| `endDate` | `string` | - | **직접입력**: Đến ngày (`YYYY.MM.DD` hoặc `YYYY-MM-DD`) | `?endDate=2026.09.16` |
| `searchType` | `enum` | `ALL` | **검색어 입력**: `HOLDER` (예금주명), `MEMO` (메모), `ALL` | `?searchType=HOLDER` |
| `keyword` | `string` | - | **검색어**: Từ khóa nhập vào ô input | `?keyword=NGUYEN VAN A` |
| `minAmount` | `number` | - | **금액**: Số tiền tối thiểu (>= `transferAmount`) | `?minAmount=10000` |
| `maxAmount` | `number` | - | **금액**: Số tiền tối đa (<= `transferAmount`) | `?maxAmount=500000` |
| `page` | `number` | `1` | Phân trang | `?page=1` |
| `limit` | `number` | `20` | Số lượng item mỗi trang | `?limit=20` |

#### Ví dụ URL lọc:
- Lấy toàn bộ giao dịch chuyển tiền quốc tế: `GET /api/transactions?category=INTERNATIONAL`
- Lọc giao dịch trong nước gần 1 tháng qua: `GET /api/transactions?category=DOMESTIC&period=1M`

---

### 3.2. Xem chi tiết giao dịch (`GET /api/transactions/:id`)

* **Endpoint:** `/api/transactions/:id`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <accessToken>`

---

### 3.3. Tạo mới giao dịch chuyển tiền (`POST /api/transactions`)

Tự động trừ/cộng tiền vào Ví người dùng (theo tiền tệ gốc KRW) và tự động tính toán quy đổi ngoại tệ.

* **Endpoint:** `/api/transactions`
* **Method:** `POST`
* **Headers:**
  * `Authorization: Bearer <accessToken>`
  * `Content-Type: application/json`

#### Cơ chế lưu dữ liệu giao dịch quốc tế:
- **Front-End tự nhập toàn bộ các giá trị**:
  - `transferAmount`: Tiền gửi nhập vào (KRW) ➡️ Tiền này sẽ được trừ trực tiếp từ Ví người dùng (`transferAmount + fee`).
  - `receiveAmount`: Tiền đổi ra của người nhận (VND, USD...) do FE tự nhập/tính và gửi lên.
  - `exchangeRate`: Tỷ giá quy đổi (nếu có, ví dụ: 18.35).
  - `receiverCurrency`: Đơn vị tiền tệ nhận (mặc định `'VND'`).
  - `category`: `'INTERNATIONAL'`.
- Backend lưu chính xác các giá trị do FE gửi lên vào Database mà không ép buộc công thức tính toán.

#### Request Body Mẫu - Chuyển tiền quốc tế (Chuẩn theo biên lai Sentbe thực tế):
```json
{
  "category": "INTERNATIONAL",
  "title": "Cuong Van Vu",
  "transferNumber": "AE24518506135",
  "transferTime": "2026/09/11",
  "transferAmount": 970000,
  "fee": 5000,
  "exchangeRate": 18.810743,
  "receiverCurrency": "VND",
  "receiveAmount": 18246421,
  "receiverCountry": "VN",
  "transferMethod": "Rút tiền tự động",
  "transferStatusDetail": "Đã chuyển tiền (2026/09/11)",
  "deliveryMethod": "Ngân hàng/Chuyển nhanh",
  "receiverPhone": "+84 335053104",
  "status": "PROCESSING",
  "statusDisplay": "Đang thực hiện",
  "paymentBank": {
    "bankCode": "NH",
    "name": "농협 (NH Bank)",
    "imageUrl": "assets/images/bank/nonghyup_bank.png",
    "accountNumber": "3022130908031"
  },
  "beneficiaryBank": {
    "bankCode": "MB",
    "name": "Ngân hàng MBBank",
    "imageUrl": "assets/images/bank/bank_mbbank.png",
    "accountNumber": "9906052006",
    "accountName": "Cuong Van Vu",
    "phoneNumber": "+84 335053104"
  }
}
```

#### Request Body Mẫu - Chuyển khoản trong nước:
```json
{
  "category": "DOMESTIC",
  "title": "자연애마트",
  "transferAmount": 9470,
  "isDeposit": false,
  "transferTypeTag": "체크",
  "receiverBankCode": "KB",
  "receiverAccountNumber": "128-910734-43507",
  "receiverName": "자연애마트",
  "content": "식료품 구매"
}
```

---

### 3.4. Chỉnh sửa thông tin giao dịch (`PATCH /api/transactions/:id`)

**Hệ thống cho phép chỉnh sửa 100% tất cả các trường thông tin trong một giao dịch** (từ thông tin hiển thị, biên lai, đối tượng người nhận, cho đến tài chính và thời gian):

#### Danh sách các trường có thể sửa:
1. **Thông tin định danh & trạng thái**: `transferNumber` (mã giao dịch), `status` (`PROCESSING`, `SUCCESS`...), `statusDisplay` (`Đang thực hiện`, `Hoàn thành`...).
2. **Thời gian**: `transferTime` (`YYYY/MM/DD` hoặc `YYYY.MM.DD`), `transferTimeDetail` (`HH:mm:ss`), `transferStatusDetail` (`Đã chuyển tiền (2026/09/11)`).
3. **Phương thức**: `transferMethod` (`Rút tiền tự động`), `deliveryMethod` (`Ngân hàng/Chuyển nhanh`), `category` (`DOMESTIC` / `INTERNATIONAL`), `transferTypeTag` (`해외송금`, `체크`...).
4. **Tiền tệ & Số tiền**: `currency`, `transferAmount`, `fee`, `finalAmount` (tự động tính nếu không truyền), `exchangeRate`, `receiverCurrency`, `receiveAmount` (tự động tính lại theo tỷ giá), `balanceAfter`.
5. **Thông tin người gửi / tài khoản rút**: `paymentBank` (`name`, `accountNumber`, `bankCode`, `imageUrl`...).
6. **Thông tin người nhận**: `title`, `receiverName`, `receiverBankName`, `receiverAccountNumber`, `receiverPhone`, `beneficiaryBank` (`name`, `accountNumber`, `accountName`, `phoneNumber`...).
7. **Nội dung / Ghi chú**: `content` (lời nhắn 메모).

> [!NOTE]
> - Khi sửa **số tiền (`transferAmount`)** hoặc **phí (`fee`)** hoặc **chiều giao dịch (`isDeposit`)**, server sẽ **tự động tính toán bù trừ số dư Ví** tương ứng. Nếu số dư khả dụng không đủ bù trừ, server trả về `400 Bad Request`.
> - Khi chỉ sửa các thông tin hiển thị (tên, số tài khoản, số điện thoại, ngân hàng, mã giao dịch, ngày giờ, trạng thái), số dư Ví được **giữ nguyên không bị ảnh hưởng**.

* **Endpoint:** `/api/transactions/:id`
* **Method:** `PATCH`
* **Headers:**
  * `Authorization: Bearer <accessToken>`
  * `Content-Type: application/json`

#### Ví dụ 1: Sửa thông tin người nhận & trạng thái (không đổi số tiền):
```json
{
  "title": "Cuong Van Vu",
  "status": "PROCESSING",
  "statusDisplay": "Đang thực hiện",
  "receiverPhone": "+84 335053104",
  "beneficiaryBank": {
    "name": "Ngân hàng MBBank",
    "accountNumber": "9906052006",
    "accountName": "Cuong Van Vu",
    "phoneNumber": "+84 335053104"
  }
}
```

#### Ví dụ 2: Sửa toàn bộ biên lai sang thông tin mới:
```json
{
  "title": "Cuong Van Vu",
  "transferNumber": "AE24518506135",
  "category": "INTERNATIONAL",
  "transferTime": "2026/09/11",
  "transferTimeDetail": "12:43:00",
  "transferAmount": 970000,
  "fee": 5000,
  "finalAmount": 975000,
  "exchangeRate": 18.810743,
  "receiverCurrency": "VND",
  "receiveAmount": 18246421,
  "status": "PROCESSING",
  "statusDisplay": "Đang thực hiện",
  "transferMethod": "Rút tiền tự động",
  "transferStatusDetail": "Đã chuyển tiền (2026/09/11)",
  "deliveryMethod": "Ngân hàng/Chuyển nhanh",
  "receiverPhone": "+84 335053104",
  "paymentBank": {
    "bankCode": "NH",
    "name": "농협 (NH Bank)",
    "imageUrl": "assets/images/bank/nonghyup_bank.png",
    "accountNumber": "3022130908031"
  },
  "beneficiaryBank": {
    "bankCode": "MB",
    "name": "Ngân hàng MBBank",
    "imageUrl": "assets/images/bank/bank_mbbank.png",
    "accountNumber": "9906052006",
    "accountName": "Cuong Van Vu",
    "phoneNumber": "+84 335053104"
  }
}
```

---

## 4. Code Mẫu Flutter (Dart) Tích Hợp

### 4.1. Model Class `TransactionItemModel`

```dart
class TransactionItemModel {
  final String id;
  final String transferNumber;
  final String category; // 'DOMESTIC' hoặc 'INTERNATIONAL'
  final String transferChannel;
  final String transferTypeTag;
  final String title;
  final String content;
  final bool isDeposit;
  final String currency;
  final double transferAmount;
  final double fee;
  final double finalAmount; // transferAmount + fee (975.000 KRW)
  final double? exchangeRate;
  final String? receiverCurrency;
  final double? receiveAmount;
  final String? receiverCountry;
  final String? deliveryMethod; // 'Ngân hàng/Chuyển nhanh'
  final String? transferMethod; // 'Rút tiền tự động'
  final String? transferStatusDetail; // 'Đã chuyển tiền (2026/09/11)'
  final String? receiverPhone; // '+84 335053104'
  final String statusDisplay; // 'Đang thực hiện'
  final double balanceAfter;
  final String status;
  final String transferTime;
  final String transferTimeDetail;
  final Map<String, dynamic>? paymentBank;
  final Map<String, dynamic>? beneficiaryBank;

  TransactionItemModel({
    required this.id,
    required this.transferNumber,
    required this.category,
    required this.transferChannel,
    required this.transferTypeTag,
    required this.title,
    required this.content,
    required this.isDeposit,
    required this.currency,
    required this.transferAmount,
    required this.fee,
    required this.finalAmount,
    this.exchangeRate,
    this.receiverCurrency,
    this.receiveAmount,
    this.receiverCountry,
    this.deliveryMethod,
    this.transferMethod,
    this.transferStatusDetail,
    this.receiverPhone,
    required this.statusDisplay,
    required this.balanceAfter,
    required this.status,
    required this.transferTime,
    required this.transferTimeDetail,
    this.paymentBank,
    this.beneficiaryBank,
  });

  bool get isInternational => category == 'INTERNATIONAL';

  factory TransactionItemModel.fromJson(Map<String, dynamic> json) {
    final transferAmount = (json['transferAmount'] as num?)?.toDouble() ?? 0.0;
    final fee = (json['fee'] as num?)?.toDouble() ?? 0.0;
    final finalAmount = (json['finalAmount'] as num?)?.toDouble() ?? (transferAmount + fee);

    return TransactionItemModel(
      id: json['id'] ?? json['_id'] ?? '',
      transferNumber: json['transferNumber'] ?? '',
      category: json['category'] ?? 'DOMESTIC',
      transferChannel: json['transferChannel'] ?? (json['category'] == 'INTERNATIONAL' ? 'Sentbe' : 'IBK'),
      transferTypeTag: json['transferTypeTag'] ?? (json['category'] == 'INTERNATIONAL' ? '해외송금' : '체크'),
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      isDeposit: json['isDeposit'] == true,
      currency: json['currency'] ?? 'KRW',
      transferAmount: transferAmount,
      fee: fee,
      finalAmount: finalAmount,
      exchangeRate: (json['exchangeRate'] as num?)?.toDouble(),
      receiverCurrency: json['receiverCurrency'],
      receiveAmount: (json['receiveAmount'] as num?)?.toDouble(),
      receiverCountry: json['receiverCountry'],
      deliveryMethod: json['deliveryMethod'],
      transferMethod: json['transferMethod'] ?? 'Rút tiền tự động',
      transferStatusDetail: json['transferStatusDetail'],
      receiverPhone: json['receiverPhone'] ?? json['beneficiaryBank']?['phoneNumber'],
      statusDisplay: json['statusDisplay'] ?? (json['status'] == 'PROCESSING' ? 'Đang thực hiện' : 'Hoàn thành'),
      balanceAfter: (json['balanceAfter'] as num?)?.toDouble() ??
          (json['totalWithdrawalAmount'] as num?)?.toDouble() ??
          0.0,
      status: json['status'] ?? 'SUCCESS',
      transferTime: json['transferTime'] ?? '',
      transferTimeDetail: json['transferTimeDetail'] ?? '',
      paymentBank: json['paymentBank'] as Map<String, dynamic>?,
      beneficiaryBank: json['beneficiaryBank'] as Map<String, dynamic>?,
    );
  }
}
```

### 4.2. Widget Render Item Hỗ Trợ Cả Quốc Tế và Trong Nước

```dart
Widget buildTransactionCard(TransactionItemModel item) {
  final formatKrw = NumberFormat('#,###');
  final formatVnd = NumberFormat('#,###');
  final amountText = '${formatKrw.format(item.transferAmount)} ${item.currency}';
  final balanceText = '잔액 ${formatKrw.format(item.balanceAfter)}원';
  final isDeposit = item.isDeposit;

  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: const BoxDecoration(
      border: Border(bottom: BorderSide(color: Color(0xFFEFEFEF), width: 1)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Dòng trên: Giờ | Tag loại ........... Trạng thái (출금 / 입금)
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${item.transferTimeDetail} | ${item.transferTypeTag}',
              style: const TextStyle(fontSize: 13, color: Color(0xFF9E9E9E)),
            ),
            Text(
              isDeposit ? '입금' : '출금',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isDeposit ? const Color(0xFF4B6BC6) : const Color(0xFF757575),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),

        // Dòng chính: Tiêu đề ........... Số tiền chuyển đi (KRW)
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                item.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF212121),
                ),
              ),
            ),
            Text(
              amountText,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: isDeposit ? const Color(0xFF4B6BC6) : const Color(0xFFD81B60),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),

        // Dòng phụ: Nếu là giao dịch quốc tế, hiển thị số tiền người nhận đổi ra & tỷ giá
        if (item.isInternational && item.receiveAmount != null) ...[
          Padding(
            padding: const EdgeInsets.only(top: 2, bottom: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Đổi ra: ${formatVnd.format(item.receiveAmount)} ${item.receiverCurrency ?? "VND"}'
                  '${item.exchangeRate != null ? " (Tỷ giá: ${item.exchangeRate})" : ""}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF00897B), // Màu xanh ngọc nổi bật
                  ),
                ),
                Text(
                  balanceText,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF616161)),
                ),
              ],
            ),
          ),
        ] else ...[
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              balanceText,
              style: const TextStyle(fontSize: 13, color: Color(0xFF616161)),
            ),
          ),
        ],
      ],
    ),
  );
}
```
