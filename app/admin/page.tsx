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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            harez.io
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Yönetim</h1>
        </div>
        <Link
          href="/"
          className="inline-flex h-8 items-center rounded-lg border px-2.5 text-sm"
        >
          Sohbete dön
        </Link>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <section className="rounded-2xl border bg-background p-4">
        <h2 className="mb-3 text-sm font-medium">Endpoint ekle veya güncelle</h2>
        <form onSubmit={save} className="grid gap-2 md:grid-cols-3">
          <Input
            required
            placeholder="kimlik (grok)"
            value={form.id}
            onChange={(event) => setForm({ ...form, id: event.target.value })}
          />
          <Input
            required
            placeholder="görünen ad"
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
          />
          <Input
            required
            placeholder="https://.../v1"
            value={form.baseUrl}
            onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
          />
          <Input
            required
            placeholder="model adı"
            value={form.model}
            onChange={(event) => setForm({ ...form, model: event.target.value })}
          />
          <Input
            placeholder="API anahtarı (boşsa eskisi kalır)"
            value={form.apiKey}
            onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
          />
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={form.kind}
            onChange={(event) =>
              setForm({ ...form, kind: event.target.value as "chat" | "image" })
            }
          >
            <option value="chat">sohbet</option>
            <option value="image">görsel</option>
          </select>
          <Button type="submit" className="md:col-span-3">
            Kaydet
          </Button>
        </form>
        <ul className="mt-4 divide-y text-sm">
          {endpoints.map((endpoint) => (
            <li key={endpoint.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {endpoint.label}{" "}
                  <span className="text-muted-foreground">({endpoint.kind})</span>
                </p>
                <p className="truncate text-muted-foreground">
                  {endpoint.model} · {endpoint.baseUrl} ·{" "}
                  {endpoint.hasKey ? "anahtar var" : "anahtar yok"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toggle(endpoint)}>
                {endpoint.enabled ? "Açık" : "Kapalı"}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border bg-background p-4">
        <h2 className="mb-3 text-sm font-medium">Kullanıcı token kullanımı</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Kullanıcı</th>
                <th className="py-2 font-medium">Rol</th>
                <th className="py-2 font-medium">Girdi</th>
                <th className="py-2 font-medium">Çıktı</th>
                <th className="py-2 font-medium">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="py-2">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-muted-foreground">{user.email}</div>
                  </td>
                  <td>{user.role === "admin" ? "yönetici" : "kullanıcı"}</td>
                  <td>{user.prompt_tokens}</td>
                  <td>{user.completion_tokens}</td>
                  <td className="font-medium">{user.total_tokens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
