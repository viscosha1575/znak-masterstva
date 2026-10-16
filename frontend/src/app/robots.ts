import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The account page is not shut here: it says noindex itself, and a crawler
// kept out of it would never read that.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
