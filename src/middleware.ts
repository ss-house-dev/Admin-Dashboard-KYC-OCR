import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = req.nextUrl; 

  if (!token) {
    if (url.pathname.startsWith("/sign-in")) return NextResponse.next();
    return NextResponse.redirect(new URL("/sign-in", url));
  }

  const rtx = (token as any).refreshTokenExpires as number | undefined;
  if (rtx && Date.now() >= rtx) {
    return NextResponse.redirect(
      new URL(`/api/auth/signout?callbackUrl=${encodeURIComponent("/sign-in")}`, url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-dashboard/:path*"],
};
