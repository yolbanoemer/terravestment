import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Plan = {
  id: string;
  name: string;
  lock_days: number;
  daily_rate: number;
  min_amount: number;
  is_active: boolean;
  sort_order: number;
};

export const plansQuery = (includeInactive = false) =>
  queryOptions({
    queryKey: ["plans", includeInactive],
    queryFn: async (): Promise<Plan[]> => {
      let q = supabase.from("plans").select("*").order("sort_order");
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Plan[];
    },
  });

export const profileQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const investmentsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["investments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*, plans(name)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const transactionsQuery = (userId: string | undefined, limit = 50) =>
  queryOptions({
    queryKey: ["transactions", userId, limit],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

export const withdrawalsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["withdrawals", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const ticketsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["tickets", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const announcementsQuery = queryOptions({
  queryKey: ["announcements"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data ?? [];
  },
});

export const settingsQuery = queryOptions({
  queryKey: ["platform_settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("platform_settings").select("*");
    if (error) throw error;
    const map: Record<string, Record<string, unknown>> = {};
    for (const row of data ?? []) map[row.key] = row.value as Record<string, unknown>;
    return map;
  },
});

export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
};

export const marketQuery = queryOptions({
  queryKey: ["market"],
  refetchInterval: 60_000,
  staleTime: 30_000,
  queryFn: async (): Promise<MarketCoin[]> => {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h,7d",
    );
    if (!res.ok) throw new Error("Live prices are temporarily unavailable");
    return (await res.json()) as MarketCoin[];
  },
});

/* ---------- staff / admin ---------- */

export const allProfilesQuery = queryOptions({
  queryKey: ["admin", "profiles"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const allRolesQuery = queryOptions({
  queryKey: ["admin", "roles"],
  queryFn: async () => {
    const { data, error } = await supabase.from("user_roles").select("*");
    if (error) throw error;
    return data ?? [];
  },
});

export const allInvestmentsQuery = queryOptions({
  queryKey: ["admin", "investments"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("investments")
      .select("*, plans(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export const allTransactionsQuery = queryOptions({
  queryKey: ["admin", "transactions"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return data ?? [];
  },
});

export const allWithdrawalsQuery = queryOptions({
  queryKey: ["admin", "withdrawals"],
  queryFn: async () => {
    const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export const allTicketsQuery = queryOptions({
  queryKey: ["admin", "tickets"],
  queryFn: async () => {
    const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export const depositsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["deposits", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const allDepositsQuery = queryOptions({
  queryKey: ["admin", "deposits"],
  queryFn: async () => {
    const { data, error } = await supabase
        .from("deposits")
        .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});
