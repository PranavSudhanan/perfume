"use client";

import {
  ExternalLink,
  FileText,
  FlaskConical,
  ImageIcon,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Palette,
  PanelTop,
  Settings,
  ShoppingCart,
  Star,
  TicketPercent,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type Counts = { orders: number; reviews: number; messages: number };
type Item = { href: string; label: string; icon: LucideIcon; count?: keyof Counts };

const NAV: { title?: string; items: Item[] }[] = [
  { items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart, count: "orders" },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/coupons", label: "Discount codes", icon: TicketPercent },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Collections", icon: Layers },
      { href: "/admin/builder", label: "Perfume builder", icon: FlaskConical },
      { href: "/admin/reviews", label: "Reviews", icon: Star, count: "reviews" },
    ],
  },
  {
    title: "Storefront",
    items: [
      { href: "/admin/pages", label: "Pages & banners", icon: FileText },
      { href: "/admin/navigation", label: "Menus & footer", icon: PanelTop },
      { href: "/admin/theme", label: "Theme", icon: Palette },
      { href: "/admin/media", label: "Media library", icon: ImageIcon },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/admin/messages", label: "Inbox", icon: Mail, count: "messages" },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AdminShell({
  storeName,
  user,
  counts,
  children,
}: {
  storeName: string;
  user: { name: string; email: string };
  counts: Counts;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-5">
        <Link href="/admin" className="truncate font-semibold tracking-tight">
          {storeName} <span className="font-normal text-zinc-400">admin</span>
        </Link>
        <button type="button" onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin">
        {NAV.map((group, i) => (
          <div key={i}>
            {group.title && (
              <p className="mb-1 px-2 text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const count = item.count ? counts[item.count] : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition",
                        active
                          ? "bg-zinc-900 font-medium text-white"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 text-[11px] font-medium tabular-nums",
                            active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800",
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-zinc-200 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ExternalLink className="size-4" strokeWidth={1.75} /> View storefront
        </a>
        <div className="flex items-center justify-between gap-2 px-2 pt-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await logoutAction();
                router.push("/admin/login");
                router.refresh();
              })
            }
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-zinc-200 bg-white lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <span className="font-semibold">{storeName} admin</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
