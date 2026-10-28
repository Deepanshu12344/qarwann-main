import CLOUDINARY_MAP from "@/data/cloudinary-map.json";

interface CloudinaryEntry {
  url?: string;
}

const map = CLOUDINARY_MAP as Record<string, CloudinaryEntry>;

/**
 * Resolve an image URL or local asset path to its Cloudinary CDN URL.
 * Falls back gracefully to the original URL/path if not found in the mapping.
 */
export function resolveImageUrl(src?: string | null): string {
  if (!src) return "";
  if (map[src]?.url) {
    return map[src].url!;
  }
  return src;
}
