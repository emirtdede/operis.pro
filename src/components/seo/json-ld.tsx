import { serializeJsonLd } from "@/src/lib/security/json-ld";

export interface JsonLdProps {
  data: Record<string, unknown>;
  id?: string;
}

/**
 * Enterprise SEO JSON-LD Structured Data Component.
 * Automatically sanitizes `<` and `>` into unicode escape sequences `\u003c` and `\u003e`
 * via `serializeJsonLd()` to eliminate XSS script-injection breakouts when injecting
 * Schema.org metadata into the DOM.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script id={id} type="application/ld+json">
      {serializeJsonLd(data)}
    </script>
  );
}
