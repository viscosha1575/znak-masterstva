/**
 * The site's public address, for what search engines and link previews read:
 * canonical links, robots.txt, the sitemap, the picture of a shared link.
 *
 * In production it comes from DOMAIN in the server's .env (docker-compose.yml
 * hands it to the image, see the Dockerfile).
 */
export const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

/** The pages search engines should know about; the account is not one. */
export const INDEXED_PATHS = ["/", "/contest", "/rating", "/apply"] as const;
