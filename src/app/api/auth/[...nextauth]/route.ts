import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

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

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = (await res.json().catch(() => null)) as unknown;

        if (!res.ok || !data || typeof data !== "object") {
          const msg = (data as { message?: string } | null)?.message
            ?? (res.status === 401 ? "Invalid credentials" : `HTTP ${res.status}`);
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
        (token as { id?: string }).id = u.id;
        (token as { role?: string }).role = u.role;
        (token as { accessToken?: string }).accessToken = u.accessToken;
        (token as { refreshToken?: string }).refreshToken = u.refreshToken;
        (token as { accessTokenExpires?: number }).accessTokenExpires =
          Date.now() + ((u.expiresIn ?? 900) * 1000);
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: (token as { id?: string }).id,
        name: token.name,
        role: (token as { role?: string }).role,
      };
      (session as { accessToken?: string }).accessToken =
        (token as { accessToken?: string }).accessToken;
      (session as { refreshToken?: string }).refreshToken =
        (token as { refreshToken?: string }).refreshToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
