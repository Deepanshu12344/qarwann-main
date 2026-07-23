import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileUp, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { API_BASE_URL, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ImportResult = {
  tripsAdded?: number;
  tripsUpdated?: number;
  journeyDaysAdded?: number;
  journeyDaysUpdated?: number;
  errors?: { sheet?: string; row?: number; message: string }[];
};

export const Route = createFileRoute("/admin/trips/import")({
  component: ImportTripsPage,
});

function ImportTripsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/import/excel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken() || ""}` },
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || `Upload failed (${res.status})`);
      setResult(data);
      toast.success("Import complete");
    } catch (err: any) {
      toast.error("Import failed", { description: err?.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/trips"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to trips
      </Link>
      <header>
        <h1 className="font-serif text-3xl text-primary">Import Trips from Excel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a workbook with <strong>ABOUT TRIP</strong> and{" "}
          <strong>JOURNEY MASTER</strong> sheets. Existing trips with the same
          name are updated.
        </p>
      </header>

      <Card className="p-6">
        <form onSubmit={onUpload} className="space-y-5">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.18em] text-foreground/70">
              Excel file (.xlsx / .xls)
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full rounded-md border border-input bg-background p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
            />
          </label>
          <Button
            type="submit"
            disabled={!file || busy}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="mr-2 h-4 w-4" />
            )}
            Upload &amp; Import
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="space-y-3 p-6">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="font-serif text-xl">Import Summary</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Trips added" value={result.tripsAdded ?? 0} />
            <Stat label="Trips updated" value={result.tripsUpdated ?? 0} />
            <Stat label="Journey days added" value={result.journeyDaysAdded ?? 0} />
            <Stat label="Journey days updated" value={result.journeyDaysUpdated ?? 0} />
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <div className="mb-2 text-sm font-medium text-destructive">
                {result.errors.length} error(s)
              </div>
              <ul className="space-y-1 text-xs text-destructive">
                {result.errors.map((er, i) => (
                  <li key={i}>
                    {er.sheet ? `[${er.sheet}${er.row ? ` row ${er.row}` : ""}] ` : ""}
                    {er.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-serif text-2xl text-primary">{value}</div>
    </div>
  );
}
