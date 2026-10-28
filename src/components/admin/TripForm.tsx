import { useState, useRef } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getCsrfToken, API_BASE_URL } from "@/lib/api";

export type TripFormValues = {
  packageName: string;
  category: "journey" | "weekend";
  status: "published" | "draft";
  destination: string;
  country: string;
  duration: string;
  durationDays: number;
  nights: number;
  startingPrice: number;
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
  category: "journey",
  status: "published",
  destination: "",
  country: "India",
  duration: "7 Days / 6 Nights",
  durationDays: 7,
  nights: 6,
  startingPrice: 0,
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
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  let days = Number(v.durationDays) || 1;
  let nights = Number(v.nights) ?? Math.max(days - 1, 0);

  return {
    packageName: v.packageName,
    category: v.category || "journey",
    status: v.status || "published",
    destination: v.destination || undefined,
    country: v.country || "India",
    duration: v.duration,
    durationDays: days,
    nights: nights,
    startingPrice: Number(v.startingPrice) || 0,
    citiesCovered: split(v.citiesCovered),
    startPoint: v.startPoint,
    endPoint: v.endPoint,
    bestSeason: split(v.bestSeason),
    idealFor: split(v.idealFor),
    tripType: v.tripType,
    detailedOverview: v.detailedOverview,
    whyThisTrip: v.whyThisTrip,
    keyExperiences: split(v.keyExperiences),
    coverImage: v.coverImage ? { url: v.coverImage, publicId: "", alt: v.packageName } : undefined,
  };
}

export function tripFromServer(t: any): TripFormValues {
  const j = (a: any) => (Array.isArray(a) ? a.join(", ") : a || "");
  const coverUrl = typeof t.coverImage === "string" ? t.coverImage : t.coverImage?.url || "";
  return {
    packageName: t.packageName || t.title || "",
    category: t.category === "weekend" ? "weekend" : "journey",
    status: t.status === "draft" ? "draft" : "published",
    destination: t.destination || t.place || "",
    country: t.country || "India",
    duration: t.duration || "",
    durationDays: t.durationDays || 1,
    nights: t.nights ?? Math.max((t.durationDays || 1) - 1, 0),
    startingPrice: t.startingPrice ?? t.budgetFrom ?? 0,
    citiesCovered: j(t.citiesCovered || t.cities),
    startPoint: t.startPoint || t.startingPoint || "",
    endPoint: t.endPoint || "",
    bestSeason: j(t.bestSeason),
    idealFor: j(t.idealFor),
    tripType: t.tripType || "",
    detailedOverview: t.detailedOverview || t.summary || "",
    whyThisTrip: t.whyThisTrip || "",
    keyExperiences: j(t.keyExperiences || t.highlights),
    coverImage: coverUrl,
  };
}

export function TripFormFields({
  values,
  onChange,
}: {
  values: TripFormValues;
  onChange: (next: TripFormValues) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const set = <K extends keyof TripFormValues>(k: K, v: TripFormValues[K]) =>
    onChange({ ...values, [k]: v });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    fd.append("folder", "qarwaan/trips");

    try {
      const csrf = getCsrfToken();
      const headers: Record<string, string> = {};
      if (csrf) headers["X-CSRF-Token"] = csrf;

      const res = await fetch(`${API_BASE_URL}/api/uploads/image`, {
        method: "POST",
        headers,
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();
      set("coverImage", data.image.url);
      toast.success("Image uploaded to Cloudinary!");
    } catch (err: any) {
      toast.error("Upload error", { description: err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Package Name *">
        <Input
          value={values.packageName}
          placeholder="e.g. Andaman Island Escape"
          onChange={(e) => set("packageName", e.target.value)}
        />
      </Field>

      <Field label="Category *">
        <select
          value={values.category}
          onChange={(e) => set("category", e.target.value as "journey" | "weekend")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="journey">Signature Journey (Normal)</option>
          <option value="weekend">Weekend Getaway (Short)</option>
        </select>
      </Field>

      <Field label="Publish Status *">
        <select
          value={values.status}
          onChange={(e) => set("status", e.target.value as "published" | "draft")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="published">Published (Visible Publicly)</option>
          <option value="draft">Draft (Admin Only)</option>
        </select>
      </Field>

      <Field label="Destination (Place) *">
        <Input
          value={values.destination}
          placeholder="e.g. Andaman Islands, Rajasthan, Bali"
          onChange={(e) => set("destination", e.target.value)}
        />
      </Field>

      <Field label="Country *">
        <Input
          value={values.country}
          placeholder="e.g. India, Indonesia, Bhutan"
          onChange={(e) => set("country", e.target.value)}
        />
      </Field>

      <Field label="Starting Price (₹) *">
        <Input
          type="number"
          min={0}
          value={values.startingPrice}
          placeholder="39500"
          onChange={(e) => set("startingPrice", Number(e.target.value) || 0)}
        />
      </Field>

      <Field label="Duration String *">
        <Input
          value={values.duration}
          placeholder="e.g. 7 Days / 6 Nights"
          onChange={(e) => set("duration", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Days *">
          <Input
            type="number"
            min={1}
            value={values.durationDays}
            onChange={(e) => set("durationDays", Number(e.target.value) || 1)}
          />
        </Field>
        <Field label="Nights *">
          <Input
            type="number"
            min={0}
            value={values.nights}
            onChange={(e) => set("nights", Number(e.target.value) || 0)}
          />
        </Field>
      </div>

      <Field label="Trip Type *">
        <Input
          value={values.tripType}
          placeholder="Cultural, Adventure, Leisure..."
          onChange={(e) => set("tripType", e.target.value)}
        />
      </Field>

      <Field label="Start Point *">
        <Input
          value={values.startPoint}
          placeholder="e.g. Port Blair"
          onChange={(e) => set("startPoint", e.target.value)}
        />
      </Field>

      <Field label="End Point *">
        <Input
          value={values.endPoint}
          placeholder="e.g. Port Blair"
          onChange={(e) => set("endPoint", e.target.value)}
        />
      </Field>

      <Field label="Cities Covered (comma separated)" full>
        <Input
          value={values.citiesCovered}
          placeholder="Port Blair, Havelock Island, Neil Island"
          onChange={(e) => set("citiesCovered", e.target.value)}
        />
      </Field>

      <Field label="Cover Image" full>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={values.coverImage}
              placeholder="https://res.cloudinary.com/... or paste image URL"
              onChange={(e) => set("coverImage", e.target.value)}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Cloudinary Upload
                </>
              )}
            </Button>
          </div>
          {values.coverImage && (
            <div className="relative mt-2 h-40 w-full max-w-md overflow-hidden rounded-lg border border-border">
              <img
                src={values.coverImage}
                alt="Cover Preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </Field>

      <Field label="Best Season (comma separated)">
        <Input
          value={values.bestSeason}
          placeholder="October, November, December"
          onChange={(e) => set("bestSeason", e.target.value)}
        />
      </Field>

      <Field label="Ideal For (comma separated)">
        <Input
          value={values.idealFor}
          placeholder="Couples, Families, Adventure Enthusiasts"
          onChange={(e) => set("idealFor", e.target.value)}
        />
      </Field>

      <Field label="Detailed Overview" full>
        <Textarea
          rows={5}
          value={values.detailedOverview}
          placeholder="A detailed description of this journey..."
          onChange={(e) => set("detailedOverview", e.target.value)}
        />
      </Field>

      <Field label="Why This Trip" full>
        <Textarea
          rows={4}
          value={values.whyThisTrip}
          placeholder="Highlights of what makes this itinerary stand out..."
          onChange={(e) => set("whyThisTrip", e.target.value)}
        />
      </Field>

      <Field label="Key Experiences (comma separated)" full>
        <Textarea
          rows={3}
          value={values.keyExperiences}
          placeholder="Scuba diving at Elephant Beach, Sunset at Radhanagar..."
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
