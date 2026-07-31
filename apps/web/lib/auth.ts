import Credentials from "next-auth/providers/credentials";
import { parrotClient } from "./parrot";
import { AuthOptions, DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      activeTenantId: string | null;
      email: string;
      name: string;
      tenants: Array<{ id: string; name: string; logoUrl?: string }>;
      sessionToken?: string;
      defaultPropertyId?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    sessionToken: string;
    name: string;
    email: string;
    tenants: Array<{ id: string; name: string; logoUrl?: string }>;
    activeTenantId: string | null;
    defaultPropertyId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    sessionToken: string;
    name: string;
    email: string;
    tenants: Array<{ id: string; name: string; logoUrl?: string }>;
    activeTenantId: string | null;
    defaultPropertyId?: string;
  }
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
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
          parrotClient.setToken(token);
          parrotClient.setTenantId(activeTenantId);
          parrotClient.ws.connect({
            type: "agent",
          });
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            sessionToken: token,
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
    async jwt({ token, user, trigger, session }) {
      // Runs on initial sign-in; persist API data into the JWT
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.tenants = user.tenants;
        token.activeTenantId = user.activeTenantId;
        token.sessionToken = user.sessionToken;
      }

      // Handle update() from client
      if (trigger === "update" && session?.user) {
        if (session.user.tenants) {
          token.tenants = session.user.tenants;
        }
        if (session.user.activeTenantId !== undefined) {
          token.activeTenantId = session.user.activeTenantId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose only what the client needs
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        activeTenantId: token.activeTenantId,
        tenants: token.tenants,
        sessionToken: token.sessionToken,
      };
      // session.tenants = token.tenants as any[];
      // session.activeTenantId = token.activeTenantId as string | null;
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
