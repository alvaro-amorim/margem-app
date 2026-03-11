import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { isClerkConfigured } from "@/lib/env";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/products(.*)",
  "/ingredients(.*)",
  "/recipes(.*)",
  "/pricing(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isProtectedRoute(request)) {
    return NextResponse.next();
  }

  if (!isClerkConfigured()) {
    const url = new URL("/", request.url);
    url.searchParams.set("setup", "clerk");

    return NextResponse.redirect(url);
  }

  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|png|jpg|jpeg|gif|svg|ico|woff2?|ttf)).*)",
    "/(api|trpc)(.*)",
  ],
};
