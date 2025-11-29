import { describe, it, expect } from 'vitest';

/**
 * VALIDATION UTILITY TESTS
 * 
 * What we're testing: Input validation functions
 * Why it matters: Prevents invalid data from entering the system
 * 
 * These are pure functions (no side effects) - easiest to test!
 */

// Email validation function
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation function
export function validatePassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number, one special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]).{8,}$/;
  return passwordRegex.test(password);
}

// Role validation function
export function validateRole(role) {
  const validRoles = ['STUDENT', 'ADMIN'];
  return validRoles.includes(role?.toUpperCase());
}

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@domain.co.uk')).toBe(true);
      expect(validateEmail('user123@test-domain.com')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('user name@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid passwords', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('MyP@ssw0rd')).toBe(true);
      expect(validatePassword('Test1234#')).toBe(true);
    });

    it('should return false for passwords missing requirements', () => {
      expect(validatePassword('password123!')).toBe(false); // No uppercase
      expect(validatePassword('PASSWORD123!')).toBe(false); // No lowercase
      expect(validatePassword('Password!')).toBe(false); // No number
      expect(validatePassword('Password123')).toBe(false); // No special char
      expect(validatePassword('Pass1!')).toBe(false); // Too short (< 8 chars)
      expect(validatePassword('')).toBe(false); // Empty
    });
  });

  describe('validateRole', () => {
    it('should return true for valid roles', () => {
      expect(validateRole('STUDENT')).toBe(true);
      expect(validateRole('ADMIN')).toBe(true);
      expect(validateRole('student')).toBe(true); // Case insensitive
      expect(validateRole('admin')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(validateRole('TEACHER')).toBe(false);
      expect(validateRole('USER')).toBe(false);
      expect(validateRole('')).toBe(false);
      expect(validateRole(null)).toBe(false);
      expect(validateRole(undefined)).toBe(false);
    });
  });
});

