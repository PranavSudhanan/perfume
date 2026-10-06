import { desc } from "drizzle-orm";
import { MailOpen, Reply, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { ActionButton } from "@/components/admin/crud";
import { Badge, Card, EmptyState, PageHeader, ui } from "@/components/admin/ui";
import { db } from "@/db";
import { messages, subscribers } from "@/db/schema";
import {
  deleteMessageAction,
  deleteSubscriberAction,
  setMessageReadAction,
} from "@/lib/actions/admin";
import { adminPage } from "@/lib/admin";
import { getSettings } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Inbox" };

export default async function MessagesPage() {
  await adminPage();
  const [{ store }, inbox, list] = await Promise.all([
    getSettings(),
    db.select().from(messages).orderBy(messages.read, desc(messages.createdAt)).limit(200),
    db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(1000),
  ]);

  return (
    <>
      <PageHeader title="Inbox" description="Messages from the contact form and newsletter sign-ups." />

      <h2 className="mb-3 text-lg font-semibold">Messages</h2>
      {inbox.length === 0 ? (
        <EmptyState title="No messages yet" text="Messages sent from your contact page will land here." />
      ) : (
        <ul className="space-y-3">
          {inbox.map((message) => (
            <li key={message.id} className={`${ui.card} p-5 ${message.read ? "" : "border-l-4 border-l-amber-400"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-zinc-900">
                    {message.subject || "(No subject)"}
                    {!message.read && <Badge tone="amber">New</Badge>}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {message.name} · {message.email} · {formatDateTime(message.createdAt, store.locale)}
                  </p>
                  <p className="mt-3 text-sm whitespace-pre-wrap text-zinc-700">{message.body}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject ?? "Your message"}`)}`}
                    className={ui.btnSecondary}
                  >
                    <Reply className="size-4" /> Reply
                  </a>
                  {!message.read && (
                    <ActionButton action={setMessageReadAction.bind(null, message.id, true)}>
                      <MailOpen className="size-4" /> Mark read
                    </ActionButton>
                  )}
                  <ActionButton
                    action={deleteMessageAction.bind(null, message.id)}
                    confirm="Delete this message?"
                    className={ui.btnDanger}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete</span>
                  </ActionButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Card
        title={`Newsletter subscribers (${list.length})`}
        description="Copy these addresses into your email tool to send a campaign."
        className="mt-8"
      >
        {list.length === 0 ? (
          <p className="text-sm text-zinc-500">No subscribers yet.</p>
        ) : (
          <ul className="-my-2 max-h-96 divide-y divide-zinc-100 overflow-y-auto">
            {list.map((subscriber) => (
              <li key={subscriber.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">{subscriber.email}</span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-zinc-400">
                  {formatDate(subscriber.createdAt, store.locale)}
                  <ActionButton
                    action={deleteSubscriberAction.bind(null, subscriber.id)}
                    confirm={`Remove ${subscriber.email} from the list?`}
                    className={ui.btnIcon}
                    title="Remove"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Remove</span>
                  </ActionButton>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
