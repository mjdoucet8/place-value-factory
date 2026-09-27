const numberFormatter = new Intl.NumberFormat("en-CA", {
  maximumFractionDigits: 20,
  useGrouping: true,
});

/** Formats displayed numbers with spaces between groups of three digits. */
export function formatNumber(value: number) {
  return numberFormatter.format(value).replaceAll(",", " ");
}
