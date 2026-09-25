"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


type Endpoint = {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  kind: "chat" | "image";
  enabled: boolean;
  hasKey: boolean;
};

type UsageUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

const empty = {
  id: "",
  label: "",
  baseUrl: "",
  apiKey: "",
  model: "",
  kind: "chat" as "chat" | "image",
};

export default function AdminPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [users, setUsers] = useState<UsageUser[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const [endpointRes, usageRes] = await Promise.all([
      fetch("/api/admin/endpoints"),
      fetch("/api/admin/usage"),
    ]);
    if (endpointRes.status === 403 || usageRes.status === 403) {
      setError("Bu sayfa sadece yönetici hesabına açık.");
      return;
    }
    const endpointData = (await endpointRes.json()) as { endpoints: Endpoint[] };
    const usageData = (await usageRes.json()) as { users: UsageUser[] };
    setEndpoints(endpointData.endpoints);
    setUsers(usageData.users);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      setError("Kaydedilemedi");
      return;
    }
    setForm(empty);
    setEditingId(null);
    await load();
  }

  function startEdit(endpoint: Endpoint) {
    setForm({
      id: endpoint.id,
      label: endpoint.label,
      baseUrl: endpoint.baseUrl,
      model: endpoint.model,
      kind: endpoint.kind,
      apiKey: "",
    });
    setEditingId(endpoint.id);
  }

  function cancelEdit() {
    setForm(empty);
    setEditingId(null);
  }

  async function remove(endpoint: Endpoint) {
    if (!confirm(`"${endpoint.label}" silinsin mi?`)) return;
    await fetch("/api/admin/endpoints", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: endpoint.id }),
    });
    if (editingId === endpoint.id) cancelEdit();
    await load();
  }

  async function toggle(endpoint: Endpoint) {
    await fetch("/api/admin/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: endpoint.id,
        label: endpoint.label,
        baseUrl: endpoint.baseUrl,
        model: endpoint.model,
        kind: endpoint.kind,
        enabled: !endpoint.enabled,
      }),
    });
    await load();
  }

  const chatEndpoints = endpoints.filter((e) => e.kind === "chat");
  const imageEndpoints = endpoints.filter((e) => e.kind === "image");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 bg-[#010102] px-8 py-8">
      <header className="flex h-14 items-center justify-between border-b border-[#23252a]">
        <div className="flex items-center gap-3">
          <span className="size-2 rounded-full bg-[#5e6ad2]" />
          <div>
            <p className="text-[13px] font-medium tracking-[0.4px] text-[#8a8f98]">
              HAREZ.IO
            </p>
            <h1 className="text-[22px] font-medium tracking-[-0.4px]">
              Yönetim
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium transition-colors"
          >
            ← Sohbete dön
          </Link>
        </div>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <section className="overflow-hidden rounded-xl border border-[#23252a] bg-[#0f1011]">
        <div className="border-b px-4 py-2.5">
          <span className="text-[13px] font-medium">
            {editingId ? "Endpoint güncelle" : "Endpoint ekle"}
          </span>
        </div>
        <div className="p-4">
          <form onSubmit={save} className="grid gap-2 md:grid-cols-3">
            <Input
              required
              placeholder="kimlik (grok)"
              value={form.id}
              disabled={!!editingId}
              onChange={(event) => setForm({ ...form, id: event.target.value })}
            />
            <Input
              required
              placeholder="görünen ad"
              value={form.label}
              onChange={(event) =>
                setForm({ ...form, label: event.target.value })
              }
            />
            <Input
              required
              placeholder="https://.../v1"
              value={form.baseUrl}
              onChange={(event) =>
                setForm({ ...form, baseUrl: event.target.value })
              }
            />
            <Input
              required
              placeholder="model adı"
              value={form.model}
              onChange={(event) =>
                setForm({ ...form, model: event.target.value })
              }
            />
            <Input
              placeholder="API anahtarı (boşsa eskisi kalır)"
              value={form.apiKey}
              onChange={(event) =>
                setForm({ ...form, apiKey: event.target.value })
              }
            />
            <select
              className="bg-card h-8 rounded-md border border-input px-2.5 text-[13px] text-foreground transition-[border-color,box-shadow] outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[var(--accent-light)]"
              value={form.kind}
              onChange={(event) =>
                setForm({
                  ...form,
                  kind: event.target.value as "chat" | "image",
                })
              }
            >
              <option value="chat">sohbet</option>
              <option value="image">görsel</option>
            </select>
            <div className="flex gap-2 md:col-span-3">
              <Button type="submit" className="flex-1">
                {editingId ? "Güncelle" : "Kaydet"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  İptal
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#23252a] bg-[#0f1011]">
        <div className="border-b px-4 py-2.5">
          <span className="text-[13px] font-medium">Sohbet modelleri</span>
        </div>
        <div className="px-4 py-2">
          <EndpointList
            endpoints={chatEndpoints}
            editingId={editingId}
            onEdit={startEdit}
            onRemove={remove}
            onToggle={toggle}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#23252a] bg-[#0f1011]">
        <div className="border-b px-4 py-2.5">
          <span className="text-[13px] font-medium">Görsel modelleri</span>
        </div>
        <div className="px-4 py-2">
          <EndpointList
            endpoints={imageEndpoints}
            editingId={editingId}
            onEdit={startEdit}
            onRemove={remove}
            onToggle={toggle}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#23252a] bg-[#0f1011]">
        <div className="border-b px-4 py-2.5">
          <span className="text-[13px] font-medium">
            Kullanıcı token kullanımı
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b bg-muted">
                <th className="px-5 py-2 text-[11px] font-semibold tracking-[0.3px] text-muted-foreground">
                  Kullanıcı
                </th>
                <th className="px-5 py-2 text-[11px] font-semibold tracking-[0.3px] text-muted-foreground">
                  Rol
                </th>
                <th className="px-5 py-2 text-[11px] font-semibold tracking-[0.3px] text-muted-foreground">
                  Girdi
                </th>
                <th className="px-5 py-2 text-[11px] font-semibold tracking-[0.3px] text-muted-foreground">
                  Çıktı
                </th>
                <th className="px-5 py-2 text-[11px] font-semibold tracking-[0.3px] text-muted-foreground">
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b transition-colors last:border-b-0 hover:bg-muted"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">
                      {user.name}
                    </div>
                    <div className="text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center rounded-sm bg-[var(--accent-light)] px-1.5 py-0.5 text-[11px] font-medium text-primary">
                        yönetici
                      </span>
                    ) : (
                      "kullanıcı"
                    )}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">
                    {user.prompt_tokens}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">
                    {user.completion_tokens}
                  </td>
                  <td className="px-5 py-3 font-medium tabular-nums text-foreground">
                    {user.total_tokens}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function EndpointList({
  endpoints,
  editingId,
  onEdit,
  onRemove,
  onToggle,
}: {
  endpoints: Endpoint[];
  editingId: string | null;
  onEdit: (e: Endpoint) => void;
  onRemove: (e: Endpoint) => void;
  onToggle: (e: Endpoint) => void;
}) {
  if (endpoints.length === 0) {
    return <p className="text-sm text-muted-foreground">Kayıt yok</p>;
  }
  return (
    <ul className="divide-y text-[13px]">
      {endpoints.map((endpoint) => (
        <li
          key={endpoint.id}
          className={`flex items-center gap-3 py-3 transition-colors hover:bg-muted ${!endpoint.enabled ? "opacity-50" : ""}`}
        >
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-medium">
              {endpoint.label}
              <span
                className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
                  endpoint.kind === "image"
                    ? "bg-[var(--accent-light)] text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {endpoint.kind === "image" ? "görsel" : "sohbet"}
              </span>
            </p>
            <p className="truncate text-muted-foreground">
              {endpoint.model} · {endpoint.baseUrl} ·{" "}
              {endpoint.hasKey ? "anahtar var" : "anahtar yok"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggle(endpoint)}
          >
            {endpoint.enabled ? "Açık" : "Kapalı"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(endpoint)}>
            Düzenle
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRemove(endpoint)}
          >
            Sil
          </Button>
        </li>
      ))}
    </ul>
  );
}
