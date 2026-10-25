"use client";

import { useEffect, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Branch = {
  branch_name?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  landmark?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export default function BusinessHeadOfficeLocation({ businessId }: { businessId: string }) {
  const [branch, setBranch] = useState<Branch>({ branch_name: "Head Office", country: "India" });
  const [exists, setExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createSupabaseBrowserClient();
      const { data, error: loadError } = await supabase.rpc("get_my_business_head_office", { p_business_id: businessId });
      if (cancelled) return;
      if (loadError) { setError(loadError.message); return; }
      if (data) { setBranch(data); setExists(true); }
    }
    void load();
    return () => { cancelled = true; };
  }, [businessId]);

  function update(field: keyof Branch, value: string) {
    setBranch((current) => ({ ...current, [field]: value }));
  }

  async function saveLocation() {
    setError(""); setSuccess("");
    if (!branch.branch_name?.trim() || !branch.address_line_1?.trim() || !branch.city?.trim() || !branch.state?.trim() || !branch.country?.trim()) {
      setError("Enter branch name, street address, city, state and country.");
      return;
    }
    if (!navigator.geolocation) { setError("This browser does not support GPS location."); return; }
    setSaving(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
      const supabase = createSupabaseBrowserClient();
      const { data, error: saveError } = await supabase.rpc("save_my_business_head_office", {
        p_business_id: businessId,
        p_branch_name: branch.branch_name,
        p_address_line_1: branch.address_line_1,
        p_address_line_2: branch.address_line_2 || null,
        p_landmark: branch.landmark || null,
        p_city: branch.city,
        p_state: branch.state,
        p_country: branch.country,
        p_postal_code: branch.postal_code || null,
        p_latitude: position.coords.latitude,
        p_longitude: position.coords.longitude,
      });
      if (saveError) throw saveError;
      setBranch((current) => ({ ...current, latitude: position.coords.latitude, longitude: position.coords.longitude }));
      setExists(true);
      setSuccess("Head-office address and GPS saved. You can now create community posts.");
    } catch (e) {
      const geoError = e as GeolocationPositionError;
      if (typeof geoError?.code === "number") {
        if (geoError.code === 1) {
          setError("Location permission was denied. Allow location access in your browser settings and try again. If you are using a desktop or laptop and location cannot be detected, open Twimzi on your mobile phone, sign in to this same account, and tap Use Current Location & Save while at your business premises. Then you can create posts from your computer.");
        } else if (geoError.code === 2 || geoError.code === 3) {
          setError("This device could not detect your current location. If you are using a desktop or laptop, open Twimzi on your mobile phone, sign in to this same account, and tap Use Current Location & Save while at your business premises. Your saved location will then be available when you return to your computer.");
        } else {
          setError("Unable to detect your location. Try again, or use Twimzi on your mobile phone while at your business premises.");
        }
      } else {
        setError(e instanceof Error ? e.message : "Unable to save the business location.");
      }
    } finally { setSaving(false); }
  }

  const fields: Array<{ key: keyof Branch; label: string; required?: boolean }> = [
    { key: "branch_name", label: "Branch / Head-office name", required: true },
    { key: "address_line_1", label: "Street address", required: true },
    { key: "address_line_2", label: "Address line 2" },
    { key: "landmark", label: "Landmark" },
    { key: "city", label: "City", required: true },
    { key: "state", label: "State", required: true },
    { key: "country", label: "Country", required: true },
    { key: "postal_code", label: "Postal code" },
  ];

  return (
    <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <h2 className="text-base font-bold text-slate-900">Business Location & Head Office</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Add your business address and capture its actual GPS location. This creates a head-office branch if one does not exist yet.</p>
          {branch.latitude != null && branch.longitude != null && <p className="mt-2 text-xs font-medium text-emerald-700">Saved GPS: {branch.latitude.toFixed(6)}, {branch.longitude.toFixed(6)}</p>}
          {!exists && <p className="mt-2 text-xs font-medium text-amber-700">No head-office branch exists yet. Complete the fields to create one.</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="block text-sm font-semibold text-slate-700">
            {field.label}{field.required ? " *" : ""}
            <input value={String(branch[field.key] ?? "")} required={field.required} onChange={(event) => update(field.key, event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-slate-900" />
          </label>
        ))}
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs leading-5 text-slate-500">Allow location permission when prompted. Use this while physically at the business premises.</p>
        <button type="button" onClick={saveLocation} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1879FD] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          <LocateFixed className="h-4 w-4" />{saving ? "Saving location..." : "Use Current Location & Save"}
        </button>
      </div>
    </section>
  );
}
