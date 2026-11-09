import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bitcoin, Building2, Copy, Star, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { depositsQuery, profileQuery } from "@/lib/queries";
import { usd, shortDate } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { getFundingRequirements } from "@/lib/funding-rules";
import { cryptoNetworks, bankCountries } from "@/lib/deposit";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/deposit")({
  head: () => ({
    meta: [
      { title: "Add funds — Terravest" },
      {
        name: "description",
        content: "Fund your Terravest wallet with crypto, PayPal or bank transfer.",
      },
      { property: "og:title", content: "Add funds — Terravest" },
      { property: "og:description", content: "Fund your wallet with crypto, PayPal or bank." },
    ],
  }),
  component: DepositPage,
});

type Method = "crypto" | "paypal" | "bank";

const methodMeta: { key: Method; label: string; icon: typeof Wallet; hint: string }[] = [
  { key: "crypto", label: "Crypto", icon: Bitcoin, hint: "Fastest — credited after confirmation" },
  { key: "paypal", label: "PayPal", icon: Wallet, hint: "Submit a request, we review it" },
  { key: "bank", label: "Bank transfer", icon: Building2, hint: "Not available yet" },
];

function DepositPage() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery(user?.id));
  const { data: deposits = [] } = useQuery(depositsQuery(user?.id));

  const [method, setMethod] = useState<Method>("crypto");
  const [amount, setAmount] = useState(500);
  const [coin, setCoin] = useState(cryptoNetworks[0]!.code);
  const [reference, setReference] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [country, setCountry] = useState(bankCountries[0]!);
  const [busy, setBusy] = useState(false);

  const selectedCoin = cryptoNetworks.find((c) => c.code === coin)!;
  const hasConfirmedDeposit = deposits.some((deposit) => deposit.status === "confirmed");
  const fundingRequirements = getFundingRequirements(
    Number(profile?.wallet_balance ?? 0),
    lang,
    hasConfirmedDeposit,
  );
  const minDeposit = fundingRequirements.firstDepositMinimum || 1;

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Address copied");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (method === "bank") return;
    setBusy(true);
    const { error } = await supabase.rpc("request_deposit", {
      _method: method,
      _amount: amount,
      _asset: method === "crypto" ? selectedCoin.code : fundingRequirements.depositCurrency,
      _country: "",
      _destination: method === "crypto" ? selectedCoin.address : paypalEmail,
      _reference: reference,
      _lang: lang,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deposit request submitted — check back for confirmation");
    setReference("");
    qc.invalidateQueries();
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Add funds"
        subtitle={`Wallet balance: ${usd(profile?.wallet_balance)}`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {methodMeta.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMethod(m.key)}
            className={
              "rounded-xl border p-4 text-left transition-colors " +
              (m.key === method
                ? "border-accent bg-accent/10"
                : "border-border hover:border-primary-glow/50")
            }
          >
            <div className="flex items-center gap-2">
              <m.icon className="size-4 text-accent" />
              <p className="text-sm font-medium">{m.label}</p>
              {m.key === "crypto" && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] text-success">
                  <Star className="size-3" /> Recommended
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{m.hint}</p>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="surface-card mt-6 space-y-5 rounded-2xl p-5">
        {method !== "bank" && (
          <div className="max-w-xs space-y-2">
            <Label htmlFor="dep-amount">{t("deposit.amount")}</Label>
            <Input
              id="dep-amount"
              type="number"
              min={minDeposit}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              required
            />
            {!hasConfirmedDeposit && (
              <p className="text-xs text-muted-foreground">
                {fundingRequirements.firstDepositMinimum === 200
                  ? t("deposit.highBalanceMinimum")
                  : t("deposit.firstMinimum").replace("{amount}", String(minDeposit))}
              </p>
            )}
          </div>
        )}

        {method === "crypto" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {cryptoNetworks.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCoin(c.code)}
                  className={
                    "rounded-full border px-4 py-1.5 text-sm transition-colors " +
                    (c.code === coin
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-muted-foreground hover:text-foreground")
                  }
                >
                  {c.name} ({c.code})
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-border p-4">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                Send {selectedCoin.code} to this address
              </p>
              <p className="mt-2 font-mono text-xs break-all">{selectedCoin.address}</p>
              <div className="mt-3 flex items-center gap-3">
                <Button type="button" variant="subtle" size="sm" onClick={() => copy(selectedCoin.address)}>
                  <Copy className="size-4" /> Copy address
                </Button>
                <p className="text-xs text-muted-foreground">Network: {selectedCoin.network}</p>
              </div>
              <p className="mt-3 text-xs text-warning">
                Only send {selectedCoin.code} on this network. Anything else is lost.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txid">Transaction ID (after sending)</Label>
              <Input
                id="txid"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Paste the transaction hash"
              />
            </div>
          </div>
        )}

        {method === "paypal" && (
          <div className="space-y-2">
            <Label htmlFor="pp">Your PayPal email</Label>
            <Input
              id="pp"
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Submit your deposit request and check back — our team sends payment instructions and
              credits your wallet once the money lands.
            </p>
          </div>
        )}

        {method === "bank" && (
          <div className="space-y-3">
            <div className="max-w-xs space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {bankCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              Bank deposits for {country} are not available at this moment. Please use crypto or
              PayPal in the meantime.
            </p>
          </div>
        )}

        {method !== "bank" && (
          <Button type="submit" variant="hero" disabled={busy}>
            {busy ? "Submitting…" : `Submit deposit request for ${usd(amount)}`}
          </Button>
        )}
      </form>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Your deposit requests</h2>
      <div className="surface-card rounded-2xl">
        {deposits.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">No deposit requests yet.</p>
        )}
        <ul className="divide-y divide-border">
          {deposits.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{usd(d.amount)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {d.method} · {d.asset} · {shortDate(d.created_at)}
                </p>
                {d.admin_note && <p className="text-xs text-muted-foreground">“{d.admin_note}”</p>}
              </div>
              <span
                className={
                  "rounded-full px-2 py-1 text-xs " +
                  (d.status === "pending"
                    ? "bg-warning/15 text-warning"
                    : d.status === "rejected"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-success/15 text-success")
                }
              >
                {d.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
