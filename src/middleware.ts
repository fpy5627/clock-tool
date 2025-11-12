import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  
  // Remove Content-signal header if it exists
  // This header is not recognized by search engine crawlers and should be removed
  if (response instanceof NextResponse) {
    response.headers.delete("Content-signal");
    response.headers.delete("content-signal");
  }
  
  return response;
}

export const config = {
  matcher: [
    "/",
    "/(en|en-US|zh|zh-CN|zh-TW|zh-HK|zh-MO|ja|ko|ru|fr|de|ar|es|it)/:path*",
    "/((?!api/|_next|_vercel|.*\\..*).*)",
  ],
};
