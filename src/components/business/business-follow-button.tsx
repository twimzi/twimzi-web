"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  businessId: string;
};

export default function BusinessFollowButton({ businessId }: Props) {
  const router = useRouter();

  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadFollowState() {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) {
          setIsFollowing(false);
          setLoading(false);
        }

        return;
      }

      const { data, error } = await supabase.rpc(
        "is_following_business",
        {
          p_business_id: businessId,
        },
      );

      if (mounted) {
        setIsFollowing(!error && data === true);
        setLoading(false);
      }
    }

    void loadFollowState();

    return () => {
      mounted = false;
    };
  }, [businessId]);

  async function toggleFollow() {
    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirect=/businesses/${businessId}`);
      return;
    }

    setWorking(true);

    if (isFollowing) {
      const { error } = await supabase.rpc("unfollow_business", {
        p_business_id: businessId,
      });

      if (!error) {
        setIsFollowing(false);
      }
    } else {
      const { error } = await supabase.rpc("follow_business", {
        p_business_id: businessId,
      });

      if (!error) {
        setIsFollowing(true);
      }
    }

    setWorking(false);
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={loading || working}
      className={`inline-flex h-11 min-w-28 items-center justify-center rounded-xl px-5 text-sm font-semibold transition ${
        isFollowing
          ? "border border-blue-200 bg-blue-50 text-[#1879FD] hover:bg-blue-100"
          : "bg-[linear-gradient(90deg,#1879FD,#8E07FB)] text-white shadow-md hover:shadow-lg"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading
        ? "Loading..."
        : working
          ? "Please wait..."
          : isFollowing
            ? "Following"
            : "Follow"}
    </button>
  );
}
