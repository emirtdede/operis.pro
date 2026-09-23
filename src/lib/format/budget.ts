/**
 * Shared utility for formatting localized project and listing budget labels.
 */
export function formatBudgetRange(
  budgetMin: string | number | null | undefined,
  budgetMax: string | number | null | undefined,
  budgetCurrency: string | null | undefined,
  isTr: boolean
): string {
  const currency = budgetCurrency || (isTr ? "TL" : "USD");
  const locale = isTr ? "tr-TR" : "en-US";

  const minVal =
    budgetMin !== null && budgetMin !== undefined && budgetMin !== ""
      ? parseFloat(String(budgetMin))
      : null;
  const maxVal =
    budgetMax !== null && budgetMax !== undefined && budgetMax !== ""
      ? parseFloat(String(budgetMax))
      : null;

  if (
    minVal !== null &&
    !Number.isNaN(minVal) &&
    maxVal !== null &&
    !Number.isNaN(maxVal) &&
    minVal > 0 &&
    maxVal > 0
  ) {
    const formattedMin = minVal.toLocaleString(locale);
    const formattedMax = maxVal.toLocaleString(locale);
    return `${formattedMin} – ${formattedMax} ${currency}`;
  }

  if (minVal !== null && !Number.isNaN(minVal) && minVal > 0) {
    const formattedMin = minVal.toLocaleString(locale);
    const prefix = isTr ? "Min" : "From";
    return `${prefix} ${formattedMin} ${currency}`;
  }

  if (maxVal !== null && !Number.isNaN(maxVal) && maxVal > 0) {
    const formattedMax = maxVal.toLocaleString(locale);
    const prefix = isTr ? "Maks" : "Up to";
    return `${prefix} ${formattedMax} ${currency}`;
  }

  return isTr ? "Belirtilmedi" : "Negotiable";
}
