"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AddBusiness() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!businessName.trim() || !businessType.trim() || !city.trim()) {
      setErrorMessage(
        "Business name, business type and city/location are required.",
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push(
          `/login?next=${encodeURIComponent("/add-business")}`,
        );
        return;
      }

      const { data, error } = await supabase.rpc("create_business", {
        p_business_name: businessName.trim(),
        p_business_type: businessType.trim(),
        p_city: city.trim(),
        p_description: description.trim() || null,
        p_phone: phone.trim() || null,
        p_website: website.trim() || null,
      });

      if (error) {
        throw error;
      }

      const business = Array.isArray(data) ? data[0] : data;

      if (business?.id) {
        router.push(
          `/businesses/${business.slug || business.id}`,
        );
        router.refresh();
        return;
      }

      setMessage(
        "Your business has been submitted successfully. It will appear publicly after approval.",
      );

      setBusinessName("");
      setBusinessType("");
      setCity("");
      setDescription("");
      setPhone("");
      setWebsite("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit the business right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="For businesses"
        title="Create your Twimzi business presence."
        description="Start building a profile for your business, products, services, offers and updates."
      />

      <Container>
        <div className="max-w-2xl py-14">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-md)] sm:p-8"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold">
                Business information
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Submit your business details to create a Twimzi business
                profile.
              </p>
            </div>

            <div className="grid gap-5">
              <div>
                <label
                  htmlFor="business-name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Business name *
                </label>

                <input
                  id="business-name"
                  value={businessName}
                  onChange={(event) =>
                    setBusinessName(event.target.value)
                  }
                  placeholder="Enter your business name"
                  required
                  className="min-h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="business-type"
                  className="mb-2 block text-sm font-semibold"
                >
                  Business type *
                </label>

                <select
                  id="business-type"
                  value={businessType}
                  onChange={(event) =>
                    setBusinessType(event.target.value)
                  }
                  required
                  className="min-h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                >
                  <option value="">Select business type</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Trader">Trader / Wholesaler</option>
                  <option value="Professional">Professional</option>
                  <option value="Home Service">
                    Home Service Provider
                  </option>
                  <option value="Shop">Local Shop</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Dealer">Dealer</option>
                  <option value="Service Provider">
                    Service Provider
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="mb-2 block text-sm font-semibold"
                >
                  City / Location *
                </label>

                <input
                  id="city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Ludhiana, Punjab"
                  required
                  className="min-h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Business phone
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="min-h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="mb-2 block text-sm font-semibold"
                >
                  Website
                </label>

                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(event) =>
                    setWebsite(event.target.value)
                  }
                  placeholder="https://example.com"
                  className="min-h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold"
                >
                  About your business
                </label>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={6}
                  placeholder="Tell customers about your business..."
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {errorMessage}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-700">
                  {message}
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Create Business"}
              </Button>

              <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">
                You must be signed in to submit a business. Submitted
                businesses are subject to approval before public listing.
              </p>
            </div>
          </form>
        </div>
      </Container>
    </>
  );
}