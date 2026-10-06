"use client";

import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cart, cartCount, useCart } from "@/lib/cart";
import type { NavLink } from "@/lib/config";
import { cn, safeHref } from "@/lib/utils";

type Props = {
  name: string;
  logo: string;
  links: NavLink[];
  layout: "left" | "center";
  sticky: boolean;
};

function Brand({ name, logo }: { name: string; logo: string }) {
  return (
    <Link href="/" className="flex shrink-0 items-center" aria-label={`${name} — home`}>
      {logo ? (
        <img src={logo} alt={name} className="h-8 w-auto md:h-10" />
      ) : (
        <span className="heading text-2xl tracking-[0.18em] uppercase md:text-[1.7rem]">{name}</span>
      )}
    </Link>
  );
}

export function Header({ name, logo, links, layout, sticky }: Props) {
  const pathname = usePathname();
  const { items } = useCart();
  const count = cartCount(items);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close overlays whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const nav = (
    <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
      {links.map((link, i) => {
        const href = safeHref(link.href, "/");
        const active = href !== "/" && pathname.startsWith(href);
        return (
          <Link
            key={i}
            href={href}
            className={cn(
              "text-[0.8rem] tracking-[0.14em] uppercase transition hover:opacity-60",
              active && "underline decoration-1 underline-offset-8",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const actions = (
    <div className="flex items-center justify-end gap-1 md:gap-2">
      <button
        type="button"
        onClick={() => setSearchOpen((v) => !v)}
        className="p-2 transition hover:opacity-60"
        aria-label="Search"
        aria-expanded={searchOpen}
      >
        <Search className="size-5" strokeWidth={1.5} />
      </button>
      <Link href="/account" className="hidden p-2 transition hover:opacity-60 sm:block" aria-label="Account">
        <User className="size-5" strokeWidth={1.5} />
      </Link>
      <button
        type="button"
        onClick={() => cart.open()}
        className="relative p-2 transition hover:opacity-60"
        aria-label={`Bag, ${count} item${count === 1 ? "" : "s"}`}
      >
        <ShoppingBag className="size-5" strokeWidth={1.5} />
        {count > 0 && (
          <span className="bg-primary text-on-primary absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full text-[10px] font-medium">
            {count}
          </span>
        )}
      </button>
    </div>
  );

  const menuButton = (
    <button
      type="button"
      onClick={() => setMenuOpen(true)}
      className="-ml-2 p-2 lg:hidden"
      aria-label="Open menu"
    >
      <Menu className="size-5" strokeWidth={1.5} />
    </button>
  );

  return (
    <header
      className={cn(
        "border-line bg-bg/92 z-40 border-b backdrop-blur-md",
        sticky && "sticky top-0",
      )}
    >
      {layout === "center" ? (
        <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-20">
          <div className="flex items-center">
            {menuButton}
            {nav}
          </div>
          <Brand name={name} logo={logo} />
          {actions}
        </div>
      ) : (
        <div className="container-page flex h-16 items-center justify-between gap-6 md:h-20">
          <div className="flex items-center gap-2">
            {menuButton}
            <Brand name={name} logo={logo} />
          </div>
          {nav}
          {actions}
        </div>
      )}

      {searchOpen && (
        <div className="border-line bg-bg absolute inset-x-0 top-full border-b">
          <form action="/shop" className="container-page flex items-center gap-3 py-4">
            <Search className="text-muted size-5 shrink-0" strokeWidth={1.5} />
            <input
              name="q"
              type="search"
              autoFocus
              placeholder="Search perfumes, notes, families…"
              className="placeholder:text-muted w-full bg-transparent py-2 text-base outline-none"
              aria-label="Search products"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>
        </div>
      )}

      {menuOpen && (
        <div className="bg-bg fixed inset-0 z-50 flex h-dvh flex-col lg:hidden">
          <div className="container-page flex h-16 items-center justify-between">
            <Brand name={name} logo={logo} />
            <button type="button" onClick={() => setMenuOpen(false)} className="-mr-2 p-2" aria-label="Close menu">
              <X className="size-6" strokeWidth={1.5} />
            </button>
          </div>
          <nav className="container-page flex flex-1 flex-col gap-1 overflow-y-auto pt-6" aria-label="Mobile">
            {links.map((link, i) => (
              <Link
                key={i}
                href={safeHref(link.href, "/")}
                className="heading border-line border-b py-4 text-3xl"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/account" className="text-muted mt-6 text-sm tracking-widest uppercase">
              My account
            </Link>
            <Link href="/track" className="text-muted mt-3 text-sm tracking-widest uppercase">
              Track an order
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
