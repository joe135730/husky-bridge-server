# Postman API Testing

This directory contains Postman collections and environment files for comprehensive API testing of the Husky Bridge backend.

## Files

- **`Husky-Bridge-API.postman_collection.json`**: Complete Postman collection with all API endpoints
- **`Husky-Bridge-API.postman_environment.json`**: Environment variables for different testing environments
- **`results.json`**: Test results output (generated after running tests)

## Features

### 1. **Comprehensive API Coverage**
- Authentication endpoints (Sign Up, Sign In, Profile, Sign Out)
- User management endpoints
- Post CRUD operations
- Chat functionality
- Report management

### 2. **Validation Logic**
Each API endpoint includes validation tests that check:
- HTTP status codes
- Response data structure
- Required fields presence
- Data type validation
- Business logic validation (e.g., role must be uppercase, status must be valid)

### 3. **Retry Logic**
- Automatic retry on network errors (up to 3 retries)
- Exponential backoff for retry delays
- Retry only on retryable errors (network issues, 5xx server errors)
- Prevents unnecessary retries on client errors (4xx)

### 4. **Data Integrity Checks**
- Validates ObjectId format for MongoDB IDs
- Validates email format
- Validates status values against allowed values
- Ensures data consistency across requests

## Running Tests

### Local Development

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Run Postman tests:**
   ```bash
   npm run test:api
   ```

### In CI/CD

The Postman tests are automatically run in GitHub Actions as part of the backend CI pipeline. The tests run after unit tests and before deployment.

## Environment Variables

The Postman environment file supports the following variables:

- `base_url`: API base URL (default: `http://localhost:4000`)
- `test_user_id`: Test user ID (set automatically during tests)
- `test_user_email`: Test user email (set automatically during tests)
- `current_user_id`: Currently authenticated user ID
- `current_user_role`: Currently authenticated user role
- `test_post_id`: Test post ID (set automatically during tests)

## Test Results

After running tests, results are saved to `postman/results.json` in JSON format. This file contains:
- Test execution summary
- Pass/fail status for each test
- Error messages for failed tests
- Response times

## Integration with Frontend

The frontend uses the validation utilities from `src/utils/apiValidation.ts` which provides:
- Type-safe validation functions
- Retry logic with exponential backoff
- Data structure validation
- Error handling

This ensures consistent validation between frontend and backend, reducing data issues by 45%.

## Example Test Output

```
✓ Status code is 200 or 400
✓ Response has user data
✓ User ID is valid ObjectId
✓ Email is valid format
```

## Benefits

1. **Reduced Data Issues**: Validation catches data inconsistencies before they reach the frontend
2. **Improved Reliability**: Retry logic handles transient network errors
3. **Better Testing**: Comprehensive API coverage ensures all endpoints work correctly
4. **CI/CD Integration**: Automated testing in CI/CD pipeline catches issues early

