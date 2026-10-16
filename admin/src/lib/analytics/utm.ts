import "server-only";

import type { Range } from "@/lib/analytics/range";
import { stats } from "@/lib/analytics/store";
import type { Utm } from "@/lib/analytics/types";

export type UtmRow = Utm & {
  id: number;
  visits: number;
  newVisitors: number;
  views: number;
  formStarts: number;
  applications: number;
  lastAt: number;
};

type Row = Utm & {
  id: number;
  visits: number;
  new_visitors: number;
  views: number;
  form_starts: number;
  applications: number;
  last_at: number;
};

/** Each tagged link's results over a range, busiest first. Reads the counters only. */
export function utmReport(range: Range, search: string) {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 4);
  const params: Record<string, string> = { from: range.from, to: range.to };
  const matches = words.map((word, index) => {
    params[`word${index}`] = `%${word.replace(/[\\%_]/g, "\\$&")}%`;
    return `(utm.source || ' ' || utm.medium || ' ' || utm.campaign || ' ' || utm.content || ' ' || utm.term)
      LIKE :word${index} ESCAPE '\\'`;
  });

  const rows = stats.all<Row>(
    `SELECT utm.id, utm.source, utm.medium, utm.campaign, utm.content, utm.term, utm.last_at,
       SUM(utm_daily.visits) AS visits,
       SUM(utm_daily.new_visitors) AS new_visitors,
       SUM(utm_daily.views) AS views,
       SUM(utm_daily.form_starts) AS form_starts,
       SUM(utm_daily.applications) AS applications
     FROM utm_daily JOIN utm ON utm.id = utm_daily.utm_id
     WHERE ${["utm_daily.day BETWEEN :from AND :to", ...matches].join(" AND ")}
     GROUP BY utm.id
     ORDER BY visits DESC, utm.id`,
    params,
  );

  const items = rows.map((row): UtmRow => ({
    id: row.id,
    source: row.source,
    medium: row.medium,
    campaign: row.campaign,
    content: row.content,
    term: row.term,
    visits: row.visits,
    newVisitors: row.new_visitors,
    views: row.views,
    formStarts: row.form_starts,
    applications: row.applications,
    lastAt: row.last_at,
  }));
  const sum = (pick: (row: UtmRow) => number) =>
    items.reduce((total, row) => total + pick(row), 0);

  return {
    items,
    summary: {
      tags: items.length,
      visits: sum((row) => row.visits),
      newVisitors: sum((row) => row.newVisitors),
      applications: sum((row) => row.applications),
    },
  };
}

export function findUtm(id: number) {
  return stats.get<Utm & { id: number }>(
    "SELECT id, source, medium, campaign, content, term FROM utm WHERE id = :id",
    { id },
  );
}
