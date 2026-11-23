import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return "/";
  return value;
}

async function recordRequiredAcceptances(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  includeBusinessPolicies: boolean,
  request: NextRequest,
) {
  const types = [
    "terms_of_service",
    "privacy_policy",
    "community_guidelines",
    "acceptable_use_policy",
    "user_content_policy",
    "messaging_policy",
    ...(includeBusinessPolicies ? ["business_terms", "marketplace_policy"] : []),
  ];

  for (const documentType of types) {
    const { data } = await supabase.rpc("get_active_legal_document", {
      p_document_type: documentType,
      p_language_code: "en",
    });
    const document = Array.isArray(data) ? data[0] : null;
    if (!document?.id) {
      throw new Error(`The active legal document is unavailable: ${documentType}`);
    }

    const { error: acceptanceError } = await supabase.rpc("accept_legal_document", {
      p_profile_id: userId,
      p_legal_document_id: document.id,
      p_user_agent: request.headers.get("user-agent") ?? null,
      p_acceptance_source: "web_registration",
      p_metadata: { acceptance_method: "explicit_registration_checkbox", policy_version: document.version },
    });
    if (acceptanceError) throw acceptanceError;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const isSignupFlow = requestUrl.searchParams.get("flow") === "signup";

  if (!code) {
    const error = requestUrl.searchParams.get("error");
    if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, requestUrl.origin));
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=" + encodeURIComponent("Authentication link is invalid or has expired."), requestUrl.origin));
  }

  const acceptedCookie = request.cookies.get("twimzi_legal_acceptance")?.value === "1";
  const { data: { user } } = await supabase.auth.getUser();
  const acceptedAtSignup = user?.user_metadata?.legal_acceptance?.accepted === true;
  const ageConfirmedAtSignup = user?.user_metadata?.age_confirmation?.confirmed === true
    && user?.user_metadata?.age_confirmation?.minimum_age === 18;
  // The cookie is set only after the separate age and policy checkboxes are selected.
  if (isSignupFlow && user && !((acceptedCookie && !acceptedAtSignup) || (acceptedAtSignup && ageConfirmedAtSignup))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/register?error=" + encodeURIComponent("You must confirm that you are at least 18 years old and accept the required policies to create an account."), requestUrl.origin));
  }
  if (isSignupFlow && user && (acceptedCookie || (acceptedAtSignup && ageConfirmedAtSignup))) {
    try {
      await recordRequiredAcceptances(supabase, user.id, next === "/add-business" || next.startsWith("/add-business?"), request);
    } catch {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/register?error=" + encodeURIComponent("We could not save your legal acceptance. Please try registration again."), requestUrl.origin));
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.twimzi.com";
  const redirectUrl = new URL(next, siteUrl);
  const response = redirectUrl.origin === new URL(siteUrl).origin
    ? NextResponse.redirect(redirectUrl)
    : NextResponse.redirect(new URL("/", siteUrl));
  response.cookies.set("twimzi_legal_acceptance", "", { path: "/", maxAge: 0 });
  return response;
}
