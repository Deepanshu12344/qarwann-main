import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type TripFormValues = {
  packageName: string;
  duration: string;
  citiesCovered: string;
  startPoint: string;
  endPoint: string;
  bestSeason: string;
  idealFor: string;
  tripType: string;
  detailedOverview: string;
  whyThisTrip: string;
  keyExperiences: string;
  coverImage: string;
};

export const emptyTrip: TripFormValues = {
  packageName: "",
  duration: "",
  citiesCovered: "",
  startPoint: "",
  endPoint: "",
  bestSeason: "",
  idealFor: "",
  tripType: "",
  detailedOverview: "",
  whyThisTrip: "",
  keyExperiences: "",
  coverImage: "",
};

export function tripFormToPayload(v: TripFormValues) {
  const split = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);
  return {
    packageName: v.packageName,
    duration: v.duration,
    citiesCovered: split(v.citiesCovered),
    startPoint: v.startPoint,
    endPoint: v.endPoint,
    bestSeason: split(v.bestSeason),
    idealFor: split(v.idealFor),
    tripType: v.tripType,
    detailedOverview: v.detailedOverview,
    whyThisTrip: v.whyThisTrip,
    keyExperiences: split(v.keyExperiences),
    coverImage: v.coverImage,
  };
}

export function tripFromServer(t: any): TripFormValues {
  const j = (a: any) => (Array.isArray(a) ? a.join(", ") : a || "");
  return {
    packageName: t.packageName || "",
    duration: t.duration || "",
    citiesCovered: j(t.citiesCovered),
    startPoint: t.startPoint || "",
    endPoint: t.endPoint || "",
    bestSeason: j(t.bestSeason),
    idealFor: j(t.idealFor),
    tripType: t.tripType || "",
    detailedOverview: t.detailedOverview || "",
    whyThisTrip: t.whyThisTrip || "",
    keyExperiences: j(t.keyExperiences),
    coverImage: t.coverImage || "",
  };
}

export function TripFormFields({
  values,
  onChange,
}: {
  values: TripFormValues;
  onChange: (next: TripFormValues) => void;
}) {
  const set = <K extends keyof TripFormValues>(k: K, v: TripFormValues[K]) =>
    onChange({ ...values, [k]: v });
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Package Name *">
        <Input value={values.packageName} onChange={(e) => set("packageName", e.target.value)} />
      </Field>
      <Field label="Duration *">
        <Input
          value={values.duration}
          placeholder="e.g. 7 Days / 6 Nights"
          onChange={(e) => set("duration", e.target.value)}
        />
      </Field>
      <Field label="Trip Type *">
        <Input
          value={values.tripType}
          placeholder="Cultural, Adventure, Luxury..."
          onChange={(e) => set("tripType", e.target.value)}
        />
      </Field>
      <Field label="Cover Image URL">
        <Input value={values.coverImage} onChange={(e) => set("coverImage", e.target.value)} />
      </Field>
      <Field label="Start Point *">
        <Input value={values.startPoint} onChange={(e) => set("startPoint", e.target.value)} />
      </Field>
      <Field label="End Point *">
        <Input value={values.endPoint} onChange={(e) => set("endPoint", e.target.value)} />
      </Field>
      <Field label="Cities Covered (comma separated)" full>
        <Input
          value={values.citiesCovered}
          placeholder="Tokyo, Kyoto, Osaka"
          onChange={(e) => set("citiesCovered", e.target.value)}
        />
      </Field>
      <Field label="Best Season (comma separated)">
        <Input
          value={values.bestSeason}
          placeholder="Spring, Autumn"
          onChange={(e) => set("bestSeason", e.target.value)}
        />
      </Field>
      <Field label="Ideal For (comma separated)">
        <Input
          value={values.idealFor}
          placeholder="Couples, Families"
          onChange={(e) => set("idealFor", e.target.value)}
        />
      </Field>
      <Field label="Detailed Overview" full>
        <Textarea
          rows={5}
          value={values.detailedOverview}
          onChange={(e) => set("detailedOverview", e.target.value)}
        />
      </Field>
      <Field label="Why This Trip" full>
        <Textarea
          rows={4}
          value={values.whyThisTrip}
          onChange={(e) => set("whyThisTrip", e.target.value)}
        />
      </Field>
      <Field label="Key Experiences (comma separated)" full>
        <Textarea
          rows={3}
          value={values.keyExperiences}
          placeholder="Tea ceremony in Kyoto, Private sushi omakase, ..."
          onChange={(e) => set("keyExperiences", e.target.value)}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs uppercase tracking-[0.18em] text-foreground/70">
        {label}
      </Label>
      {children}
    </div>
  );
}
