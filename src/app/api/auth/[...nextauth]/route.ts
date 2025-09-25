import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

const API_BASE_INTERNAL =
  process.env.API_BASE_INTERNAL || "http://141.11.156.52:3203";

/* ===================== Types ===================== */
type SignInSuccess = {
  id: string;
  name?: string;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
};

type SignInResponse = {
  user?: { _id?: string; username?: string; role?: string };
  _id?: string;
  username?: string;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  message?: string;
};

type AppJWT = JWT & {
  id?: string;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  refreshTokenExpires?: number;
};

type AppSession = Session & {
  user: {
    id?: string;
    name?: string | null;
    role?: string;
  };
  // ตั้งใจ "ไม่" ปล่อย token ออก client เพื่อความปลอดภัย
  // accessToken?: string;
  // refreshToken?: string;
};

/* ===================== Utils ===================== */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getMessage(v: unknown): string | undefined {
  if (isObject(v) && typeof v.message === "string") return v.message;
  return undefined;
}

/* =================== NextAuth ==================== */
export const authOptions: NextAuthOptions = {
  // ให้ตรงกับ middleware ที่ redirect -> /auth/signin
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
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const text = await res.text();
        let data: unknown = null;
        try {
          data = JSON.parse(text);
        } catch {
          // ignore parsing error -> handled by !res.ok branch
        }

        if (!res.ok || !isObject(data)) {
          const msg =
            getMessage(data) ??
            (res.status === 401 ? "Invalid credentials" : `HTTP ${res.status}`);
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

      // เซ็ตค่าเมื่อ login ครั้งแรก
      if (user) {
        const u = user as SignInSuccess;
        t.name = u.name ?? t.name ?? null;
        t.id = u.id;
        t.role = u.role;
        t.accessToken = u.accessToken;
        t.refreshToken = u.refreshToken;
        t.accessTokenExpires = Date.now() + (u.expiresIn ?? 900) * 1000;

        // อายุ refresh token
        const refreshTtlSec =
          (u.refreshExpiresIn as number | undefined) ??
          Number(process.env.REFRESH_MAX_AGE_SEC ?? 60 * 60 * 24 * 30);
        t.refreshTokenExpires = Date.now() + refreshTtlSec * 1000;

        // log หลัง login
        console.log("[Auth] Login success:", {
          userId: t.id,
          role: t.role,
          accessTokenExpiresAt: new Date(t.accessTokenExpires).toISOString(),
          refreshTokenExpiresAt: new Date(t.refreshTokenExpires).toISOString(),
        });

        return t;
      }

      // ถ้า refresh token หมดอายุแล้ว -> ล้าง session ให้ logout ทันที
      if (t.refreshTokenExpires && Date.now() >= t.refreshTokenExpires) {
        return {}; // จะทำให้ getSession()/getToken ว่าง และ middleware จะเด้งออก
      }

      // access token ยังไม่หมด -> ใช้ต่อ
      const safeMargin = 30 * 1000;
      if (
        t.accessToken &&
        t.accessTokenExpires &&
        Date.now() < t.accessTokenExpires - safeMargin
      ) {
        return t;
      }

      // access token หมด/ใกล้หมด -> ลอง refresh (ถ้ายังมี refresh token และยังไม่หมด)
      try {
        if (t.refreshToken) {
          const resp = await fetch(`${API_BASE_INTERNAL}/auth/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
            },
            body: JSON.stringify({ refreshToken: t.refreshToken }),
          });
          if (!resp.ok) throw new Error("refresh failed");

          const rd = (await resp.json()) as {
            accessToken: string;
            refreshToken?: string;
            expiresIn?: number;
            refreshExpiresIn?: number;
          };

          t.accessToken = rd.accessToken;
          t.refreshToken = rd.refreshToken ?? t.refreshToken;
          t.accessTokenExpires = Date.now() + (rd.expiresIn ?? 900) * 1000;

          // ถ้ามี refreshExpiresIn ใหม่ ให้ต่ออายุ; ถ้าไม่มีก็ใช้ค่าของเดิม
          if (typeof rd.refreshExpiresIn === "number") {
            t.refreshTokenExpires = Date.now() + rd.refreshExpiresIn * 1000;
          }
          return t;
        }
      } catch {
        // refresh ไม่ได้ -> เคลียร์ token เพื่อให้ระบบบังคับ login ใหม่
        return {};
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

      // ถ้าจำเป็นต้องใช้ token ฝั่ง client ค่อยเปิดสองบรรทัดนี้
      // s.accessToken = t.accessToken;
      // s.refreshToken = t.refreshToken;

      return s;
    },
  },

  /**
   * signOut จากที่ไหนก็ตาม -> ยิงไป backend เพื่อ revoke/logout
   * หมายเหตุ: ไม่ block การ logout แม้ backend พัง (ทำ best-effort)
   */
  events: {
    async signOut({ token }) {
      try {
        const t = token as AppJWT;
        if (!t?.accessToken) return;
        await fetch(`${API_BASE_INTERNAL}/auth/logout`, {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken: t.accessToken }),
        });
      } catch {
        // ignore
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
