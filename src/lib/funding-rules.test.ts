import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getFundingRequirements } from "./funding-rules";
import { resolvePreferredLanguage } from "./language-preference";

describe("first-deposit and withdrawal rules", () => {
  it("requires a $100 first deposit for English accounts below the high-balance threshold", () => {
    assert.deepEqual(getFundingRequirements(10_000, "en", false), {
      canWithdraw: false,
      depositCurrency: "USD",
      firstDepositMinimum: 100,
    });
  });

  it("requires a €100 first deposit for German accounts below the high-balance threshold", () => {
    assert.deepEqual(getFundingRequirements(10_000, "de", false), {
      canWithdraw: false,
      depositCurrency: "EUR",
      firstDepositMinimum: 100,
    });
  });

  it("requires a $200 first deposit when an English account is above $10,000", () => {
    assert.equal(getFundingRequirements(10_001, "en", false).firstDepositMinimum, 200);
  });

  it("requires a €200 first deposit when a German account is above 10,000", () => {
    assert.equal(getFundingRequirements(10_001, "de", false).firstDepositMinimum, 200);
  });

  it("allows withdrawal after a deposit request regardless of its confirmation or investment history", () => {
    assert.equal(getFundingRequirements(500, "en", false).canWithdraw, false);
    assert.equal(getFundingRequirements(500, "en", true).canWithdraw, true);
  });

  it("defaults to German for a German IP country and English otherwise", () => {
    assert.equal(resolvePreferredLanguage(null, "DE"), "de");
    assert.equal(resolvePreferredLanguage(null, "US"), "en");
  });

  it("always preserves a saved language over IP country", () => {
    assert.equal(resolvePreferredLanguage("en", "DE"), "en");
    assert.equal(resolvePreferredLanguage("de", "US"), "de");
  });
});