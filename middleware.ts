import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  '/login',
];

export default withAuth(
  function middleware(req) {
    if (PUBLIC_ROUTES.some(route => req.nextUrl.pathname === route)) {
      return NextResponse.next();
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page
        if (PUBLIC_ROUTES.some(route => req.nextUrl.pathname === route)) {
          return true;
        }
        
        // Se houver erro no token ou não houver token, não autorize
        if (!token || token.error === "RefreshAccessTokenError") {
          return false;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
