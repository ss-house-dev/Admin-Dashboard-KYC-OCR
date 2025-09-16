// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_BASE_INTERNAL =
  process.env.API_BASE_INTERNAL || "http://141.11.156.52:3203"; // << ใช้ base ฝั่งเซิร์ฟเวอร์เท่านั้น

type SignInSuccess = {
  id: string;
  name?: string;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
};

export const authOptions: NextAuthOptions = {
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds): Promise<SignInSuccess | null> {
        const username = String(creds?.username ?? "");
        const password = String(creds?.password ?? "");

        const url = new URL("/auth/signin", API_BASE_INTERNAL).toString();

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const text = await res.text();
        const data = (() => { try { return JSON.parse(text); } catch { return null; } })();

        if (!res.ok || !data || typeof data !== "object") {
          const msg =
            (data as any)?.message ??
            (res.status === 401 ? "Invalid credentials" : `HTTP ${res.status}`);

          throw new Error(msg);
        }

        const d = data as {
          user?: { _id?: string; username?: string; role?: string };
          _id?: string;
          username?: string;
          role?: string;
          accessToken?: string;
          refreshToken?: string;
          expiresIn?: number;
        };

        return {
          id: d.user?._id ?? d._id ?? username,
          name: d.user?.username ?? d.username ?? username,
          role: d.user?.role ?? d.role ?? "user",
          accessToken: d.accessToken,
          refreshToken: d.refreshToken,
          expiresIn: d.expiresIn,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as SignInSuccess;
        token.name = u.name ?? token.name;
        (token as any).id = u.id;
        (token as any).role = u.role;
        (token as any).accessToken = u.accessToken;
        (token as any).refreshToken = u.refreshToken;
        (token as any).accessTokenExpires = Date.now() + ((u.expiresIn ?? 900) * 1000);
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: (token as any).id,
        name: token.name,
        role: (token as any).role,
      };
      (session as any).accessToken = (token as any).accessToken;
      (session as any).refreshToken = (token as any).refreshToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
