// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Add Web APIs that are missing in Jest environment
if (typeof Request === 'undefined') {
  global.Request = class {
    constructor(url, init) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Map();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }
  };
}

if (typeof Response === 'undefined') {
  global.Response = class {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Map();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }

    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'));
    }
  };
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
  }),
}));

// Mock Next.js server modules
jest.mock('next/server', () => ({
  NextRequest: class {
    constructor(url, init) {
      this.url = url;
      this.method = init?.method || 'GET';
    }
  },
  NextResponse: {
    json: (data, init) => ({
      ...init,
      json: () => Promise.resolve(data),
    }),
  },
}));

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.DATABASE_URL = 'file:./test.db';

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});