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
      <SidebarHeader className="aui-sidebar-header mb-2 border-b">
        <div className="aui-sidebar-header-content flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href="/" />}>
                <div className="aui-sidebar-header-icon-wrapper bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <MessagesSquare className="aui-sidebar-header-icon size-4" />
                </div>
                <div className="aui-sidebar-header-heading me-6 flex flex-col gap-0.5 leading-none">
                  <span className="aui-sidebar-header-title font-semibold">
                    harez.io
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {me ? `${me.usage.total} token` : "sohbet"}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent className="aui-sidebar-content px-2">
        <ThreadList />
      </SidebarContent>
      {props.collapsible !== "none" && <SidebarRail />}
      <SidebarFooter className="aui-sidebar-footer border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                {initial}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">
                  {me?.user.name ?? "..."}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {me?.user.role === "admin" ? "Yönetici" : "Kullanıcı"}
                </p>
              </div>
              {me?.user.role === "admin" && (
                <Link
                  href="/admin"
                  aria-label="Yönetim"
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <SettingsIcon className="size-4" />
                </Link>
              )}
              <button
                type="button"
                aria-label="Çıkış"
                onClick={logout}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <LogOutIcon className="size-4" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
