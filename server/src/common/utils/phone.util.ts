/**
 * Utility xử lý và chuẩn hóa số điện thoại, email
 */

/**
 * Chuẩn hóa chuỗi số điện thoại: loại bỏ khoảng trắng, dấu gạch ngang, dấu chấm, ngoặc...
 */
export function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/[\s\-().]/g, '').trim();
}

/**
 * Kiểm tra xem chuỗi có phải là định dạng email hợp lệ không
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Kiểm tra số điện thoại hợp lệ (chuẩn VN hoặc quốc tế từ 9 đến 15 chữ số, có thể bắt đầu bằng +)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = normalizePhone(phone);
  return /^\+?[0-9]{9,15}$/.test(cleaned);
}

/**
 * Chuẩn hóa số điện thoại về định dạng canonical để lưu trữ:
 * - Nếu là số điện thoại Việt Nam bắt đầu bằng +84 hoặc 84: chuyển về dạng 0xxxxxxxxx
 * - Các số khác: giữ nguyên chuỗi đã được làm sạch
 */
export function canonicalizePhone(phone: string): string {
  const cleaned = normalizePhone(phone);
  if (!cleaned) return '';

  // Số VN 9 chữ số sau +84 (VD: +84912345678 -> 0912345678)
  if (/^\+84[1-9][0-9]{8}$/.test(cleaned)) {
    return `0${cleaned.substring(3)}`;
  }
  // Số VN 9 chữ số sau 84 (VD: 84912345678 -> 0912345678)
  if (/^84[1-9][0-9]{8}$/.test(cleaned)) {
    return `0${cleaned.substring(2)}`;
  }

  return cleaned;
}

/**
 * Tạo danh sách các biến thể của số điện thoại để tìm kiếm linh hoạt
 * (VD: 0912345678 -> ['0912345678', '+84912345678', '84912345678'])
 */
export function getPhoneVariants(phone: string): string[] {
  const cleaned = normalizePhone(phone);
  if (!cleaned) return [];

  const variants = new Set<string>();
  variants.add(cleaned);

  const canonical = canonicalizePhone(cleaned);
  variants.add(canonical);

  if (/^0[1-9][0-9]{8}$/.test(canonical)) {
    const withoutZero = canonical.substring(1);
    variants.add(`+84${withoutZero}`);
    variants.add(`84${withoutZero}`);
  }

  return Array.from(variants);
}
