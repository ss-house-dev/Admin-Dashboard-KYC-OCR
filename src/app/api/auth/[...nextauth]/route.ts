import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

const API_BASE_INTERNAL =
  process.env.API_BASE_INTERNAL || "http://141.11.156.52:3203";

type SignInSuccess = {
  id: string;
  name?: string;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
};

type SignInResponse = {
  user?: { _id?: string; username?: string; role?: string };
  _id?: string;
  username?: string;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
};

type AppJWT = JWT & {
  id?: string;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
};

type AppSession = Session & {
  user: {
    id?: string;
    name?: string | null;
    role?: string;
  };
  accessToken?: string;
  refreshToken?: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getMessage(v: unknown): string | undefined {
  if (isObject(v) && typeof v.message === "string") return v.message;
  return undefined;
}

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
        let data: unknown = null;
        try {
          data = JSON.parse(text);
        } catch {
          // ignore
        }

        if (!res.ok || !isObject(data)) {
          const msg = getMessage(data) ?? (res.status === 401 ? "Invalid credentials" : `HTTP ${res.status}`);
          throw new Error(msg);
        }

        const d = data as SignInResponse;

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
      const t = token as AppJWT;

      if (user) {
        const u = user as unknown as SignInSuccess;
        t.name = u.name ?? t.name ?? null;
        t.id = u.id;
        t.role = u.role;
        t.accessToken = u.accessToken;
        t.refreshToken = u.refreshToken;
        t.accessTokenExpires = Date.now() + ((u.expiresIn ?? 900) * 1000);
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as AppJWT;
      const s = session as AppSession;

      s.user = {
        ...s.user,
        id: t.id,
        name: s.user?.name ?? t.name ?? null,
        role: t.role,
      };
      s.accessToken = t.accessToken;
      s.refreshToken = t.refreshToken;
      return s;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
