import Link from "next/link";
import { AuthForm } from "../../components/auth-form";

export default function KayitPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-sm">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          harez.io
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Kayıt ol</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          İlk kayıt olan hesap yönetici olur.
        </p>
        <AuthForm mode="kayit" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Zaten hesabın var mı?{" "}
          <Link href="/giris" className="text-foreground underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </main>
  );
}
