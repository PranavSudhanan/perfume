"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { safeHref } from "@/lib/utils";

export function AnnouncementBar({ messages, href }: { messages: string[]; href: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (!messages.length) return null;
  const text = (
    <span key={index} className="animate-fade-up block px-4 text-balance">
      {messages[index % messages.length]}
    </span>
  );
  const link = safeHref(href, "");
  return (
    <div className="tone-dark bg-bg text-ink py-2.5 text-center text-[0.7rem] tracking-[0.18em] uppercase">
      {link ? <Link href={link}>{text}</Link> : text}
    </div>
  );
}
