"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { MdAdd, MdEdit } from "react-icons/md";
import type { FormState } from "@/app/(panel)/applications/[id]/actions";
import {
  createStaffAction,
  updateStaffAction,
} from "@/app/(panel)/staff/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { ROLES, type Role } from "@/lib/dictionaries";

/*
 * React clears uncontrolled fields when a form's action finishes — also when
 * it finishes with a validation error. Everything typed into these dialogs is
 * therefore kept in state, so a refused form comes back as it was sent.
 *
 * The forms live in components of their own, mounted while their dialog is
 * open: opening a dialog again starts from a clean slate.
 */
function useText(initial = "") {
  const [value, setValue] = useState(initial);
  return {
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValue(event.target.value),
  };
}

/** A password nobody has to invent: 16 characters without look-alikes (0/O, 1/l). */
function generatePassword() {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = crypto.getRandomValues(new Uint32Array(16));
  return Array.from(random, (value) => alphabet[value % alphabet.length]).join(
    "",
  );
}

function PasswordField({
  label,
  hint,
  required,
}: {
  label: string;
  hint: string;
  required?: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <Field label={label} hint={hint}>
      <span className="flex gap-2">
        {/* Shown as text on purpose: the administrator has to pass it on. */}
        <input
          name="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required={required}
          autoComplete="off"
          spellCheck={false}
          className="control font-mono"
        />
        <Button variant="soft" onClick={() => setValue(generatePassword())}>
          Придумать
        </Button>
      </span>
    </Field>
  );
}

function RoleField({ initial }: { initial: Role }) {
  const role = useText(initial);
  return (
    <Field
      label="Роль"
      hint="Модератор работает с заявками. Администратор ещё управляет сотрудниками, настройками и может удалять заявки."
    >
      <select name="role" {...role} className="control">
        {ROLES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function AddStaff() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <MdAdd aria-hidden className="size-[18px]" />
        Добавить
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Новый сотрудник">
        <AddStaffForm onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function AddStaffForm({ onClose }: { onClose: () => void }) {
  const name = useText();
  const login = useText();
  // Set once the account exists: the only moment its password can be read.
  const [created, setCreated] = useState<{ login: string; password: string }>();
  const [copied, setCopied] = useState(false);

  const [state, action, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      const result = await createStaffAction(previous, form);
      if (!result.error) {
        setCreated({
          login: String(form.get("login")).trim(),
          password: String(form.get("password")),
        });
      }
      return result;
    },
    {},
  );

  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-soft">
          Учётная запись создана. Передайте сотруднику логин и пароль — после
          входа он сможет сменить пароль сам. Панель пароль больше не покажет.
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-subtle px-4 py-3.5 text-sm">
          <dt className="text-mute">Логин</dt>
          <dd className="font-mono font-bold break-all text-ink">
            {created.login}
          </dd>
          <dt className="text-mute">Пароль</dt>
          <dd className="font-mono font-bold break-all text-ink">
            {created.password}
          </dd>
        </dl>
        <div className="flex justify-end gap-2">
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(
                `Логин: ${created.login}\nПароль: ${created.password}`,
              );
              setCopied(true);
            }}
          >
            {copied ? "Скопировано" : "Скопировать"}
          </Button>
          <Button variant="primary" onClick={onClose}>
            Готово
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Имя и фамилия">
        <input
          name="name"
          {...name}
          required
          data-autofocus
          className="control"
        />
      </Field>
      <Field label="Логин">
        <input
          name="login"
          {...login}
          required
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          className="control"
        />
      </Field>
      <RoleField initial="moderator" />
      <PasswordField label="Пароль" hint="Не короче 10 символов." required />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <div className="mt-1 flex justify-end gap-2">
        <Button onClick={onClose}>Отмена</Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Создаём…" : "Создать"}
        </Button>
      </div>
    </form>
  );
}

type Member = {
  id: number;
  login: string;
  name: string;
  role: Role;
  active: boolean;
};

export function EditStaff({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="soft" size="xs" onClick={() => setOpen(true)}>
        <MdEdit aria-hidden className="size-3.5" />
        Изменить
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Сотрудник ${member.login}`}
      >
        <EditStaffForm member={member} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function EditStaffForm({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const name = useText(member.name);
  const [active, setActive] = useState(member.active);

  const [state, action, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      const result = await updateStaffAction(previous, form);
      if (!result.error) onClose();
      return result;
    },
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={member.id} />
      <Field label="Имя и фамилия">
        <input name="name" {...name} required className="control" />
      </Field>
      <RoleField initial={member.role} />
      <label className="flex items-start gap-2.5 text-sm font-bold text-ink">
        <input
          type="checkbox"
          name="active"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
          className="mt-0.5 size-4 accent-brand"
        />
        <span>
          Может входить в панель
          <span className="mt-0.5 block text-xs font-normal text-mute">
            Снимите, когда сотрудник больше не работает с премией: его сразу
            выкинет из панели, а история его решений останется.
          </span>
        </span>
      </label>
      <PasswordField
        label="Новый пароль"
        hint="Оставьте пустым, чтобы не менять. Новый пароль скопируйте до сохранения: позже панель его не покажет."
      />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <div className="mt-1 flex justify-end gap-2">
        <Button onClick={onClose}>Отмена</Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
