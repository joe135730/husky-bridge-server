import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as dao from './dao.js';
import model from './model.js';

// Mock the Mongoose model
vi.mock('./model.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

/**
 * DAO (Data Access Object) TESTS
 * 
 * What we're testing: Database operations layer
 * Why it matters: Ensures data is correctly saved/retrieved from database
 * 
 * Concepts:
 * - DAO Pattern: Separates database logic from business logic
 * - Mocking: We mock MongoDB to test without real database
 * - Unit Testing: Testing one function at a time in isolation
 */

describe('User DAO Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    // This ensures tests don't interfere with each other
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user with default STUDENT role when role not provided', async () => {
      // Arrange: Mock user data without role
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockCreatedUser = {
        ...userData,
        _id: 'generated-uuid',
        role: 'STUDENT',
        lastActivity: new Date(),
        totalActivity: '0',
      };

      vi.mocked(model.create).mockResolvedValue(mockCreatedUser);

      // Act: Call the function
      const result = await dao.createUser(userData);

      // Assert: Verify user was created with correct data
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          email: 'john@example.com',
          role: 'STUDENT', // Should default to STUDENT
          _id: expect.any(String), // UUID should be generated
        })
      );
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create user with provided role', async () => {
      // Arrange
      const userData = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'ADMIN',
      };

      const mockCreatedUser = { ...userData, _id: 'uuid-123' };
      vi.mocked(model.create).mockResolvedValue(mockCreatedUser);

      // Act
      const result = await dao.createUser(userData);

      // Assert: Should use provided role, not default
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'ADMIN',
        })
      );
      expect(result).toEqual(mockCreatedUser);
    });

    it('should generate UUID for new user', async () => {
      // Arrange
      const userData = {
        firstName: 'Test',
        email: 'test@example.com',
        password: 'test123',
      };

      vi.mocked(model.create).mockImplementation((data) => {
        return Promise.resolve({ ...data, _id: data._id });
      });

      // Act
      await dao.createUser(userData);

      // Assert: Should generate UUID
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.any(String),
        })
      );
    });
  });

  describe('findAllUsers', () => {
    it('should return all users from database', async () => {
      // Arrange: Mock database response
      const mockUsers = [
        { _id: '1', email: 'user1@example.com' },
        { _id: '2', email: 'user2@example.com' },
      ];
      vi.mocked(model.find).mockResolvedValue(mockUsers);

      // Act
      const result = await dao.findAllUsers();

      // Assert
      expect(model.find).toHaveBeenCalledWith();
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      vi.mocked(model.find).mockResolvedValue([]);

      // Act
      const result = await dao.findAllUsers();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findUserById', () => {
    it('should find user by ID', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        firstName: 'Test',
      };
      vi.mocked(model.findOne).mockResolvedValue(mockUser);

      // Act
      const result = await dao.findUserById(userId);

      // Assert
      expect(model.findOne).toHaveBeenCalledWith({ _id: userId });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      vi.mocked(model.findOne).mockResolvedValue(null);

      // Act
      const result = await dao.findUserById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockUser = { _id: '123', email };
      vi.mocked(model.findOne).mockResolvedValue(mockUser);

      // Act
      const result = await dao.findUserByEmail(email);

      // Assert
      expect(model.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findUserByCredentials', () => {
    it('should find user by email and password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = { _id: '123', email, password };
      vi.mocked(model.findOne).mockResolvedValue(mockUser);

      // Act
      const result = await dao.findUserByCredentials(email, password);

      // Assert
      expect(model.findOne).toHaveBeenCalledWith({ email, password });
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid credentials', async () => {
      // Arrange
      vi.mocked(model.findOne).mockResolvedValue(null);

      // Act
      const result = await dao.findUserByCredentials('wrong@example.com', 'wrongpass');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user with new data', async () => {
      // Arrange
      const userId = 'user-123';
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
      };
      const mockUpdatedUser = {
        _id: userId,
        ...updates,
        email: 'test@example.com',
      };
      vi.mocked(model.findOneAndUpdate).mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await dao.updateUser(userId, updates);

      // Assert
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId },
        { $set: updates },
        { new: true }
      );
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user by ID', async () => {
      // Arrange
      const userId = 'user-123';
      const mockDeleteResult = { deletedCount: 1 };
      vi.mocked(model.deleteOne).mockResolvedValue(mockDeleteResult);

      // Act
      const result = await dao.deleteUser(userId);

      // Assert
      expect(model.deleteOne).toHaveBeenCalledWith({ _id: userId });
      expect(result).toEqual(mockDeleteResult);
    });

    it('should return deletedCount 0 when user not found', async () => {
      // Arrange
      vi.mocked(model.deleteOne).mockResolvedValue({ deletedCount: 0 });

      // Act
      const result = await dao.deleteUser('non-existent-id');

      // Assert
      expect(result.deletedCount).toBe(0);
    });
  });
});

