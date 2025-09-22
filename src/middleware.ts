import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const AUTH_PAGE_REGEX = /^\/((auth\/(signin|signup))|(sign-in|sign-up))\/?$/i;
const PROTECTED_PREFIXES = ["/admin-dashboard"];

export default withAuth(
  (req: NextRequestWithAuth) => {
    const { pathname } = req.nextUrl;
    const isAuth = !!req.nextauth.token;

    const isAuthPage = AUTH_PAGE_REGEX.test(pathname);
    const isProtected = PROTECTED_PREFIXES.some((p) =>
      pathname.startsWith(p)
    );

    // ล็อกอินแล้ว → ห้ามเข้า sign-in/sign-up
    if (isAuth && isAuthPage) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin-dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // ยังไม่ล็อกอิน → ห้ามเข้าแดชบอร์ด
    if (!isAuth && isProtected) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/signin";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // ให้เราเป็นคนตัดสินใจ redirect เอง
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    "/auth/:path*",
    "/sign-in",
    "/sign-up",
    "/admin-dashboard/:path*",
  ],
};
