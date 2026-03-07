// Mock for next-auth
export const getServerSession = jest.fn();
export const auth = jest.fn();
export const signIn = jest.fn();
export const signOut = jest.fn();
export const useSession = jest.fn(() => ({
  data: null,
  status: 'unauthenticated',
}));

export const SessionProvider = ({ children }: { children: React.ReactNode }) => children;

export default {
  getServerSession,
  auth,
  signIn,
  signOut,
  useSession,
  SessionProvider,
};