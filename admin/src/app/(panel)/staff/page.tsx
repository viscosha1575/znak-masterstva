import type { Metadata } from "next";
import { Panel, Pill } from "@/components/panel/Blocks";
import { AddStaff, EditStaff } from "@/components/staff/StaffForms";
import { Badge } from "@/components/ui/Badge";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { roleTitle } from "@/lib/dictionaries";
import { formatShortDateTime } from "@/lib/format";
import { listStaff } from "@/lib/users";

export const metadata: Metadata = { title: "Сотрудники" };

export default async function StaffPage() {
  const admin = await requireAdmin();
  const staff = listStaff();

  return (
    <Panel
      title="Кто может входить в панель"
      lead="Модератор работает с заявками и статистикой. Администратор ещё управляет сотрудниками и настройками."
      aside={
        <div className="flex items-center gap-3">
          <Pill>Всего: {staff.length}</Pill>
          <AddStaff />
        </div>
      }
    >
      <div className="-mx-[18px] overflow-x-auto md:-mx-6">
        <table className="w-full min-w-[42rem]">
          <thead>
            <tr>
              <th className="th">Сотрудник</th>
              <th className="th">Роль</th>
              <th className="th">Последний вход, мск</th>
              <th className="th text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id}>
                <td className="td">
                  <span
                    className={cn(
                      "block font-bold",
                      member.active ? "text-ink" : "text-mute",
                    )}
                  >
                    {member.name}
                    {member.id === admin.id && (
                      <span className="ml-2 text-xs font-normal text-mute">
                        это вы
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-mute">
                    {member.login}
                  </span>
                </td>
                <td className="td">
                  {member.active ? (
                    <Badge tone={member.role === "admin" ? "purple" : "blue"}>
                      {roleTitle(member.role)}
                    </Badge>
                  ) : (
                    <Badge>Отключён</Badge>
                  )}
                </td>
                <td className="td text-mute tabular-nums">
                  {member.lastLoginAt
                    ? formatShortDateTime(member.lastLoginAt)
                    : "Ещё не входил"}
                </td>
                <td className="td text-right">
                  <EditStaff
                    member={{
                      id: member.id,
                      login: member.login,
                      name: member.name,
                      role: member.role,
                      active: member.active,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
