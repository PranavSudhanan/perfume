import { Fragment, type ReactNode } from "react";
import { safeHref } from "@/lib/utils";

/**
 * A deliberately small Markdown renderer for admin-written content: headings,
 * paragraphs, lists, **bold**, *italic* and [links](url). It builds React
 * elements only — raw HTML in the source is shown as text, never executed.
 */
const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = safeHref(link[2]);
      const external = /^https?:/i.test(href);
      return (
        <a key={i} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {link[1]}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function lines(text: string) {
  return text.split("\n").map((line, i, all) => (
    <Fragment key={i}>
      {inline(line)}
      {i < all.length - 1 && <br />}
    </Fragment>
  ));
}

export function Markdown({ source, className }: { source: unknown; className?: string }) {
  if (typeof source !== "string" || !source.trim()) return null;
  const blocks = source.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className={`prose-store ${className ?? ""}`}>
      {blocks.map((block, i) => {
        const rows = block.split("\n");
        if (block.startsWith("### ")) return <h3 key={i}>{inline(block.slice(4))}</h3>;
        if (block.startsWith("## ")) return <h2 key={i}>{inline(block.slice(3))}</h2>;
        if (block.startsWith("# ")) return <h2 key={i}>{inline(block.slice(2))}</h2>;
        if (rows.every((r) => /^[-*] /.test(r))) {
          return (
            <ul key={i}>
              {rows.map((r, j) => (
                <li key={j}>{inline(r.slice(2))}</li>
              ))}
            </ul>
          );
        }
        if (rows.every((r) => /^\d+[.)] /.test(r))) {
          return (
            <ol key={i}>
              {rows.map((r, j) => (
                <li key={j}>{inline(r.replace(/^\d+[.)] /, ""))}</li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{lines(block)}</p>;
      })}
    </div>
  );
}
