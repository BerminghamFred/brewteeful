import { createClient } from "@/lib/supabase/server";
import {
  saveFloatingBannerAction,
  saveExitPopupAction,
} from "@/lib/actions/admin";

export default async function AdminSettingsPage() {
  let floating = "";
  let exitTitle = "";
  let exitSub = "";

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["floating_offer", "exit_popup"]);
    for (const row of data ?? []) {
      const v = row.value as Record<string, unknown>;
      if (row.key === "floating_offer") {
        floating = (v.text as string) ?? "";
      }
      if (row.key === "exit_popup") {
        exitTitle = (v.title as string) ?? "";
        exitSub = (v.subtitle as string) ?? "";
      }
    }
  } catch {
    /* defaults */
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-white">Site settings</h1>
      <p className="mt-2 text-sm text-white/55">
        Banners and popups sync to the storefront.
      </p>

      <form
        action={saveFloatingBannerAction}
        className="mt-8 max-w-lg space-y-4 rounded-xl border border-white/10 p-6"
      >
        <h2 className="font-medium text-white">Floating offer bar</h2>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="enabled" defaultChecked className="accent-brand-accent" />
          Enabled
        </label>
        <textarea
          name="text"
          defaultValue={floating}
          rows={2}
          className="w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-dark"
        >
          Save banner
        </button>
      </form>

      <form
        action={saveExitPopupAction}
        className="mt-8 max-w-lg space-y-4 rounded-xl border border-white/10 p-6"
      >
        <h2 className="font-medium text-white">Exit intent popup</h2>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="enabled" defaultChecked className="accent-brand-accent" />
          Enabled
        </label>
        <input
          name="title"
          defaultValue={exitTitle}
          placeholder="Title"
          className="w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
        <textarea
          name="subtitle"
          defaultValue={exitSub}
          placeholder="Subtitle"
          rows={2}
          className="w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
        <input
          name="discount"
          type="number"
          defaultValue={10}
          className="w-full rounded-lg border border-white/15 bg-brand-ink px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-dark"
        >
          Save popup
        </button>
      </form>
    </div>
  );
}
