import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Trash2, Plus, FileUp, Search } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Trip = {
  _id: string;
  packageName: string;
  duration: string;
  tripType: string;
  citiesCovered: string[];
  startPoint: string;
  slug: string;
};
type ListRes = {
  items: Trip[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export const Route = createFileRoute("/admin/trips/")({
  component: TripsAdminListPage,
});

function TripsAdminListPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "trips", { q, page }],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      sp.set("page", String(page));
      sp.set("limit", "20");
      return api<ListRes>(`/api/trips?${sp.toString()}`, { auth: true });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/trips/${id}`, { method: "DELETE", auth: true }),
    onSuccess: () => {
      toast.success("Trip deleted");
      qc.invalidateQueries({ queryKey: ["admin", "trips"] });
    },
    onError: (e: any) => toast.error("Delete failed", { description: e?.message }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-primary">Trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, import, and delete trip packages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/trips/import">
            <Button variant="outline" className="rounded-full">
              <FileUp className="mr-2 h-4 w-4" /> Import Excel
            </Button>
          </Link>
          <Link to="/admin/trips/new">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> New Trip
            </Button>
          </Link>
        </div>
      </header>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Search by name or overview..."
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Cities</TableHead>
              <TableHead>Start</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No trips found.
                </TableCell>
              </TableRow>
            )}
            {data?.items?.map((t) => (
              <TableRow key={t._id}>
                <TableCell>
                  <div className="font-medium text-foreground">{t.packageName}</div>
                  <div className="text-xs text-muted-foreground">{t.slug}</div>
                </TableCell>
                <TableCell>{t.tripType}</TableCell>
                <TableCell>{t.duration}</TableCell>
                <TableCell className="max-w-[260px] truncate">
                  {t.citiesCovered?.join(", ")}
                </TableCell>
                <TableCell>{t.startPoint}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      to="/admin/trips/$id/edit"
                      params={{ id: t._id }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-muted hover:text-primary"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${t.packageName}"? This cannot be undone.`))
                          del.mutate(t._id);
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
            Page {data.page} of {data.pages} · {data.total} trips
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
    </div>
  );
}
