import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Страница не найдена" };

export default function NotFound() {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-6xl font-bold text-ink">404</h1>
      <p className="max-w-sm text-base text-mute">
        Такой страницы нет — возможно, ссылка устарела или у вас нет к ней
        доступа.
      </p>
      <ButtonLink href="/" variant="primary">
        В панель
      </ButtonLink>
    </main>
  );
}
