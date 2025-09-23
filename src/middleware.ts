import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const AUTH_PAGE_REGEX = /^\/((auth\/(signin|signup))|(sign-in|sign-up))\/?$/i;
const PROTECTED_PREFIXES = ["/admin-dashboard"]; // ต้องล็อกอินก่อนเข้า

export default withAuth(
  (req: NextRequestWithAuth) => {
    const { pathname } = req.nextUrl;
    const isAuth = !!req.nextauth.token;

    const isAuthPage = AUTH_PAGE_REGEX.test(pathname);
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

    // ยังไม่ล็อกอิน + พยายามเข้าแดชบอร์ด → คง URL เดิม แต่แสดงหน้า /sign-in
    if (!isAuth && isProtected) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in"; // <<-- หน้า Sign-in ที่ "มีอยู่จริง"
      return NextResponse.rewrite(url);
    }

    // ล็อกอินแล้ว แต่จะเข้า sign-in/sign-up → ส่งกลับแดชบอร์ด
    if (isAuth && isAuthPage) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin-dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // ให้ middleware ทำงานเสมอ เราจะเป็นคนตัดสินใจ rewrite/redirect เอง
      authorized: () => true,
    },
    // ไม่ต้องกำหนด pages.signIn ที่นี่ เพื่อกัน next-auth แทรกทางเอง
  }
);

// ให้ทำงานเฉพาะเส้นทางที่เกี่ยวข้อง
export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/auth/:path*",          // เผื่อคุณมีเส้นทาง auth เก่า
    "/admin-dashboard/:path*",
  ],
};
