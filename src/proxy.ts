import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPathPrefixes = [
  "/add-business",
  "/businesses/dashboard",
  "/admin",
  "/messages",
];

function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function loginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const protectedPath = isProtectedPath(request.nextUrl.pathname);
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Fail closed for protected routes if auth cannot be checked.
  if (!supabaseUrl || !supabasePublishableKey) {
    if (protectedPath) {
      return new NextResponse("Authentication is temporarily unavailable.", {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Never allow a protected route through when the session cannot be verified.
  if (protectedPath && (error || !user)) {
    return loginRedirect(request);
  }

  return response;
}

/*
 * This proxy provides a navigation-level authentication gate only.
 * Every database mutation, server action, RPC and admin operation must
 * independently enforce authentication, ownership and role authorization.
 */
export const config = {
  matcher: [
    "/add-business",
    "/businesses/dashboard/:path*",
    "/admin/:path*",
    "/messages/:path*",
  ],
};
