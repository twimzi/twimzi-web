"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const subject = encodeURIComponent(
      `Twimzi Contact - ${name.trim() || "Website enquiry"}`,
    );

    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
    );

    window.location.href = `mailto:support@twimzi.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you."
        description="Questions, partnership ideas, business support or feedback — send us a message."
      />

      <Container>
        <div className="grid gap-8 py-14 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              Get in touch
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Let&apos;s connect.
            </h2>

            <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
              Whether you need help with your business profile, want to explore
              a partnership, or have feedback about Twimzi, our team is here
              to help.
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Email
                </p>

                <a
                  href="mailto:support@twimzi.com"
                  className="mt-1 inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline"
                >
                  support@twimzi.com
                </a>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Business enquiries
                </p>

                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                  Contact us for business onboarding, partnerships and platform
                  support.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-md)] sm:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight">
                Send us a message
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Complete the form below. Your email application will open with
                the message prepared for our support team.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="text-sm font-semibold">Name</span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                  placeholder="Your name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Email</span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Message</span>

                <textarea
                  rows={7}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  className="mt-2 w-full resize-y rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                  placeholder="How can we help?"
                />
              </label>

              {sent && (
                <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]">
                  Your email application has been opened with your message
                  prepared for support@twimzi.com.
                </div>
              )}

              <Button type="submit">Send Message</Button>
            </form>
          </div>
        </div>
      </Container>
    </>
  );
}