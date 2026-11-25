"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

function getSafeNextPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\\u0000-\\u001f\\u007f]/.test(value)
  ) {
    return "/";
  }

  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const nextPath = getSafeNextPath(searchParams.get("next"));
  const callbackError = searchParams.get("error");
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(callbackError ?? "");
  const [successMessage, setSuccessMessage] = useState(
    resetSuccess
      ? "Your password has been updated successfully. You can now sign in."
      : "",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  async function sendLoginOtp() {
    setErrorMessage("");
    setSuccessMessage("");
    if (!email.trim()) { setErrorMessage("Enter your email address first."); return; }
    setOtpLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setOtpLoading(false);
    if (error) { setErrorMessage(error.message); return; }
    setOtpSent(true);
    setSuccessMessage("A 6-digit login code has been sent to your email.");
  }

  async function verifyLoginOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!/^\d{6}$/.test(otp)) { setErrorMessage("Enter the 6-digit code."); return; }
    setOtpLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type: "email",
    });
    setOtpLoading(false);
    if (error) { setErrorMessage(error.message); return; }
    router.push(nextPath);
    router.refresh();
  }

  async function handleGoogleLogin() {
    setErrorMessage("");
    setSuccessMessage("");
    setIsGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsGoogleLoading(false);
    }
  }

  return (
    <Container>
      <div className="flex min-h-[700px] items-center justify-center py-16">
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
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Sign in to continue to Twimzi.
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div
              role="status"
              className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
            >
              {successMessage}
            </div>
          ) : null}

          <div className="mt-8 mb-5 grid grid-cols-2 rounded-xl bg-[var(--color-secondary)] p-1">
            <button type="button" onClick={() => { setLoginMode("password"); setOtpSent(false); setOtp(""); setErrorMessage(""); setSuccessMessage(""); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${loginMode === "password" ? "bg-white shadow-sm" : "text-[var(--color-text-muted)]"}`}>Email & password</button>
            <button type="button" onClick={() => { setLoginMode("otp"); setOtpSent(false); setOtp(""); setErrorMessage(""); setSuccessMessage(""); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${loginMode === "otp" ? "bg-white shadow-sm" : "text-[var(--color-text-muted)]"}`}>Email OTP</button>
          </div>
          {loginMode === "password" ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[var(--color-text)]">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label htmlFor="password" className="block text-sm font-semibold text-[var(--color-text)]">Password</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-[var(--color-primary)] hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 pr-20 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]" />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-text)]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading || isGoogleLoading} className="w-full">{isLoading ? "Signing in..." : "Sign in"}</Button>
            </form>
          ) : (
            <form onSubmit={verifyLoginOtp} className="space-y-5">
              <div>
                <label htmlFor="otp-email" className="mb-2 block text-sm font-semibold text-[var(--color-text)]">Email address</label>
                <input id="otp-email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setOtpSent(false); }} placeholder="you@example.com" required className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 outline-none transition focus:border-[var(--color-primary)]" />
              </div>
              {otpSent ? (
                <div>
                  <label htmlFor="login-otp" className="mb-2 block text-sm font-semibold">6-digit email code</label>
                  <input id="login-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter code" required className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 tracking-widest" />
                  <button type="button" disabled={otpLoading} onClick={sendLoginOtp} className="mt-3 text-sm font-semibold text-[var(--color-primary)] underline">Resend code</button>
                </div>
              ) : null}
              {!otpSent ? <Button type="button" onClick={sendLoginOtp} disabled={otpLoading || !email.trim()} className="w-full">{otpLoading ? "Sending code..." : "Send login code"}</Button> : <Button type="submit" disabled={otpLoading || otp.length !== 6} className="w-full">{otpLoading ? "Verifying..." : "Verify code & sign in"}</Button>}
            </form>
          )}

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              OR
            </span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isGoogleLoading}
            onClick={handleGoogleLogin}
            className="w-full"
          >
            {isGoogleLoading ? (
              "Connecting to Google..."
            ) : (
              <>
                <span className="mr-2 text-base font-bold">G</span>
                Continue with Google
              </>
            )}
          </Button>

          <p className="mt-7 text-center text-sm text-[var(--color-text-muted)]">
            Don&apos;t have an account?{" "}
            <Link
              href={nextPath === "/" ? "/register" : `/register?next=${encodeURIComponent(nextPath)}`}
              className="font-semibold text-[var(--color-primary)] hover:underline"
            >
              Create an account
            </Link>
          </p>

          <p className="mt-5 text-center text-xs leading-5 text-[var(--color-text-muted)]">
            By continuing, you agree to our{" "}
            <Link
              href="/terms-and-conditions"
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy-policy"
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </Container>
  );
}

function LoginFallback() {
  return (
    <Container>
      <div className="flex min-h-[700px] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-8 text-center shadow-[var(--shadow-md)] sm:p-10">
          <Image
            src="/twimzi-logo.png"
            alt="Twimzi"
            width={769}
            height={650}
            priority
            className="mx-auto h-20 w-auto object-contain"
          />

          <p className="mt-6 text-sm text-[var(--color-text-muted)]">
            Loading login...
          </p>
        </div>
      </div>
    </Container>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}