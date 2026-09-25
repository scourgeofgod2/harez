"use client";

import type * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, MessagesSquare, SettingsIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThreadList } from "@/components/assistant-ui/elements/thread-list.aui";

type Me = {
  user: { name: string; email: string; role: "admin" | "user" };
  usage: { total: number };
};

export function ThreadListSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void fetch("/api/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Me | null) => setMe(data));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/giris");
    router.refresh();
  }

  const initial = me?.user.name?.slice(0, 1).toUpperCase() ?? "H";

  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header h-14 justify-center border-b border-[#23252a] px-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-sm">
              <MessagesSquare className="size-3" />
            </span>
            <span className="text-[13px] font-medium tracking-tight">
              harez.io
            </span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="aui-sidebar-content px-2 pt-2">
        <ThreadList />
      </SidebarContent>
      {props.collapsible !== "none" && <SidebarRail />}
      <SidebarFooter className="aui-sidebar-footer border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="bg-muted text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium">
                {initial}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13px] font-medium">
                  {me?.user.name ?? "..."}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {me
                    ? `${me.user.role === "admin" ? "Yönetici" : "Kullanıcı"} · ${me.usage.total} token`
                    : "sohbet"}
                </p>
              </div>
              {me?.user.role === "admin" && (
                <Link
                  href="/admin"
                  aria-label="Yönetim"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded-md transition-colors"
                >
                  <SettingsIcon className="size-3.5" />
                </Link>
              )}
              <button
                type="button"
                aria-label="Çıkış"
                onClick={logout}
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded-md transition-colors"
              >
                <LogOutIcon className="size-3.5" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
