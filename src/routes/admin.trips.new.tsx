import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TripFormFields,
  emptyTrip,
  tripFormToPayload,
  type TripFormValues,
} from "@/components/admin/TripForm";

export const Route = createFileRoute("/admin/trips/new")({
  component: NewTripPage,
});

function NewTripPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [values, setValues] = useState<TripFormValues>(emptyTrip);

  const create = useMutation({
    mutationFn: (v: TripFormValues) =>
      api("/api/trips", {
        method: "POST",
        auth: true,
        body: JSON.stringify(tripFormToPayload(v)),
      }),
    onSuccess: () => {
      toast.success("Trip created");
      qc.invalidateQueries({ queryKey: ["admin", "trips"] });
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
        <h1 className="font-serif text-3xl text-primary">New Trip</h1>
      </header>
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(values);
          }}
          className="space-y-6"
        >
          <TripFormFields values={values} onChange={setValues} />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={create.isPending}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {create.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Trip
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
