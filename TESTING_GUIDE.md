# Backend Unit Testing Guide for Husky Bridge Server

## Overview

This document explains the unit tests created for the Husky Bridge backend server and teaches you the fundamental concepts of backend testing.

## Test Files Created

### 1. **Authentication Middleware Tests** (`middleware/auth.test.js`)
**What we're testing:** Security-critical middleware that protects routes

**Why it matters:**
- **Security**: Prevents unauthorized access to protected routes
- **Authorization**: Ensures only admins can access admin routes
- **Session Management**: Verifies proper authentication flow
- **Critical**: If this breaks, your entire app security is compromised

**Tests include:**
- ✅ User authentication (allows/denies access)
- ✅ Admin authorization (role-based access control)
- ✅ Session validation
- ✅ Error handling (missing session, missing user)
- ✅ Case-insensitive role checking

**Key Concepts:**
- **Middleware**: Functions that run between HTTP request and response
- **Mocking**: We create fake `req`, `res`, `next` objects to test without real HTTP
- **Test Isolation**: Each test gets fresh mock objects (no interference)

---

### 2. **DAO (Data Access Object) Tests** (`Users/dao.test.js`)
**What we're testing:** Database operations layer

**Why it matters:**
- **Data Integrity**: Ensures data is correctly saved/retrieved
- **Business Logic**: Default values (like STUDENT role) work correctly
- **Error Handling**: Handles missing data gracefully
- **Separation of Concerns**: Database logic is separate from route logic

**Tests include:**
- ✅ User creation (with/without role, UUID generation)
- ✅ Finding users (by ID, email, credentials)
- ✅ Updating users
- ✅ Deleting users
- ✅ Edge cases (not found, empty results)

**Key Concepts:**
- **DAO Pattern**: Separates database code from business logic
- **Mocking MongoDB**: We mock Mongoose models to test without real database
- **Unit Testing**: Testing one function at a time in isolation
- **Promise Testing**: Using `async/await` to test database operations

---

### 3. **Route Handler Tests** (`Users/routes.test.js`)
**What we're testing:** API endpoint logic

**Why it matters:**
- **API Contract**: Ensures API returns correct status codes and data
- **Request Validation**: Validates input data
- **Error Responses**: Proper error messages for clients
- **Session Management**: Correctly handles authentication state

**Tests include:**
- ✅ Signin (valid/invalid credentials)
- ✅ Signup (new user, duplicate email, missing fields)
- ✅ Profile (authenticated/unauthenticated)
- ✅ Signout (session destruction)
- ✅ Update user (success, not found)
- ✅ Delete user (success, not found)

**Key Concepts:**
- **HTTP Status Codes**: 
  - `200`: Success
  - `400`: Bad Request (invalid input)
  - `401`: Unauthorized (not logged in)
  - `403`: Forbidden (not enough permissions)
  - `404`: Not Found
  - `500`: Server Error
- **Request/Response Mocking**: Simulate HTTP without real server
- **Session Testing**: Verify session state changes

---

### 4. **Validation Utility Tests** (`utils/validation.test.js`)
**What we're testing:** Input validation functions

**Why it matters:**
- **Data Quality**: Prevents invalid data from entering system
- **Security**: Strong passwords protect user accounts
- **User Experience**: Clear validation prevents user frustration
- **Pure Functions**: Easy to test (no side effects)

**Tests include:**
- ✅ Email validation (valid/invalid formats)
- ✅ Password validation (strength requirements)
- ✅ Role validation (valid/invalid roles)

**Key Concepts:**
- **Pure Functions**: Functions with no side effects (same input = same output)
- **Regex Testing**: Testing pattern matching
- **Edge Cases**: Testing boundary conditions

---

## Test Statistics

- **Total Test Files:** 4
- **Total Tests:** 40
- **All Passing:** ✅

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Understanding Unit Testing Concepts

### 1. **What is Unit Testing?**

**Definition:** Testing individual functions/components in isolation

**Example:**
```javascript
// Function to test
function add(a, b) {
  return a + b;
}

// Unit test
test('adds two numbers', () => {
  expect(add(2, 3)).toBe(5);
});
```

**Key Points:**
- Tests ONE thing at a time
- Fast execution (no database, no network)
- Isolated (doesn't depend on other tests)

---

### 2. **Mocking Explained**

**What is Mocking?**
Creating fake versions of dependencies so we can test in isolation.

**Why Mock?**
- **Speed**: No real database = faster tests
- **Reliability**: No network issues, no database failures
- **Isolation**: Test only YOUR code, not dependencies
- **Control**: You control what the mock returns

**Example:**
```javascript
// Real code uses MongoDB
const user = await model.findOne({ email });

// In tests, we mock it
vi.mock('./model.js', () => ({
  findOne: vi.fn().mockResolvedValue({ email: 'test@example.com' })
}));
```

**Types of Mocks:**
- **Function Mocks**: `vi.fn()` - track calls, control return values
- **Module Mocks**: `vi.mock()` - replace entire modules
- **Object Mocks**: Create fake objects with expected properties

---

### 3. **Test Structure: AAA Pattern**

Every test follows this pattern:

```javascript
it('should do something', () => {
  // Arrange: Set up test data and mocks
  const mockUser = { id: '123', email: 'test@example.com' };
  vi.mocked(dao.findUser).mockResolvedValue(mockUser);
  
  // Act: Execute the function being tested
  const result = await getUser('123');
  
  // Assert: Verify the result
  expect(result).toEqual(mockUser);
});
```

- **Arrange**: Prepare everything needed for the test
- **Act**: Run the code you're testing
- **Assert**: Check if results match expectations

---

### 4. **Testing Backend vs Frontend**

| Aspect | Frontend | Backend |
|--------|----------|---------|
| **What we test** | React components, UI logic | API routes, database ops, middleware |
| **Dependencies** | Browser APIs, React | Database, HTTP, Sessions |
| **Mocking** | Mock API calls | Mock database, HTTP requests |
| **Tools** | Vitest + React Testing Library | Vitest + Express mocks |
| **Focus** | User interactions, rendering | Business logic, data flow |

---

### 5. **What Makes a Good Test?**

✅ **Fast**: Runs quickly (milliseconds, not seconds)
✅ **Isolated**: Doesn't depend on other tests
✅ **Repeatable**: Same result every time
✅ **Clear**: Easy to understand what's being tested
✅ **Comprehensive**: Tests happy path AND error cases

❌ **Bad Test Examples:**
- Tests that require real database
- Tests that depend on other tests
- Tests that are hard to understand
- Tests that only test happy path

---

## CI/CD Integration

Your tests run automatically in GitHub Actions:

```yaml
1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ Lint code
4. ✅ Run unit tests ← Your 40 tests run here!
5. ✅ Build
6. ✅ Upload artifacts
```

**If tests fail:**
- CI/CD pipeline stops
- Code cannot be merged
- You get immediate feedback
- Prevents broken code from reaching production

---

## Testing Best Practices

### 1. **Test Coverage**
Aim to test:
- ✅ Happy paths (normal operation)
- ✅ Error cases (invalid input, not found, etc.)
- ✅ Edge cases (empty data, null values, etc.)
- ✅ Security (authentication, authorization)

### 2. **Test Organization**
```javascript
describe('Feature Name', () => {
  describe('Function Name', () => {
    it('should do X when Y', () => { ... });
    it('should handle error Z', () => { ... });
  });
});
```

### 3. **Naming Conventions**
- Test names should be descriptive: `'should return 401 when user is not authenticated'`
- Use `describe` blocks to group related tests
- Use `it` or `test` for individual test cases

### 4. **Mock Management**
- Clear mocks between tests: `vi.clearAllMocks()` in `beforeEach`
- Reset mocks: `vi.resetAllMocks()` if needed
- Use `beforeEach` to set up fresh test data

---

## Common Testing Patterns

### Pattern 1: Testing Async Functions
```javascript
it('should fetch user', async () => {
  const user = await getUser('123');
  expect(user).toBeDefined();
});
```

### Pattern 2: Testing Error Cases
```javascript
it('should throw error when user not found', async () => {
  vi.mocked(dao.findUser).mockResolvedValue(null);
  await expect(getUser('invalid')).rejects.toThrow();
});
```

### Pattern 3: Testing Middleware
```javascript
it('should call next() when authenticated', () => {
  req.session.currentUser = { id: '123' };
  authenticateUser(req, res, next);
  expect(next).toHaveBeenCalled();
});
```

### Pattern 4: Testing Status Codes
```javascript
it('should return 404 when not found', () => {
  getPost('invalid', req, res);
  expect(res.status).toHaveBeenCalledWith(404);
});
```

---

## What to Test Next

Consider adding tests for:
- ✅ Post routes (create, update, delete posts)
- ✅ Chat routes (send messages, get messages)
- ✅ Report routes (create reports, admin actions)
- ✅ Integration tests (full API flows)
- ✅ Error handling edge cases

---

## Key Takeaways

1. **Unit tests** test individual functions in isolation
2. **Mocking** lets us test without real dependencies
3. **AAA pattern** (Arrange-Act-Assert) structures tests clearly
4. **Test coverage** should include happy paths AND error cases
5. **Fast tests** = faster development feedback
6. **CI/CD** runs tests automatically to catch bugs early

---

**Remember:** Good tests are an investment in code quality, team confidence, and bug prevention! 🚀

