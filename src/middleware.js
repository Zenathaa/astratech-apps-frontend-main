import { NextResponse } from "next/server";

const LOGIN_PATH = "/auth/login";
const SSO_PATH = "/auth/sso";
const PROTECTED_PAGES_PATH = "/pages";
const ROOT_PATH = "/";
const COOKIE_JWT = "jwtToken";
const COOKIE_SSO = "ssoData";
const COOKIE_USER_DATA = "userData";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL(LOGIN_PATH, request.url);
  const ssoUrl = new URL(SSO_PATH, request.url);
  const hasJwt = request.cookies.has(COOKIE_JWT);
  const hasSso = request.cookies.has(COOKIE_SSO);
  const hasUser = request.cookies.has(COOKIE_USER_DATA);
  const isAuthenticated = hasJwt && hasSso;
  const isFullyAuthenticated = isAuthenticated && hasUser;

  if (pathname === ROOT_PATH) {
    return NextResponse.redirect(loginUrl);
  }

  const isPublicPath = pathname.startsWith(LOGIN_PATH);
  if (isPublicPath) {
    if (isAuthenticated) {
      return NextResponse.redirect(ssoUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith(SSO_PATH)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith(PROTECTED_PAGES_PATH)) {
    if (!isFullyAuthenticated) {
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
