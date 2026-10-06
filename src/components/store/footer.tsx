import Link from "next/link";
import type { NavigationSettings, StoreSettings } from "@/lib/config";
import { safeHref } from "@/lib/utils";
import { NewsletterForm } from "./forms";

export function Footer({ store, nav }: { store: StoreSettings; nav: NavigationSettings }) {
  const social = [
    ["Instagram", store.instagram],
    ["Facebook", store.facebook],
    ["YouTube", store.youtube],
    ["WhatsApp", store.whatsapp ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}` : ""],
  ].filter(([, href]) => safeHref(href, ""));

  return (
    <footer className="tone-dark bg-bg text-ink">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="heading text-3xl tracking-[0.18em] uppercase">{store.name}</p>
          {nav.footerAbout && (
            <p className="text-muted mt-4 max-w-sm text-sm leading-relaxed">{nav.footerAbout}</p>
          )}
          <div className="text-muted mt-6 space-y-1 text-sm">
            {store.email && (
              <p>
                <a href={`mailto:${store.email}`} className="hover:text-ink">
                  {store.email}
                </a>
              </p>
            )}
            {store.phone && <p>{store.phone}</p>}
          </div>
          {social.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs tracking-widest uppercase">
              {social.map(([label, href]) => (
                <a
                  key={label}
                  href={safeHref(href)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-5">
          {nav.footerColumns.map((column, i) => (
            <div key={i}>
              <p className="mb-4 text-xs font-medium tracking-[0.2em] uppercase">{column.title}</p>
              <ul className="text-muted space-y-2.5 text-sm">
                {column.links.map((link, j) => (
                  <li key={j}>
                    <Link href={safeHref(link.href, "/")} className="hover:text-ink transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {nav.footerNewsletter && (
          <div className="md:col-span-3">
            <p className="mb-4 text-xs font-medium tracking-[0.2em] uppercase">Newsletter</p>
            <p className="text-muted mb-4 text-sm">New blends and private offers, a few times a year.</p>
            <NewsletterForm buttonLabel="Join" />
          </div>
        )}
      </div>
      <div className="border-line border-t">
        <div className="container-page text-muted flex flex-col items-center justify-between gap-2 py-6 text-xs sm:flex-row">
          <p>
            © {new Date().getFullYear()} {store.name}. {nav.copyright}
          </p>
          <p>{store.address}</p>
        </div>
      </div>
    </footer>
  );
}
