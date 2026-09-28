"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type MessageBusinessButtonProps = {
  businessId: string;
};

type BusinessMessagingTarget = {
  business_id: string;
  owner_profile_id: string;
  business_name: string;
};

export function MessageBusinessButton({
  businessId,
}: MessageBusinessButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMessageBusiness() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(
          `/login?next=${encodeURIComponent(
            `/businesses/${businessId}`,
          )}`,
        );
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_business")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error("Your Twimzi profile could not be found.");
      }

      const { data: targetRows, error: targetError } = await supabase.rpc(
        "get_business_messaging_target",
        {
          p_business_id: businessId,
        },
      );

      if (targetError) {
        throw targetError;
      }

      const target = (targetRows?.[0] ?? null) as
        | BusinessMessagingTarget
        | null;

      if (!target) {
        throw new Error("This business is not available for messaging.");
      }

      if (target.owner_profile_id === user.id) {
        setError("You cannot start a conversation with your own business.");
        return;
      }

      if (!profile.is_business) {
        const { data: conversationId, error: conversationError } =
          await supabase.rpc("create_conversation", {
            p_conversation_type: "customer_business",
            p_business_id: businessId,
            p_customer_profile_id: user.id,
            p_title: null,
          });

        if (conversationError) {
          throw conversationError;
        }

        if (!conversationId) {
          throw new Error("Unable to create the conversation.");
        }

        router.push(`/messages/${conversationId}`);
        return;
      }

      const { data: sourceBusiness, error: sourceBusinessError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("owner_profile_id", user.id)
          .eq("is_active", true)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();

      if (sourceBusinessError) {
        throw sourceBusinessError;
      }

      if (!sourceBusiness) {
        setError(
          "Your business profile is required before you can message another business.",
        );
        return;
      }

      if (sourceBusiness.id === businessId) {
        setError("You cannot start a conversation with your own business.");
        return;
      }

      const { data: conversationId, error: conversationError } =
        await supabase.rpc("create_direct_conversation", {
          p_target_profile_id: target.owner_profile_id,
          p_target_business_id: businessId,
          p_source_business_id: sourceBusiness.id,
          p_title: target.business_name,
        });

      if (conversationError) {
        throw conversationError;
      }

      if (!conversationId) {
        throw new Error("Unable to create the conversation.");
      }

      router.push(`/messages/${conversationId}`);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to start the conversation.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleMessageBusiness}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-primary-dark)] shadow-sm transition hover:bg-[var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MessageCircle className="h-4 w-4" />
        {loading ? "Opening..." : "Message Business"}
      </button>

      {error && (
        <p className="max-w-xs text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}