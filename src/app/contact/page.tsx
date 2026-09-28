"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type TicketCategory =
  | "general"
  | "business_support"
  | "partnership"
  | "feedback"
  | "grievance"
  | "report";

type TicketPriority = "low" | "medium" | "high" | "critical";

export default function Contact() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("general");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setErrorMessage("");
    setTicketNumber("");

    const trimmedName = name.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!trimmedSubject) {
      setErrorMessage("Please enter a subject.");
      return;
    }

    if (!trimmedMessage) {
      setErrorMessage("Please enter your message.");
      return;
    }

    if (trimmedSubject.length > 200) {
      setErrorMessage("Subject must be 200 characters or fewer.");
      return;
    }

    if (trimmedMessage.length > 10000) {
      setErrorMessage("Message must be 10,000 characters or fewer.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage(
          "Please sign in to submit a support or grievance request.",
        );
        return;
      }

      const { data: ticketId, error: ticketError } = await supabase.rpc(
        "create_support_ticket",
        {
          p_profile_id: user.id,
          p_subject: trimmedSubject,
          p_description: trimmedMessage,
          p_category: category,
          p_business_id: null,
          p_priority: priority,
          p_metadata: {
            source: "website_contact",
            name: trimmedName,
            email: user.email ?? null,
          },
        },
      );

      if (ticketError || !ticketId) {
        setErrorMessage(
          ticketError?.message ||
            "We could not submit your request. Please try again.",
        );
        return;
      }

      const { data: ticket, error: ticketLookupError } = await supabase
        .from("support_tickets")
        .select("ticket_number")
        .eq("id", ticketId)
        .maybeSingle();

      if (ticketLookupError || !ticket?.ticket_number) {
        setTicketNumber(ticketId);
      } else {
        setTicketNumber(ticket.ticket_number);
      }

      setName("");
      setSubject("");
      setCategory("general");
      setPriority("medium");
      setMessage("");
    } catch {
      setErrorMessage(
        "Something went wrong while submitting your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you."
        description="Questions, partnership ideas, business support, feedback or grievances — send us a message."
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
              a partnership, have feedback about Twimzi, or need to raise a
              grievance, our support team is here to help.
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

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Grievances
                </p>

                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                  For complaints or formal grievances, select the Grievance
                  category in the form. Your request will receive a reference
                  number for support handling.
                </p>

                <Link
                  href="/grievance-redressal"
                  className="mt-2 inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline"
                >
                  View Grievance Redressal Policy
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-md)] sm:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight">
                Send us a message
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Submit your request directly to Twimzi support. You must be
                signed in so your request can be securely associated with your
                account.
              </p>
            </div>

            {ticketNumber ? (
              <div
                className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4"
                role="status"
              >
                <p className="text-sm font-bold text-emerald-900">
                  Request submitted successfully.
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  Your reference number is{" "}
                  <span className="font-extrabold">{ticketNumber}</span>.
                  Please keep it for future communication with Twimzi support.
                </p>
              </div>
            ) : null}

            {errorMessage ? (
              <div
                className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-800"
                role="alert"
              >
                {errorMessage}

                {errorMessage.includes("sign in") ? (
                  <div className="mt-2">
                    <Link
                      href="/login?next=/contact"
                      className="font-bold underline"
                    >
                      Sign in to continue
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="text-sm font-semibold">Name</span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={120}
                  autoComplete="name"
                  disabled={submitting}
                  className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="Your name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Subject</span>

                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                  maxLength={200}
                  disabled={submitting}
                  className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="What can we help you with?"
                />

                <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                  Maximum 200 characters.
                </span>
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold">Category</span>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as TicketCategory)
                    }
                    disabled={submitting}
                    className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="general">General Support</option>
                    <option value="business_support">
                      Business Support
                    </option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                    <option value="grievance">Grievance / Complaint</option>
                    <option value="report">Report / Safety Concern</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">Priority</span>

                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(event.target.value as TicketPriority)
                    }
                    disabled={submitting}
                    className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold">Message</span>

                <textarea
                  rows={8}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  maxLength={10000}
                  disabled={submitting}
                  className="mt-2 w-full resize-y rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="Describe your request, complaint or grievance."
                />

                <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                  Maximum 10,000 characters.
                </span>
              </label>

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-[var(--color-text-muted)]">
                By submitting this form, your request will be recorded in
                Twimzi&apos;s support system and associated with your account
                for handling and follow-up.
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </>
  );
}