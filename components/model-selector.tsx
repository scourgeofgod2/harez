"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Model = {
  id: string;
  label: string;
};

export function ModelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [models, setModels] = useState<Model[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void fetch("/api/models")
      .then((r) => (r.ok ? r.json() : { models: [] }))
      .then((data: { models: { id: string; label: string }[] }) => {
        setModels(data.models.map((m) => ({ id: m.id, label: m.label })));
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const selected = models.find((m) => m.id === value);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="gap-1 text-muted-foreground"
      >
        {selected?.label ?? value}
        <ChevronDownIcon className="size-3.5" />
      </Button>
      {open && models.length > 0 && (
        <div
          className="bg-popover text-popover-foreground absolute top-full right-0 z-50 mt-1 min-w-40 overflow-hidden rounded-md border p-1 shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              className={`flex w-full items-center rounded-sm px-2.5 py-1.5 text-left text-[0.8125rem] transition-colors hover:bg-muted ${
                model.id === value ? "font-medium" : "text-muted-foreground"
              }`}
              onClick={() => {
                onChange(model.id);
                setOpen(false);
              }}
            >
              {model.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
