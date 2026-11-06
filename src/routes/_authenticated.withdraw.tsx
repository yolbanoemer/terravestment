import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { profileQuery, withdrawalsQuery, settingsQuery, depositsQuery } from "@/lib/queries";
import { usd, shortDate, num } from "@/lib/format";
import { cryptoNetworks, bankCountries } from "@/lib/deposit";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — Terravest" },
      { name: "description", content: "Request a payout to crypto or PayPal and track its status." },
      { property: "og:title", content: "Withdraw — Terravest" },
      { property: "og:description", content: "Request a payout and track its status." },
    ],
  }),
  component: Withdraw,
});

const methods = ["Crypto", "PayPal", "Bank transfer"] as const;
type Method = (typeof methods)[number];

function Withdraw() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery(user?.id));
  const { data: requests = [] } = useQuery(withdrawalsQuery(user?.id));
  const { data: deposits = [] } = useQuery(depositsQuery(user?.id));
  const { data: settings } = useQuery(settingsQuery);
  const [amount, setAmount] = useState(100);
  const [method, setMethod] = useState<Method>("Crypto");
  const [coin, setCoin] = useState<string>(cryptoNetworks[0]!.code);
  const [country, setCountry] = useState(bankCountries[0]!);
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);

  const hasDeposit = deposits.length > 0;
  const feePct = num(profile?.withdrawal_fee_pct ?? 0);
  const fee = Math.round(amount * feePct) / 100;

  const minWithdrawal = num(
    (settings?.["platform"] as { min_withdrawal?: number } | undefined)?.["min_withdrawal"] ?? 0,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const fullMethod =
      method === "Crypto"
        ? `Crypto (${coin})`
        : method === "Bank transfer"
          ? `Bank transfer (${country})`
          : "PayPal";
    const { error } = await supabase.rpc("request_withdrawal", {
      _amount: amount,
      _method: fullMethod,
      _destination: destination,
      _lang: lang,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request submitted — our team reviews it shortly");
    setDestination("");
    qc.invalidateQueries();
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Withdraw"
        subtitle={`Available: ${usd(profile?.wallet_balance)} · minimum ${usd(minWithdrawal)}`}
      />

      {!hasDeposit && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {t("withdraw.mustDeposit")}
        </p>
      )}

      <form onSubmit={submit} className="surface-card grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="w-amount">Amount (USD)</Label>
          <Input
            id="w-amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Method</Label>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={
                  "rounded-full border px-3 py-1.5 text-xs transition-colors " +
                  (m === method
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        {method === "Crypto" && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Coin</Label>
            <div className="flex flex-wrap gap-2">
              {cryptoNetworks.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCoin(c.code)}
                  className={
                    "rounded-full border px-3 py-1.5 text-xs transition-colors " +
                    (c.code === coin
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-muted-foreground hover:text-foreground")
                  }
                >
                  {c.name} ({c.code})
                </button>
              ))}
            </div>
          </div>
        )}
        {method === "Bank transfer" && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="w-country">Country</Label>
            <select
              id="w-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="h-10 w-full max-w-xs rounded-md border border-border bg-background px-3 text-sm"
            >
              {bankCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="dest">
            {method === "PayPal"
              ? "PayPal email"
              : method === "Bank transfer"
                ? "Bank details (account name, IBAN / account number, bank)"
                : `Your ${coin} wallet address`}
          </Label>
          <Input
            id="dest"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={
              method === "PayPal"
                ? "you@example.com"
                : method === "Bank transfer"
                  ? "Jane Doe · DE89 3704 0044 0532 0130 00 · Commerzbank"
                  : "Paste your wallet address"
            }
            required
          />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          {feePct > 0
            ? `${t("withdraw.fee")}: ${feePct}% · ${t("withdraw.receive")}: ${usd(Math.max(0, amount - fee))}`
            : ""}
        </p>
        <Button
          type="submit"
          variant="hero"
          className="sm:col-span-2"
          disabled={busy || !hasDeposit}
        >
          {busy ? "Submitting…" : `Request ${usd(amount)}`}
        </Button>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          The amount is held from your wallet while the request is reviewed. Rejected requests are
          refunded in full. Every payout stays pending until our team confirms it.
        </p>
      </form>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Your requests</h2>
      <div className="surface-card rounded-2xl">
        {requests.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">No withdrawal requests yet.</p>
        )}
        <ul className="divide-y divide-border">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{usd(r.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {r.method} · {r.destination} · {shortDate(r.created_at)}
                </p>
                {r.admin_note && <p className="text-xs text-muted-foreground">“{r.admin_note}”</p>}
              </div>
              <span
                className={
                  "rounded-full px-2 py-1 text-xs " +
                  (r.status === "pending"
                    ? "bg-warning/15 text-warning"
                    : r.status === "rejected"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-success/15 text-success")
                }
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
