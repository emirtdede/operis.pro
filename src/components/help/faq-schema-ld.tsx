import { FAQ_ITEMS } from "./faq-data";
import { getLocalizedRoute } from "@/src/lib/i18n/routes";
import { JsonLd } from "@/src/components/seo/json-ld";
import { getBaseUrl } from "@/src/lib/config/url";

interface FaqSchemaLdProps {
  locale: "tr" | "en";
}

export function FaqSchemaLd({ locale }: FaqSchemaLdProps) {
  const isTr = locale === "tr";
  const baseUrl = getBaseUrl();
  const helpUrl = `${baseUrl}${getLocalizedRoute("help", locale)}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HelpPage",
        name: isTr
          ? "Rehber & Sıkça Sorulan Sorular (SSS) — Bilgi Merkezi"
          : "Help, Guidelines & Frequently Asked Questions (FAQ)",
        description: isTr
          ? "168 saatlik canlılık döngüsü, %0 komisyonsuz doğrudan model, AES-256 şifreli teklifler, vergi ve sözleşme rehberi hakkında kapsamlı bilgi merkezi."
          : "Complete guide to Operis 168-hour lifecycles, zero-commission model, encrypted blind bids, taxes, and legal contracts.",
        url: helpUrl,
        inLanguage: locale,
        publisher: {
          "@type": "Organization",
          name: "Vellium",
          url: "https://vellium.dev",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isTr ? "Ana Sayfa" : "Home",
            item: `${baseUrl}/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isTr ? "Rehber & SSS" : "Help & FAQ",
            item: helpUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: isTr ? item.questionTr : item.questionEn,
          acceptedAnswer: {
            "@type": "Answer",
            text: isTr ? item.answerTr : item.answerEn,
          },
        })),
      },
    ],
  };

  return <JsonLd data={schema} />;
}
