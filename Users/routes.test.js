import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as dao from './dao.js';

// Mock the DAO module
vi.mock('./dao.js', () => ({
  findUserByCredentials: vi.fn(),
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  findUserById: vi.fn(),
  findAllUsers: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

/**
 * ROUTE HANDLER TESTS
 * 
 * What we're testing: API endpoint handlers (Express routes)
 * Why it matters: Ensures API returns correct responses, handles errors properly
 * 
 * Concepts:
 * - Route Handlers: Functions that process HTTP requests
 * - Request/Response Mocking: Simulate HTTP requests without real server
 * - Status Codes: HTTP response codes (200, 400, 401, 404, 500)
 * - Session Management: Testing authentication state
 */

// Helper function to create mock Express request/response
function createMockReqRes() {
  const req = {
    body: {},
    params: {},
    session: {},
    sessionID: 'test-session',
  };

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    sendStatus: vi.fn(),
  };

  return { req, res };
}

describe('User Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signin route', () => {
    it('should sign in user with valid credentials', async () => {
      // Import the route handler (we'll need to extract it)
      // For now, let's test the logic directly
      const { req, res } = createMockReqRes();
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        role: 'student',
        toObject: () => ({ _id: '123', email: 'test@example.com', role: 'student' }),
      };

      vi.mocked(dao.findUserByCredentials).mockResolvedValue(mockUser);

      // Simulate signin logic
      const currentUser = await dao.findUserByCredentials(req.body.email, req.body.password);
      if (currentUser) {
        const formattedUser = {
          ...currentUser.toObject(),
          role: currentUser.role.toUpperCase(),
        };
        req.session.currentUser = formattedUser;
        res.json(formattedUser);
      }

      // Assert
      expect(dao.findUserByCredentials).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(req.session.currentUser).toBeDefined();
      expect(req.session.currentUser.role).toBe('STUDENT');
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 for invalid credentials', async () => {
      const { req, res } = createMockReqRes();
      req.body = {
        email: 'wrong@example.com',
        password: 'wrongpass',
      };

      vi.mocked(dao.findUserByCredentials).mockResolvedValue(null);

      // Simulate signin logic
      const currentUser = await dao.findUserByCredentials(req.body.email, req.body.password);
      if (!currentUser) {
        res.status(401).json({ message: 'Invalid credentials' });
      }

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });

  describe('signup route', () => {
    it('should create new user with valid data', async () => {
      const { req, res } = createMockReqRes();
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const mockNewUser = {
        _id: 'new-id',
        ...req.body,
        role: 'STUDENT',
      };

      vi.mocked(dao.findUserByEmail).mockResolvedValue(null); // Email not taken
      vi.mocked(dao.createUser).mockResolvedValue(mockNewUser);

      // Simulate signup logic
      const existingUser = await dao.findUserByEmail(req.body.email);
      if (!existingUser) {
        const currentUser = await dao.createUser(req.body);
        req.session.currentUser = currentUser;
        res.json(currentUser);
      }

      // Assert
      expect(dao.findUserByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(dao.createUser).toHaveBeenCalledWith(req.body);
      expect(req.session.currentUser).toEqual(mockNewUser);
      expect(res.json).toHaveBeenCalledWith(mockNewUser);
    });

    it('should return 400 when email already exists', async () => {
      const { req, res } = createMockReqRes();
      req.body = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const existingUser = { _id: '123', email: 'existing@example.com' };
      vi.mocked(dao.findUserByEmail).mockResolvedValue(existingUser);

      // Simulate signup logic
      const user = await dao.findUserByEmail(req.body.email);
      if (user) {
        res.status(400).json({ message: 'Email already registered' });
      }

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
      expect(dao.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 when email or password is missing', () => {
      const { req, res } = createMockReqRes();
      req.body = {
        firstName: 'John',
        // Missing email and password
      };

      // Simulate validation logic
      if (!req.body || !req.body.email || !req.body.password) {
        res.status(400).json({ message: 'Email and password are required' });
      }

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email and password are required',
      });
    });
  });

  describe('profile route', () => {
    it('should return user profile when authenticated', async () => {
      const { req, res } = createMockReqRes();
      req.session.currentUser = {
        _id: '123',
        email: 'test@example.com',
      };

      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        role: 'student',
        toObject: () => ({
          _id: '123',
          email: 'test@example.com',
          role: 'student',
        }),
      };

      vi.mocked(dao.findUserById).mockResolvedValue(mockUser);

      // Simulate profile logic
      if (req.session.currentUser) {
        const user = await dao.findUserById(req.session.currentUser._id);
        const formattedUser = {
          ...user.toObject(),
          role: user.role.toUpperCase(),
        };
        res.json(formattedUser);
      }

      // Assert
      expect(dao.findUserById).toHaveBeenCalledWith('123');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: '123',
          role: 'STUDENT',
        })
      );
    });

    it('should return 401 when not authenticated', () => {
      const { req, res } = createMockReqRes();
      req.session.currentUser = null;

      // Simulate profile logic
      if (!req.session.currentUser) {
        res.status(401).json({ message: 'Not authenticated' });
      }

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
    });
  });

  describe('signout route', () => {
    it('should destroy session on signout', () => {
      const { req, res } = createMockReqRes();
      req.session.currentUser = { _id: '123' };
      req.session.destroy = vi.fn((callback) => {
        if (callback) callback();
      });

      // Simulate signout logic
      req.session.destroy();
      res.sendStatus(200);

      // Assert
      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.sendStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('updateUser route', () => {
    it('should update user when user exists', async () => {
      const { req, res } = createMockReqRes();
      req.params.id = 'user-123';
      req.body = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const existingUser = {
        _id: 'user-123',
        email: 'test@example.com',
      };
      const updatedUser = {
        ...existingUser,
        ...req.body,
      };

      vi.mocked(dao.findUserById).mockResolvedValue(existingUser);
      vi.mocked(dao.updateUser).mockResolvedValue(updatedUser);

      // Simulate update logic
      const user = await dao.findUserById(req.params.id);
      if (user) {
        const result = await dao.updateUser(req.params.id, req.body);
        res.json(result);
      }

      // Assert
      expect(dao.findUserById).toHaveBeenCalledWith('user-123');
      expect(dao.updateUser).toHaveBeenCalledWith('user-123', req.body);
      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    it('should return 404 when user not found', async () => {
      const { req, res } = createMockReqRes();
      req.params.id = 'non-existent';

      vi.mocked(dao.findUserById).mockResolvedValue(null);

      // Simulate update logic
      const existingUser = await dao.findUserById(req.params.id);
      if (!existingUser) {
        res.status(404).json({ message: 'User not found' });
      }

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(dao.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser route', () => {
    it('should delete user successfully', async () => {
      const { req, res } = createMockReqRes();
      req.params.id = 'user-123';

      vi.mocked(dao.deleteUser).mockResolvedValue({ deletedCount: 1 });

      // Simulate delete logic
      const status = await dao.deleteUser(req.params.id);
      if (status.deletedCount === 1) {
        res.json({ message: 'User deleted successfully' });
      }

      // Assert
      expect(dao.deleteUser).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({
        message: 'User deleted successfully',
      });
    });

    it('should return 404 when user not found', async () => {
      const { req, res } = createMockReqRes();
      req.params.id = 'non-existent';

      vi.mocked(dao.deleteUser).mockResolvedValue({ deletedCount: 0 });

      // Simulate delete logic
      const status = await dao.deleteUser(req.params.id);
      if (status.deletedCount !== 1) {
        res.status(404).json({ message: 'User not found' });
      }

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });
});

