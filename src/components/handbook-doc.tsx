"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui";

type TocItem = { id: string; text: string; level: 2 | 3 };

function slugify(text: string) {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\-]/g, "")
    .toLowerCase();
}

function buildToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  for (const line of markdown.split("\n")) {
    const m2 = /^(#{2})\s+(.+)$/.exec(line);
    const m3 = /^(#{3})\s+(.+)$/.exec(line);
    const m = m2 || m3;
    if (!m) continue;
    const text = m[2].replace(/#+$/, "").trim();
    if (text.startsWith("فهرست")) continue;
    items.push({
      id: slugify(text),
      text,
      level: m[1].length === 2 ? 2 : 3,
    });
  }
  return items;
}

export function HandbookDoc({ markdown }: { markdown: string }) {
  const toc = useMemo(() => buildToc(markdown), [markdown]);
  const [activeId, setActiveId] = useState(toc[0]?.id ?? "");

  useEffect(() => {
    const headings = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <Panel className="p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">
            فهرست مطالب
          </p>
          <nav
            aria-label="فهرست راهنما"
            className="mt-3 max-h-[70vh] space-y-1 overflow-y-auto text-sm"
          >
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "block rounded-lg px-2 py-2 leading-6 transition-colors",
                  item.level === 3 && "pr-4 text-[13px]",
                  activeId === item.id
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink)]/80 hover:bg-[var(--mist)]",
                )}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </Panel>
      </aside>

      <Panel className="min-w-0 p-5 sm:p-8">
        <article className="handbook-prose max-w-none text-[15px] leading-8 text-[var(--ink)]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
                  {children}
                </h1>
              ),
              h2: ({ children }) => {
                const text = String(children);
                const id = slugify(text);
                return (
                  <h2
                    id={id}
                    className="mt-12 scroll-mt-28 border-t border-[var(--line)] pt-8 font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]"
                  >
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => {
                const text = String(children);
                const id = slugify(text);
                return (
                  <h3
                    id={id}
                    className="mt-8 scroll-mt-28 text-lg font-semibold text-[var(--ink)]"
                  >
                    {children}
                  </h3>
                );
              },
              p: ({ children }) => (
                <p className="mt-4 text-[var(--ink)]/90">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mt-4 list-disc space-y-2 pr-5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mt-4 list-decimal space-y-2 pr-5">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-8 text-[var(--ink)]/90">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="mt-4 border-r-4 border-[var(--gold)] bg-[var(--mist)]/70 pr-4 py-3 text-[var(--muted)]">
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="font-medium text-[var(--gold-deep)] underline underline-offset-4"
                >
                  {children}
                </a>
              ),
              code: ({ className, children }) => {
                const isBlock = Boolean(className);
                if (isBlock) {
                  return (
                    <code
                      data-ltr
                      className="mt-4 block overflow-x-auto rounded-xl bg-[var(--ink)] px-4 py-3 text-sm text-[var(--mist)]"
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code
                    data-ltr
                    className="rounded-md bg-[var(--mist)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--ink)] ring-1 ring-[var(--line)]"
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="mt-4 overflow-x-auto">{children}</pre>
              ),
              table: ({ children }) => (
                <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--line)]">
                  <table className="w-full min-w-[28rem] text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-[var(--mist)]/90">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="px-3 py-2.5 text-start text-[11px] font-semibold text-[var(--muted)]">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-t border-[var(--line)] px-3 py-2.5 align-top">
                  {children}
                </td>
              ),
              hr: () => <hr className="my-10 border-[var(--line)]" />,
              strong: ({ children }) => (
                <strong className="font-semibold text-[var(--ink)]">
                  {children}
                </strong>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </Panel>
    </div>
  );
}
