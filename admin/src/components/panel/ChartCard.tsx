import { formatNumber, Panel, Pill } from "@/components/panel/Blocks";
import { Chart, type ChartProps } from "@/components/panel/Chart";

/** A chart in a card: what it shows, the period's total, the drawing. */
export function ChartCard({
  title,
  lead,
  total,
  ...chart
}: ChartProps & { title: string; lead: string; total: number }) {
  return (
    <Panel title={title} lead={lead} aside={<Pill>{formatNumber(total)}</Pill>}>
      <Chart {...chart} />
    </Panel>
  );
}
