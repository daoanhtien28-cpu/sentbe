# Tài Liệu API Giao Dịch Gần Đây (Recent Transactions API)

Tài liệu hướng dẫn tích hợp và sử dụng API quản lý **Danh sách giao dịch gần đây (tài khoản người nhận gần đây - 최근 보낸 계좌)** dành cho ứng dụng di động và frontend. Hỗ trợ cả **tài khoản nội địa Hàn Quốc** và **tài khoản chuyển tiền quốc tế (Sentbe Remittance - Việt Nam...)**.

---

## 1. Tổng quan & Luồng hoạt động

- **Mục đích**: Lưu trữ và quản lý danh sách các tài khoản ngân hàng thụ hưởng mà người dùng đã từng chuyển tiền đến hoặc tự thêm/sửa/xóa trong danh bạ chuyển khoản nhanh (bao gồm cả số tài khoản, tên ngân hàng và số điện thoại người nhận quốc tế).
- **Xác thực (Authentication)**: Tất cả API đều yêu cầu Header:
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
- **Đặc điểm & Lưu ý**:
  - Quản lý độc lập thông qua bộ API `/recent-transactions`.
  - Hỗ trợ lưu trữ số điện thoại người nhận (`phoneNumber`, ví dụ: `+84 335053104`) phục vụ chuyển tiền quốc tế nhanh chóng.
  - Khi thêm tài khoản chỉ có `bankCode` (vd: `'KBANK'`), hệ thống tự động điền `name` (vd: `'K Bank'`) và `imageUrl` (vd: `'assets/images/bank/bank_kbank.png'`) từ danh mục ngân hàng hệ thống nếu chưa có. Đối với ngân hàng quốc tế (vd: MB, VCB), client có thể tự chỉ định `name` và `imageUrl`.
  - **Không có dữ liệu mẫu (dummy data)**: Trả về mảng rỗng `[]` khi người dùng chưa có giao dịch nào và chỉ hiển thị đúng các bản ghi do người dùng/client chủ động thêm hoặc phát sinh.

---

## 2. Cấu trúc dữ liệu (Data Model)

Mỗi đối tượng giao dịch gần đây gồm các thuộc tính sau:

```typescript
interface RecentTransaction {
  id: string;             // ID định danh bản ghi (MongoDB ObjectId)
  bankCode?: string;      // Mã viết tắt ngân hàng (MB, VCB, KB, SH, SHINHAN, NH, WOORI, HANA...)
  name: string;          // Tên ngân hàng / đơn vị (Ngân hàng MBBank, Vietcombank, K Bank, 수협, 신한은행...)
  imageUrl: string;      // Đường dẫn ảnh / logo ngân hàng (assets/images/bank/...)
  accountNumber: string; // Số tài khoản người nhận (9906052006, 123-456-7890...)
  accountName: string;   // Tên người nhận / chủ tài khoản (Cuong Van Vu, 자연애마트, 김철수...)
  phoneNumber?: string;  // Số điện thoại người nhận (+84 335053104...)
  createdAt: string;     // Thời điểm tạo (ISO 8601)
  updatedAt: string;     // Thời điểm cập nhật cuối (dùng để sắp xếp mới nhất)
}
```

---

## 3. Bảng tổng hợp Endpoints

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/recent-transactions` | Lấy danh sách giao dịch gần đây của người dùng |
| `GET` | `/transactions/recent` | Alias lấy danh sách giao dịch gần đây |
| `GET` | `/recent-transactions/:id` | Xem chi tiết một giao dịch gần đây |
| `POST` | `/recent-transactions` | Thêm mới 1 giao dịch gần đây (hoặc mảng nhiều mục) |
| `POST` | `/recent-transactions/bulk` | Nhập danh sách hàng loạt (`bulk import`) |
| `PATCH` | `/recent-transactions/:id` | Cập nhật / sửa thông tin một giao dịch gần đây |
| `PUT` | `/recent-transactions/:id` | Cập nhật / thay thế thông tin một giao dịch gần đây |
| `DELETE` | `/recent-transactions/:id` | Xóa một giao dịch gần đây theo ID |
| `DELETE` | `/recent-transactions` | Xóa tất cả giao dịch gần đây của người dùng |

---

## 4. Chi tiết từng API

### 4.1. Lấy danh sách giao dịch gần đây
- **Method**: `GET`
- **Path**: `/recent-transactions` (hoặc `/transactions/recent`)
- **Headers**:
  ```http
  Authorization: Bearer {{token}}
  ```
- **Response Success (200 OK)**:
```json
[
  {
    "id": "673f1a2b89c3e4567890abca",
    "bankCode": "MB",
    "name": "Ngân hàng MBBank",
    "imageUrl": "assets/images/bank/bank_mbbank.png",
    "accountNumber": "9906052006",
    "accountName": "Cuong Van Vu",
    "phoneNumber": "+84 335053104",
    "createdAt": "2026-09-24T11:00:00.000Z",
    "updatedAt": "2026-09-24T11:00:00.000Z"
  },
  {
    "id": "673f1a2b89c3e4567890abcd",
    "bankCode": "KBANK",
    "name": "K Bank",
    "imageUrl": "assets/images/bank/bank_kbank.png",
    "accountNumber": "9876 543 210",
    "accountName": "자연애마트",
    "phoneNumber": "",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z"
  }
]
```

---

### 4.2. Thêm mới một giao dịch gần đây
- **Method**: `POST`
- **Path**: `/recent-transactions`
- **Request Body (Giao dịch quốc tế / Sentbe)**:
```json
{
  "bankCode": "MB",
  "name": "Ngân hàng MBBank",
  "imageUrl": "assets/images/bank/bank_mbbank.png",
  "accountNumber": "9906052006",
  "accountName": "Cuong Van Vu",
  "phoneNumber": "+84 335053104"
}
```
*(Nếu đã có tài khoản trùng `accountNumber` và `bankCode`, hệ thống tự động cập nhật thông tin và đẩy lên đầu danh sách).*

- **Response Success (201 Created)**:
```json
{
  "id": "673f1a2b89c3e4567890abca",
  "bankCode": "MB",
  "name": "Ngân hàng MBBank",
  "imageUrl": "assets/images/bank/bank_mbbank.png",
  "accountNumber": "9906052006",
  "accountName": "Cuong Van Vu",
  "phoneNumber": "+84 335053104",
  "createdAt": "2026-09-24T11:00:00.000Z",
  "updatedAt": "2026-09-24T11:00:00.000Z"
}
```

---

### 4.3. Nhập danh sách hàng loạt (Bulk Import)
- **Method**: `POST`
- **Path**: `/recent-transactions/bulk`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer {{token}}
  ```
- **Request Body (Mảng nhiều tài khoản)**:
```json
[
  {
    "bankCode": "MB",
    "name": "Ngân hàng MBBank",
    "imageUrl": "assets/images/bank/bank_mbbank.png",
    "accountNumber": "9906052006",
    "accountName": "Cuong Van Vu",
    "phoneNumber": "+84 335053104"
  },
  {
    "bankCode": "NH",
    "name": "농협 (NH Bank)",
    "imageUrl": "assets/images/bank/nonghyup_bank.png",
    "accountNumber": "3022130908031",
    "accountName": "KIM SENTBE",
    "phoneNumber": ""
  }
]
```

---

### 4.4. Xem chi tiết một giao dịch gần đây
- **Method**: `GET`
- **Path**: `/recent-transactions/:id`
- **Response Success (200 OK)**:
```json
{
  "id": "673f1a2b89c3e4567890abca",
  "bankCode": "MB",
  "name": "Ngân hàng MBBank",
  "imageUrl": "assets/images/bank/bank_mbbank.png",
  "accountNumber": "9906052006",
  "accountName": "Cuong Van Vu",
  "phoneNumber": "+84 335053104",
  "createdAt": "2026-09-24T11:00:00.000Z",
  "updatedAt": "2026-09-24T11:00:00.000Z"
}
```

---

### 4.5. Chỉnh sửa một giao dịch gần đây
- **Method**: `PATCH` hoặc `PUT`
- **Path**: `/recent-transactions/:id`
- **Request Body**:
```json
{
  "accountName": "Cuong Van Vu",
  "phoneNumber": "+84 335053104"
}
```
- **Response Success (200 OK)**: Trả về đối tượng sau khi cập nhật thành công.

---

### 4.6. Xóa một giao dịch gần đây
- **Method**: `DELETE`
- **Path**: `/recent-transactions/:id`
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "message": "Đã xóa giao dịch gần đây thành công"
}
```

---

### 4.7. Xóa toàn bộ danh sách giao dịch gần đây
- **Method**: `DELETE`
- **Path**: `/recent-transactions`
- **Response Success (200 OK)**:
```json
{
  "success": true,
  "deletedCount": 2
}
```

---

## 5. Ví dụ cURL thao tác nhanh

### Lấy danh sách:
```bash
curl -X GET "http://localhost:3000/recent-transactions" \
  -H "Authorization: Bearer <TOKEN>"
```

### Thêm mới một mục người nhận quốc tế (Sentbe):
```bash
curl -X POST "http://localhost:3000/recent-transactions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "bankCode": "MB",
    "name": "Ngân hàng MBBank",
    "imageUrl": "assets/images/bank/bank_mbbank.png",
    "accountNumber": "9906052006",
    "accountName": "Cuong Van Vu",
    "phoneNumber": "+84 335053104"
  }'
```

### Sửa thông tin:
```bash
curl -X PATCH "http://localhost:3000/recent-transactions/<ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "phoneNumber": "+84 335053104"
  }'
```

### Xóa một mục:
```bash
curl -X DELETE "http://localhost:3000/recent-transactions/<ID>" \
  -H "Authorization: Bearer <TOKEN>"
```

### Sửa thông tin:
```bash
curl -X PATCH "http://localhost:3000/recent-transactions/<ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "accountName": "자연애마트 (Gần nhà)"
  }'
```

### Xóa một mục:
```bash
curl -X DELETE "http://localhost:3000/recent-transactions/<ID>" \
  -H "Authorization: Bearer <TOKEN>"
```
