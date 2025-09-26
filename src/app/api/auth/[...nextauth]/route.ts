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
  accessToken?: string;
  refreshToken?: string;
};

/* ===================== Utils ===================== */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getMessage(v: unknown): string | undefined {
  if (isObject(v) && typeof v.message === "string") return v.message;
  return undefined;
}

/** พยายามดึง role จาก /auth/me ถ้ามี accessToken (บาง backend ให้มาด้วย) */
async function fetchRoleFromMe(
  accessToken: string
): Promise<string | undefined> {
  try {
    const res = await fetch(`${API_BASE_INTERNAL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as unknown;
    if (isObject(data)) {
      // เผื่อ backend ใส่ role ไว้บน root หรือซ้อนใน user
      if (typeof data.role === "string") return data.role;
      const u = data.user;
      if (isObject(u) && typeof u.role === "string") return u.role;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/* =================== NextAuth ==================== */
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

        // ไม่เดา "user" เอง — ถ้าไม่มี role จะพยายามดึงจาก /auth/me
        let role: string | undefined = d.user?.role ?? d.role ?? undefined;

        const accessToken = d.accessToken;
        if (!role && typeof accessToken === "string" && accessToken) {
          role = await fetchRoleFromMe(accessToken);
        }

        const out: SignInSuccess = {
          id: d.user?._id ?? d._id ?? username,
          name: d.user?.username ?? d.username ?? username,
          role, // อาจเป็น "admin" หรือ undefined แต่ไม่ default เป็น "user"
          accessToken,
          refreshToken: d.refreshToken,
          expiresIn: d.expiresIn,
          refreshExpiresIn: d.refreshExpiresIn,
        };

        console.log("[Auth] authorize() result:", {
          userId: out.id,
          name: out.name,
          role: out.role ?? "(none)",
          hasAccessToken: Boolean(out.accessToken),
          hasRefreshToken: Boolean(out.refreshToken),
        });

        return out;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      const t = token as AppJWT;

      // login ครั้งแรก
      if (user) {
        const u = user as SignInSuccess;
        t.name = u.name ?? t.name ?? null;
        t.id = u.id;
        // เก็บ role (ถ้า backend ให้มา) — ถ้าไม่มี ให้คงค่าเดิมไว้
        t.role = u.role ?? t.role;
        t.accessToken = u.accessToken;
        t.refreshToken = u.refreshToken;
        t.accessTokenExpires = Date.now() + (u.expiresIn ?? 900) * 1000;

        const refreshTtlSec =
          (u.refreshExpiresIn as number | undefined) ??
          Number(process.env.REFRESH_MAX_AGE_SEC ?? 60 * 60 * 24 * 30);
        t.refreshTokenExpires = Date.now() + refreshTtlSec * 1000;

        console.log("[Auth] Login success:", {
          userId: t.id,
          role: t.role ?? "(none)",
          accessTokenExpiresAt: new Date(t.accessTokenExpires).toISOString(),
          refreshTokenExpiresAt: new Date(t.refreshTokenExpires).toISOString(),
        });

        return t;
      }

      // refresh token หมด -> เคลียร์ session
      if (t.refreshTokenExpires && Date.now() >= t.refreshTokenExpires) {
        console.warn("[Auth] Refresh token expired -> clearing session");
        return {};
      }

      // access token ยังใช้ได้
      const safeMargin = 30 * 1000;
      if (
        t.accessToken &&
        t.accessTokenExpires &&
        Date.now() < t.accessTokenExpires - safeMargin
      ) {
        return t;
      }

      // ลอง refresh access token
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
            role?: string; // เผื่อ backend ใส่ role มา
          };

          t.accessToken = rd.accessToken;
          t.refreshToken = rd.refreshToken ?? t.refreshToken;
          t.accessTokenExpires = Date.now() + (rd.expiresIn ?? 900) * 1000;

          if (typeof rd.refreshExpiresIn === "number") {
            t.refreshTokenExpires = Date.now() + rd.refreshExpiresIn * 1000;
          }

          // ถ้า refresh response ให้ role มาด้วย ก็อัปเดต
          if (typeof rd.role === "string") {
            t.role = rd.role;
          }

          console.log("[Auth] Token refreshed:", {
            userId: t.id,
            role: t.role ?? "(none)",
            accessTokenExpiresAt: new Date(t.accessTokenExpires).toISOString(),
            refreshTokenExpiresAt: new Date(
              t.refreshTokenExpires ?? 0
            ).toISOString(),
          });

          return t;
        }
      } catch (e) {
        console.error("[Auth] Refresh token failed:", e);
        return {};
      }

      return t;
    },

    async session({ session, token }) {
      const t = token as AppJWT;
      const s = session as AppSession;

      console.log("[Auth] session() callback:", {
        token,
        session,
      });

      s.user = {
        ...s.user,
        id: t.id,
        name: s.user?.name ?? t.name ?? null,
        role: t.role,
      };

      s.accessToken = t.accessToken;
      s.refreshToken = t.refreshToken;

      console.groupCollapsed("[Auth] Session built");
      console.table({
        userId: s.user?.id,
        role: s.user?.role ?? "(none)",
        hasAccessToken: Boolean(s.accessToken),
        hasRefreshToken: Boolean(s.refreshToken),
      });
      console.groupEnd();

      return s;
    },
  },

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
