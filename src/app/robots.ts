import type { MetadataRoute } from "next";
import { company } from "@/content/site";
export default function robots(): MetadataRoute.Robots {
  const enabled = process.env.SITE_INDEXABLE === "true" && !!company.siteUrl;
  return {
    rules: {
      userAgent: "*",
      ...(enabled ? { allow: "/" } : { disallow: "/" }),
    },
    ...(enabled ? { sitemap: `${company.siteUrl}/sitemap.xml` } : {}),
  };
}
