import { createClient } from "@/lib/supabase/server";
import { updateExperimentStatusAction } from "@/lib/actions/admin";

export default async function AdminExperimentsPage() {
  let rows: {
    id: string;
    slug: string;
    name: string;
    status: string;
    experiment_type: string;
    variants: Record<string, unknown>;
  }[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("experiments")
      .select("*")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as typeof rows;
  } catch {
    rows = [];
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-white">A/B tests</h1>
      <p className="mt-2 text-sm text-white/55">
        Variants are assigned per visitor and stored with experiment_assignments.
        Order attribution in v2.
      </p>
      <ul className="mt-8 space-y-4">
        {rows.map((e) => (
          <li
            key={e.id}
            className="rounded-xl border border-white/10 bg-brand-concrete/30 p-4"
          >
            <p className="font-medium text-white">{e.name}</p>
            <p className="text-xs text-white/45">{e.slug} · {e.experiment_type}</p>
            <pre className="mt-2 max-h-32 overflow-auto text-[10px] text-white/55">
              {JSON.stringify(e.variants, null, 2)}
            </pre>
            <form action={updateExperimentStatusAction} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="id" value={e.id} />
              <select
                name="status"
                defaultValue={e.status}
                className="rounded border border-white/15 bg-brand-ink px-2 py-1 text-xs text-white"
              >
                <option value="draft">draft</option>
                <option value="running">running</option>
                <option value="paused">paused</option>
              </select>
              <button
                type="submit"
                className="rounded bg-white/10 px-2 text-xs text-white hover:bg-white/20"
              >
                Update
              </button>
            </form>
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="mt-8 text-sm text-white/45">
          Run seed.sql to create the homepage headline experiment.
        </p>
      )}
    </div>
  );
}
