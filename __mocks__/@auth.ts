// Mock for @/auth (next-auth wrapper)
const mockAuth = jest.fn();

export const auth = mockAuth;

export const handlers = {
  GET: jest.fn(),
  POST: jest.fn(),
};

export const signIn = jest.fn();
export const signOut = jest.fn();

export default {
  auth,
  handlers,
  signIn,
  signOut,
};