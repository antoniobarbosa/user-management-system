"use client";

import { ChevronDown, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
import * as authService from "@/services/authService";
import * as userService from "@/services/userService";
import type { UpdateUserInput } from "@/services/userService";
import { ApiError } from "@/services/api";
import type { User, UserStatus } from "@/types/auth";
import {
  useSessionStore,
  useSessionStoreHydrated,
} from "@/store/sessionStore";

const PAGE_SIZE = 6;

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: UserStatus }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-500/30"
          : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/40"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: "auto", label: "Auto", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

function ThemePreferenceDropdown() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const current = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[0];
  const CurrentIcon = current.Icon;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Theme"
        className="inline-flex min-w-[7.5rem] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <CurrentIcon
            className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400"
            aria-hidden
          />
          <span className="truncate">{current.label}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition dark:text-slate-400 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Theme"
          className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
        >
          {THEME_OPTIONS.map((opt) => {
            const OptIcon = opt.Icon;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={theme === opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                    theme === opt.value
                      ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <OptIcon
                    className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400"
                    aria-hidden
                  />
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function parsePageFromSearchParams(searchParams: URLSearchParams): number {
  const raw = searchParams.get("page");
  if (raw == null || raw === "") return 1;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return 1;
  return n;
}

/** At most 5 numbered slots; first and last always shown; current ±1 in the middle band. */
function buildPaginationItems(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total < 1) return [];
  if (total === 1) return [1];
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, "ellipsis", total];
  }
  if (current >= total - 2) {
    return [1, "ellipsis", total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

function DashboardPagination({
  currentPage,
  totalPages,
  hasPrev,
  hasNext,
  router,
}: {
  currentPage: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const items = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  function goToPage(n: number) {
    router.push(`/dashboard?page=${n}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <button
        type="button"
        disabled={!hasPrev}
        onClick={() => goToPage(Math.max(1, currentPage - 1))}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:px-3"
      >
        Previous
      </button>
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1.5 text-sm text-slate-400 dark:text-slate-500"
            aria-hidden
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => goToPage(item)}
            disabled={item === currentPage}
            className={`min-w-[2.25rem] rounded-lg border px-2.5 py-1.5 text-sm font-medium shadow-sm transition sm:px-3 ${
              item === currentPage
                ? "cursor-default border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={!hasNext}
        onClick={() => goToPage(currentPage + 1)}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:px-3"
      >
        Next
      </button>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePageFromSearchParams(searchParams);

  const [mounted, setMounted] = useState(false);
  const isHydrated = useSessionStoreHydrated();
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionUser = useSessionStore((s) => s.user);
  const [list, setList] = useState<User[]>([]);
  const [meta, setMeta] = useState<userService.PaginationMeta | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [cFirst, setCFirst] = useState("");
  const [cLast, setCLast] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cStatus, setCStatus] = useState<UserStatus>("active");

  const [editUser, setEditUser] = useState<User | null>(null);
  const [eFirst, setEFirst] = useState("");
  const [eLast, setELast] = useState("");
  const [eStatus, setEStatus] = useState<UserStatus>("active");
  const [eLogins, setELogins] = useState(0);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUsersForPage = useCallback(
    async (targetPage: number) => {
      setListLoading(true);
      setListError(null);
      try {
        const res = await userService.getUsers(targetPage, PAGE_SIZE);
        if (res.meta.totalPages > 0 && targetPage > res.meta.totalPages) {
          const last = res.meta.totalPages;
          router.replace(`/dashboard?page=${last}`);
          const resLast = await userService.getUsers(last, PAGE_SIZE);
          setList(resLast.data);
          setMeta(resLast.meta);
          return;
        }
        setList(res.data);
        setMeta(res.meta);
      } catch (err) {
        setListError(
          err instanceof ApiError ? err.message : "Could not load users.",
        );
        setList([]);
        setMeta(null);
      } finally {
        setListLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!mounted || !isHydrated || !sessionId) return;
    void fetchUsersForPage(page);
  }, [mounted, isHydrated, sessionId, page, fetchUsersForPage]);

  useEffect(() => {
    if (!mounted || !isHydrated) return;
    if (!sessionId) router.replace("/auth");
  }, [mounted, isHydrated, sessionId, router]);

  function openCreateModal() {
    setCreateError(null);
    setCFirst("");
    setCLast("");
    setCEmail("");
    setCPassword("");
    setCStatus("active");
    setCreateOpen(true);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const fn = cFirst.trim();
    const ln = cLast.trim();
    const em = cEmail.trim();
    const pw = cPassword;
    if (!fn || !ln || !em || !pw) {
      setCreateError("Please fill in all required fields.");
      return;
    }
    if (pw.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }
    setCreateSubmitting(true);
    try {
      await userService.createUser({
        firstName: fn,
        lastName: ln,
        email: em,
        password: pw,
        status: cStatus,
      });
      setCreateOpen(false);
      router.push("/dashboard?page=1");
      await fetchUsersForPage(1);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Could not create user.");
    } finally {
      setCreateSubmitting(false);
    }
  }

  function openEdit(u: User) {
    setEditError(null);
    setEditUser(u);
    setEFirst(u.firstName);
    setELast(u.lastName);
    setEStatus(u.status);
    setELogins(u.loginsCounter);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditError(null);
    const fn = eFirst.trim();
    const ln = eLast.trim();
    const namesEditable = !(
      editUser.status === "inactive" && eStatus === "inactive"
    );
    if (namesEditable) {
      if (!fn || !ln) {
        setEditError("First and last name are required.");
        return;
      }
    }
    if (!Number.isInteger(eLogins) || eLogins < 0) {
      setEditError("Invalid login counter.");
      return;
    }

    const wasInactive = editUser.status === "inactive";
    const activating = wasInactive && eStatus === "active";

    setEditSubmitting(true);
    try {
      if (wasInactive && !activating) {
        const patch: UpdateUserInput = {};
        if (eStatus !== editUser.status) patch.status = eStatus;
        if (eLogins !== editUser.loginsCounter) patch.loginsCounter = eLogins;
        if (Object.keys(patch).length === 0) {
          setEditError("Nothing was changed.");
          return;
        }
        await userService.updateUser(editUser.id, patch);
      } else if (activating) {
        if (eStatus !== editUser.status) {
          await userService.updateUser(editUser.id, { status: "active" });
        }
        const afterActive: UpdateUserInput = {};
        if (fn !== editUser.firstName) afterActive.firstName = fn;
        if (ln !== editUser.lastName) afterActive.lastName = ln;
        if (eLogins !== editUser.loginsCounter) afterActive.loginsCounter = eLogins;
        if (Object.keys(afterActive).length > 0) {
          await userService.updateUser(editUser.id, afterActive);
        }
      } else {
        const patch: UpdateUserInput = {};
        if (fn !== editUser.firstName) patch.firstName = fn;
        if (ln !== editUser.lastName) patch.lastName = ln;
        if (eStatus !== editUser.status) patch.status = eStatus;
        if (eLogins !== editUser.loginsCounter) patch.loginsCounter = eLogins;
        if (Object.keys(patch).length === 0) {
          setEditError("Nothing was changed.");
          return;
        }
        await userService.updateUser(editUser.id, patch);
      }

      setEditUser(null);
      await fetchUsersForPage(page);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Could not update user.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await userService.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await fetchUsersForPage(page);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : "Could not delete user.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function handleLogout() {
    const sid = useSessionStore.getState().sessionId;
    if (sid) {
      try {
        await authService.signOut(sid);
      } catch {
        /* clear local session anyway */
      }
    }
    useSessionStore.getState().clearSession();
    router.replace("/auth");
  }

  if (!mounted || !isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting…</p>
      </div>
    );
  }

  const totalPages = meta ? Math.max(1, meta.totalPages || 1) : 1;
  const currentPage = meta?.page ?? page;
  const total = meta?.total ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
            User management
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemePreferenceDropdown />
            <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">
              Hi,{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {sessionUser?.firstName?.trim() || "User"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-medium text-slate-900 dark:text-slate-100">Users</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span>{" "}
              {total === 1 ? "user" : "users"}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            New user
          </button>
        </div>

        {listError ? (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          >
            {listError}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">First name</th>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Last name</th>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Logins</th>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Created</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                {listLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                      Loading list…
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                      No users on this page.
                    </td>
                  </tr>
                ) : (
                  list.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{u.firstName}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{u.lastName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{u.loginsCounter}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u)}
                            className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && !listLoading ? (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/40 sm:flex-row">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Page <span className="font-medium text-slate-900 dark:text-slate-100">{currentPage}</span> of{" "}
                <span className="font-medium text-slate-900 dark:text-slate-100">{totalPages}</span>
              </p>
              <DashboardPagination
                currentPage={currentPage}
                totalPages={totalPages}
                hasPrev={meta.hasPrev}
                hasNext={meta.hasNext}
                router={router}
              />
            </div>
          ) : null}
        </div>
      </main>

      {/* Create user modal */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px] dark:bg-black/60">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">New user</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter the new user&apos;s details.</p>
            <form onSubmit={(e) => void handleCreateSubmit(e)} className="mt-6 space-y-4">
              {createError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  {createError}
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">First name</label>
                <input
                  value={cFirst}
                  onChange={(e) => setCFirst(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Last name</label>
                <input
                  value={cLast}
                  onChange={(e) => setCLast(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  value={cPassword}
                  onChange={(e) => setCPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={cStatus}
                  onChange={(e) => setCStatus(e.target.value as UserStatus)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {createSubmitting ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit user modal */}
      {editUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px] dark:bg-black/60">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit user</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {editUser.firstName} {editUser.lastName}
            </p>
            <form onSubmit={(e) => void handleEditSubmit(e)} className="mt-6 space-y-4">
              {editError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  {editError}
                </div>
              ) : null}
              {editUser.status === "inactive" ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                  <p className="font-medium text-amber-900 dark:text-amber-200">First and last name locked</p>
                  <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
                    While the account is <strong>inactive</strong>, the server does not accept changes to
                    first or last name. You can change status and the login counter. If you set status to{" "}
                    <strong>active</strong>, you can edit the name fields in the same save (the client sends
                    two steps: reactivation first, then the remaining fields).
                  </p>
                </div>
              ) : null}
              {editUser.status === "inactive" && eStatus === "inactive" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="mb-1 block text-sm font-medium text-slate-500 dark:text-slate-400">First name</span>
                    <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {editUser.firstName}
                    </p>
                  </div>
                  <div>
                    <span className="mb-1 block text-sm font-medium text-slate-500 dark:text-slate-400">Last name</span>
                    <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {editUser.lastName}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">First name</label>
                    <input
                      value={eFirst}
                      onChange={(e) => setEFirst(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Last name</label>
                    <input
                      value={eLast}
                      onChange={(e) => setELast(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={eStatus}
                  onChange={(e) => setEStatus(e.target.value as UserStatus)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Login counter
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={eLogins}
                  onChange={(e) => setELogins(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {editSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Delete confirmation */}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px] dark:bg-black/60">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Delete user</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>
              ? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteSubmitting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
