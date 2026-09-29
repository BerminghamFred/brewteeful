import { getStorefrontContext } from "@/lib/store";
import { InfoPage } from "@/components/site/InfoPage";

export const metadata = {
  title: "Size Guide",
  description: "T-shirt measurements for every size, and how to pick the right one for the whole group.",
  alternates: { canonical: "/size-guide" },
};

export default async function SizeGuidePage() {
  const { settings } = await getStorefrontContext();
  return (
    <InfoPage title="Size guide">
      <p>{settings.sizing.fit_note}</p>
      <div className="card my-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-ink bg-sun text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Chest width (cm)</th>
              <th className="px-4 py-3">Length (cm)</th>
            </tr>
          </thead>
          <tbody>
            {settings.sizing.chart.map((r) => (
              <tr key={r.size} className="border-b border-ink/10 last:border-0">
                <td className="px-4 py-3 font-extrabold">{r.size}</td>
                <td className="px-4 py-3">{r.chest_cm}</td>
                <td className="px-4 py-3">{r.length_cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>{settings.content.garment_info}</p>
      <p>Wrong size? If you tell us within 24 hours of ordering, we&apos;ll change it before printing.</p>
    </InfoPage>
  );
}
