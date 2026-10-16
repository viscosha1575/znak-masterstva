import type { Metadata } from "next";
import { Panel } from "@/components/panel/Blocks";
import { AcceptingForm } from "@/components/panel/SettingsForms";
import { Badge } from "@/components/ui/Badge";
import { requireAdmin } from "@/lib/auth";
import { isAccepting } from "@/lib/settings";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  await requireAdmin();
  const accepting = isAccepting();

  return (
    <Panel
      title="Приём заявок"
      aside={
        <Badge tone={accepting ? "green" : "orange"}>
          {accepting ? "Открыт" : "Закрыт"}
        </Badge>
      }
    >
      <p className="text-sm text-soft">
        {accepting
          ? "Участники могут подавать заявки и править уже поданные."
          : "Вместо анкеты сайт показывает, что приём завершён. Поданные заявки остаются в личных кабинетах, но изменить их нельзя."}
      </p>
      <AcceptingForm accepting={accepting} />
    </Panel>
  );
}
