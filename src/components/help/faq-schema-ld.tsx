import { FAQ_ITEMS } from "./faq-data";

interface FaqSchemaLdProps {
  locale: "tr" | "en";
}

export function FaqSchemaLd({ locale }: FaqSchemaLdProps) {
  const isTr = locale === "tr";

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: isTr ? item.questionTr : item.questionEn,
      acceptedAnswer: {
        "@type": "Answer",
        text: isTr ? item.answerTr : item.answerEn,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
