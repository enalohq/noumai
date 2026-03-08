// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import util from 'util';
import { ReadableStream } from 'stream/web';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret';

// Add TextEncoder/TextDecoder polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

// Add ReadableStream polyfill for LangChain compatibility
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream;
}

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
      this._body = init?.body;
    }

    async json() {
      if (typeof this._body === 'string') {
        return JSON.parse(this._body);
      }
      return this._body;
    }

    async text() {
      return this._body?.toString() || '';
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
    json: (data, init) => {
      const response = new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: init?.headers || {},
      });
      response.status = init?.status || 200;
      return response;
    },
  },
}));

// Mock Prisma before any imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    competitor: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    trackedPrompt: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
