import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Check for userRole in cookies
  const userRole = request.cookies.get("userRole")?.value
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth")

  // Get the current path
  const path = request.nextUrl.pathname

  if (!userRole && !isAuthPage) {
    // Redirect to login if accessing protected route without role
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (userRole && isAuthPage) {
    // Redirect to home if accessing auth page with role
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Role-based access control
  if (userRole) {
    const adminOnlyPaths = ["/settings", "/promotions", "/transfers"]
    const managerAndAdminPaths = ["/items", "/reports"]

    if (adminOnlyPaths.some((p) => path.startsWith(p)) && userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (managerAndAdminPaths.some((p) => path.startsWith(p)) && !["admin", "manager"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

