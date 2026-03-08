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
 * Create a proper Next.js Request object for API route testing
 */
export function createNextRequest(options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  url?: string;
} = {}) {
  const method = options.method || 'GET';
  const url = options.url || 'http://localhost:3000/api/test';
  const headers = new Headers(options.headers || {});
  
  const bodyData = options.body ? JSON.stringify(options.body) : undefined;
  
  const request = new Request(url, {
    method,
    headers,
    body: bodyData,
  }) as any;

  // Override json() to return the parsed body
  if (options.body) {
    request.json = async () => options.body;
  } else {
    request.json = async () => ({});
  }

  return request;
}

/**
 * Create a proper Next.js Response object for API route testing
 */
export function createNextResponse(options: {
  status?: number;
  body?: any;
  headers?: Record<string, string>;
} = {}) {
  const status = options.status || 200;
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const headers = new Headers(options.headers || {});

  return new Response(body, {
    status,
    headers,
  });
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
 * Setup common mocks for onboarding route tests
 */
export function setupOnboardingMocks() {
  return {
    workspace: {
      update: jest.fn().mockResolvedValue({ id: 'workspace-123' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'workspace-123' }),
      findFirst: jest.fn().mockResolvedValue({ id: 'workspace-123' }),
      create: jest.fn().mockResolvedValue({ id: 'workspace-123' }),
    },
    workspaceMember: {
      findFirst: jest.fn().mockResolvedValue({ workspaceId: 'workspace-123' }),
      create: jest.fn().mockResolvedValue({ id: 'member-123' }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      }),
      update: jest.fn().mockResolvedValue({ id: 'user-123', onboardingStep: 1 }),
    },
    competitor: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'competitor-123' }),
    },
    trackedPrompt: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'prompt-123' }),
    },
    $transaction: jest.fn((fn) => {
      if (typeof fn === 'function') return fn();
      return Promise.all(fn);
    }),
  };
}
