import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  pages: { signIn: "/sign-in" }, // ใช้หน้าล็อกอินของเราเอง
  session: { strategy: "jwt" }, // เก็บ session แบบ JWT

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const username = creds?.username as string;
        const password = creds?.password as string;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signin`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          }
        );

        if (!res.ok) return null; // ให้ NextAuth มองว่า credential ผิด

        const data = await res.json();
        // NOTE: ปรับ mapping ตาม response ของ BE
        return {
          id: data.user?._id ?? data._id ?? username,
          name: data.user?.username ?? data.username ?? username,
          role: data.user?.role ?? data.role ?? "user",
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // ครั้งแรกหลัง authorize สำเร็จ
      if (user) {
        token.id = (user as any).id;
        token.name = user.name ?? token.name;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
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
      // เพิ่ม token ลง session (ฝั่ง client จะดึงไปยิง API ต่อ)
      (session as any).accessToken = (token as any).accessToken;
      (session as any).refreshToken = (token as any).refreshToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
