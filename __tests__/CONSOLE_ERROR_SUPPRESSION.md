# Console Error Suppression - Best Practice Implementation

## Problem Statement

During test execution, error handling tests were logging `console.error` output, which polluted the test output and made it harder to read test results. The user questioned whether suppressing console output was a valid software engineering practice.

## Solution: Suite-Level Console Suppression

We implemented **suite-level console suppression** using Jest spies in `beforeEach` and `afterEach` hooks. This approach:

1. **Suppresses console output during tests** - Keeps test output clean
2. **Preserves error logging in production code** - Errors are still logged (essential for debugging)
3. **Verifies logging occurred** - Tests can assert that errors were logged with correct messages
4. **Follows SOLID principles** - Maintains separation of concerns

## Why This Is Correct Software Engineering

### 1. Single Responsibility Principle (SRP)

- **Production code responsibility**: Log errors for debugging and monitoring
- **Test code responsibility**: Verify behavior and suppress console output for readability
- These are separate concerns that should not interfere with each other

### 2. Dependency Inversion Principle (DIP)

- Production code does NOT depend on test infrastructure
- Tests depend on mocking infrastructure (Jest spies)
- The route handler logs errors regardless of test environment

### 3. Separation of Concerns

```
Production Code:
  - Handles requests
  - Logs errors to console (for debugging/monitoring)
  - Returns error responses

Test Code:
  - Mocks dependencies
  - Suppresses console output (for readability)
  - Verifies behavior and logging occurred
```

### 4. DRY Principle

Instead of wrapping each error test with `withSuppressedConsoleError()`:

```typescript
// ❌ Before: Repetitive wrapping
it("should handle error", async () => {
  const result = await withSuppressedConsoleError(async () => {
    return await service.method();
  });
  expect(result).toBeDefined();
});
```

We now suppress at the suite level:

```typescript
// ✅ After: DRY - centralized suppression
describe('Service', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle error', async () => {
    const result = await service.method();
    expect(result).toBeDefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(...);
  });
});
```

## Implementation Details

### Files Updated

1. **`__tests__/api/competitors/discover.test.ts`**
   - Suite-level console.error suppression
   - Verifies error logging with `expect(consoleErrorSpy).toHaveBeenCalledWith(...)`

2. **`__tests__/lib/auth/account-linking.test.ts`**
   - Suite-level console.error suppression
   - Verifies specific error message: `'OAuth account linking error:'`

3. **`__tests__/lib/auth/provider-tracker.test.ts`**
   - Suite-level console.error suppression
   - Three error handling tests verify logging occurred

4. **`__tests__/integration/account-linking-flow.test.ts`**
   - Suite-level console.error suppression
   - Integration test verifies error logging

### Pattern

```typescript
describe("Service Name", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // ... other setup
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should handle errors gracefully", async () => {
    // ... test setup
    const result = await service.method();

    // Verify behavior
    expect(result.success).toBe(false);

    // Verify logging occurred
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Expected error message:",
      expect.any(Error),
    );
  });
});
```

## Test Results

✅ **All 271 tests pass**
✅ **No console.error pollution in test output**
✅ **Error logging is verified in tests**
✅ **Production code unchanged** - errors still logged in real environment

## Key Principles Applied

| Principle                  | Application                                              |
| -------------------------- | -------------------------------------------------------- |
| **SRP**                    | Production logs errors; tests verify logging             |
| **DIP**                    | Tests depend on mocks, not vice versa                    |
| **DRY**                    | Centralized suppression, not repeated in each test       |
| **Separation of Concerns** | Logging and testing are separate responsibilities        |
| **Behavior Verification**  | Tests verify that errors are logged, not just suppressed |

## Conclusion

This approach is **solid software engineering** because:

1. ✅ Production code maintains its responsibility to log errors
2. ✅ Tests maintain their responsibility to verify behavior
3. ✅ Test output is clean and readable
4. ✅ Error logging is verified, not hidden
5. ✅ Code follows SOLID principles and DRY
6. ✅ No workarounds or hacks - standard Jest patterns

The console.error output is not removed from production; it's only suppressed during tests to keep test output clean while still verifying that logging occurred.
