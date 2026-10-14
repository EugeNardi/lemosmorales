import type { MetadataRoute } from "next";
import { company } from "@/content/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return company.siteUrl && process.env.SITE_INDEXABLE === "true"
    ? [{ url: company.siteUrl, changeFrequency: "monthly", priority: 1 }]
    : [];
}
