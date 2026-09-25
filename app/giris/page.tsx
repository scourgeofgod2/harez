import Link from "next/link";
import { AuthForm } from "../../components/auth-form";

export default function GirisPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-[#010102] px-4">
      <Link
        href="/"
        className="absolute top-5 left-5 flex items-center gap-2 text-sm text-[#d0d6e0]"
      >
        <span className="size-2 rounded-full bg-[#5e6ad2]" />
        harez.io
      </Link>
      <div className="w-full max-w-[420px] rounded-2xl border border-[#23252a] bg-[#0f1011] p-8">
        <p className="text-[13px] font-medium tracking-[0.4px] text-[#8a8f98]">
          HESAP
        </p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.8px]">
          Giriş yap
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Sohbete devam etmek için hesabına gir.
        </p>
        <AuthForm mode="giris" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="text-primary underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}
