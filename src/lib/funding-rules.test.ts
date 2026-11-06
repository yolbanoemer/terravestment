import { describe, expect, it } from "bun:test";
import { getFundingRequirements } from "./funding-rules";

describe("first-deposit and withdrawal rules", () => {
  it("requires a $100 first deposit for English accounts below the high-balance threshold", () => {
    expect(getFundingRequirements(10_000, "en", false)).toEqual({
      canWithdraw: false,
      depositCurrency: "USD",
      firstDepositMinimum: 100,
    });
  });

  it("requires a €100 first deposit for German accounts below the high-balance threshold", () => {
    expect(getFundingRequirements(10_000, "de", false)).toEqual({
      canWithdraw: false,
      depositCurrency: "EUR",
      firstDepositMinimum: 100,
    });
  });

  it("requires a $200 first deposit when an English account is above $10,000", () => {
    expect(getFundingRequirements(10_001, "en", false).firstDepositMinimum).toBe(200);
  });

  it("requires a €200 first deposit when a German account is above 10,000", () => {
    expect(getFundingRequirements(10_001, "de", false).firstDepositMinimum).toBe(200);
  });

  it("allows withdrawal only after a confirmed deposit, regardless of investments", () => {
    expect(getFundingRequirements(500, "en", false).canWithdraw).toBe(false);
    expect(getFundingRequirements(500, "en", true).canWithdraw).toBe(true);
  });
});