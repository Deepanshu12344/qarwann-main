import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Download,
  Trash2,
  Search,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { api, API_BASE_URL, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type Enquiry = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  tripName?: string;
  travelers: number;
  travelStartDate?: string;
  travelEndDate?: string;
  message?: string;
  newsletterOptIn: boolean;
  status: "new" | "contacted" | "closed";
  source?: string;
  createdAt: string;
};

type ListRes = {
  items: Enquiry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export const Route = createFileRoute("/admin/enquiries")({
  component: EnquiriesPage,
});

function EnquiriesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<Enquiry | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "enquiries", { q, status, page }],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (status) sp.set("status", status);
      sp.set("page", String(page));
      sp.set("limit", "20");
      return api<ListRes>(`/api/enquiries?${sp.toString()}`, { auth: true });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Enquiry["status"] }) =>
      api(`/api/enquiries/${id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_d, v) => {
      toast.success(`Status set to ${v.status}`);
      qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
      if (active && active._id === v.id) setActive({ ...active, status: v.status });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/enquiries/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => {
      toast.success("Enquiry deleted");
      qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
      setActive(null);
    },
  });

  async function onExport() {
    setExporting(true);
    try {
      const sp = new URLSearchParams();
      if (status) sp.set("status", status);
      const res = await fetch(`${API_BASE_URL}/api/enquiries/export?${sp.toString()}`, {
        headers: { Authorization: `Bearer ${getToken() || ""}` },
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qarwaan-enquiries-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error("Export failed", { description: e?.message });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-primary">Enquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All submissions from the website. {data ? `${data.total} total.` : ""}
          </p>
        </div>
        <Button
          onClick={onExport}
          disabled={exporting}
          className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export to Excel
        </Button>
      </header>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Search by name, email, trip..."
            className="pl-9"
          />
        </div>
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v === "all" ? "" : v);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Trip</TableHead>
              <TableHead>Pax</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No enquiries yet.
                </TableCell>
              </TableRow>
            )}
            {data?.items?.map((e) => (
              <TableRow
                key={e._id}
                className="cursor-pointer"
                onClick={() => setActive(e)}
              >
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">{e.tripName || "—"}</TableCell>
                <TableCell>{e.travelers}</TableCell>
                <TableCell className="text-xs">
                  <div>{e.email}</div>
                  <div className="text-muted-foreground">{e.phone}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.status} />
                </TableCell>
                <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setActive(e)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-muted hover:text-primary"
                      aria-label="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this enquiry?")) del.mutate(e._id);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Page {data.page} of {data.pages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="font-serif text-2xl text-primary">
                  {active.name}
                </SheetTitle>
                <SheetDescription>
                  Received {new Date(active.createdAt).toLocaleString()}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <DetailRow label="Email" value={active.email} />
                <DetailRow label="Phone" value={active.phone} />
                <DetailRow label="Trip" value={active.tripName || "—"} />
                <DetailRow label="Travelers" value={String(active.travelers)} />
                <DetailRow
                  label="Travel Dates"
                  value={
                    [active.travelStartDate, active.travelEndDate]
                      .filter(Boolean)
                      .map((d) => new Date(d as string).toDateString())
                      .join(" → ") || "—"
                  }
                />
                <DetailRow
                  label="Newsletter Opt-In"
                  value={active.newsletterOptIn ? "Yes" : "No"}
                />
                <DetailRow label="Source" value={active.source || "website"} />
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Message
                  </div>
                  <div className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3">
                    {active.message || "—"}
                  </div>
                </div>
                <div className="pt-2">
                  <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </div>
                  <Select
                    value={active.status}
                    onValueChange={(v) =>
                      updateStatus.mutate({ id: active._id, status: v as Enquiry["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm("Delete this enquiry?")) del.mutate(active._id);
                    }}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusBadge({ status }: { status: Enquiry["status"] }) {
  const map = {
    new: "bg-accent/15 text-accent-foreground border-accent/40",
    contacted: "bg-primary/10 text-primary border-primary/30",
    closed: "bg-muted text-muted-foreground border-border",
  } as const;
  return (
    <Badge variant="outline" className={`${map[status]} uppercase tracking-wider text-[10px]`}>
      {status}
    </Badge>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border pb-2">
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}
