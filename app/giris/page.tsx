import Link from "next/link";
import { AuthForm } from "../../components/auth-form";

export default function GirisPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-sm">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          harez.io
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Giriş yap</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Sohbete devam etmek için hesabına gir.
        </p>
        <AuthForm mode="giris" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="text-foreground underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}
