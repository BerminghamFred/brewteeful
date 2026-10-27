"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

/** Uploads to the `product-images` bucket (admin-only storage policy) and appends URLs to the textarea. */
export function ImageUploader({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    const sb = createClient();
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${Date.now()}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
      const { error } = await sb.storage.from("product-images").upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) {
        setErr(error.message);
        continue;
      }
      urls.push(sb.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    }
    setValue((v) => [v.trim(), ...urls].filter(Boolean).join("\n"));
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <textarea name={name} value={value} onChange={(e) => setValue(e.target.value)} rows={4} className="input font-mono text-xs" placeholder="One image URL per line — first is the main image" />
      <input type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} disabled={busy} className="text-sm" />
      {busy ? <p className="text-xs">Uploading…</p> : null}
      {err ? <p className="text-xs font-bold text-flare">{err}</p> : null}
    </div>
  );
}
