import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Calendar, MapPin, Upload } from "lucide-react";
import { toast } from "sonner";

import { api, getCsrfToken, API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  TripFormFields,
  emptyTrip,
  tripFormToPayload,
  tripFromServer,
  type TripFormValues,
} from "@/components/admin/TripForm";

export const Route = createFileRoute("/admin/trips/$id/edit")({
  component: EditTripPage,
});

function EditTripPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [values, setValues] = useState<TripFormValues>(emptyTrip);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "trip", id],
    queryFn: () => api<any>(`/api/trips/${id}`, { auth: true }),
  });

  useEffect(() => {
    if (data) setValues(tripFromServer(data));
  }, [data]);

  const save = useMutation({
    mutationFn: (v: TripFormValues) =>
      api(`/api/trips/${id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify(tripFormToPayload(v)),
      }),
    onSuccess: () => {
      toast.success("Trip updated");
      qc.invalidateQueries({ queryKey: ["admin", "trips"] });
      qc.invalidateQueries({ queryKey: ["admin", "trip", id] });
    },
    onError: (e: any) => toast.error("Could not save", { description: e?.message }),
  });

  const addDay = useMutation({
    mutationFn: () => {
      const nextDayNum = (data?.journeyDays?.length || 0) + 1;
      return api("/api/journey-days", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          tripId: id,
          dayNumber: nextDayNum,
          location: "New Location",
          experienceDetails: "Day itinerary details...",
        }),
      });
    },
    onSuccess: () => {
      toast.success("Day added");
      qc.invalidateQueries({ queryKey: ["admin", "trip", id] });
    },
    onError: (e: any) => toast.error("Could not add day", { description: e?.message }),
  });

  const deleteDay = useMutation({
    mutationFn: (dayId: string) =>
      api(`/api/journey-days/${dayId}`, {
        method: "DELETE",
        auth: true,
      }),
    onSuccess: () => {
      toast.success("Day removed");
      qc.invalidateQueries({ queryKey: ["admin", "trip", id] });
    },
    onError: (e: any) => toast.error("Could not remove day", { description: e?.message }),
  });

  return (
    <div className="space-y-8">
      <Link
        to="/admin/trips"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to trips
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-primary">Edit Trip</h1>
          {data?.slug && (
            <p className="mt-1 text-xs text-muted-foreground">slug: {data.slug}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/trips/$slug" params={{ slug: data?.slug || "" }} target="_blank">
            <Button variant="outline" className="rounded-full">
              Preview Public Page ↗
            </Button>
          </Link>
        </div>
      </header>

      {isLoading && <Card className="p-6 text-muted-foreground">Loading…</Card>}
      {error && (
        <Card className="p-6 text-destructive">
          {(error as Error).message}
        </Card>
      )}

      {data && (
        <>
          <Card className="p-6">
            <h2 className="mb-6 font-serif text-xl text-primary">Overview &amp; Logistics</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(values);
              }}
              className="space-y-6"
            >
              <TripFormFields values={values} onChange={setValues} />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={save.isPending}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {save.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl text-primary">Day-by-Day Itinerary</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.journeyDays?.length || 0} days configured for this trip.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addDay.mutate()}
                disabled={addDay.isPending}
                className="rounded-full"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Day
              </Button>
            </div>

            <div className="space-y-4">
              {data.journeyDays?.map((day: any) => (
                <DayEditorItem
                  key={day._id || day.id}
                  day={day}
                  tripId={id}
                  onDelete={() => {
                    if (confirm(`Remove Day ${day.dayNumber || day.day}?`)) {
                      deleteDay.mutate(day._id || day.id);
                    }
                  }}
                />
              ))}
              {(!data.journeyDays || data.journeyDays.length === 0) && (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No days created yet. Click "Add Day" to begin building the day-by-day plan.
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function DayEditorItem({
  day,
  tripId,
  onDelete,
}: {
  day: any;
  tripId: string;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(day.location || "");
  const [route, setRoute] = useState(day.route || "");
  const [stay, setStay] = useState(day.stayType || day.stay || "");
  const [details, setDetails] = useState(day.experienceDetails || day.description || "");
  const [saving, setSaving] = useState(false);

  const saveDay = async () => {
    setSaving(true);
    try {
      await api(`/api/journey-days/${day._id || day.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          location,
          route,
          stayType: stay,
          experienceDetails: details,
        }),
      });
      toast.success(`Day ${day.dayNumber || day.day} updated`);
      qc.invalidateQueries({ queryKey: ["admin", "trip", tripId] });
      setOpen(false);
    } catch (err: any) {
      toast.error("Failed to update day", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            D{day.dayNumber || day.day}
          </span>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              {day.location || "Untitled Day"}
            </h3>
            {day.route && (
              <p className="text-xs text-muted-foreground">{day.route}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="text-xs"
          >
            {open ? "Collapse" : "Edit Details"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-border/60 pt-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Location
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Route
              </Label>
              <Input
                value={route}
                placeholder="e.g. Leh → Nubra Valley"
                onChange={(e) => setRoute(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Stay / Hotel
              </Label>
              <Input
                value={stay}
                placeholder="e.g. Boutique Hotel, Camp"
                onChange={(e) => setStay(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Experience Details
            </Label>
            <Textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={saveDay}
              className="rounded-full bg-primary text-primary-foreground"
            >
              {saving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Save Day
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
