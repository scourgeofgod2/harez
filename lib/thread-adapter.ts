"use client";

import { useMemo } from "react";
import { useAui } from "@assistant-ui/react";
import type {
  RemoteThreadListAdapter,
  RemoteThreadMetadata,
  RemoteThreadListResponse,
  ThreadHistoryAdapter,
} from "@assistant-ui/core";
import { toConversationUuid } from "@/lib/db";

const emptyStream = () =>
  new ReadableStream({
    start(controller) {
      controller.close();
    },
  });

type DbMessage = {
  id: string;
  role: string;
  content: string;
};

function useDbHistoryAdapter(): ThreadHistoryAdapter {
  const aui = useAui();
  return useMemo(
    () => ({
      async load() {
        return { headId: null, messages: [] };
      },
      async append() {},
      withFormat: (fmt) => ({
        async load() {
          const { remoteId } = aui.threadListItem.getState() as {
            remoteId?: string;
          };
          if (!remoteId) return { messages: [] };
          const res = await fetch(`/api/conversations/${remoteId}/messages`);
          if (!res.ok) return { messages: [] };
          const data = (await res.json()) as { messages: DbMessage[] };
          const messages = data.messages.map((row, i) => ({
            parentId: i === 0 ? null : data.messages[i - 1]!.id,
            message: {
              id: row.id,
              role: row.role === "user" ? "user" : "assistant",
              parts: [{ type: "text", text: row.content }],
            },
          }));
          return {
            messages: messages as unknown as ReturnType<
              typeof fmt.decode
            >[],
          };
        },
        async append() {},
      }),
    }),
    [aui],
  );
}

export const dbThreadListAdapter: RemoteThreadListAdapter = {
  async list(): Promise<RemoteThreadListResponse> {
    const res = await fetch("/api/conversations");
    if (!res.ok) return { threads: [] };
    const data = (await res.json()) as {
      threads: {
        remoteId: string;
        status: "regular" | "archived";
        title?: string;
        lastMessageAt?: string;
      }[];
    };
    return {
      threads: data.threads.map(
        (t): RemoteThreadMetadata => ({
          remoteId: t.remoteId,
          status: t.status,
          title: t.title,
          lastMessageAt: t.lastMessageAt
            ? new Date(t.lastMessageAt)
            : undefined,
        }),
      ),
    };
  },

  async initialize(localId: string) {
    const remoteId = toConversationUuid(localId);
    await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remoteId }),
    });
    return { remoteId };
  },

  async rename(remoteId, newTitle) {
    await fetch(`/api/conversations/${remoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
  },

  async archive(remoteId) {
    await fetch(`/api/conversations/${remoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
  },

  async unarchive(remoteId) {
    await fetch(`/api/conversations/${remoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "regular" }),
    });
  },

  async delete(remoteId) {
    await fetch(`/api/conversations/${remoteId}`, { method: "DELETE" });
  },

  async fetch(remoteId): Promise<RemoteThreadMetadata> {
    const res = await fetch(`/api/conversations/${remoteId}`);
    if (!res.ok) throw new Error("Sohbet bulunamadı");
    const data = (await res.json()) as {
      remoteId: string;
      status: "regular" | "archived";
      title?: string;
      lastMessageAt?: string;
    };
    return {
      remoteId: data.remoteId,
      status: data.status,
      title: data.title,
      lastMessageAt: data.lastMessageAt
        ? new Date(data.lastMessageAt)
        : undefined,
    };
  },

  async generateTitle() {
    return emptyStream() as unknown as Awaited<
      ReturnType<RemoteThreadListAdapter["generateTitle"]>
    >;
  },

  unstable_useAdapters() {
    const history = useDbHistoryAdapter();
    return useMemo(() => ({ history }), [history]);
  },
};
