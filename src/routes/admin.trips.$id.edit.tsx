import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
      navigate({ to: "/admin/trips" });
    },
    onError: (e: any) => toast.error("Could not save", { description: e?.message }),
  });

  return (
    <div className="space-y-6">
      <Link
        to="/admin/trips"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to trips
      </Link>
      <header>
        <h1 className="font-serif text-3xl text-primary">Edit Trip</h1>
        {data?.slug && (
          <p className="mt-1 text-xs text-muted-foreground">slug: {data.slug}</p>
        )}
      </header>
      {isLoading && <Card className="p-6 text-muted-foreground">Loading…</Card>}
      {error && (
        <Card className="p-6 text-destructive">
          {(error as Error).message}
        </Card>
      )}
      {data && (
        <Card className="p-6">
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
      )}
    </div>
  );
}
