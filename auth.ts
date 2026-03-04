import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "./lib/prisma";


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
          });

          if (!user) return null;
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
      // For OAuth providers, detect first-time sign-in and create workspace
      if (account?.provider !== "credentials" && user?.id) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              onboardingCompleted: true,
              workspaces: { take: 1 },
            },
          });
          // New OAuth user: no workspace memberships yet
          if (existingUser && existingUser.workspaces.length === 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                onboardingCompleted: false, 
                onboardingStep: 0,
                emailVerified: new Date(),  // Email is verified via OAuth provider
              },
            });
            await prisma.workspace.create({
              data: {
                name: `${user.name || user.email}'s Workspace`,
                description: "Default workspace",
                members: {
                  create: { userId: user.id, role: "owner" },
                },
              },
            });
          }
        } catch (error) {
          console.error("OAuth signIn hook error:", error);
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
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
      if (url.includes("/auth/signin")) return baseUrl + "/";
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.AUTH_SECRET,
  debug: false,
};

export const authOptions = config;
export const { auth, handlers, signIn, signOut } = NextAuth(config);
