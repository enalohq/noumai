/**
 * Test Helpers - Reusable utilities for testing
 * Follows DRY principle by centralizing common test patterns
 */

/**
 * Suppress console.error during test execution
 * Useful for testing error handling without polluting test output
 */
export async function withSuppressedConsoleError<T>(
  fn: () => Promise<T>
): Promise<T> {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    return await fn();
  } finally {
    spy.mockRestore();
  }
}

/**
 * Suppress console.warn during test execution
 */
export async function withSuppressedConsoleWarn<T>(
  fn: () => Promise<T>
): Promise<T> {
  const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    return await fn();
  } finally {
    spy.mockRestore();
  }
}

/**
 * Verify that console.error was called with expected message
 */
export function expectErrorLogged(
  spy: jest.SpyInstance,
  expectedMessage: string
): void {
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining(expectedMessage),
    expect.any(Error)
  );
}

/**
 * Verify that console.warn was called with expected message
 */
export function expectWarnLogged(
  spy: jest.SpyInstance,
  expectedMessage: string
): void {
  expect(spy).toHaveBeenCalledWith(expect.stringContaining(expectedMessage));
}

/**
 * Create a mock request object for API route testing
 */
export function createMockRequest(body: any) {
  return {
    json: jest.fn().mockResolvedValue(body),
    method: 'POST',
    url: new URL('http://localhost:3000/api/test'),
    headers: new Map(),
    nextUrl: new URL('http://localhost:3000/api/test'),
  } as any;
}

/**
 * Create a mock Prisma user object
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Create a mock Prisma account object
 */
export function createMockAccount(overrides = {}) {
  return {
    provider: 'google',
    providerAccountId: 'google-123',
    type: 'oauth' as const,
    userId: 'user-123',
    ...overrides,
  };
}
