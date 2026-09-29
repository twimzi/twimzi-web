/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ImagePlus,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type MediaKind = "logo" | "cover" | "gallery";

type SelectedImage = {
  file: File;
  preview: string;
};

const MAX_GALLERY_IMAGES = 6;

function revokePreview(preview: string) {
  URL.revokeObjectURL(preview);
}

export default function AddBusiness() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [logo, setLogo] = useState<SelectedImage | null>(null);
  const [cover, setCover] = useState<SelectedImage | null>(null);
  const [gallery, setGallery] = useState<SelectedImage[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const totalSelectedImages = useMemo(
    () => gallery.length + (logo ? 1 : 0) + (cover ? 1 : 0),
    [cover, gallery.length, logo],
  );

  function selectSingleImage(
    file: File | undefined,
    kind: "logo" | "cover",
  ) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Logo and cover images must be 5 MB or smaller.");
      return;
    }

    setErrorMessage("");

    const selected = {
      file,
      preview: URL.createObjectURL(file),
    };

    if (kind === "logo") {
      setLogo((current) => {
        if (current) revokePreview(current.preview);
        return selected;
      });
    } else {
      setCover((current) => {
        if (current) revokePreview(current.preview);
        return selected;
      });
    }
  }

  function selectGalleryImages(files: FileList | null) {
    if (!files) return;

    const incoming = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (incoming.length === 0) {
      setErrorMessage("Please select image files.");
      return;
    }

    const oversized = incoming.find(
      (file) => file.size > 10 * 1024 * 1024,
    );

    if (oversized) {
      setErrorMessage("Each gallery image must be 10 MB or smaller.");
      return;
    }

    const remaining = MAX_GALLERY_IMAGES - gallery.length;

    if (remaining <= 0) {
      setErrorMessage(
        `You can add up to ${MAX_GALLERY_IMAGES} gallery images.`,
      );
      return;
    }

    const accepted = incoming.slice(0, remaining);

    if (accepted.length < incoming.length) {
      setErrorMessage(
        `Only ${MAX_GALLERY_IMAGES} gallery images are allowed.`,
      );
    } else {
      setErrorMessage("");
    }

    setGallery((current) => [
      ...current,
      ...accepted.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeGalleryImage(index: number) {
    setGallery((current) => {
      const target = current[index];

      if (target) {
        revokePreview(target.preview);
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function clearSingleImage(kind: "logo" | "cover") {
    if (kind === "logo") {
      setLogo((current) => {
        if (current) revokePreview(current.preview);
        return null;
      });
    } else {
      setCover((current) => {
        if (current) revokePreview(current.preview);
        return null;
      });
    }
  }

  async function uploadImage(
    supabase: ReturnType<typeof createSupabaseBrowserClient>,
    businessId: string,
    kind: MediaKind,
    selected: SelectedImage,
  ) {
    const formData = new FormData();

    formData.append("business_id", businessId);
    formData.append("kind", kind);
    formData.append("file", selected.file);

    formData.append(
      "alt_text",
      kind === "logo"
        ? `${businessName.trim()} logo`
        : kind === "cover"
          ? `${businessName.trim()} cover image`
          : `${businessName.trim()} gallery image`,
    );

    const { data, error } = await supabase.functions.invoke(
      "upload-media",
      {
        body: formData,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.success) {
      throw new Error(data?.error || "Unable to upload image.");
    }
  }

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
    setUploadProgress("");

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

      if (!business?.id) {
        throw new Error(
          "Business was created but no business ID was returned.",
        );
      }

      const uploads: Array<{
        kind: MediaKind;
        selected: SelectedImage;
      }> = [];

      if (logo) {
        uploads.push({
          kind: "logo",
          selected: logo,
        });
      }

      if (cover) {
        uploads.push({
          kind: "cover",
          selected: cover,
        });
      }

      gallery.forEach((selected) => {
        uploads.push({
          kind: "gallery",
          selected,
        });
      });

      for (let index = 0; index < uploads.length; index += 1) {
        const upload = uploads[index];

        setUploadProgress(
          `Uploading image ${index + 1} of ${uploads.length}...`,
        );

        await uploadImage(
          supabase,
          business.id,
          upload.kind,
          upload.selected,
        );
      }

      setUploadProgress("");

      const successText =
        uploads.length > 0
          ? "Your business and selected images have been submitted successfully. The profile will appear publicly after approval."
          : "Your business has been submitted successfully. It will appear publicly after approval.";

      setMessage(successText);

      if (logo) {
        revokePreview(logo.preview);
      }

      if (cover) {
        revokePreview(cover.preview);
      }

      gallery.forEach((item) => revokePreview(item.preview));

      setLogo(null);
      setCover(null);
      setGallery([]);
      setBusinessName("");
      setBusinessType("");
      setCity("");
      setDescription("");
      setPhone("");
      setWebsite("");

      window.setTimeout(() => {
        router.push("/businesses/dashboard");
        router.refresh();
      }, 900);
    } catch (error) {
      setUploadProgress("");

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
        <div className="max-w-3xl py-14">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-md)] sm:p-8"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold">
                Business information
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Submit your business details and add your brand images.
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
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
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
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
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

              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    <ImagePlus className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold">
                      Business media
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                      Add a logo, cover image and up to{" "}
                      {MAX_GALLERY_IMAGES} gallery images.
                      Logo and cover images can be up to 5 MB;
                      gallery images can be up to 10 MB.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="business-logo"
                        className="text-sm font-semibold"
                      >
                        Logo
                      </label>

                      {logo ? (
                        <button
                          type="button"
                          onClick={() =>
                            clearSingleImage("logo")
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <label
                      htmlFor="business-logo"
                      className="group relative flex min-h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white transition hover:border-[var(--color-primary)]"
                    >
                      {logo ? (
                        <img
                          src={logo.preview}
                          alt="Selected business logo"
                          className="absolute inset-0 h-full w-full object-contain p-4"
                        />
                      ) : (
                        <div className="text-center">
                          <UploadCloud className="mx-auto h-8 w-8 text-[var(--color-primary)]" />

                          <p className="mt-2 text-sm font-semibold">
                            Upload logo
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            PNG, JPG, WEBP · 5 MB max
                          </p>
                        </div>
                      )}

                      <input
                        id="business-logo"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) =>
                          selectSingleImage(
                            event.target.files?.[0],
                            "logo",
                          )
                        }
                      />
                    </label>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="business-cover"
                        className="text-sm font-semibold"
                      >
                        Cover image
                      </label>

                      {cover ? (
                        <button
                          type="button"
                          onClick={() =>
                            clearSingleImage("cover")
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <label
                      htmlFor="business-cover"
                      className="group relative flex min-h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white transition hover:border-[var(--color-primary)]"
                    >
                      {cover ? (
                        <img
                          src={cover.preview}
                          alt="Selected business cover"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <UploadCloud className="mx-auto h-8 w-8 text-[var(--color-primary)]" />

                          <p className="mt-2 text-sm font-semibold">
                            Upload cover
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            PNG, JPG, WEBP · 5 MB max
                          </p>
                        </div>
                      )}

                      <input
                        id="business-cover"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) =>
                          selectSingleImage(
                            event.target.files?.[0],
                            "cover",
                          )
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="business-gallery"
                      className="text-sm font-semibold"
                    >
                      Gallery images
                    </label>

                    <span className="text-xs text-[var(--color-text-muted)]">
                      {gallery.length}/{MAX_GALLERY_IMAGES}
                    </span>
                  </div>

                  <label
                    htmlFor="business-gallery"
                    className="flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-white transition hover:border-[var(--color-primary)]"
                  >
                    <div className="text-center">
                      <UploadCloud className="mx-auto h-7 w-7 text-[var(--color-primary)]" />

                      <p className="mt-2 text-sm font-semibold">
                        Add gallery images
                      </p>

                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        Select multiple images · 10 MB max each
                      </p>
                    </div>

                    <input
                      id="business-gallery"
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        selectGalleryImages(event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  {gallery.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {gallery.map((item, index) => (
                        <div
                          key={item.preview}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--color-border)] bg-white"
                        >
                          <img
                            src={item.preview}
                            alt={`Gallery image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeGalleryImage(index)
                            }
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                            aria-label={`Remove gallery image ${index + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <p className="mt-4 text-xs text-[var(--color-text-muted)]">
                  {totalSelectedImages === 0
                    ? "Images are optional."
                    : `${totalSelectedImages} image${
                        totalSelectedImages === 1 ? "" : "s"
                      } selected.`}
                </p>
              </section>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {errorMessage}
                </div>
              )}

              {message && (
                <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {uploadProgress ? (
                <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-light)] p-4 text-sm font-semibold text-[var(--color-primary)]">
                  {uploadProgress}
                </div>
              ) : null}

              <Button type="submit" disabled={loading}>
                {loading
                  ? uploadProgress || "Submitting..."
                  : "Create Business"}
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