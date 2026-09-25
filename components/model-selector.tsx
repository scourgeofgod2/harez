"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Model = {
  id: string;
  label: string;
  description?: string;
};

type Status = "loading" | "ready" | "error";

export function ModelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [models, setModels] = useState<Model[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/models")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<{ models: Model[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setModels(
          data.models.map(({ id, label, description }) => ({
            id,
            label,
            description,
          })),
        );
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Seçili model listede yoksa ilkine geç.
  useEffect(() => {
    if (
      status === "ready" &&
      models.length > 0 &&
      !models.some((m) => m.id === value)
    ) {
      onChange(models[0].id);
    }
  }, [status, models, value, onChange]);

  // Dışarı tıklayınca kapat.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Aktif öğeye odaklan.
  useEffect(() => {
    if (open) itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  const selectedIndex = models.findIndex((m) => m.id === value);
  const selected = models[selectedIndex];

  const openMenu = () => {
    setActiveIndex(Math.max(selectedIndex, 0));
    setOpen(true);
  };

  const closeMenu = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const count = models.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (count) setActiveIndex((i) => (i + 1) % count);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (count) setActiveIndex((i) => (i - 1 + count) % count);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        if (count) setActiveIndex(count - 1);
        break;
      case "Escape":
        e.preventDefault();
        closeMenu(true);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const triggerLabel =
    selected?.label ?? (status === "loading" ? "Yükleniyor…" : value);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={cn(
          "hover:bg-surface-2 focus-visible:ring-primary/40 flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[15px] font-medium tracking-[-0.2px] transition-colors outline-none focus-visible:ring-2",
          open && "bg-surface-2",
        )}
      >
        <span className={cn(status === "loading" && "text-muted-foreground")}>
          {triggerLabel}
        </span>
        <ChevronDownIcon
          className={cn(
            "text-muted-foreground size-4 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Model seç"
          onKeyDown={onMenuKeyDown}
          className="bg-popover text-popover-foreground animate-in fade-in zoom-in-95 slide-in-from-top-1 absolute top-full left-0 z-50 mt-1.5 w-72 max-w-[calc(100vw-1.5rem)] origin-top-left overflow-hidden rounded-2xl border p-1.5 shadow-2xl duration-150"
        >
          <div className="text-text-light px-2.5 pt-1.5 pb-2 text-[11px] font-medium tracking-[0.6px] uppercase">
            Model
          </div>

          {status === "loading" && (
            <p className="text-muted-foreground px-2.5 py-2 text-sm">
              Modeller yükleniyor…
            </p>
          )}
          {status === "error" && (
            <p className="text-destructive px-2.5 py-2 text-sm">
              Modeller yüklenemedi. Sayfayı yenilemeyi dene.
            </p>
          )}
          {status === "ready" && models.length === 0 && (
            <p className="text-muted-foreground px-2.5 py-2 text-sm">
              Kullanılabilir model yok.
            </p>
          )}

          {models.map((model, i) => {
            const isSelected = model.id === value;
            return (
              <button
                key={model.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                tabIndex={i === activeIndex ? 0 : -1}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  onChange(model.id);
                  closeMenu(true);
                }}
                className="hover:bg-surface-4 focus-visible:bg-surface-4 flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start transition-colors outline-none"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium">
                    {model.label}
                  </p>
                  {model.description && (
                    <p className="text-muted-foreground truncate text-xs">
                      {model.description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <CheckIcon className="text-primary size-4 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div> );
}
    