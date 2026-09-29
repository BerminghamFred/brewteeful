import { getFaqs } from "@/lib/store";
import { Faqs } from "@/components/site/Faqs";
import { InfoPage } from "@/components/site/InfoPage";
import { JsonLd } from "@/components/site/JsonLd";

export const metadata = {
  title: "Stag T-Shirt FAQ",
  description: "Minimum order, pricing, delivery times, sizing and returns for our stag do T-shirt sets.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getFaqs();
  return (
    <InfoPage title="FAQ">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
      <Faqs faqs={faqs} />
    </InfoPage>
  );
}
