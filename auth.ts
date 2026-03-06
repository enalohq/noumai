import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "./lib/prisma";
import { accountLinkingService } from "./lib/auth/account-linking";


declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      onboardingCompleted: boolean;
    };
  }
}

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: { accounts: true }
          });

          if (!user) return null;
          
          // Scenario 2: User has OAuth account but trying to use credentials
          // Check if user has OAuth accounts but no password
          const hasOAuthAccount = user.accounts.some(acc => acc.provider !== 'credentials');
          if (hasOAuthAccount && !user.password) {
            // User has OAuth account but no password set
            // This is a linking scenario - allow it to proceed
            // The password will be set during account linking
            console.log(`User ${credentials.email} attempting credentials login with existing OAuth account`);
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          }
          
          if (!user.password) return null;

          const isValid = await compare(credentials.password as string, user.password);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true, // Enable automatic account linking
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 hours in seconds (adjust as needed)
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Scenario 1: OAuth account linking (Email/Password → OAuth)
      if (account?.provider !== "credentials" && user?.email && account) {
        try {
          const result = await accountLinkingService.linkOAuthAccount(user, account);
          
          if (!result.success) {
            console.error("OAuth account linking failed:", result.error);
            return false;
          }

          if (result.action === 'linked') {
            console.log(`Successfully linked ${account.provider} account to existing user: ${user.email}`);
          }

          return true;
        } catch (error) {
          console.error("OAuth signIn hook error:", error);
          return false;
        }
      }

      // Scenario 2: Credentials account linking (OAuth → Email/Password)
      if (account?.provider === "credentials" && user?.email) {
        try {
          const result = await accountLinkingService.linkCredentialsAccount(user.email, user.id);
          
          if (!result.success) {
            console.error("Credentials account linking failed:", result.error);
            return false;
          }

          if (result.action === 'linked') {
            console.log(`Successfully linked credentials account to existing OAuth user: ${user.email}`);
          }

          return true;
        } catch (error) {
          console.error("Credentials signIn hook error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, account }) {
      // Handle user ID from OAuth linking
      if (user) {
        token.sub = user.id;
      }

      // For OAuth sign-ins, ensure we get the correct user ID
      if (account?.provider !== "credentials" && user?.email && !token.sub) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true }
          });
          if (existingUser) {
            token.sub = existingUser.id;
          }
        } catch (error) {
          console.error("Error finding user in JWT callback:", error);
        }
      }

      // Refresh onboardingCompleted from DB on initial sign-in or session.update()
      if ((trigger === "update" || user) && token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub as string },
            select: { onboardingCompleted: true },
          });
          token.onboardingCompleted = dbUser?.onboardingCompleted ?? false;
        } catch {
          token.onboardingCompleted = false;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id: string }).id = token.sub as string;
        (session.user as { onboardingCompleted: boolean }).onboardingCompleted =
          (token.onboardingCompleted as boolean) ?? false;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle post-authentication redirects
      if (url.includes("/auth/signin")) return baseUrl + "/";
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async linkAccount({ user, account }) {
      // Log successful account linking
      console.log(`Account linked: ${account.provider} for user ${user.email}`);
    },
  },
  secret: process.env.AUTH_SECRET,
  debug: false,
};

export const authOptions = config;
export const { auth, handlers, signIn, signOut } = NextAuth(config);
