import Credentials from "next-auth/providers/credentials";
import { parrotClient } from "./parrot";
import { AuthOptions, DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    apiToken: string;
    activeTenantId: string | null;
    tenants: Array<{ id: string; name: string }>;
    user: DefaultSession["user"];
  }

  interface User extends DefaultUser {
    token: string;
    tenants: Array<{ id: string; name: string }>;
    activeTenantId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    apiToken: string;
    tenants: Array<{ id: string; name: string }>;
    activeTenantId: string | null;
  }
}

export const authOptions: AuthOptions = {
  secret: "process.env.AUTH_SECRET",
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentials as {
            email: string;
            password: string;
          };

          const res = await parrotClient.auth.login({ email, password });

          if (!res.data) return null;

          const { token, user, tenants, lastActiveTenantId } = res.data;
          const activeTenantId = lastActiveTenantId ?? tenants[0]?.id ?? null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            token,
            tenants,
            activeTenantId,
          };
        } catch (err: any) {
          // Surface the API error message to the client
          throw new Error(err?.message ?? "Authentication failed.");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Runs on initial sign-in; persist API data into the JWT
      if (user) {
        token.apiToken = (user as any).token;
        token.tenants = (user as any).tenants;
        token.activeTenantId = (user as any).activeTenantId;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Expose only what the client needs
      session.apiToken = token.apiToken as string;
      session.tenants = token.tenants as any[];
      session.activeTenantId = token.activeTenantId as string | null;
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
};
