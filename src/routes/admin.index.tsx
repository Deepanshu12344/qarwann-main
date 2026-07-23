import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Plane,
  Inbox,
  Sparkles,
  Mail,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";

type Stats = {
  totalTrips: number;
  totalEnquiries: number;
  newEnquiriesWeek: number;
  subscriberCount: number | null;
  enquiriesByStatus: Record<string, number>;
  enquiriesPerDay: { date: string; count: number }[];
  tripsByType: { type: string; count: number }[];
};

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api<Stats>("/api/admin/stats", { auth: true }),
    refetchOnWindowFocus: false,
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A snapshot of your trips, enquiries, and audience.
        </p>
      </header>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn't load stats: {(error as Error).message}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total Trips"
          value={data?.totalTrips}
          icon={<Plane className="h-5 w-5" />}
          loading={isLoading}
        />
        <Kpi
          label="Total Enquiries"
          value={data?.totalEnquiries}
          icon={<Inbox className="h-5 w-5" />}
          loading={isLoading}
        />
        <Kpi
          label="New This Week"
          value={data?.newEnquiriesWeek}
          icon={<Sparkles className="h-5 w-5" />}
          loading={isLoading}
        />
        <Kpi
          label="Newsletter Subscribers"
          value={data?.subscriberCount ?? "—"}
          icon={<Mail className="h-5 w-5" />}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-xl text-primary">Enquiries · last 30 days</h2>
            <span className="text-xs text-muted-foreground">Daily volume</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.enquiriesPerDay || []}>
                <defs>
                  <linearGradient id="enqFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#004643" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#004643" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#004643" strokeWidth={2} fill="url(#enqFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-serif text-xl text-primary">Trips by Type</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.tripsByType || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="count" fill="#C9A227" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["new", "contacted", "closed"] as const).map((s) => (
          <Card key={s} className="p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {s} enquiries
            </div>
            <div className="mt-2 font-serif text-3xl text-primary">
              {data?.enquiriesByStatus?.[s] ?? 0}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: number | string | null | undefined;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 font-serif text-2xl text-primary">
          {loading ? "…" : value ?? 0}
        </div>
      </div>
    </Card>
  );
}
