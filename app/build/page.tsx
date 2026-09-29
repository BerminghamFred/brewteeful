import { Suspense } from "react";
import { Builder } from "@/components/builder/Builder";
import { getBuilderConfig } from "@/lib/builder-config";

export const metadata = {
  title: "Build your stag set",
  description: "Pick your group size, give everyone a different design and a size, pay once.",
  alternates: { canonical: "/build" },
  robots: { index: false },
};

export default async function BuildPage() {
  const cfg = await getBuilderConfig();
  return (
    <Suspense>
      <Builder cfg={cfg} />
    </Suspense>
  );
}
