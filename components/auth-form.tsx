"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function AuthForm({ mode }: { mode: "giris" | "kayit" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(
      mode === "giris" ? "/api/auth/login" : "/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      },
    );
    const raw = await response.text();
    const data = raw
      ? (JSON.parse(raw) as { error?: string })
      : { error: "Sunucu boş yanıt döndü" };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Bir hata oluştu");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
      {mode === "kayit" && (
        <Input
          required
          placeholder="Adın"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-10"
        />
      )}
      <Input
        required
        type="email"
        placeholder="E-posta"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="h-10"
      />
      <Input
        required
        type="password"
        minLength={6}
        placeholder="Şifre"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="h-10"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="h-10">
        {pending ? "Bekle..." : mode === "giris" ? "Giriş yap" : "Kayıt ol"}
      </Button>
    </form>
  );
}
