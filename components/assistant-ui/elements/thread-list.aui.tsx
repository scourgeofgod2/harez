"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AuiIf,
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import {
  ArchiveIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import {
  forwardRef,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FC,
} from "react";

const FALLBACK_TITLE = "Yeni sohbet";

/* Kenar çubuğunda zaten "Yeni sohbet" butonu olduğu için varsayılan olarak
   gizli. Başka bir yerde kullanırsan showNew ile açabilirsin. */
export const ThreadList: FC<{ showNew?: boolean }> = ({ showNew = false }) => {
  const [search, setSearch] = useState("");
  const hasThreads = useAuiState((s) => s.threads.threadIds.length > 0);

  return (
    <ThreadListRoot>
      {showNew && <ThreadListNew />}
      {hasThreads && (
        <ThreadListSearch value={search} onValueChange={setSearch} />
      )}
      <ThreadListItems searchQuery={hasThreads ? search : ""} />
    </ThreadListRoot>
  );
};

/* ---------- Arama ---------- */

export const ThreadListSearch = forwardRef<
  HTMLInputElement,
  Omit<ComponentPropsWithoutRef<typeof Input>, "value" | "onChange"> & {
    value: string;
    onValueChange: (value: string) => void;
  }
>(({ className, value, onValueChange, ...props }, ref) => (
  <div data-slot="aui_thread-list-search" className="relative pb-1">
    <SearchIcon
      aria-hidden
      className="text-text-light pointer-events-none absolute start-2.5 top-[calc(50%-2px)] size-4 -translate-y-1/2"
    />
    <Input
      ref={ref}
      type="search"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && value) {
          event.preventDefault();
          onValueChange("");
        }
      }}
      aria-label="Sohbetlerde ara"
      placeholder="Sohbet ara"
      className={cn(
        "bg-surface-2 placeholder:text-text-light focus-visible:border-border-hover h-9 rounded-lg border-transparent ps-8 pe-8 text-sm shadow-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:hidden",
        className,
      )}
      {...props}
    />
    {value && (
      <button
        type="button"
        aria-label="Aramayı temizle"
        onClick={() => onValueChange("")}
        className="text-text-light hover:text-foreground absolute end-2 top-[calc(50%-2px)] inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
      >
        <XIcon className="size-3.5" />
      </button>
    )}
  </div>
));
ThreadListSearch.displayName = "ThreadListSearch";

/* ---------- Kök ve liste ---------- */

export const ThreadListRoot: FC<
  ComponentPropsWithoutRef<typeof ThreadListPrimitive.Root>
> = ({ className, ...props }) => (
  <ThreadListPrimitive.Root
    data-slot="aui_thread-list-root"
    className={cn("flex flex-col gap-px", className)}
    {...props}
  />
);

export const ThreadListItems: FC<
  ComponentPropsWithoutRef<"div"> & { searchQuery?: string }
> = ({ className, searchQuery = "", ...props }) => (
  <div
    data-slot="aui_thread-list-items"
    className={cn("flex flex-col gap-px", className)}
    {...props}
  >
    <AuiIf condition={(s) => s.threads.isLoading}>
      <ThreadListSkeleton />
    </AuiIf>
    <AuiIf condition={(s) => !s.threads.isLoading}>
      <ThreadListItemGroups searchQuery={searchQuery} />
    </AuiIf>
  </div>
);

/* ---------- Tarih grupları ---------- */

const DAY_IN_MS = 86_400_000;

const dateGroupLabel = (
  date: Date | undefined,
  startOfToday: number,
): string => {
  if (!date) return "Bugün";
  const t = date.getTime();
  if (t >= startOfToday) return "Bugün";
  if (t >= startOfToday - DAY_IN_MS) return "Dün";
  if (t >= startOfToday - 7 * DAY_IN_MS) return "Son 7 gün";
  if (t >= startOfToday - 30 * DAY_IN_MS) return "Son 30 gün";
  return "Daha önce";
};

export type ThreadListGroup = { label: string; indices: number[] };

export const useThreadListGroups = (searchQuery = "") => {
  const threadIds = useAuiState((s) => s.threads.threadIds);
  const threadItems = useAuiState((s) => s.threads.threadItems);
  const query = searchQuery.trim().toLocaleLowerCase("tr-TR");

  return useMemo(() => {
    const itemsById = new Map(threadItems.map((item) => [item.id, item]));
    const dates = threadIds.map((id) => itemsById.get(id)?.lastMessageAt);

    const filteredIndices = threadIds
      .map((id, index) => ({ id, index }))
      .filter(
        ({ id }) =>
          !query ||
          (itemsById.get(id)?.title || FALLBACK_TITLE)
            .toLocaleLowerCase("tr-TR")
            .includes(query),
      )
      .map(({ index }) => index);

    if (!filteredIndices.some((index) => dates[index])) {
      return { threadIds, filteredIndices, groups: null };
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const time = (index: number) =>
      dates[index]?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const sorted = [...filteredIndices].sort((a, b) => time(b) - time(a));

    const result: ThreadListGroup[] = [];
    for (const index of sorted) {
      const label = dateGroupLabel(dates[index], startOfToday);
      const lastGroup = result[result.length - 1];
      if (lastGroup?.label === label) lastGroup.indices.push(index);
      else result.push({ label, indices: [index] });
    }
    return { threadIds, filteredIndices, groups: result };
  }, [threadIds, threadItems, query]);
};

const ThreadListItemGroups: FC<{ searchQuery?: string }> = ({
  searchQuery = "",
}) => {
  const { threadIds, filteredIndices, groups } =
    useThreadListGroups(searchQuery);
  const query = searchQuery.trim();

  if (query && filteredIndices.length === 0) {
    return (
      <div
        data-slot="aui_thread-list-empty"
        className="text-text-light px-2.5 py-6 text-center text-[13px]"
      >
        “{query}” için sonuç yok
      </div>
    );
  }

  if (!groups) {
    return filteredIndices.map((index) => (
      <ThreadListPrimitive.ItemByIndex
        key={threadIds[index]}
        index={index}
        components={{ ThreadListItem }}
      />
    ));
  }

  return groups.map((group) => (
    <Fragment key={group.label}>
      <div
        data-slot="aui_thread-list-group-label"
        className="text-text-light px-2.5 pt-5 pb-1.5 text-[11px] font-medium tracking-[0.6px] uppercase first:pt-3"
      >
        {group.label}
      </div>
      {group.indices.map((index) => (
        <ThreadListPrimitive.ItemByIndex
          key={threadIds[index]}
          index={index}
          components={{ ThreadListItem }}
        />
      ))}
    </Fragment>
  ));
};

/* ---------- Yeni sohbet (opsiyonel) ---------- */

export const ThreadListNew = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof Button> & { labelClassName?: string }
>(({ className, labelClassName, children, ...props }, ref) => (
  <ThreadListPrimitive.New asChild>
    <Button
      ref={ref}
      variant="ghost"
      data-slot="aui_thread-list-new"
      className={cn(
        "hover:bg-surface-2 h-9 justify-start gap-2.5 rounded-lg px-2.5 text-sm font-normal",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <PlusIcon className="text-muted-foreground size-4 shrink-0" />
          <span className={cn("whitespace-nowrap", labelClassName)}>
            Yeni sohbet
          </span>
        </>
      )}
    </Button>
  </ThreadListPrimitive.New>
));
ThreadListNew.displayName = "ThreadListNew";

/* ---------- İskelet ---------- */

const SKELETON_WIDTHS = ["w-4/5", "w-3/5", "w-11/12", "w-2/3", "w-3/4"];

const ThreadListSkeleton: FC = () => (
  <div role="status" className="flex flex-col gap-px pt-3">
    <span className="sr-only">Sohbetler yükleniyor</span>
    {SKELETON_WIDTHS.map((width, i) => (
      <div key={i} className="flex h-9 items-center px-2.5">
        <Skeleton
          className={cn("h-3.5 rounded-md motion-reduce:animate-none", width)}
        />
      </div>
    ))}
  </div>
);

/* ---------- Sohbet satırı ---------- */

export const ThreadListItem: FC = () => {
  const isRunning = useAuiState((s) => s.threadListItem.isRunning);
  const [isRenaming, setIsRenaming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (isRenaming || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    triggerRef.current?.focus();
  }, [isRenaming]);

  return (
    <ThreadListItemPrimitive.Root
      data-slot="aui_thread-list-item"
      className="group text-ink-muted hover:bg-surface-2 hover:text-foreground has-focus-visible:bg-surface-2 has-data-[state=open]:bg-surface-2 data-active:bg-surface-4 data-active:text-foreground relative flex h-9 items-center rounded-lg transition-colors"
    >
      {isRenaming ? (
        <ThreadListItemRename
          onDone={(restoreFocus) => {
            restoreFocusRef.current = restoreFocus;
            setIsRenaming(false);
          }}
        />
      ) : (
        <ThreadListItemPrimitive.Trigger
          ref={triggerRef}
          data-slot="aui_thread-list-item-trigger"
          className="focus-visible:ring-primary/40 flex h-full min-w-0 flex-1 items-center rounded-lg px-2.5 text-start text-sm outline-none group-hover:pe-9 group-has-focus-visible:pe-9 group-has-data-[state=open]:pe-9 group-data-active:pe-9 focus-visible:ring-2 pointer-coarse:pe-9"
        >
          {isRunning && (
            <Loader2Icon
              aria-hidden
              className="text-primary me-2 size-3.5 shrink-0 animate-spin"
            />
          )}
          <span className="min-w-0 flex-1 truncate">
            <ThreadListItemPrimitive.Title fallback={FALLBACK_TITLE} />
          </span>
          {isRunning && <span className="sr-only">Yanıt yazılıyor</span>}
        </ThreadListItemPrimitive.Trigger>
      )}
      <ThreadListItemMore onRename={() => setIsRenaming(true)} />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemRename: FC<{
  onDone: (restoreFocus: boolean) => void;
}> = ({ onDone }) => {
  const aui = useAui();
  const title = useAuiState((s) => s.threadListItem.title) ?? "";
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const settledRef = useRef(false);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const commit = (restoreFocus: boolean) => {
    if (settledRef.current) return;
    settledRef.current = true;
    const next = value.trim();
    if (!next || next === title) {
      onDone(restoreFocus);
      return;
    }
    Promise.resolve()
      .then(() => aui.threadListItem.rename(next))
      .then(
        () => onDone(restoreFocus),
        () => {
          settledRef.current = false;
          if (restoreFocus) inputRef.current?.focus();
        },
      );
  };

  const cancel = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    onDone(true);
  };

  return (
    <Input
      ref={inputRef}
      autoFocus
      data-slot="aui_thread-list-item-rename"
      aria-label="Sohbeti yeniden adlandır"
      value={value}
      className="bg-surface-4 border-border-hover focus-visible:ring-primary/30 h-9 min-w-0 flex-1 rounded-lg ps-2.5 pe-9 text-sm shadow-none focus-visible:ring-2"
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => commit(false)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit(true);
        } else if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
      }}
    />
  );
};

/* ---------- Satır menüsü ---------- */

const menuItem =
  "hover:bg-surface-4 focus:bg-surface-4 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] outline-none select-none";

const ThreadListItemMore: FC<{ onRename: () => void }> = ({ onRename }) => (
  <ThreadListItemMorePrimitive.Root sharedFocusGroup>
    <ThreadListItemMorePrimitive.Trigger asChild>
      <Button
        variant="ghost"
        size="icon"
        data-slot="aui_thread-list-item-more"
        className="text-muted-foreground hover:text-foreground data-[state=open]:text-foreground absolute end-1.5 top-1/2 size-7 -translate-y-1/2 rounded-md p-0 opacity-0 hover:bg-transparent group-hover:opacity-100 group-has-focus-visible:opacity-100 group-data-active:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
      >
        <MoreHorizontalIcon className="size-4" />
        <span className="sr-only">Diğer seçenekler</span>
      </Button>
    </ThreadListItemMorePrimitive.Trigger>
    <ThreadListItemMorePrimitive.Content
      side="bottom"
      align="end"
      sideOffset={4}
      data-slot="aui_thread-list-item-more-content"
      className="bg-popover text-popover-foreground animate-in fade-in zoom-in-95 z-50 min-w-44 overflow-hidden rounded-xl border p-1 shadow-xl duration-150"
    >
      <ThreadListItemMorePrimitive.Item className={menuItem} onSelect={onRename}>
        <PencilIcon className="text-muted-foreground size-4" />
        Yeniden adlandır
      </ThreadListItemMorePrimitive.Item>
      <ThreadListItemPrimitive.Archive asChild>
        <ThreadListItemMorePrimitive.Item className={menuItem}>
          <ArchiveIcon className="text-muted-foreground size-4" />
          Arşivle
        </ThreadListItemMorePrimitive.Item>
      </ThreadListItemPrimitive.Archive>
      <div className="bg-border mx-1 my-1 h-px" />
      <ThreadListItemPrimitive.Delete asChild>
        <ThreadListItemMorePrimitive.Item
          className={cn(
            menuItem,
            "text-destructive hover:bg-danger-light focus:bg-danger-light",
          )}
        >
          <TrashIcon className="size-4" />
          Sil
        </ThreadListItemMorePrimitive.Item>
      </ThreadListItemPrimitive.Delete>
    </ThreadListItemMorePrimitive.Content>
  </ThreadListItemMorePrimitive.Root>
);