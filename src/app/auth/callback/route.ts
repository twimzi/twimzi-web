import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    const error = requestUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error)}`,
          requestUrl.origin,
        ),
      );
    }

    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Authentication link is invalid or has expired.",
        )}`,
        requestUrl.origin,
      ),
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.twimzi.com";

  const redirectUrl = new URL(next, siteUrl);
  if (redirectUrl.origin !== new URL(siteUrl).origin) {
    return NextResponse.redirect(new URL("/", siteUrl));
  }

  return NextResponse.redirect(redirectUrl);
}
