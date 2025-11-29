import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authenticateUser, isAdmin } from './auth.js';

/**
 * AUTHENTICATION MIDDLEWARE TESTS
 * 
 * What we're testing: Security-critical middleware that protects routes
 * Why it matters: Prevents unauthorized access, ensures proper authentication flow
 * 
 * Concepts:
 * - Middleware: Functions that run between request and response
 * - Mocking: Simulating request/response objects without real HTTP
 * - Test isolation: Each test is independent
 */

describe('Authentication Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create fresh mock objects for each test
    // This ensures test isolation - one test doesn't affect another
    mockReq = {
      session: {},
      sessionID: 'test-session-id',
    };

    mockRes = {
      status: vi.fn().mockReturnThis(), // Chainable: res.status().json()
      json: vi.fn(),
    };

    mockNext = vi.fn(); // Mock function to track if middleware calls next()
  });

  describe('authenticateUser', () => {
    it('should call next() when user is authenticated', () => {
      // Arrange: Set up authenticated user in session
      mockReq.session.currentUser = {
        _id: '123',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      // Act: Call the middleware
      authenticateUser(mockReq, mockRes, mockNext);

      // Assert: Verify middleware allows request to continue
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.user).toEqual(mockReq.session.currentUser);
    });

    it('should return 401 when user is not authenticated', () => {
      // Arrange: No user in session
      mockReq.session.currentUser = null;

      // Act
      authenticateUser(mockReq, mockRes, mockNext);

      // Assert: Should block request and return 401
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Unauthorized - please log in',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 when session is not initialized', () => {
      // Arrange: Session doesn't exist (middleware misconfiguration)
      mockReq.session = null;

      // Act
      authenticateUser(mockReq, mockRes, mockNext);

      // Assert: Should return server error
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Session middleware not properly configured',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach user to request object when authenticated', () => {
      // Arrange
      const mockUser = {
        _id: '456',
        email: 'admin@example.com',
        role: 'ADMIN',
      };
      mockReq.session.currentUser = mockUser;

      // Act
      authenticateUser(mockReq, mockRes, mockNext);

      // Assert: User should be attached to request for use in route handlers
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('should call next() when user is admin', () => {
      // Arrange: Set up admin user (must be attached by authenticateUser first)
      mockReq.user = {
        _id: '123',
        role: 'ADMIN',
      };

      // Act
      isAdmin(mockReq, mockRes, mockNext);

      // Assert: Should allow access
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access for lowercase "admin" role', () => {
      // Arrange: Test case-insensitive role check
      mockReq.user = {
        _id: '123',
        role: 'admin', // lowercase
      };

      // Act
      isAdmin(mockReq, mockRes, mockNext);

      // Assert: Should still allow (case-insensitive)
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', () => {
      // Arrange: Student user
      mockReq.user = {
        _id: '123',
        role: 'STUDENT',
      };

      // Act
      isAdmin(mockReq, mockRes, mockNext);

      // Assert: Should block access
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden - admin access only',
        currentRole: 'STUDENT',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user object is missing', () => {
      // Arrange: No user attached (authenticateUser wasn't called)
      mockReq.user = null;

      // Act
      isAdmin(mockReq, mockRes, mockNext);

      // Assert: Should block access
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden - admin access only',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined role gracefully', () => {
      // Arrange: User without role
      mockReq.user = {
        _id: '123',
        // role is undefined
      };

      // Act
      isAdmin(mockReq, mockRes, mockNext);

      // Assert: Should block access
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

