import type { ReactNode } from "react";
import { MobileNav } from "@/components/panel/MobileNav";
import { Navbar } from "@/components/panel/Navbar";
import { Menu } from "@/components/panel/Sidebar";
import { countByStatus } from "@/lib/applications";
import { requireUser } from "@/lib/auth";
import { roleTitle } from "@/lib/dictionaries";

/*
 * The frame around every page of the panel. The check below only decides what
 * the frame shows: each page, action and route makes its own (lib/auth.ts),
 * because a layout is not re-run on every navigation.
 */
export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const menu = {
    waiting: countByStatus().moderation,
    isAdmin: user.role === "admin",
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[300px] overflow-y-auto bg-card shadow-card xl:block">
        <Menu {...menu} />
      </aside>
      <Navbar
        user={{ name: user.name, role: roleTitle(user.role) }}
        {...menu}
      />
      <main className="min-h-dvh px-3.5 pb-28 pt-[88px] md:px-6 md:pb-6 md:pt-[116px] xl:ml-[290px] xl:pb-[30px] xl:pl-[30px] xl:pr-5 xl:pt-[130px]">
        {children}
      </main>
      <MobileNav isAdmin={menu.isAdmin} />
    </>
  );
}
