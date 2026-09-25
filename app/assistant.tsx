"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FC,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AssistantRuntimeProvider,
  ThreadListPrimitive,
  useAuiState,
  useRemoteThreadListRuntime,
} from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import {
  LogOutIcon,
  PanelLeftIcon,
  SettingsIcon,
  SquarePenIcon,
  XIcon,
} from "lucide-react";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { ThreadList } from "@/components/assistant-ui/elements/thread-list.aui";
import { ModelSelector } from "@/components/model-selector";
import { dbThreadListAdapter } from "@/lib/thread-adapter";
import { cn } from "@/lib/utils";

type Me = {
  user: { name: string; email: string; role: "admin" | "user" };
  usage: { total: number };
};

/* Seçili model ve transport modül seviyesinde tutuluyor; böylece runtime
   hook'u her render'da değişmiyor ve transport yalnızca bir kez oluşuyor. */
let selectedModelId = "grok";
let transport: AssistantChatTransport | null = null;

const getTransport = () =>
  (transport ??= new AssistantChatTransport({
    api: "/api/chat",
    body: () => ({ modelId: selectedModelId }),
  }));

function RuntimeHook() {
  return useChatRuntime({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: getTransport(),
  });
}

const SIDEBAR_KEY = "harez:sidebar-open";
const numberFormat = new Intl.NumberFormat("tr-TR");

export const Assistant = () => {
  const router = useRouter();
  const [modelId, setModelId] = useState(selectedModelId);
  const [me, setMe] = useState<Me | null>(null);
  const [meError, setMeError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const runtime = useRemoteThreadListRuntime({
    runtimeHook: RuntimeHook,
    adapter: dbThreadListAdapter,
    allowNesting: true,
  });

  const changeModel = useCallback((id: string) => {
    selectedModelId = id;
    setModelId(id);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setMe((await res.json()) as Me);
      setMeError(false);
    } catch {
      setMeError(true);
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved !== null) setSidebarOpen(saved === "1");
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
  };

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/giris");
    router.refresh();
  }

  const sidebarProps = { me, meError, onLogout: logout };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <UsageRefresher onRunEnd={loadMe} />
      <DrawerAutoClose onClose={closeDrawer} />

      <div className="bg-background text-foreground flex h-dvh overflow-hidden">
        {/* Masaüstü kenar çubuğu */}
        <aside
          className={cn(
            "bg-sidebar hidden shrink-0 overflow-hidden border-r transition-[width] duration-200 ease-out md:block",
            sidebarOpen ? "w-64" : "w-0 border-r-0",
          )}
          inert={!sidebarOpen}
        >
          <div className="flex h-full w-64 flex-col">
            <SidebarContent
              {...sidebarProps}
              onClose={toggleSidebar}
              closeLabel="Kenar çubuğunu kapat"
              closeIcon={<PanelLeftIcon />}
            />
          </div>
        </aside>

        {/* Mobil çekmece */}
        <div
          className={cn(
            "fixed inset-0 z-50 md:hidden",
            !drawerOpen && "pointer-events-none",
          )}
          inert={!drawerOpen}
        >
          <div
            onClick={closeDrawer}
            className={cn(
              "absolute inset-0 bg-black/60 transition-opacity duration-200",
              drawerOpen ? "opacity-100" : "opacity-0",
            )}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Sohbet geçmişi"
            className={cn(
              "bg-sidebar absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r transition-transform duration-200 ease-out",
              drawerOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <SidebarContent
              {...sidebarProps}
              onClose={closeDrawer}
              closeLabel="Menüyü kapat"
              closeIcon={<XIcon />}
            />
          </aside>
        </div>

        {/* Sohbet kolonu */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-1 px-3">
            <IconButton
              label="Menüyü aç"
              className="md:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <PanelLeftIcon />
            </IconButton>

            {!sidebarOpen && (
              <div className="hidden items-center gap-1 md:flex">
                <IconButton label="Kenar çubuğunu aç" onClick={toggleSidebar}>
                  <PanelLeftIcon />
                </IconButton>
                <NewChatIconButton />
              </div>
            )}

            <ModelSelector value={modelId} onChange={changeModel} />

            <div className="ml-auto flex items-center gap-1">
              {me?.user.role === "admin" && (
                <Link
                  href="/admin"
                  aria-label="Yönetim"
                  title="Yönetim"
                  className="text-muted-foreground hover:bg-surface-2 hover:text-foreground inline-flex size-9 items-center justify-center rounded-lg transition-colors"
                >
                  <SettingsIcon className="size-4" />
                </Link>
              )}
              <div className="md:hidden">
                <NewChatIconButton />
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1">
            <Thread />
          </main>
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};

/* ---------- Kenar çubuğu içeriği ---------- */

type SidebarContentProps = {
  me: Me | null;
  meError: boolean;
  onLogout: () => void;
  onClose: () => void;
  closeLabel: string;
  closeIcon: ReactNode;
};

const SidebarContent: FC<SidebarContentProps> = ({
  me,
  meError,
  onLogout,
  onClose,
  closeLabel,
  closeIcon,
}) => {
  const name = me?.user.name ?? (meError ? "Bağlantı hatası" : "Yükleniyor…");
  const initial = me?.user.name?.slice(0, 1).toUpperCase() ?? "H";

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <Link
          href="/"
          className="hover:bg-surface-2 flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
        >
          <span className="bg-primary size-2 rounded-full" />
          <span className="text-sm font-medium tracking-[-0.2px]">
            harez.io
          </span>
        </Link>
        <IconButton label={closeLabel} onClick={onClose}>
          {closeIcon}
        </IconButton>
      </div>

      <div className="px-2">
        <ThreadListPrimitive.New asChild>
          <button
            type="button"
            className="hover:bg-surface-2 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
          >
            <SquarePenIcon className="text-muted-foreground size-4" />
            Yeni sohbet
          </button>
        </ThreadListPrimitive.New>
      </div>

      <div className="text-text-light px-5 pt-5 pb-1.5 text-[11px] font-medium tracking-[0.6px] uppercase">
        Geçmiş
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <ThreadList />
      </div>

      <div className="border-t p-2">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span className="bg-surface-4 text-ink-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{name}</p>
            <p className="text-text-light text-xs tabular-nums">
              {me ? `${numberFormat.format(me.usage.total)} token` : "\u00A0"}
            </p>
          </div>
          <IconButton label="Çıkış yap" onClick={onLogout}>
            <LogOutIcon />
          </IconButton>
        </div>
      </div>
    </>
  );
};

/* ---------- Yardımcılar ---------- */

const IconButton: FC<ComponentProps<"button"> & { label: string }> = ({
  label,
  className,
  children,
  ...props
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      "text-muted-foreground hover:bg-surface-2 hover:text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors [&_svg]:size-4.5",
      className,
    )}
    {...props}
  >
    {children}
  </button>
);

const NewChatIconButton: FC = () => (
  <ThreadListPrimitive.New asChild>
    <IconButton label="Yeni sohbet">
      <SquarePenIcon />
    </IconButton>
  </ThreadListPrimitive.New>
);

/* Bir yanıt bittiğinde token sayacını yeniler. */
const UsageRefresher: FC<{ onRunEnd: () => void }> = ({ onRunEnd }) => {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !isRunning) onRunEnd();
    wasRunning.current = isRunning;
  }, [isRunning, onRunEnd]);
  return null;
};

/* Mobilde bir sohbet seçilince çekmeceyi kapatır. */
const DrawerAutoClose: FC<{ onClose: () => void }> = ({ onClose }) => {
  const threadId = useAuiState((s) => s.threads.mainThreadId);
  useEffect(() => {
    onClose();
  }, [threadId, onClose]);
  return null;
};