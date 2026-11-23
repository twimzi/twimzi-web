"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { trackAnalyticsEvent } from "@/lib/analytics";

async function recordAcceptedPolicies(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  userId: string,
  includeBusiness: boolean,
) {
  const types = [
    "terms_of_service",
    "privacy_policy",
    "community_guidelines",
    "acceptable_use_policy",
    "user_content_policy",
    "messaging_policy",
    ...(includeBusiness ? ["business_terms", "marketplace_policy"] : []),
  ];

  for (const documentType of types) {
    const { data } = await supabase.rpc("get_active_legal_document", {
      p_document_type: documentType,
      p_language_code: "en",
    });
    const document = Array.isArray(data) ? data[0] : null;
    if (!document?.id) throw new Error(`The active legal document is unavailable: ${documentType}`);

    const { error } = await supabase.rpc("accept_legal_document", {
      p_profile_id: userId,
      p_legal_document_id: document.id,
      p_acceptance_source: "web_registration",
      p_metadata: {
        acceptance_method: "explicit_registration_checkbox",
        policy_version: document.version,
      },
    });
    if (error) throw error;
  }
}

function setLegalAcceptanceCookie() {
  document.cookie =
    "twimzi_legal_acceptance=1; Path=/; Max-Age=1800; SameSite=Lax; Secure";
}

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

export default function Register() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (password.length < 12) {
      setErrorMessage("Password must contain at least 12 characters.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setErrorMessage("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setErrorMessage("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setErrorMessage("Password must contain at least one number.");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setErrorMessage("Password must contain at least one special character.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage(
        "You must agree to the Terms & Conditions and Privacy Policy to create an account.",
      );
      return;
    }

    setLegalAcceptanceCookie();
    setIsLoading(true);
    const nextPath = getSafeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedName,
          legal_acceptance: {
            accepted: true,
            method: "explicit_registration_checkbox",
            submitted_at: new Date().toISOString(),
          },
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    await trackAnalyticsEvent("signup_completed");

    if (data.session) {
      try {
        await recordAcceptedPolicies(supabase, data.session.user.id, nextPath === "/add-business" || nextPath.startsWith("/add-business?"));
      } catch {
        await supabase.auth.signOut();
        setErrorMessage("We could not save your legal acceptance. Please try registration again.");
        setIsLoading(false);
        return;
      }
      router.push(nextPath);
      router.refresh();
      return;
    }

    setSuccessMessage(
      "Account created successfully. Please check your email and click the verification link to continue.",
    );
    setIsLoading(false);
  }

  async function handleGoogleRegister() {
    setErrorMessage("");
    setSuccessMessage("");
    if (!acceptedTerms) {
      setErrorMessage("Please agree to the Terms & Conditions and Privacy Policy before continuing with Google.");
      return;
    }
    setLegalAcceptanceCookie();
    setIsGoogleLoading(true);

    const nextPath = getSafeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );
    void trackAnalyticsEvent("signup_started");
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsGoogleLoading(false);
    }
  }

  return (
    <Container>
      <div className="flex min-h-[760px] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-8 shadow-[var(--shadow-md)] sm:p-10">
          <div className="text-center">
            <Image
              src="/twimzi-logo.png"
              alt="Twimzi"
              width={769}
              height={650}
              priority
              className="mx-auto h-20 w-auto object-contain"
            />

            <h1 className="mt-5 text-2xl font-bold text-[var(--color-text)]">
              Create your Twimzi account
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Join Twimzi and discover local businesses, products and services.
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div
              role="status"
              className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {successMessage}
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleRegister}
            className="mt-6 w-full gap-3"
          >
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-full text-sm font-bold"
            >
              G
            </span>
            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              or
            </span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold"
              >
                Full name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                required
                className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a strong password"
                  required
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 pr-20 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-text)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
                Use at least 12 characters with uppercase, lowercase, a number
                and a special character.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold"
              >
                Confirm password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Confirm your password"
                  required
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 pr-20 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-text)]"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-4">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                required
              />

              <span className="text-xs leading-5 text-[var(--color-text-muted)]">
                I agree to the{" "}
                <Link
                  href="/terms-and-conditions"
                  target="_blank"
                  className="font-semibold text-[var(--color-text)] hover:underline"
                >
                  Terms & Conditions
                </Link>{" "}
                and acknowledge the{" "}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="font-semibold text-[var(--color-text)] hover:underline"
                >
                  Privacy Policy
                </Link>
                {" "}and the applicable platform policies, including{" "}
                <Link href="/community-guidelines" target="_blank" className="font-semibold text-[var(--color-text)] hover:underline">Community Guidelines</Link>,{" "}
                <Link href="/acceptable-use" target="_blank" className="font-semibold text-[var(--color-text)] hover:underline">Acceptable Use</Link> and{" "}
                <Link href="/messaging-policy" target="_blank" className="font-semibold text-[var(--color-text)] hover:underline">Messaging Policy</Link>.
              </span>
            </label>

            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-7 text-center text-sm text-[var(--color-text-muted)]">
            Already have an account?{" "}
            <Link
              href="/login"
              onClick={(event) => {
                const nextPath = getSafeNextPath(
                  new URLSearchParams(window.location.search).get("next"),
                );
                if (nextPath !== "/") {
                  event.preventDefault();
                  router.push(`/login?next=${encodeURIComponent(nextPath)}`);
                }
              }}
              className="font-semibold text-[var(--color-primary)] hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}