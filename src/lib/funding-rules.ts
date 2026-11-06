import type { Lang } from "@/lib/i18n";

export function getFundingRequirements(
  walletBalance: number,
  lang: Lang,
  hasDeposit: boolean,
) {
  return {
    canWithdraw: hasDeposit,
    depositCurrency: lang === "de" ? "EUR" : "USD",
    firstDepositMinimum: hasDeposit ? 0 : walletBalance > 10_000 ? 200 : 100,
  } as const;
}