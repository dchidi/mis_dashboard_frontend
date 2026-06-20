export const formatPercent = (value: number) => `${value}%`;

export const formatCount = (value: number) => value.toLocaleString();

export const formatAxisCount = (value: number) =>
  value >= 1000 ? `${Number((value / 1000).toFixed(1))}K` : formatCount(value);

interface CompactCurrencyOptions {
  currencySymbol: string;
}

const formatNumberWithOptionalDecimals = (value: number) => {
  const hasWholeValue = Number(value.toFixed(2)) % 1 === 0;

  return value.toLocaleString(undefined, {
    maximumFractionDigits: hasWholeValue ? 0 : 2,
    minimumFractionDigits: hasWholeValue ? 0 : 2,
  });
};

export const formatCompactCurrency = (
  value: number,
  { currencySymbol }: CompactCurrencyOptions,
) => {
  const sign = value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);
  const units = ["", "K", "M", "B", "T"];
  let compactValue = absoluteValue;
  let unitIndex = 0;

  while (compactValue >= 999.995 && unitIndex < units.length - 1) {
    compactValue /= 1000;
    unitIndex += 1;
  }

  return `${sign}${currencySymbol}${formatNumberWithOptionalDecimals(
    compactValue,
  )}${units[unitIndex]}`;
};
