"use client";

import { useSyncExternalStore } from "react";

/*
 * Applications live on the server, behind /api (see app/api/[...path]/route.ts).
 * The server recognises the applicant by a cookie: it is set with their first
 * application, which also opens their account — the password typed into the
 * form — and again whenever they sign in to that account from another
 * browser. The applications are only given out to an applicant with an
 * account: one from before accounts existed sets a password first.
 * Everything that talks to the server is in this file.
 */

export type ApplicationStatus = "moderation" | "approved" | "rejected";

/** A photo already stored with an application. */
export type Photo = { id: string; name: string };

export type Application = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avitoId: string;
  city: string;
  kind: string;
  field: string;
  /** Nomination id, see content/nominations.ts */
  nomination: string;
  story: string;
  photos: Photo[];
  consentPromo: boolean;
  status: ApplicationStatus;
  createdAt: string;
};

/** One participant may enter at most two nominations. */
export const MAX_APPLICATIONS = 2;

/** Shortest password of an applicant's account. The server asks for the same (admin/src/lib/accounts.ts). */
export const MIN_PASSWORD = 8;

/** What the server tells about the applicant. */
type Answer = {
  accepting: boolean;
  account: boolean;
  passwordNeeded: boolean;
  applications: Application[];
};

type Store = {
  /** `undefined` until the first answer from the server. */
  applications?: Application[];
  /** Whether the award still takes applications and edits. */
  accepting: boolean;
  /** Whether this applicant has an account, that is, a password to sign in with. */
  account: boolean;
  /** This browser has applications from before accounts existed: a password will open them. */
  passwordNeeded: boolean;
  /** The server could not be reached and there is nothing to show yet. */
  failed: boolean;
};

const INITIAL: Store = {
  accepting: true,
  account: false,
  passwordNeeded: false,
  failed: false,
};

let store = INITIAL;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: Store) {
  store = next;
  for (const listener of listeners) listener();
}

async function load() {
  try {
    const response = await fetch("/api/applications", { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    publish({ ...((await response.json()) as Answer), failed: false });
  } catch {
    // A failed refresh keeps the last good answer on screen.
    publish({ ...store, failed: store.applications === undefined });
  }
}

/** Re-reads the applications from the server. */
export function refreshApplications() {
  loading ??= load().finally(() => {
    loading = null;
  });
  return loading;
}

function onVisible() {
  // Back on the tab: a moderator may have decided in the meantime.
  if (document.visibilityState === "visible") void refreshApplications();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshApplications();
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

/** The applicant's applications together with the state of the connection. */
export function useApplicationStore(): Store {
  return useSyncExternalStore(
    subscribe,
    () => store,
    () => INITIAL,
  );
}

/** Saved applications, or `undefined` until the server has answered. */
export function useApplications(): Application[] | undefined {
  return useApplicationStore().applications;
}

async function request<Result>(path: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, init);
  } catch {
    throw new Error(
      "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз",
    );
  }
  if (response.status === 204) return undefined as Result;

  const body: unknown = await response.json().catch(() => null);
  if (response.ok) return body as Result;

  // The server words its refusals for the applicant: show them as they are.
  const message = (body as { error?: unknown } | null)?.error;
  throw new Error(
    typeof message === "string"
      ? message
      : "Что-то пошло не так. Попробуйте ещё раз",
  );
}

export type ApplicationDraft = Omit<
  Application,
  "id" | "status" | "createdAt" | "photos"
> & {
  consentData: boolean;
  consentTerms: boolean;
  /** Sent with the first application: it opens the applicant's account. */
  password?: string;
};

/** Signs in to the account opened with an earlier application. Throws with the server's words if it cannot. */
export async function signIn(login: string, password: string) {
  const answer = await request<Answer>("/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  publish({ ...answer, failed: false });
}

/**
 * Sets the password of an applicant who has applications but no account yet,
 * which opens them. Throws with the server's words if it cannot.
 */
export async function createPassword(password: string) {
  const answer = await request<Answer>("/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  publish({ ...answer, failed: false });
}

/** Creates an application, or replaces the one with `id` when editing. */
export function saveApplication(draft: ApplicationDraft, id?: string) {
  return request<Application>(id ? `/applications/${id}` : "/applications", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
}

/** Adds one photo to a saved application. */
export function uploadPhoto(applicationId: string, file: File) {
  return request<Photo>(`/applications/${applicationId}/photos`, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      // Header values must be ASCII; the server decodes the name back.
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: file,
  });
}

export function removePhoto(applicationId: string, photoId: string) {
  return request<void>(`/applications/${applicationId}/photos/${photoId}`, {
    method: "DELETE",
  });
}

/** Address of a stored photo's small preview. */
export function photoUrl(applicationId: string, photoId: string) {
  return `/api/applications/${applicationId}/photos/${photoId}`;
}
