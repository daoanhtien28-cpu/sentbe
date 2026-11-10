import { describe, expect, it } from 'vitest';
import {
  canonicalizePhone,
  getPhoneVariants,
  isValidEmail,
  isValidPhone,
  normalizePhone,
} from './phone.util';

describe('Phone & Email Utils', () => {
  describe('normalizePhone', () => {
    it('should strip spaces, dashes, dots, and parentheses', () => {
      expect(normalizePhone('0912 345 678')).toBe('0912345678');
      expect(normalizePhone('0912-345-678')).toBe('0912345678');
      expect(normalizePhone('(0912) 345.678')).toBe('0912345678');
      expect(normalizePhone('+84 912 345 678')).toBe('+84912345678');
      expect(normalizePhone('')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('0912345678')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate phone numbers correctly', () => {
      expect(isValidPhone('0912345678')).toBe(true);
      expect(isValidPhone('+84912345678')).toBe(true);
      expect(isValidPhone('0912 345 678')).toBe(true);
      expect(isValidPhone('+14155552671')).toBe(true);
      expect(isValidPhone('123')).toBe(false); // too short
      expect(isValidPhone('user@example.com')).toBe(false);
    });
  });

  describe('canonicalizePhone', () => {
    it('should normalize Vietnam phone numbers with +84 or 84 to 0xxxxxxxxx', () => {
      expect(canonicalizePhone('+84912345678')).toBe('0912345678');
      expect(canonicalizePhone('84912345678')).toBe('0912345678');
      expect(canonicalizePhone('0912345678')).toBe('0912345678');
      expect(canonicalizePhone('+14155552671')).toBe('+14155552671');
    });
  });

  describe('getPhoneVariants', () => {
    it('should return all variants for 10-digit VN phone starting with 0', () => {
      const variants = getPhoneVariants('0912345678');
      expect(variants).toContain('0912345678');
      expect(variants).toContain('+84912345678');
      expect(variants).toContain('84912345678');
    });

    it('should return all variants for VN phone starting with +84', () => {
      const variants = getPhoneVariants('+84912345678');
      expect(variants).toContain('0912345678');
      expect(variants).toContain('+84912345678');
      expect(variants).toContain('84912345678');
    });

    it('should handle formatted phone input with spaces', () => {
      const variants = getPhoneVariants('0912 345 678');
      expect(variants).toContain('0912345678');
      expect(variants).toContain('+84912345678');
    });
  });
});

