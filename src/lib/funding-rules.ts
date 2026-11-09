import type { Lang } from "@/lib/i18n";

export function getFundingRequirements(
  walletBalance: number,
  lang: Lang,
  hasConfirmedDeposit: boolean,
) {
  return {
    depositCurrency: lang === "de" ? "EUR" : "USD",
    firstDepositMinimum: hasConfirmedDeposit ? 0 : walletBalance > 10_000 ? 200 : 100,
  } as const;
}