import type { Lang } from "@/lib/i18n";

export function getFundingRequirements(
  walletBalance: number,
  lang: Lang,
  hasDepositRequest: boolean,
) {
  return {
    depositCurrency: lang === "de" ? "EUR" : "USD",
    canWithdraw: hasDepositRequest,
    firstDepositMinimum: hasDepositRequest ? 0 : walletBalance > 10_000 ? 200 : 100,
  } as const;
}